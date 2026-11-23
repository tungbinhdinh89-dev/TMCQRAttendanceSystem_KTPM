import { spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { isIP } from "node:net"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2).filter(x => x !== "--")
if (args.includes("--help")) {
  console.log("node scripts/lan-https.mjs --ip <LAN-IP> [--serve-ca]\nCreates/reuses a local CA, configures Vite HTTPS and API origins. No automatic trust installation.\n--serve-ca serves ONLY the public CA certificate on LAN port5194 for iPhone profile installation.")
  process.exit(0)
}
let ip, serve = false
for (let i=0; i<args.length; i++) {
  if (args[i] === "--ip") ip = args[++i]
  else if (args[i] === "--serve-ca") serve = true
  else throw new Error("Unknown HTTPS setup argument. Use --help.")
}
if (!isIP(ip || "")) throw new Error("Provide the computer's LAN IP, e.g. --ip 192.168.1.53")
const openssl = process.env.OPENSSL_PATH || (process.platform === "win32" && existsSync("C:/Program Files/Git/usr/bin/openssl.exe") ? "C:/Program Files/Git/usr/bin/openssl.exe" : "openssl")
const folder = join(root, ".local-certs")
mkdirSync(folder, {recursive:true})
function run(...argv) {
  const r=spawnSync(openssl,argv,{cwd:folder,windowsHide:true,encoding:"utf8"})
  if (r.error || r.status !== 0) throw new Error("OpenSSL failed. Install OpenSSL or set OPENSSL_PATH. Existing private keys were not printed.")
}
const caKey=join(folder,"ca-key.pem"),ca=join(folder,"ca-cert.pem")
if (existsSync(caKey) !== existsSync(ca)) throw new Error("Local CA files incomplete. Restore both files; refusing silent CA replacement.")
if (!existsSync(ca)) {
  writeFileSync(join(folder,"ca.cnf"),"[req]\ndistinguished_name=dn\nprompt=no\nx509_extensions=ca_ext\n[dn]\nCN=TMC Classroom Local CA\n[ca_ext]\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n")
  run("req","-x509","-newkey","rsa:2048","-nodes","-sha256","-days","365","-config","ca.cnf","-keyout","ca-key.pem","-out","ca-cert.pem")
}
run("req","-new","-newkey","rsa:2048","-nodes","-subj","/CN=TMC Classroom LAN","-keyout","lan-key.pem","-out","lan.csr")
writeFileSync(join(folder,"lan.ext"),`basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:localhost,IP:127.0.0.1,IP:${ip}\n`)
run("x509","-req","-in","lan.csr","-CA","ca-cert.pem","-CAkey","ca-key.pem","-CAcreateserial","-days","90","-sha256","-extfile","lan.ext","-out","lan-cert.pem")
run("x509","-in","ca-cert.pem","-outform","DER","-out","tmc-local-ca.cer")
function settings(path, values) {
  let text=existsSync(path)?readFileSync(path,"utf8"):""
  for (const [key,value] of Object.entries(values)) {
    const line=`${key}=${JSON.stringify(value)}`, re=new RegExp(`^${key}=.*$`,"m")
    text=re.test(text)?text.replace(re,()=>line):text+`\n${line}\n`
  }
  writeFileSync(path,text,{encoding:"utf8",mode:0o600})
}
settings(join(root,"client/.env.local"),{DEV_HTTPS:"1",DEV_HTTPS_CERT:"../.local-certs/lan-cert.pem",DEV_HTTPS_KEY:"../.local-certs/lan-key.pem",DEV_HTTPS_HOST:"0.0.0.0"})
const apiEnv=join(root,"api/.env")
const current=existsSync(apiEnv)?parseEnv(readFileSync(apiEnv,"utf8")):{}
const origins=new Set((current.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map(x=>x.trim()).filter(Boolean))
for (const host of [ip,"localhost","127.0.0.1"]) origins.add(`https://${isIP(host)===6?'['+host+']':host}:5173`)
settings(apiEnv,{CORS_ORIGINS:[...origins].join(",")})
const host=isIP(ip)===6?'['+ip+']':ip
console.log(`Local HTTPS ready. Restart FE/BE, then open https://${host}:5173/scanner on iPhone.`)
console.log("Install .local-certs/tmc-local-ca.cer on the iPhone, then enable certificate trust in Settings > General > About > Certificate Trust Settings. This script does not install trust automatically.")
console.log("CA private key and TLS key remain local/ignored. Do not share or commit them.")
if (serve) {
  const certificate=readFileSync(join(folder,"tmc-local-ca.cer"))
  const server=createServer((req,res)=>{
    if(req.url!=="/tmc-local-ca.cer" || req.method!=="GET"){res.writeHead(404);res.end();return}
    res.writeHead(200,{"Content-Type":"application/x-x509-ca-cert","Content-Disposition":'attachment; filename="tmc-local-ca.cer"',"Cache-Control":"no-store"});res.end(certificate)
  })
  server.on("error",()=>{console.error("Cannot serve public CA on port5194; use the certificate file directly.");process.exitCode=1})
  server.listen(5194,"0.0.0.0",()=>console.log(`Download public CA only: http://${host}:5194/tmc-local-ca.cer (Ctrl+C stops this certificate server).`))
}

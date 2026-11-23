import assert from "node:assert/strict"
import test from "node:test"
import { once } from "node:events"
import { createServer } from "node:net"
import { mkdtemp, rm, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { parseArgs, migrationSource, migrationStatus, Processes, availablePort, root } from "../project.mjs"

const ts = createRequire(import.meta.url)("typescript")
test("run defaults to both services; mode and migration flags are strict and path-safe",()=>{
  assert.equal(parseArgs(["run"]).target,"all")
  assert.equal(parseArgs(["run","--","--frontend"]).target,"frontend")
  assert.equal(parseArgs(["run","--frontend"]).target,"frontend")
  assert.equal(parseArgs(["run","--backend"]).target,"backend")
  assert.equal(parseArgs(["add","EmployeeEmail","--empty"]).empty,true)
  assert.equal(parseArgs(["add","--name","EmployeeEmail"]).name,"EmployeeEmail")
  for(const args of [["run","--frontend","--backend"],["add","../../evil"],["add"],["update","--frontend"],["check","--empty"],["update","--database-name"],["run","--frontend","--database-name","other"],["run","--unknown"]])assert.throws(()=>parseArgs(args))
})
test("check reads existing history and never creates a history table even on a fresh database",async()=>{
  const names=[{name:"One1790000000000"},{name:"Two1790000001000"}]
  const ds={options:{},migrations:names}
  const absent=await migrationStatus(ds,{hasTable:async()=>false,query:async()=>{throw Error("No history query when table absent")}})
  assert.deepEqual(absent.pending,names);assert.deepEqual(absent.applied,[])
  const queries=[]
  const existing=await migrationStatus(ds,{hasTable:async()=>true,query:async sql=>{queries.push(sql);return [{name:names[0].name},{name:"Missing1780000000000"}]}})
  assert.equal(existing.applied.length,1);assert.equal(existing.pending[0].name,names[1].name);assert.equal(existing.missing.length,1)
  assert.ok(queries.every(sql=>sql.startsWith("SELECT ")))
})
test("generated SQL is escaped valid TypeScript and rollback order reverses dependent statements",()=>{
  const down=[{query:'DROP TABLE "parent"'},{query:'DROP TABLE "child"'}]
  const source=migrationSource("EmployeeEmail",1790000000000,[{query:'SELECT \'` ${value} \\\'',parameters:["test"]}],down)
  assert.ok(source.indexOf('child')<source.indexOf('parent'))
  assert.equal(down[0].query,'DROP TABLE "parent"')
  const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true})
  assert.equal(result.diagnostics.length,0)
  assert.throws(()=>migrationSource("../Bad",1790000000000))
})
test("help works outside repository cwd without database config; bad flags exit nonzero",async t=>{
  const directory=await mkdtemp(join(tmpdir(),"tmc-project-"));t.after(()=>rm(directory,{recursive:true,force:true}))
  const env={...process.env,DATABASE_URL:"",TMC_DATABASE_OVERRIDE:""}
  const ok=spawnSync(process.execPath,[join(root,"scripts/project.mjs"),"check","--help"],{cwd:directory,env,encoding:"utf8"})
  assert.equal(ok.status,0,ok.stderr);assert.match(ok.stdout,/PENDING/)
  const bad=spawnSync(process.execPath,[join(root,"scripts/project.mjs"),"add","../../bad"],{cwd:directory,env,encoding:"utf8"})
  assert.notEqual(bad.status,0)
})
test("port conflict fails explicitly and does not stop the existing listener",async t=>{
  const server=createServer();server.listen(0);await once(server,"listening");t.after(()=>server.close())
  await assert.rejects(availablePort(server.address().port),/already in use/)
  assert.equal(server.listening,true)
})
test("service termination cleans up companion Node processes",async()=>{
  const processes=new Processes()
  const peer=processes.spawn(["-e","setInterval(()=>{},1000)"])
  const failing=processes.spawn(["-e","process.exit(7)"])
  assert.equal((await failing.done).code,7)
  await processes.stop();await peer.done
  assert.equal(processes.children.size,0)
})
test("shell wrappers use quoted script-relative paths and LF, not cwd or a Windows shell",async()=>{
  for(const name of ["run","add","update","check"]){
    const sh=await readFile(join(root,"scripts",name+".sh"),"utf8")
    assert.equal(sh.includes("\r"),false);assert.match(sh,/exec node "\$script_dir\/project.mjs"/);assert.ok(sh.includes('"$@"'))
    const ps=await readFile(join(root,"scripts",name+".ps1"),"utf8")
    assert.match(ps,/\$PSScriptRoot/);assert.ok(ps.includes('@args'));assert.match(ps,/exit \$LASTEXITCODE/)
  }
})

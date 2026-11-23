import assert from "node:assert/strict"
import test from "node:test"
import { configurationScope } from "../dist/modules/cfg/application/configuration-policy.js"
import { employeeScope } from "../dist/modules/eqr/application/employee.service.js"
import { auditScope } from "../dist/modules/iam/application/audit.service.js"
import { AuthService } from "../dist/modules/iam/application/auth.service.js"
import { StationConfigurationService } from "../dist/modules/gate/application/station-configuration.service.js"
import { QrService } from "../dist/modules/eqr/application/qr.service.js"

const factory="00000000-0000-4000-8000-000000000001"
const otherFactory="00000000-0000-4000-8000-000000000002"
const role=(code,permissions=[],scopeType="FACTORY",factoryId=factory)=>({code,permissions,scopeType,factoryId})
const identity=(roles)=>({userId:factory,employeeId:factory,roles})
const forbidden=error=>error.getStatus()===403
const noData=new Proxy({}, {get(){throw Error("Denied request must not access persistence")}})
const audit={write:async()=>{}}

test("assignment role matrix denies implicit employee/config capabilities",()=>{
 for(const code of ["EMP","HR","SEC","ADM","SUP","EXE"]){
  const user=identity([role(code,code==="ADM"?["iam:manage"]:[])])
  if(code==="HR")assert.equal(employeeScope(user).factoryIds[0],factory)
  else assert.throws(()=>employeeScope(user),forbidden)
  for(const resource of ["organization","station","integration"]){
   const allowed=code==="ADM"||(code==="SEC"&&resource!=="integration")||(code==="HR"&&resource==="organization")
   if(allowed)assert.equal(configurationScope(user,false,resource).factoryIds[0],factory)
   else assert.throws(()=>configurationScope(user,false,resource),forbidden)
  }
  if(code!=="ADM")assert.throws(()=>configurationScope(user,true),forbidden)
 }
 assert.throws(()=>configurationScope(identity([role("ADM")]),false,"organization"),forbidden)
 assert.throws(()=>configurationScope(identity([])),forbidden)
})

test("qualifying role retains its own scope instead of borrowing another role's GLOBAL",()=>{
 const user=identity([role("SEC"),role("HR",[],"GLOBAL",null)])
 assert.deepEqual(configurationScope(user,false,"station"),{global:false,factoryIds:[factory]})
 assert.throws(()=>configurationScope(user,false,"integration"),forbidden)
 const combined=identity([role("ADM",["iam:manage"]),role("HR",[],"GLOBAL",null)])
 assert.deepEqual(configurationScope(combined,false,"integration"),{global:false,factoryIds:[factory]})
 assert.deepEqual(employeeScope(combined),{global:true,factoryIds:[]})
 const split=identity([role("ADM",[],"GLOBAL",null),role("HR",["iam:manage"],"GLOBAL",null)])
 assert.throws(()=>configurationScope(split,false,"integration"),forbidden)
 assert.throws(()=>configurationScope(identity([role("SEC",[],"TEAM",otherFactory)]),false,"station"),forbidden)
})

test("denied HR/EMP/SUP/EXE station and integration reads fail before any query",async()=>{
 const service=new StationConfigurationService(noData,audit)
 for(const code of ["EMP","HR","SUP","EXE"]){
  const user=identity([role(code)])
  await assert.rejects(service.stations(user),forbidden)
  await assert.rejects(service.readiness(user),forbidden)
  await assert.rejects(service.integrations(user),forbidden)
 }
 await assert.rejects(service.integrations(identity([role("SEC")])),forbidden)
 for(const code of ["EMP","HR","SEC","SUP","EXE"]){
  await assert.rejects(service.saveStation(identity([role(code)]),{}),forbidden)
  await assert.rejects(service.credential(identity([role(code)]),factory,{}),forbidden)
 }
})

test("personal QR is EMP-only; additive HR+EMP remains bound to authenticated employee",async()=>{
 const qr=new QrService({manager:noData},audit)
 for(const code of ["HR","SEC","ADM","SUP","EXE"]){
  await assert.rejects(qr.status(identity([role(code)])),forbidden)
  await assert.rejects(qr.issue(identity([role(code)])),forbidden)
 }
 let requestedEmployee
 const manager={getRepository:()=>({findOne:async options=>{requestedEmployee=options.where.employeeId;return null}})}
 const readable=new QrService({manager},audit)
 const user=identity([role("HR"),role("EMP",[],"SELF",null)])
 const result=await readable.status(user)
 assert.equal(requestedEmployee,user.employeeId)
 assert.equal(result.credential,null)
})

test("audit requires explicit audit permission and scope on the eligible role",()=>{
 for(const code of ["EMP","SUP","EXE"]){assert.throws(()=>auditScope(identity([role(code,["audit:read"])])),forbidden)}
 for(const code of ["HR","SEC"]){
  assert.throws(()=>auditScope(identity([role(code)])),forbidden)
  assert.deepEqual(auditScope(identity([role(code,["audit:read"])])),{global:false,factoryIds:[factory]})
 }
 const combined=identity([role("SEC",["audit:read"]),role("HR",[],"GLOBAL",null)])
 assert.deepEqual(auditScope(combined),{global:false,factoryIds:[factory]})
})

test("anonymous cookie identity and cookie-as-station credentials are rejected",async()=>{
 const auth=new AuthService(noData,audit)
 await assert.rejects(auth.me(undefined),e=>e.getStatus()===401)
 const station=new StationConfigurationService(noData,audit)
 await assert.rejects(station.heartbeat(factory,undefined,{}),e=>e.getStatus()===401)
 await assert.rejects(station.heartbeat(factory,"tmc_session=not-a-station-bearer",{}),e=>e.getStatus()===401)
})

test("HTTP route boundaries reject missing/wrong roles before database access",async t=>{
 const {Test}=await import("@nestjs/testing")
 const {DataSource}=await import("typeorm")
 const {UnauthorizedException}=await import("@nestjs/common")
 const {AppModule}=await import("../dist/app.module.js")
 const {AuditService}=await import("../dist/modules/iam/application/audit.service.js")
 let current=null,queries=0
 const failQuery=()=>{queries++;throw Error("Denied HTTP request accessed persistence")}; const poison={query:failQuery,getRepository:failQuery,transaction:failQuery}
 const auth={me:async()=>{if(!current)throw new UnauthorizedException();return current},verifyRequestOrigin:async()=>{}}
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue(poison).overrideProvider(AuditService).useValue(audit).overrideProvider(AuthService).useValue(auth).compile()
 const app=module.createNestApplication();app.setGlobalPrefix("api");app.useLogger(false)
 t.after(()=>app.close());await app.listen(0,"127.0.0.1");const base=await app.getUrl()
 const cases=[
  [null,"qr/self/code",401], [null,"employees",401], [null,"configuration/stations",401],
  ["HR","qr/self/code",403], ["SEC","qr/self/code",403], ["ADM","qr/self/code",403], ["SUP","qr/self/code",403], ["EXE","qr/self/code",403],
  ["EMP","employees",403], ["SEC","employees",403], ["ADM","employees",403],
  ["HR","configuration/stations",403], ["HR","configuration/readiness",403], ["HR","configuration/integrations",403],
  ["SEC","configuration/integrations",403], ["EMP","organization",403], ["ADM","configuration/stations",403],
  ["EMP",`employees/${factory}/account`,403], ["EMP",`employees/${factory}/qr-credential`,403,"POST"], ["ADM",`employees/${factory}/qr-credential/revoke`,403,"POST"],
 ]
 for(const [code,path,expected,method="GET"] of cases){
  current=code?identity([role(code)]):null
  const response=await fetch(`${base}/api/${path}`,{method,...(method==="POST"?{headers:{"Content-Type":"application/json"},body:JSON.stringify({reason:"unit-test"})}:{})})
  assert.equal(response.status,expected,`${code??"anonymous"} ${method} ${path}`)
 }
 for(const code of [null,"EMP","HR","SEC","ADM","SUP","EXE"]){current=code?identity([role(code)]):null;const response=await fetch(`${base}/api/demo/bootstrap`);assert.equal(response.status,404)}
 assert.equal(queries,0,"Denied routes and removed endpoints must not read business persistence")
})

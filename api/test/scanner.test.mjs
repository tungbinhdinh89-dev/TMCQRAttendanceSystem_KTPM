import assert from "node:assert/strict"
import test from "node:test"
import { WebScannerService, scannerScope } from "../dist/modules/gate/application/web-scanner.service.js"
import { DemoAttendanceRecorder } from "../dist/modules/att/application/demo-attendance-recorder.js"
const ids={factory:"00000000-0000-4000-8000-000000000001",other:"00000000-0000-4000-8000-000000000002",station:"00000000-0000-4000-8000-000000000003",employee:"00000000-0000-4000-8000-000000000004",token:"00000000-0000-4000-8000-000000000005",assignment:"00000000-0000-4000-8000-000000000006",actor:"00000000-0000-4000-8000-000000000007",event:"00000000-0000-4000-8000-000000000008",event2:"00000000-0000-4000-8000-000000000009"}
const role=(code="SEC",factoryId=ids.factory,permissions=["access:decide"],scopeType="FACTORY")=>({code,factoryId,permissions,scopeType})
const identity=(roles=[role()])=>({userId:ids.actor,employeeId:ids.actor,roles})
const forbidden=e=>e.getStatus()===403
function fixture(){
 const state={attempts:[],events:[],revisions:[],audits:[],grant:true,assignment:true,validation:true,employee:{id:ids.employee,employeeCode:"DEMO-1",fullName:"Demo Employee",status:"ACTIVE"},station:{id:ids.station,factoryId:ids.factory,direction:"IN",status:"ACTIVE"},factory:{status:"ACTIVE"},failAudit:false}
 let calls=0
 const repositories={
  GateStationOrmEntity:{findOne:async()=>state.station},FactoryOrmEntity:{findOne:async()=>state.factory},EmployeeOrmEntity:{findOne:async()=>state.employee,findOneBy:async()=>state.employee},
  AccessAttemptOrmEntity:{create:v=>({...v}),findOneBy:async w=>state.attempts.find(a=>a.stationId===w.stationId&&a.eventId===w.eventId),save:async a=>{state.attempts.push({...a});return a}},
  AttendanceEventOrmEntity:{create:v=>({...v,_entity:"event"})},AttendanceEventRevisionOrmEntity:{create:v=>({...v,_entity:"revision"})},
 }
 const manager={queryRunner:{isTransactionActive:true},getRepository:type=>{calls++;return repositories[type.name]},save:async row=>{const copy={...row};delete copy._entity;(row._entity==="event"?state.events:state.revisions).push(copy);return row},query:async(sql,params)=>{
  calls++
  if(sql.startsWith("SELECT id FROM access_grants"))return state.grant?[{id:ids.factory}]:[]
  if(sql.startsWith("SELECT id FROM employee_assignments"))return state.assignment?[{id:ids.assignment}]:[]
  if(sql.startsWith("SELECT e.id,e.employee_id")){const event=state.events.find(e=>e.accessAttemptId===params[0]);if(!event)return [];const revision=state.revisions.find(r=>r.eventId===event.id);return [{id:event.id,employee_id:event.employeeId,occurred_at:revision.occurredAt,direction:revision.direction}]}
  if(sql.startsWith("SELECT e.id FROM attendance_events")){return state.events.filter(e=>e.employeeId===params[0]&&state.revisions.some(r=>r.eventId===e.id&&r.activityFactoryId===params[1]&&r.direction===params[2]&&r.occurredAt>params[3])).map(e=>({id:e.id}))}
  throw Error("Unexpected fixture query")
 }}
 const audit={write:async e=>{if(state.failAudit)throw Error("Audit failed");state.audits.push(e)}}
 const qr={validate:async()=>state.validation&&state.employee.status==="ACTIVE"?{valid:true,employeeId:ids.employee,tokenId:ids.token}:{valid:false,reasonCode:"QR_CREDENTIAL_REVOKED"}}
 let queue=Promise.resolve()
 const ds={transaction:fn=>{const operation=queue.then(async()=>{const before=structuredClone(state);try{return await fn(manager)}catch(e){Object.assign(state,before);throw e}});queue=operation.catch(()=>{});return operation},query:async()=>[]}
 return {state,manager,ds,qr,audit,get calls(){return calls},service:new WebScannerService(ds,qr,new DemoAttendanceRecorder(),audit)}
}
test("scanner requires permission on SEC factory/global assignment; other roles cannot borrow privileges",async()=>{
 for(const code of ["EMP","HR","ADM","SUP","EXE"]){const f=fixture();await assert.rejects(f.service.scan(identity([role(code)]),ids.station,{eventId:ids.event,token:"test"}),forbidden);assert.equal(f.calls,0)}
 assert.throws(()=>scannerScope(identity([role("SEC",ids.factory,[]),role("HR",null,["access:decide"],"GLOBAL")])),forbidden)
 assert.deepEqual(scannerScope(identity([role(),role("HR",null,[],"GLOBAL")])),{global:false,factoryIds:[ids.factory]})
 const f=fixture();await assert.rejects(f.service.scan(identity([role("SEC",ids.other)]),ids.station,{eventId:ids.event,token:"test"}),forbidden);assert.equal(f.state.events.length,0)
})
test("server station determines IN/OUT and records explicit demo event/revision with audit",async()=>{
 for(const direction of ["IN","OUT"]){const f=fixture();f.state.station.direction=direction;const result=await f.service.scan(identity(),ids.station,{eventId:ids.event,token:"opaque signed fixture"});assert.equal(result.mode,"CLASSROOM_DEMO");assert.equal(result.direction,direction);assert.equal(result.attendanceState,"RECORDED");assert.equal(f.state.events.length,1);assert.equal(f.state.events[0].sourceType,"DEMO");assert.equal(f.state.events[0].evidenceType,"DEMO_QR_SCAN");assert.equal(f.state.revisions[0].direction,direction);assert.equal(f.state.revisions[0].activityFactoryId,ids.factory);assert.equal(f.state.audits[0].outcome,"SUCCESS");assert.ok(!JSON.stringify(f.state).includes("opaque signed fixture"))}
})
test("same event exact retry and concurrent retry never duplicate attendance; changed payload conflicts",async()=>{
 const f=fixture(),input={eventId:ids.event,token:"fixture-token"};const results=await Promise.all([f.service.scan(identity(),ids.station,input),f.service.scan(identity(),ids.station,input)]);assert.equal(f.state.events.length,1);assert.equal(f.state.attempts.length,1);assert.equal(results[0].attendanceEventId,results[1].attendanceEventId);assert.equal(results[1].attendanceState,"ALREADY_RECORDED");f.state.validation=false;const replay=await f.service.scan(identity(),ids.station,input);assert.equal(replay.attendanceEventId,results[0].attendanceEventId);await assert.rejects(f.service.scan(identity(),ids.station,{...input,token:"changed"}),e=>e.getStatus()===409)
})
test("revoked QR, absent grant or assignment do not create attendance or expose employee identity",async()=>{
 for(const mode of ["validation","grant","assignment"]){const f=fixture();f.state[mode]=false;const result=await f.service.scan(identity(),ids.station,{eventId:ids.event,token:"denied-token"});assert.equal(result.decision,"DENIED");assert.equal(result.attendanceState,"NOT_RECORDED");assert.equal(result.employee,null);assert.equal(f.state.events.length,0);assert.equal(f.state.attempts.length,1);assert.equal(f.state.audits[0].outcome,"DENIED")}
})
test("rapid new event camera repeats are denied; OUT after IN remains a separate event",async()=>{
 const f=fixture();await f.service.scan(identity(),ids.station,{eventId:ids.event,token:"fixture"});const repeated=await f.service.scan(identity(),ids.station,{eventId:ids.event2,token:"fixture"});assert.equal(repeated.reasonCode,"DEMO_DUPLICATE_SCAN");assert.equal(repeated.duplicate,true);assert.equal(f.state.events.length,1);f.state.station.direction="OUT";await f.service.scan(identity(),ids.station,{eventId:ids.token,token:"fixture"});assert.equal(f.state.events.length,2)
})
test("untrusted direction, employee/time selectors and inactive station are rejected",async()=>{
 for(const extra of [{direction:"OUT"},{employeeId:ids.employee},{occurredAt:new Date().toISOString()}]){const f=fixture();await assert.rejects(f.service.scan(identity(),ids.station,{eventId:ids.event,token:"fixture",...extra}),e=>e.getStatus()===400);assert.equal(f.calls,0)}
 const f=fixture();f.state.station.status="INACTIVE";await assert.rejects(f.service.scan(identity(),ids.station,{eventId:ids.event,token:"fixture"}),e=>e.getStatus()===409);assert.equal(f.state.events.length,0)
})
test("audit failure rolls back attempt, attendance and revision together (transaction adapter)",async()=>{
 const f=fixture();f.state.failAudit=true;await assert.rejects(f.service.scan(identity(),ids.station,{eventId:ids.event,token:"fixture"}),/Audit failed/);assert.equal(f.state.attempts.length,0);assert.equal(f.state.events.length,0);assert.equal(f.state.revisions.length,0)
})
test("actual HTTP scanner routes enforce anonymous401 and wrong-role403 before persistence",async t=>{
 const {Test}=await import("@nestjs/testing"),{DataSource}=await import("typeorm"),{UnauthorizedException}=await import("@nestjs/common")
 const {AppModule}=await import("../dist/app.module.js"),{AuthService}=await import("../dist/modules/iam/application/auth.service.js"),{AuditService}=await import("../dist/modules/iam/application/audit.service.js")
 let current=null,calls=0
 const fail=()=>{calls++;throw Error("Unauthorized persistence access")};const poison={query:fail,getRepository:fail,transaction:fail}
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue(poison).overrideProvider(AuditService).useValue({write:async()=>{}}).overrideProvider(AuthService).useValue({me:async()=>{if(!current)throw new UnauthorizedException();return current},verifyRequestOrigin:async()=>{}}).compile()
 const app=module.createNestApplication();app.setGlobalPrefix("api");app.useLogger(false);await app.listen(0,"127.0.0.1");t.after(()=>app.close());const base=await app.getUrl()
 for(const code of [null,"EMP","HR","ADM","SUP","EXE"]){current=code?identity([role(code)]):null;for(const [path,method] of [["stations","GET"],[`stations/${ids.station}/scans`,"POST"]]){const response=await fetch(`${base}/api/scanner/${path}`,{method,...(method==="POST"?{headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:ids.event,token:"fixture"})}:{})});assert.equal(response.status,code?403:401)}}
 assert.equal(calls,0)
 current=identity();poison.query=async()=>{calls++;return []};const allowed=await fetch(`${base}/api/scanner/stations`);assert.equal(allowed.status,200);assert.deepEqual(await allowed.json(),{items:[]});assert.equal(calls,1)
})

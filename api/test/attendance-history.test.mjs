import assert from "node:assert/strict"
import test from "node:test"
import { attendanceGrants, attendanceWhere, AttendanceHistoryService } from "../dist/modules/att/application/attendance-history.service.js"
import { gateHistoryScope, gateHistoryWhere, GateHistoryService } from "../dist/modules/gate/application/gate-history.service.js"
import { historyQuery } from "../dist/platform/http/history-query.js"
const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002"
const role=(code,scopeType="FACTORY",permissions=["attendance:read"],extra={})=>({code,scopeType,permissions,factoryId:a,departmentId:null,teamId:null,...extra})
const user=(roles)=>({userId:a,employeeId:b,roles})
const forbidden=e=>e.getStatus()===403
const q=()=>historyQuery({from:"2026-11-01T00:00:00+07:00",to:"2026-12-01T00:00:00+07:00"})
test("attendance role permission scope stay on one assignment; SUP requires explicit team",()=>{
 for(const code of ["ADM","SEC","EXE"])assert.throws(()=>attendanceGrants(user([role(code)])),forbidden)
 assert.throws(()=>attendanceGrants(user([role("HR","FACTORY",[]),role("ADM","GLOBAL")])),forbidden)
 assert.throws(()=>attendanceGrants(user([role("SUP")])),forbidden)
 assert.equal(attendanceGrants(user([role("SUP","TEAM",undefined,{teamId:b})])).length,1)
 const self=attendanceWhere(user([role("EMP","GLOBAL")]),q());assert.match(self.sql(),/e.employee_id=\$1::uuid/);assert.equal(self.params[0],b);assert.doesNotMatch(self.sql(),/TRUE/)
})
test("scope SQL is parameterized and uses recorded assignment and activity factory",()=>{
 const where=attendanceWhere(user([role("HR","DEPARTMENT",undefined,{departmentId:b})]),{...q(),factoryId:b,employeeId:a})
 assert.match(where.sql(),/oa.id=r.organization_assignment_id/);assert.match(where.sql(),/oa.employee_id=e.employee_id/);assert.match(where.sql(),/oa.factory_id=r.activity_factory_id/)
 assert.match(where.sql(),/oa.department_id=/);assert.deepEqual(where.params.slice(0,2),[a,b]);assert.ok(!where.sql().includes(a))
 const summary=attendanceWhere(user([role("EXE")]),q(),true);assert.match(summary.sql(),/r.is_voided=false/)
 assert.throws(()=>attendanceGrants(user([role("HR")]),true),forbidden)
})
test("query enforces bounded half-open range and rejects aggregate employee selector",()=>{
 assert.equal(q().from,"2026-10-31T17:00:00.000Z");assert.equal(q().pageSize,25)
 for(const input of [{pageSize:101},{page:0},{from:"2026-02-30T00:00:00Z"},{from:"2026-01-01T00:00:00Z",to:"2026-12-01T00:00:00Z"},{from:"2026-11-01"},{employeeId:a},{direction:["IN"]},{factoryId:[a]},{from:"2026-11-01T00:00:00Z",to:"2026-11-01T00:00:00Z"}])assert.throws(()=>historyQuery(input),e=>e.getStatus()===400)
})
test("SEC gate logs require factory permission and event lookup never consults QR",async()=>{
 for(const code of ["EMP","HR","ADM","SUP","EXE"])assert.throws(()=>gateHistoryScope(user([role(code,"GLOBAL",["access:decide"])])),forbidden)
 assert.throws(()=>gateHistoryScope(user([role("SEC","GLOBAL",[]),role("ADM","GLOBAL",["access:decide"])])),forbidden)
 const where=gateHistoryWhere(user([role("SEC","FACTORY",["access:decide"])]),{...q(),eventId:b,factoryId:b});assert.deepEqual(where.params.slice(0,2),[false,[a]]);assert.match(where.sql(),/a.event_id=/)
 let called=0
 const ds={query:async(sql,params)=>{called++;assert.match(sql,/WITH scoped/);assert.match(sql,/ORDER BY received_at DESC,id DESC/);assert.match(sql,/r.is_voided=false/);assert.ok(params.includes(b));return [{total:0,items:[]}]}}
 assert.deepEqual(await new GateHistoryService(ds).history(user([role("SEC","FACTORY",["access:decide"])]),{eventId:b}),{items:[],total:0,page:1,pageSize:25});assert.equal(called,1)
})
test("detail hides out-of-scope rows as404; count pagination uses same scoped statement",async()=>{
 let sql="",params
 const ds={query:async(s,p)=>{sql=s;params=p;return []}},service=new AttendanceHistoryService(ds)
 await assert.rejects(service.detail(user([role("EMP")]),a),e=>e.getStatus()===404)
 assert.match(sql,/e.employee_id=\$1::uuid/);assert.equal(params[0],b);assert.equal(params.at(-1),a)
 ds.query=async(s,p)=>{sql=s;params=p;return [{total:5,items:[]}]}
 const result=await service.history(user([role("HR")]),{page:2,pageSize:3})
 assert.equal(result.total,5);assert.match(sql,/COUNT\(\*\)::int FROM scoped/);assert.match(sql,/ORDER BY occurred_at DESC,id DESC/);assert.deepEqual(params.slice(-2),[3,3])
})

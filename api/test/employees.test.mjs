import test from "node:test"
import assert from "node:assert/strict"
import { employeeScope, employeeInterval } from "../dist/modules/eqr/application/employee.service.js"
const factory="00000000-0000-4000-8000-000000000001"
const identity=roles=>({userId:factory,roles})
test("employee writes require an HR assignment and keep factory scope bound to that assignment",()=>{
 assert.throws(()=>employeeScope(identity([{code:"ADM",scopeType:"GLOBAL",permissions:["iam:manage"]}])),e=>e.getStatus()===403)
 assert.deepEqual(employeeScope(identity([{code:"HR",scopeType:"FACTORY",factoryId:factory,permissions:[]},{code:"ADM",scopeType:"GLOBAL",permissions:[]}])),{global:false,factoryIds:[factory]})
})
test("effective intervals require timezone, real calendar dates and increasing half-open bounds",()=>{
 for(const [from,to] of [["2026-02-30T00:00:00Z",null],["2026-11-18T00:00:00",null],["2026-11-18T00:00:00Z","2026-11-18T00:00:00Z"]])assert.throws(()=>employeeInterval(from,to),e=>e.getStatus()===400)
 const interval=employeeInterval("2026-11-18T00:00:00+07:00","2026-11-19T00:00:00+07:00")
 assert.equal(interval.validFrom.toISOString(),"2026-11-17T17:00:00.000Z")
 assert.ok(interval.validTo>interval.validFrom)
})

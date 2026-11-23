import test from "node:test"
import assert from "node:assert/strict"
import { EmployeeService, employeeCodePrefix, nextEmployeeCode } from "../dist/modules/eqr/application/employee.service.js"

const factoryId="00000000-0000-4000-8000-000000000001"
const identity={userId:factoryId,roles:[{code:"HR",scopeType:"FACTORY",factoryId,permissions:[]}]}
const input=externalHrId=>({factoryId,externalHrId,fullName:"Test employee",generateEmployeeCode:true})

test("employee codes use a bounded factory prefix, pad numbers and never wrap",()=>{
  assert.equal(employeeCodePrefix(" bd "),"BD-")
  assert.equal(nextEmployeeCode("BD-",null),"BD-0001")
  assert.equal(nextEmployeeCode("BD-","9999"),"BD-10000")
  assert.throws(()=>nextEmployeeCode("A".repeat(21),"9".repeat(11)),e=>e.getStatus()===409)
})

test("code suggestion checks HR factory scope before reading another factory",async()=>{
  let queried=false
  const service=new EmployeeService({manager:{query:async()=>{queried=true;return []}}},{})
  await assert.rejects(service.previewCode(identity,"00000000-0000-4000-8000-000000000002"),e=>e.getStatus()===403)
  assert.equal(queried,false)
})

// Unit transaction adapter only: tests orchestration/rollback and locking protocol, not PostgreSQL behavior.
function fixture(initial=[]) {
  let committed=structuredClone(initial),queue=Promise.resolve()
  const ds={transaction:async work=>{
    let draft,release
    const manager={
      query:async(sql,args)=>{
        if(sql.includes("pg_advisory_xact_lock")) {
          const previous=queue;queue=new Promise(resolve=>{release=resolve});await previous
          draft=structuredClone(committed);return []
        }
        if(sql.includes("FROM factories"))return [{id:factoryId,code:"BD"}]
        if(sql.includes("MAX(CASE")) {
          assert.ok(draft,"allocation lock must precede MAX query")
          const numbers=draft.filter(e=>e.employeeCode.startsWith(args[0])).map(e=>e.employeeCode.slice(args[0].length)).filter(n=>/^\d+$/.test(n)).map(BigInt)
          return [{last:numbers.length?numbers.reduce((a,b)=>a>b?a:b).toString():null}]
        }
        throw new Error(`Unexpected query: ${sql}`)
      },
      getRepository:()=>({create:value=>value,findOneBy:async where=>draft.find(e=>Object.entries(where).every(([k,v])=>e[k]===v))??null}),
      save:async value=>{if(value.employeeCode)draft.push(value);return value},
    }
    try {const result=await work(manager);committed=draft;return result}finally{release?.()}
  }}
  const service=new EmployeeService(ds,{write:async()=>{}})
  service.detail=async(_identity,id)=>committed.find(e=>e.id===id)
  return {service,rows:()=>committed}
}

test("automatic saves serialize allocation and ignore stale editable preview values (unit adapter)",async()=>{
  const f=fixture()
  const [a,b]=await Promise.all([
    f.service.create(identity,{...input("HRS-A"),employeeCode:"BD-0001"}),
    f.service.create(identity,{...input("HRS-B"),employeeCode:"BD-0001"}),
  ])
  assert.deepEqual([a.employeeCode,b.employeeCode],["BD-0001","BD-0002"])
  assert.deepEqual(f.rows().map(e=>e.externalHrId),["HRS-A","HRS-B"])
})

test("HRS conflicts roll back an entire import and manual override conflicts identify the field (unit adapter)",async()=>{
  const f=fixture([{id:factoryId,employeeCode:"BD-0010",externalHrId:"HRS-EXISTING"}])
  await assert.rejects(f.service.importEmployees(identity,{rows:[input("HRS-NEW"),input("HRS-EXISTING")]}),e=>{
    assert.equal(e.getStatus(),409);assert.equal(e.getResponse().field,"externalHrId");assert.equal(e.getResponse().row,3);return true
  })
  assert.equal(f.rows().length,1)
  await assert.rejects(f.service.create(identity,{...input("HRS-NEW"),employeeCode:"BD-0010",generateEmployeeCode:false}),e=>e.getStatus()===409&&e.getResponse().field==="employeeCode")
  assert.equal(f.rows().length,1)
})

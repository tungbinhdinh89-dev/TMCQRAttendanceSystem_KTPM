import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import vm from 'node:vm'
const require=createRequire(import.meta.url)
const ts=require('typescript')
const source=readFileSync(new URL('../src/lib/server-access.ts',import.meta.url),'utf8')
const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}})
const module={exports:{}};vm.runInNewContext(result.outputText,{module,exports:module.exports,URLSearchParams})
const {canVisit,managementTabs,serverHome}=module.exports
const role=(code,permissions=[],scopeType='FACTORY',factoryId='factory-a')=>({code,permissions,scopeType,factoryId})
const user=(...roles)=>({roles})
test('web policy grants only implemented role areas and denies direct foreign URLs',()=>{
 const matrix={EMP:['/qr','/mobile/ma-qr'],HR:['employees','organization'],SEC:['organization','stations','readiness'],ADM:['organization','stations','integrations','readiness'],SUP:[],EXE:[]}
 for(const [code,allowed] of Object.entries(matrix)){
  const u=user(role(code,code==='ADM'?['iam:manage']:[]))
  for(const tab of ['employees','organization','stations','integrations','readiness'])assert.equal(canVisit(u,'/management',`?tab=${tab}`),allowed.includes(tab),`${code} ${tab}`)
  assert.equal(canVisit(u,'/qr'),code==='EMP')
  assert.equal(canVisit(u,'/audit'),code==='ADM')
  assert.equal(canVisit(u,'/app/cham-cong'),false)
  assert.equal(canVisit(u,'/management','?tab=unknown'),false)
 }
})
test('explicit combined roles add capabilities; invalid scope/borrowed permission does not',()=>{
 const combined=user(role('HR'),role('EMP',[],'SELF',null))
 assert.equal(canVisit(combined,'/qr'),true)
 assert.equal(canVisit(combined,'/management','?tab=employees'),true)
 assert.equal(canVisit(combined,'/management','?tab=stations'),false)
 const split=user(role('ADM'),role('HR',['iam:manage']))
 assert.equal(canVisit(split,'/management','?tab=integrations'),false)
 assert.equal(canVisit(user(role('HR',[],'TEAM')),'/management','?tab=employees'),false)
 assert.equal(canVisit(user(role('SEC',['audit:read'])),'/audit'),true)
})
test('role destinations match permitted tabs without granting unimplemented SUP/EXE features',()=>{
 assert.equal(serverHome(user(role('EMP'))),'/qr')
 assert.equal(serverHome(user(role('HR'))),'/management?tab=employees')
 assert.equal(serverHome(user(role('SEC'))),'/management?tab=stations')
 assert.equal(serverHome(user(role('ADM',['iam:manage']))),'/management?tab=organization')
 assert.equal(serverHome(user(role('SUP'))),'/workspace')
 assert.equal(serverHome(user(role('EXE'))),'/workspace')
 assert.equal(managementTabs(user(role('ADM'))).length,0)
})

test("pending password identity cannot enter any business page",()=>{
 const pending={...user(role("EMP")),mustChangePassword:true}
 assert.equal(canVisit(pending,"/qr"),false)
 assert.equal(canVisit(pending,"/management","?tab=employees"),false)
})

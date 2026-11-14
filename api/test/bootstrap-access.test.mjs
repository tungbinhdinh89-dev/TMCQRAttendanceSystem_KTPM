import assert from 'node:assert/strict'
import test from 'node:test'
import { WorkspaceController, withinScope } from '../dist/modules/cfg/presentation/workspace.controller.js'
test('workspace rejects unauthenticated requests before any data query', async()=>{
 let queries=0
 const controller=new WorkspaceController({query:()=>{queries++}}, {me:async()=>{throw new Error('Unauthorized')}})
 await assert.rejects(()=>controller.bootstrap({headers:{}}), /Unauthorized/)
 assert.equal(queries,0)
})
test('scope checks are fail closed and employee scope cannot be broadened by GLOBAL', ()=>{
 const identity={employeeId:'self'}
 const row={id:'other',factory_id:'f1',department_id:'d1',team_id:'t1'}
 assert.equal(withinScope(row,identity,{code:'EMP',scopeType:'GLOBAL'}),false)
 assert.equal(withinScope(row,identity,{code:'SUP',scopeType:'TEAM',teamId:'t2'}),false)
 assert.equal(withinScope(row,identity,{code:'SUP',scopeType:'TEAM',teamId:'t1'}),true)
 assert.equal(withinScope(row,identity,{code:'HR',scopeType:'FACTORY',factoryId:'f1'}),true)
 assert.equal(withinScope(row,identity,{code:'HR',scopeType:'FACTORY',factoryId:null}),false)
 assert.equal(withinScope(row,identity,{code:'HR',scopeType:'unknown'}),false)
})
test('executive bootstrap exposes aggregates without employee/event detail or account enumeration', async()=>{
 const identity={userId:'u',username:'exe.local',employeeId:'e',employee:{fullName:'Account'},roles:[{code:'EXE',scopeType:'GLOBAL'}]}
 const controller=new WorkspaceController({query:async sql=>sql.includes('DISTINCT ON')?[{id:'e',name:'Private profile'}]:[{count:7}]},{me:async()=>identity})
 const {data}=await controller.bootstrap({headers:{cookie:'tmc_session=test'}})
 assert.equal(data.summary.employees,1);assert.equal(data.summary.confirmedAttendance,7)
 assert.deepEqual(data.employees,[]);assert.deepEqual(data.events,[]);assert.deepEqual(data.confirmedEvents,[])
 assert.equal(data.accounts.length,1);assert.equal(data.accounts[0].username,'exe.local')
})

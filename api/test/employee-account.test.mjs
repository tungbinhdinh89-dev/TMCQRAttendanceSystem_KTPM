import assert from "node:assert/strict"
import test from "node:test"
import { EmployeeAccountService } from "../dist/modules/iam/application/employee-account.service.js"
import { AuthService, encodePassword, hashToken } from "../dist/modules/iam/application/auth.service.js"
import { AuthController } from "../dist/modules/iam/presentation/auth.controller.js"

const employeeId = "00000000-0000-4000-8000-000000000001"
const factoryId = "00000000-0000-4000-8000-000000000002"
const identity = { userId: "00000000-0000-4000-8000-000000000003", employeeId, roles: [{code:"HR", scopeType:"FACTORY", factoryId, permissions:[]}] }
function fixture() {
  const employee = {id:employeeId,employeeCode:"TMC-1",fullName:"Employee",status:"ACTIVE"}
  const state = { user:null, assignments:[], sessions:[], audits:[] }
  const users = {
    create: x=>({...x}),
    findOne: async ({where})=>state.user && Object.entries(where).every(([key,value])=>state.user[key]===value) ? {...state.user} : null,
  }
  const roles = {findOne:async()=>({id:"00000000-0000-4000-8000-000000000004"})}
  const assignments = {create:x=>({...x}),createQueryBuilder:()=>{
    const qb={getRawMany:async()=>state.assignments.map(()=>({code:"EMP",scopeType:"SELF",factoryId:null,departmentId:null,teamId:null,permission:null}))}
    for(const name of ["innerJoin","leftJoin","select","where","andWhere"])qb[name]=()=>qb
    return qb
  }}
  const sessions = {create:x=>({...x}),findOne:async({where})=>state.sessions.find(s=>Object.entries(where).every(([k,v])=>s[k]===v)),update:async(id,patch)=>Object.assign(state.sessions.find(s=>s.id===id),patch)}
  const getRepository = entity => ({UserOrmEntity:users,EmployeeOrmEntity:{findOne:async()=>({...employee})},RoleOrmEntity:roles,RoleAssignmentOrmEntity:assignments,UserSessionOrmEntity:sessions})[entity.name]
  const manager={getRepository,
    query:async(sql)=>{
      if(sql.startsWith("SELECT factory_id"))return [{factory_id:factoryId}]
      if(sql.startsWith("UPDATE user_sessions")){for(const s of state.sessions)if(!s.revokedAt){s.revokedAt=new Date();s.revokeReason="PASSWORD_CHANGED"}return []}
      throw new Error(sql)
    },
    save:async(value)=>{
      if(value.passwordHash){if(state.user)throw Object.assign(new Error("duplicate"),{code:"23505"});state.user={...value}}
      else if(value.scopeType)state.assignments.push({...value})
      else state.sessions.push({...value})
      return value
    },
    update:async(entity,id,patch)=>{if(entity.name==="UserOrmEntity")Object.assign(state.user,patch);else await sessions.update(id,patch)},
  }
  const ds={manager,getRepository,transaction:async work=>{
    const snapshot=structuredClone(state)
    try{return await work(manager)}catch(e){Object.assign(state,snapshot);throw e}
  }}
  const audit={write:async event=>{state.audits.push(event)}}
  return {employee,state,ds,audit,accounts:new EmployeeAccountService(ds,audit),auth:new AuthService(ds,audit)}
}

test("HR provisioning creates EMP SELF only; temporary secret is returned once and not audited",async()=>{
  const f=fixture(),result=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
  assert.ok(result.temporaryPassword.length>=24)
  assert.notEqual(f.state.user.passwordHash,result.temporaryPassword)
  assert.equal(f.state.user.mustChangePassword,true)
  assert.equal(f.state.assignments.length,1)
  assert.equal(f.state.assignments[0].scopeType,"SELF")
  assert.equal(f.state.assignments[0].factoryId,null)
  assert.equal(f.state.assignments[0].assignedByUserId,identity.userId)
  const read=await f.accounts.get(identity,employeeId)
  assert.deepEqual(Object.keys(read).sort(),["mustChangePassword","status","userId","username"])
  assert.ok(!JSON.stringify(f.state.audits).includes(result.temporaryPassword))
  assert.ok(!JSON.stringify(read).includes(f.state.user.passwordHash))
  await assert.rejects(f.accounts.provision(identity,employeeId,{username:"another.user"}),e=>e.getStatus()===409)
  assert.equal(f.state.assignments.length,1)
})

test("non-HR and out-of-factory HR cannot read or provision accounts",async()=>{
  for(const roles of [[{code:"ADM",scopeType:"GLOBAL",permissions:["iam:manage"]}],[{code:"EMP",scopeType:"SELF",permissions:[]}],[{code:"HR",scopeType:"FACTORY",factoryId:identity.userId,permissions:[]}]]){
    const f=fixture(),actor={...identity,roles}
    await assert.rejects(f.accounts.get(actor,employeeId),e=>e.getStatus()===403)
    await assert.rejects(f.accounts.provision(actor,employeeId,{username:"employee.one"}),e=>e.getStatus()===403)
    assert.equal(f.state.user,null)
  }
})

test("HR cannot inject elevated role/password; inactive employee rejected; transaction rolls back on audit failure",async()=>{
  const f=fixture()
  for(const input of [{username:"employee.one",role:"ADM"},{username:"employee.one",password:"chosen"},{username:"a"}])await assert.rejects(f.accounts.provision(identity,employeeId,input),e=>e.getStatus()===400)
  f.employee.status="INACTIVE"
  await assert.rejects(f.accounts.provision(identity,employeeId,{username:"employee.one"}),e=>e.getStatus()===409)
  f.employee.status="ACTIVE";f.audit.write=async()=>{throw new Error("audit unavailable")}
  await assert.rejects(f.accounts.provision(identity,employeeId,{username:"employee.one"}),/audit unavailable/)
  assert.equal(f.state.user,null);assert.equal(f.state.assignments.length,0)
})

test("pending first-password session only allows session inspection; business identity is blocked",async()=>{
  const f=fixture(),created=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
  const login=await f.auth.login(created.username,created.temporaryPassword)
  assert.equal(login.identity.mustChangePassword,true)
  assert.equal((await f.auth.me(login.token,true)).mustChangePassword,true)
  await assert.rejects(f.auth.me(login.token),e=>e.getStatus()===403&&e.getResponse().code==="AUTH_PASSWORD_CHANGE_REQUIRED")
  assert.ok(f.state.sessions[0].tokenHash===hashToken(login.token))
})

test("password change rejects weak, identical and wrong-current; successful change revokes all sessions",async()=>{
  const f=fixture(),created=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
  const first=await f.auth.login(created.username,created.temporaryPassword)
  const second=await f.auth.login(created.username,created.temporaryPassword)
  for(const password of ["short",created.temporaryPassword,"x".repeat(129)])await assert.rejects(f.auth.changePassword(first.token,created.temporaryPassword,password),e=>e.getStatus()===400)
  await assert.rejects(f.auth.changePassword(first.token,"incorrect-temp","replacement-password"),e=>e.getStatus()===401)
  assert.equal(f.state.user.mustChangePassword,true)
  await f.auth.changePassword(first.token,created.temporaryPassword,"replacement-password")
  assert.equal(f.state.user.mustChangePassword,false)
  await assert.rejects(f.auth.me(first.token,true),e=>e.getStatus()===401)
  await assert.rejects(f.auth.me(second.token,true),e=>e.getStatus()===401)
  await assert.rejects(f.auth.login(created.username,created.temporaryPassword),e=>e.getStatus()===401)
  const login=await f.auth.login(created.username,"replacement-password")
  assert.equal((await f.auth.me(login.token)).mustChangePassword,false)
  assert.ok(!JSON.stringify(f.state.audits).includes("replacement-password"))
})

test("deactivated employee cannot login or use an existing session",async()=>{
  const f=fixture(),created=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
  const login=await f.auth.login(created.username,created.temporaryPassword)
  f.employee.status="INACTIVE"
  await assert.rejects(f.auth.me(login.token,true),e=>e.getStatus()===401)
  await assert.rejects(f.auth.login(created.username,created.temporaryPassword),e=>e.getStatus()===401)
})

test("controller allows GET me for pending session and clears cookie only after password change succeeds",async()=>{
  const calls=[],service={me:async(...args)=>{calls.push(args);return {}},verifyRequestOrigin:async()=>{},changePassword:async()=>{}}
  const controller=new AuthController(service),request={headers:{cookie:"tmc_session=opaque"}},headers=[]
  await controller.me(request)
  assert.deepEqual(calls,[["opaque",true]])
  await controller.changePassword(request,{currentPassword:"old",newPassword:"replacement-password"},{setHeader:(...v)=>headers.push(v)})
  assert.match(headers[0][1],/Max-Age=0/)
})

test("login revalidates password and employee under employee-then-user locks before session insertion",async()=>{
  for(const change of ["password","inactive"]){
    const f=fixture(),created=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
    const get=f.ds.manager.getRepository,locks=[]
    f.ds.manager.getRepository=entity=>{
      const repo=get(entity)
      return {...repo,findOne:async options=>{
        locks.push([entity.name,options.lock?.mode])
        if(entity.name==="UserOrmEntity"&&change==="password")f.state.user.passwordHash=encodePassword("concurrently-changed-password")
        if(entity.name==="EmployeeOrmEntity"&&change==="inactive")f.employee.status="INACTIVE"
        return repo.findOne(options)
      }}
    }
    await assert.rejects(f.auth.login(created.username,created.temporaryPassword),e=>e.getStatus()===401)
    assert.equal(f.state.sessions.length,0)
    assert.deepEqual(locks.map(([name])=>name),["EmployeeOrmEntity","UserOrmEntity"])
    assert.ok(locks.every(([,mode])=>mode==="pessimistic_write"))
  }
})

test("unique-username database conflict returns 409 and audit failure cannot persist changed password",async()=>{
  const duplicate=fixture(),save=duplicate.ds.manager.save
  duplicate.ds.manager.save=async value=>{if(value.passwordHash)throw Object.assign(new Error("unique"),{code:"23505"});return save(value)}
  await assert.rejects(duplicate.accounts.provision(identity,employeeId,{username:"duplicate.user"}),e=>e.getStatus()===409&&e.getResponse().code==="ACCOUNT_EXISTS")
  assert.equal(duplicate.state.user,null);assert.equal(duplicate.state.assignments.length,0)
  const f=fixture(),created=await f.accounts.provision(identity,employeeId,{username:"employee.one"})
  const login=await f.auth.login(created.username,created.temporaryPassword),before=f.state.user.passwordHash
  f.audit.write=async()=>{throw new Error("audit unavailable")}
  await assert.rejects(f.auth.changePassword(login.token,created.temporaryPassword,"replacement-password"),/audit unavailable/)
  assert.equal(f.state.user.passwordHash,before);assert.equal(f.state.user.mustChangePassword,true);assert.equal(f.state.sessions[0].revokedAt,null)
})

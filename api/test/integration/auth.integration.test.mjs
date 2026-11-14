import assert from 'node:assert/strict'
import test from 'node:test'
const base=(process.env.TEST_API_URL || 'http://127.0.0.1:3000/api').replace(/\/$/,'')
const password=process.env.LOCAL_ACCOUNT_PASSWORD
const request=(path,options={})=>fetch(base+path,options)
test('all six roles authenticate against PostgreSQL; scope, session revocation and wrong passwords are enforced',async()=>{
 assert.ok(password,'LOCAL_ACCOUNT_PASSWORD required; prepare local accounts explicitly')
 assert.equal((await request('/workspace/bootstrap')).status,401)
 const invalid=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'emp.local',password:'wrong-password'})})
 assert.equal(invalid.status,401)
 for(const [name,role] of [['emp','EMP'],['hr','HR'],['sup','SUP'],['sec','SEC'],['adm','ADM'],['exe','EXE']]){
  const response=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:name+'.local',password})})
  assert.equal(response.status,201,name)
  const header=response.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/)
  const cookie=header.split(';')[0]
  const me=await (await request('/me',{headers:{Cookie:cookie}})).json()
  assert.ok(me.roles.some(r=>r.code===role),name)
  const workspace=await request('/workspace/bootstrap',{headers:{Cookie:cookie}})
  assert.equal(workspace.status,200,name)
  const {data}=await workspace.json()
  assert.ok(data.accounts.every(account=>account.id===me.userId))
  assert.deepEqual(data.shifts,[]);assert.deepEqual(data.attendance,[])
  assert.ok(!JSON.stringify(data).includes('password'))
  if(role==='EMP') assert.ok(data.employees.every(e=>e.id===me.employeeId))
  if(role==='SUP') assert.ok(data.employees.every(e=>e.teamId===me.roles.find(r=>r.code==='SUP').teamId))
  if(role==='HR'||role==='SEC') assert.ok(data.employees.every(e=>e.factoryId===me.roles.find(r=>r.code===role).factoryId))
  if(role==='EXE') {assert.deepEqual(data.employees,[]);assert.deepEqual(data.events,[])}
  assert.equal((await request('/auth/logout',{method:'POST',headers:{Cookie:cookie}})).status,204)
  assert.equal((await request('/me',{headers:{Cookie:cookie}})).status,401)
 }
 const crossOrigin=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.invalid'},body:JSON.stringify({username:'emp.local',password})})
 assert.equal(crossOrigin.status,403)
})

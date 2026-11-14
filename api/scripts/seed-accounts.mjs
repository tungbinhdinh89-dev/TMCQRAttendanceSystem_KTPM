import './check-account-env.mjs'
import { randomUUID, randomBytes, scryptSync } from 'node:crypto'
import pg from 'pg'
const { Client } = pg
const profiles = [
  ['EMP', 'emp.local', 'Nhân viên', 'emp.demo'], ['HR', 'hr.local', 'Nhân sự', 'hr.demo'],
  ['SUP', 'sup.local', 'Giám sát sản xuất', 'sup.active.demo'], ['SEC', 'sec.local', 'Bảo vệ', 'sec.active.demo'],
  ['ADM', 'adm.local', 'Quản trị hệ thống', 'adm.demo'], ['EXE', 'exe.local', 'Ban điều hành', 'exe.demo'],
]
if (!process.argv.includes('--apply')) {
  console.log('Plan only: provision six local login accounts; no attendance, scans, shifts or device credentials. Pass --apply to write.')
  process.exit(0)
}
const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  await client.query('BEGIN')
  await client.query("SELECT pg_advisory_xact_lock(hashtext('tmc-local-accounts'))")
  // Reuse configured organization; create only the minimal local account scope on a fresh schema.
  let factory = (await client.query("SELECT id FROM factories WHERE code = 'BD'")).rows[0]
  if (!factory) factory = (await client.query("INSERT INTO factories(id,code,name) VALUES($1,'BD','Nhà máy Bình Dương') RETURNING id", [randomUUID()])).rows[0]
  let department = (await client.query("SELECT id FROM departments WHERE factory_id=$1 AND is_active ORDER BY (code='PROD') DESC,code LIMIT 1", [factory.id])).rows[0]
  if (!department) department = (await client.query("INSERT INTO departments(id,factory_id,code,name) VALUES($1,$2,'LOCAL','Phạm vi tài khoản nội bộ') RETURNING id", [randomUUID(), factory.id])).rows[0]
  let team = (await client.query('SELECT id FROM teams WHERE department_id=$1 AND is_active ORDER BY code LIMIT 1', [department.id])).rows[0]
  if (!team) team = (await client.query("INSERT INTO teams(id,department_id,code,name) VALUES($1,$2,'LOCAL','Tổ tài khoản nội bộ') RETURNING id", [randomUUID(), department.id])).rows[0]
  if (process.argv.includes('--remove-legacy')) {
    const rows = (await client.query("SELECT u.id,u.username,e.id AS employee_id,e.employee_code FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.username LIKE '%.demo'")).rows
    const expected = ['emp.demo','hr.demo','sup.demo','sec.demo','adm.demo','exe.demo','sup.active.demo','sec.active.demo']
    const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
    for (const row of rows) {
      const index = expected.indexOf(row.username)
      if (index < 0 || row.id !== id(201+index) || row.employee_id !== id(101+index) || row.employee_code !== `TMC${String(index+1).padStart(4,'0')}`) {
        throw new Error('Legacy identity differs from known fixture; no changes applied.')
      }
    }
    const ids = rows.map(row=>row.employee_id)
    // Refuse cleanup if any ledger/workflow references these identities. Never delete business evidence.
    const columns = (await client.query("SELECT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='employee_id' AND table_name NOT IN ('users','employee_assignments','access_grants')")).rows
    for (const {table_name} of columns) {
      if (!/^[a-z_]+$/.test(table_name)) throw new Error('Unexpected table name')
      if ((await client.query(`SELECT 1 FROM "${table_name}" WHERE employee_id=ANY($1::uuid[]) LIMIT 1`,[ids])).rowCount) throw new Error('Legacy identities have business references; cleanup aborted.')
    }
    // Retire only the two known negative test identities; the six usable profiles are renamed below.
    const negatives = rows.filter(row=>['sup.demo','sec.demo'].includes(row.username))
    const userIds = negatives.map(row=>row.id), employeeIds = negatives.map(row=>row.employee_id)
    await client.query('DELETE FROM user_sessions WHERE user_id=ANY($1::uuid[])',[userIds])
    await client.query('DELETE FROM user_role_assignments WHERE user_id=ANY($1::uuid[])',[userIds])
    await client.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[userIds])
    await client.query('DELETE FROM access_grants WHERE employee_id=ANY($1::uuid[])',[employeeIds])
    await client.query('DELETE FROM employee_assignments WHERE employee_id=ANY($1::uuid[])',[employeeIds])
    await client.query('DELETE FROM employees WHERE id=ANY($1::uuid[])',[employeeIds])
  }
  for (const [code,username,name,legacyName] of profiles) {
    let user = (await client.query('SELECT * FROM users WHERE username=$1',[username])).rows[0]
    if (!user && process.argv.includes('--remove-legacy')) user = (await client.query('SELECT * FROM users WHERE username=$1',[legacyName])).rows[0]
    const employeeId = user?.employee_id ?? randomUUID()
    if (user && user.username === username) {
      const employee = (await client.query('SELECT external_hr_id FROM employees WHERE id=$1',[employeeId])).rows[0]
      if (employee?.external_hr_id !== `local-account:${username}`) throw new Error('Username belongs to another identity; refusing overwrite.')
    }
    const salt = randomBytes(16).toString('hex')
    const hash = `scrypt$${salt}$${scryptSync(process.env.LOCAL_ACCOUNT_PASSWORD,salt,64).toString('hex')}`
    const userId = user?.id ?? randomUUID()
    await client.query(`INSERT INTO employees(id,employee_code,external_hr_id,full_name,status) VALUES($1,$2,$3,$4,'ACTIVE')
      ON CONFLICT(id) DO UPDATE SET employee_code=EXCLUDED.employee_code,external_hr_id=EXCLUDED.external_hr_id,full_name=EXCLUDED.full_name,status='ACTIVE',email=NULL,deactivated_at=NULL,updated_at=NOW()`, [employeeId,`LOCAL-${code}`,`local-account:${username}`,`Tài khoản ${name}`])
    await client.query(`INSERT INTO users(id,employee_id,username,password_hash,status) VALUES($1,$2,$3,$4,'ACTIVE')
      ON CONFLICT(id) DO UPDATE SET username=EXCLUDED.username,password_hash=EXCLUDED.password_hash,status='ACTIVE',updated_at=NOW()`,[userId,employeeId,username,hash])
    await client.query('UPDATE user_sessions SET revoked_at=NOW(),revoke_reason=$2 WHERE user_id=$1 AND revoked_at IS NULL',[userId,'LOCAL_PASSWORD_ROTATION'])
    let role = (await client.query('SELECT id FROM roles WHERE code=$1 AND is_active',[code])).rows[0]
    if (!role) role = (await client.query('INSERT INTO roles(id,code,name) VALUES($1,$2,$3) RETURNING id',[randomUUID(),code,name])).rows[0]
    const scope = ['ADM','EXE'].includes(code)?'GLOBAL':code==='EMP'?'SELF':code==='SUP'?'TEAM':'FACTORY'
    await client.query('UPDATE user_role_assignments SET revoked_at=NOW(),revoke_reason=$2 WHERE user_id=$1 AND revoked_at IS NULL',[userId,'LOCAL_ACCOUNT_REPROVISION'])
    await client.query(`INSERT INTO user_role_assignments(id,user_id,role_id,scope_type,factory_id,department_id,team_id,valid_from)
      VALUES($1,$2,$3,$4,$5,$6,$7,NOW())`,[randomUUID(),userId,role.id,scope,scope==='GLOBAL'||scope==='SELF'?null:factory.id,scope==='TEAM'?department.id:null,scope==='TEAM'?team.id:null])
    if (!(await client.query('SELECT 1 FROM employee_assignments WHERE employee_id=$1 AND valid_to IS NULL',[employeeId])).rowCount) {
      await client.query('INSERT INTO employee_assignments(id,employee_id,factory_id,department_id,team_id,valid_from) VALUES($1,$2,$3,$4,$5,NOW())',[randomUUID(),employeeId,factory.id,department.id,team.id])
    }
  }
  await client.query('COMMIT')
  console.log('Six local accounts prepared. Passwords hashed; no operating data generated.')
} catch (error) {
  await client.query('ROLLBACK')
  console.error(error.message)
  process.exitCode=1
} finally { await client.end() }

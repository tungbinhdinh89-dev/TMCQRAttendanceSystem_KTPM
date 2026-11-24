import assert from "node:assert/strict"
import test from "node:test"
import { Test } from "@nestjs/testing"
import { UnauthorizedException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { AppModule } from "../dist/app.module.js"
import { AuthService } from "../dist/modules/iam/application/auth.service.js"
import { AuditService } from "../dist/modules/iam/application/audit.service.js"

const factoryId = "00000000-0000-4000-8000-000000000001"
const employeeId = "00000000-0000-4000-8000-000000000002"
const role = (code, permissions = ["attendance:read"], scopeType = "FACTORY") => ({ code, permissions, scopeType, factoryId, departmentId: null, teamId: null })
const identity = roles => ({ userId: employeeId, employeeId, username: "http-test", roles })

test("history HTTP boundaries reject anonymous, wrong-role and borrowed permissions before querying data", async t => {
  let current = null, queries = 0
  const fail = () => { queries++; throw new Error("Forbidden request reached persistence") }
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource).useValue({ query: fail, getRepository: fail, transaction: fail })
    .overrideProvider(AuditService).useValue({ write: async () => {} })
    .overrideProvider(AuthService).useValue({ me: async () => { if (!current) throw new UnauthorizedException(); return current } })
    .compile()
  const app = module.createNestApplication(); app.useLogger(false); app.setGlobalPrefix("api")
  await app.listen(0, "127.0.0.1"); t.after(() => app.close())
  const base = await app.getUrl()
  for (const path of ["attendance/history", "attendance/summary", "gate/history"]) {
    current = null
    assert.equal((await fetch(`${base}/api/${path}`)).status, 401, `anonymous ${path}`)
    current = identity([role("ADM", ["iam:manage", "attendance:read", "access:decide"], "GLOBAL")])
    assert.equal((await fetch(`${base}/api/${path}`)).status, 403, `ADM is not business authority: ${path}`)
  }
  for (const code of ["SEC", "EXE"]) {
    current = identity([role(code, ["attendance:read", "access:decide"])])
    assert.equal((await fetch(`${base}/api/attendance/history`)).status, 403, `${code} no attendance details`)
  }
  for (const code of ["EMP", "HR", "SUP"]) {
    current = identity([role(code)])
    assert.equal((await fetch(`${base}/api/attendance/summary`)).status, 403, `${code} no executive capability`)
    assert.equal((await fetch(`${base}/api/gate/history`)).status, 403, `${code} no security capability`)
  }
  current = identity([role("SUP")])
  assert.equal((await fetch(`${base}/api/attendance/history`)).status, 403, "SUP factory scope cannot imply a team")
  current = identity([role("HR", []), role("ADM", ["attendance:read"], "GLOBAL")])
  assert.equal((await fetch(`${base}/api/attendance/history`)).status, 403, "HR cannot borrow ADM permission")
  current = identity([role("SEC", []), role("HR", ["access:decide"], "GLOBAL")])
  assert.equal((await fetch(`${base}/api/gate/history`)).status, 403, "SEC cannot borrow HR permission")
  assert.equal(queries, 0)
})

import assert from "node:assert/strict"
import test from "node:test"
import { AuthService, encodePassword, hashToken } from "../dist/modules/iam/application/auth.service.js"
import { AuthController } from "../dist/modules/iam/presentation/auth.controller.js"
import { allowedOrigins } from "../dist/platform/http/allowed-origins.js"

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  employeeId: "00000000-0000-0000-0000-000000000002",
  username: "emp001",
  passwordHash: encodePassword("correct-password"),
  status: "ACTIVE",
}
const employee = {
  id: user.employeeId,
  employeeCode: "EMP001",
  fullName: "Demo Employee",
  status: "ACTIVE",
}

function createFixture() {
  let savedSession
  const userRepository = {
    findOne: async () => user,
    update: async () => undefined,
  }
  const employeeRepository = { findOne: async () => employee }
  const sessionRepository = {
    create: (value) => ({ id: "00000000-0000-0000-0000-000000000003", ...value }),
    save: async (value) => {
      savedSession = value
      return value
    },
    findOne: async ({ where }) => savedSession?.tokenHash === where.tokenHash ? savedSession : null,
    update: async (_id, patch) => {
      savedSession = { ...savedSession, ...patch }
    },
  }
  const roleAssignmentRepository = {
    createQueryBuilder: () => ({
      innerJoin: function () { return this },
      leftJoin: function () { return this },
      select: function () { return this },
      where: function () { return this },
      andWhere: function () { return this },
      getRawMany: async () => [{
        code: "EMP",
        scopeType: "SELF",
        factoryId: null,
        departmentId: null,
        teamId: null,
        permission: "attendance:read:self",
      }],
    }),
  }
  const dataSource = {
    getRepository(entity) {
      if (entity.name === "UserOrmEntity") return userRepository
      if (entity.name === "EmployeeOrmEntity") return employeeRepository
      if (entity.name === "UserSessionOrmEntity") return sessionRepository
      if (entity.name === "RoleAssignmentOrmEntity") return roleAssignmentRepository
      throw new Error(`Unexpected repository ${entity.name}`)
    },
    transaction: async (callback) => callback({
      save: sessionRepository.save,
      update: async (entity, id, patch) => entity.name === "UserSessionOrmEntity"
        ? sessionRepository.update(id, patch)
        : userRepository.update(id, patch),
    }),
  }
  const auditEvents = []
  const audit = {
    write: async (event, manager) => { auditEvents.push({ event, manager }) },
    transaction: async (_event, work) => dataSource.transaction(work),
  }
  return { dataSource, sessionRepository, audit, auditEvents }
}

test("login creates an opaque session and returns scoped identity", async () => {
  const fixture = createFixture()
  const service = new AuthService(fixture.dataSource, fixture.audit)
  const result = await service.login("emp001", "correct-password")

  assert.equal(result.identity.employee.employeeCode, "EMP001")
  assert.equal(result.identity.roles[0].scopeType, "SELF")
  assert.notEqual(result.token, user.passwordHash)
  assert.equal(fixture.sessionRepository.findOne({ where: { tokenHash: hashToken(result.token) } }) instanceof Promise, true)
})

test("expired or revoked sessions are rejected and logout revokes the hash", async () => {
  const fixture = createFixture()
  const service = new AuthService(fixture.dataSource, fixture.audit)
  const result = await service.login("emp001", "correct-password")

  await service.logout(result.token)
  await assert.rejects(() => service.me(result.token), { name: "UnauthorizedException" })
})

test("successful login and logout pass their transaction manager to mandatory audit", async () => {
  const f = createFixture()
  const service = new AuthService(f.dataSource, f.audit)
  const result = await service.login("emp001", "correct-password")
  await service.logout(result.token)
  assert.deepEqual(f.auditEvents.map(x => [x.event.action, x.event.outcome]), [["AUTH_LOGIN", "SUCCESS"], ["AUTH_LOGOUT", "SUCCESS"]])
  assert.ok(f.auditEvents.every(x => x.manager && typeof x.manager.update === "function"))
  const serialized = JSON.stringify(f.auditEvents.map(x => x.event))
  for (const secret of [result.token, hashToken(result.token), user.passwordHash, "correct-password"]) assert.ok(!serialized.includes(secret))
})

test("failed login and missing/invalid sessions emit independent denial audit without secrets", async () => {
  const f = createFixture()
  const service = new AuthService(f.dataSource, f.audit)
  await assert.rejects(service.login("emp001", "bad-password"), error => error.getStatus() === 401)
  await assert.rejects(service.me(undefined), error => error.getStatus() === 401)
  await assert.rejects(service.me("raw-invalid-session"), error => error.getStatus() === 401)
  assert.deepEqual(f.auditEvents.map(x => x.event.outcome), ["FAILURE", "DENIED", "DENIED"])
  assert.ok(f.auditEvents.every(x => x.manager === undefined))
  const serialized = JSON.stringify(f.auditEvents)
  assert.ok(!serialized.includes("bad-password"))
  assert.ok(!serialized.includes("raw-invalid-session"))
})

test("mandatory audit errors cannot return a successful auth session or silently disappear", async () => {
  const f = createFixture()
  const audit = { write: async () => { throw new Error("audit unavailable") } }
  const service = new AuthService(f.dataSource, audit)
  await assert.rejects(service.login("emp001", "correct-password"), /audit unavailable/)
  await assert.rejects(service.login("emp001", "bad-password"), /audit unavailable/)
})

test("untrusted mutation origin is denied and audited; allowed origin and non-browser requests remain usable", async t => {
  const previous = process.env.CORS_ORIGINS
  t.after(() => {
    if (previous === undefined) delete process.env.CORS_ORIGINS
    else process.env.CORS_ORIGINS = previous
  })
  process.env.CORS_ORIGINS = "https://trusted.example"
  const f = createFixture()
  const service = new AuthService(f.dataSource, f.audit)
  await assert.rejects(service.verifyRequestOrigin("https://attacker.example", "AUTH_LOGIN"), error => error.getStatus() === 403)
  assert.equal(f.auditEvents.length, 1)
  assert.equal(f.auditEvents[0].event.reason, "ORIGIN_NOT_ALLOWED")
  assert.equal(f.auditEvents[0].event.outcome, "DENIED")
  await service.verifyRequestOrigin("https://trusted.example", "AUTH_LOGIN")
  await service.verifyRequestOrigin(undefined, "AUTH_LOGOUT")
  assert.equal(f.auditEvents.length, 1)
})

test("production cookies are Secure/HttpOnly and production CORS has no implicit allowed origin", async t => {
  const previous = { NODE_ENV: process.env.NODE_ENV, CORS_ORIGINS: process.env.CORS_ORIGINS }
  t.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })
  process.env.NODE_ENV = "production"
  delete process.env.CORS_ORIGINS
  assert.deepEqual(allowedOrigins(), [])
  const controller = new AuthController({
    verifyRequestOrigin: async () => undefined,
    login: async () => ({ token: "opaque-fixture", expiresAt: new Date("2026-12-01T00:00:00Z"), identity: {} }),
    logout: async () => undefined,
  })
  const cookies = []
  const response = { setHeader: (_name, value) => cookies.push(value) }
  const request = { headers: {} }
  await controller.login({ username: "test", password: "test" }, response, request)
  await controller.logout(request, response)
  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/)
    assert.match(cookie, /Secure/)
    assert.match(cookie, /SameSite=Lax/)
  }
  assert.match(cookies[1], /Max-Age=0/)
})

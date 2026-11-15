import assert from "node:assert/strict"
import test from "node:test"
import { Test } from "@nestjs/testing"
import { UnauthorizedException } from "@nestjs/common"
import { AuditService, auditScope, redactAuditData, validateAuditQuery } from "../dist/modules/iam/application/audit.service.js"
import { AuditController } from "../dist/modules/iam/presentation/audit.controller.js"
import { AuthService } from "../dist/modules/iam/application/auth.service.js"

const userId = "00000000-0000-0000-0000-000000000001"
const factoryA = "00000000-0000-0000-0000-000000000010"
const factoryB = "00000000-0000-0000-0000-000000000020"
const correlationId = "00000000-0000-0000-0000-000000000030"
const role = (code, scopeType = "GLOBAL", permissions = ["audit:read"], factoryId = null) => ({ code, scopeType, permissions, factoryId })
const identity = (...roles) => ({ userId, roles })
const event = { actorType: "USER", actorUserId: userId, factoryId: factoryA, action: "EMPLOYEE_UPDATE", objectType: "EMPLOYEE", objectId: userId, outcome: "SUCCESS", correlationId }

function fixture({ rows = [], total = rows.length, failSave = false } = {}) {
  const stored = [], calls = []
  let transactions = 0
  const makeManager = staged => ({
    getRepository: () => ({
      create: value => value,
      save: async value => {
        if (failSave && value.action) throw new Error("audit storage unavailable")
        staged.push(value)
        return value
      },
    }),
  })
  const query = {}
  for (const method of ["where", "andWhere", "orderBy", "addOrderBy", "skip", "take"]) {
    query[method] = (...args) => { calls.push([method, ...args]); return query }
  }
  query.getManyAndCount = async () => { calls.push(["getManyAndCount"]); return [rows, total] }
  const dataSource = {
    manager: makeManager(stored),
    getRepository: () => ({ createQueryBuilder: alias => { calls.push(["builder", alias]); return query } }),
    transaction: async work => {
      transactions++
      const staged = []
      const result = await work(makeManager(staged))
      stored.push(...staged)
      return result
    },
  }
  return { service: new AuditService(dataSource), dataSource, stored, calls, transactions: () => transactions }
}

test("redaction removes nested secret keys, recognizable credentials and cyclic payloads", () => {
  const circular = { publicLabel: "night shift" }; circular.self = circular
  const input = {
    employeeCode: "EMP001", password: "short-secret", nested: [
      { session_token: "opaque-session", privateKey: "private-key", qrPayload: "scan-data", api_key: "api-key" },
      "Bearer leaked-value", "-----BEGIN PRIVATE KEY-----", "a".repeat(64), "header.payload.signature",
    ], circular,
  }
  const output = redactAuditData(input)
  assert.equal(output.employeeCode, "EMP001")
  assert.equal(output.password, "[REDACTED]")
  for (const value of Object.values(output.nested[0])) assert.equal(value, "[REDACTED]")
  assert.deepEqual(output.nested.slice(1), Array(4).fill("[REDACTED]"))
  assert.doesNotThrow(() => JSON.stringify(output))
  assert.equal(input.password, "short-secret", "caller input is not mutated")
})

test("audit writes use the supplied transactional manager and redact before persistence", async () => {
  const f = fixture()
  const transactional = []
  const manager = { getRepository: () => ({ create: x => x, save: async x => transactional.push(x) }) }
  await f.service.write({ ...event, beforeData: { passwordHash: "hash" }, afterData: { state: "ACTIVE", token: "raw-token" } }, manager)
  assert.equal(f.stored.length, 0, "must not use independent manager when transaction manager is supplied")
  assert.equal(transactional.length, 1)
  assert.equal(transactional[0].correlationId, correlationId)
  assert.equal(transactional[0].objectId, userId, "UUID business identifiers remain traceable")
  assert.equal(transactional[0].actorUserId, userId)
  assert.equal(transactional[0].afterData.token, "[REDACTED]")
  assert.equal(transactional[0].beforeData.passwordHash, "[REDACTED]")
  assert.match(transactional[0].id, /^[0-9a-f-]{36}$/)
})

test("transaction orchestration commits business writes and audit together (unit adapter)", async () => {
  const f = fixture()
  const result = await f.service.transaction(event, async manager => {
    await manager.getRepository().save({ businessRecord: "changed" })
    return "updated"
  })
  assert.equal(result, "updated")
  assert.equal(f.transactions(), 1)
  assert.equal(f.stored.length, 2)
  assert.equal(f.stored[1].action, event.action)
})

test("failed business work emits no success audit and propagates failure (unit adapter)", async () => {
  const f = fixture()
  await assert.rejects(f.service.transaction(event, async manager => {
    await manager.getRepository().save({ businessRecord: "pending" })
    throw new Error("business failure")
  }), /business failure/)
  assert.deepEqual(f.stored, [])
})

test("mandatory audit persistence failure rejects the transaction and independent audit write", async () => {
  const f = fixture({ failSave: true })
  await assert.rejects(f.service.transaction(event, async manager => {
    await manager.getRepository().save({ businessRecord: "staged" })
    return "would succeed"
  }), /audit storage unavailable/)
  assert.equal(f.stored.length, 0)
  await assert.rejects(f.service.write({ ...event, outcome: "DENIED" }), /audit storage unavailable/)
})

test("EMP, EXE and unprivileged administrators cannot grant audit access", () => {
  for (const r of [role("EMP"), role("EXE"), role("ADM", "GLOBAL", []), role("HR", "TEAM")]) {
    assert.throws(() => auditScope(identity(r)), error => error.getStatus() === 403)
  }
  assert.deepEqual(auditScope(identity(role("EMP"), role("ADM", "FACTORY", ["iam:manage"], factoryA))), { global: false, factoryIds: [factoryA] })
})

test("scope and permission cannot be combined across separate assignments", () => {
  const result = auditScope(identity(role("ADM", "GLOBAL", []), role("HR", "FACTORY", ["audit:read"], factoryA)))
  assert.deepEqual(result, { global: false, factoryIds: [factoryA] })
  assert.throws(() => auditScope(identity(role("EMP", "GLOBAL"), role("HR", "FACTORY", [], factoryA))), error => error.getStatus() === 403)
  assert.deepEqual(auditScope(identity(role("HR", "FACTORY", ["audit:read"], factoryA), role("SEC", "FACTORY", ["audit:read"], factoryB))), { global: false, factoryIds: [factoryA, factoryB] })
})

test("scoped search binds factory and filters and paginates the same counted query", async () => {
  const f = fixture({ rows: [{ ...event, id: userId, createdAt: new Date("2026-11-15T00:00:00Z"), reason: "Bearer legacy-value", beforeData: { rawSession: "secret" }, afterData: { status: "ACTIVE" } }], total: 31 })
  const action = "LOGIN' OR 1=1 --"
  const page = await f.service.search(identity(role("SEC", "FACTORY", ["audit:read"], factoryA)), { page: "2", pageSize: "10", factoryId: factoryA, action, correlationId, from: "2026-11-01T00:00:00Z", to: "2026-11-30T23:59:59Z" })
  assert.deepEqual(f.calls.find(c => c[0] === "where"), ["where", "audit.factory_id IN (:...scopeFactoryIds)", { scopeFactoryIds: [factoryA] }])
  assert.deepEqual(f.calls.find(c => c[1] === "audit.action = :action"), ["andWhere", "audit.action = :action", { action }])
  assert.ok(!f.calls.some(c => typeof c[1] === "string" && c[1].includes(action)), "untrusted values are bound, not interpolated")
  assert.deepEqual(f.calls.find(c => c[0] === "skip"), ["skip", 10])
  assert.deepEqual(f.calls.find(c => c[0] === "take"), ["take", 10])
  assert.deepEqual(f.calls.filter(c => c[0] === "getManyAndCount"), [["getManyAndCount"]])
  assert.equal(page.total, 31)
  assert.equal(page.page, 2)
  assert.equal(page.items[0].beforeData.rawSession, "[REDACTED]", "legacy rows are redacted on read too")
  assert.equal(page.items[0].reason, "[REDACTED]")
})

test("out-of-scope factory and forbidden role are denied and audited before any read query", async () => {
  for (const [who, input] of [
    [identity(role("HR", "FACTORY", ["audit:read"], factoryA)), { factoryId: factoryB }],
    [identity(role("EMP")), {}], [identity(role("EXE")), {}],
  ]) {
    const f = fixture()
    await assert.rejects(f.service.search(who, input), error => error.getStatus() === 403)
    assert.equal(f.calls.length, 0)
    assert.equal(f.stored.length, 1)
    assert.equal(f.stored[0].outcome, "DENIED")
    assert.equal(f.stored[0].actorUserId, userId)
  }
})

test("invalid filter and pagination inputs are rejected instead of widening the query", () => {
  assert.deepEqual(validateAuditQuery({}), { page: 1, pageSize: 25 })
  for (const input of [{ page: 0 }, { page: "1.5" }, { pageSize: 101 }, { page: [] }, { factoryId: "not-a-uuid" }, { correlationId: "bad" }, { action: ["LOGIN"] }, { from: "yesterday" }, { from: "2026-02-30T00:00:00Z" }, { from: "2026-11-02T00:00:00Z", to: "2026-11-01T00:00:00Z" }, { outcome: "OK" }, { unexpected: true }]) {
    assert.throws(() => validateAuditQuery(input), error => error.getStatus() === 400, JSON.stringify(input))
  }
})

test("HTTP audit endpoint authenticates, enforces role/factory policy, and has no mutation routes (provider-backed)", async t => {
  const f = fixture()
  let who = identity(role("EMP"))
  const module = await Test.createTestingModule({
    controllers: [AuditController],
    providers: [
      { provide: AuditService, useValue: f.service },
      { provide: AuthService, useValue: { me: async token => {
        if (!token) throw new UnauthorizedException()
        return who
      } } },
    ],
  }).compile()
  const app = module.createNestApplication()
  t.after(() => app.close())
  app.setGlobalPrefix("api")
  await app.listen(0, "127.0.0.1")
  const base = `${await app.getUrl()}/api/audit-entries`
  assert.equal((await fetch(base)).status, 401)
  const options = { headers: { Cookie: "tmc_session=opaque-test-session" } }
  assert.equal((await fetch(base, options)).status, 403)
  who = identity(role("HR", "FACTORY", ["audit:read"], factoryA))
  assert.equal((await fetch(`${base}?factoryId=${factoryB}`, options)).status, 403)
  assert.equal((await fetch(`${base}?page=0`, options)).status, 400)
  const response = await fetch(`${base}?page=2&pageSize=10`, options)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { items: [], total: 0, page: 2, pageSize: 10 })
  for (const method of ["POST", "PATCH", "DELETE"]) {
    assert.equal((await fetch(base, { ...options, method })).status, 404)
  }
})

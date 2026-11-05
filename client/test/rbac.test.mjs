import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

function loadModule(relativePath) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8")
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(output, { exports, module: { exports } })
  return exports
}
const { hasAccess, canManage, scopeEmployees } = loadModule("../src/lib/rbac.ts")
const { accountFromSession } = loadModule("../src/lib/session.ts")

test("supervisors and administrators do not inherit HR correction or SEC override", () => {
  assert.equal(hasAccess("DEPARTMENT_MANAGER", "cham-cong"), true)
  assert.equal(canManage("DEPARTMENT_MANAGER", "attendance"), false)
  assert.equal(canManage("DEPARTMENT_MANAGER", "shifts"), false)
  assert.equal(canManage("SYSTEM_ADMIN", "employees"), false)
  assert.equal(canManage("SYSTEM_ADMIN", "attendance"), false)
  assert.equal(canManage("SYSTEM_ADMIN", "override"), false)
  assert.equal(canManage("SYSTEM_ADMIN", "settings"), true)
})

test("executive navigation is summary-only and never grants gate control", () => {
  assert.equal(hasAccess("EXECUTIVE", "bao-cao"), true)
  assert.equal(hasAccess("EXECUTIVE", "kiem-soat"), false)
  assert.equal(hasAccess("EXECUTIVE", "nhan-su"), false)
  assert.equal(canManage("EXECUTIVE", "gates"), false)
})

test("employee, team and factory visibility follow the session scope", () => {
  const db = { employees: [
    { id: "one", factoryId: "bd", teamId: "a" },
    { id: "two", factoryId: "bd", teamId: "b" },
    { id: "three", factoryId: "la", teamId: "c" },
  ] }
  assert.deepEqual(scopeEmployees(db, { role: "EMPLOYEE", employeeId: "one", scopeType: "FACTORY", factoryId: "bd" }).map(e => e.id), ["one"])
  assert.deepEqual(scopeEmployees(db, { role: "DEPARTMENT_MANAGER", scopeType: "TEAM", teamId: "a" }).map(e => e.id), ["one"])
  assert.deepEqual(scopeEmployees(db, { role: "HR_MANAGER", scopeType: "FACTORY", factoryId: "bd" }).map(e => e.id), ["one", "two"])
  assert.equal(scopeEmployees(db, { role: "HR_MANAGER", scopeType: "UNKNOWN" }).length, 0)
})

test("session roles override untrusted bootstrap role labels and preserve scope", () => {
  const identity = { userId: "user", username: "exe.demo", employeeId: "employee", employee: { fullName: "Demo", status: "ACTIVE" }, roles: [{ code: "EXE", scopeType: "FACTORY", factoryId: "la", departmentId: null, teamId: null, permissions: ["attendance:read"] }] }
  const db = { accounts: [{ id: "user", role: "GATE_OPERATOR", site: "la" }], employees: [{ id: "employee", department: "Demo" }] }
  const account = accountFromSession(identity, db)
  assert.equal(account.role, "EXECUTIVE")
  assert.equal(account.factoryId, "la")
  assert.equal(account.scopeType, "FACTORY")
  assert.equal(accountFromSession({ ...identity, roles: [] }, db), undefined)
  assert.equal(accountFromSession({ ...identity, employee: { status: "INACTIVE" } }, db), undefined)
})

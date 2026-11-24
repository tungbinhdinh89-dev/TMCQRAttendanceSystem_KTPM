import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import vm from "node:vm"
const ts = createRequire(import.meta.url)("typescript")
const code = ts.transpileModule(readFileSync(new URL("../src/data/management-response.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const module = { exports: {} }
vm.runInNewContext(code, { module, exports: module.exports })
const { readManagementResponse } = module.exports

test("legacy empty account lookup and JSON null both mean no account", async () => {
  assert.equal(await readManagementResponse(new Response(""), true), null)
  assert.equal(await readManagementResponse(new Response("null"), true), null)
})
test("empty creation or unrelated successful responses never imply success", async () => {
  await assert.rejects(readManagementResponse(new Response("", { status: 201 })))
  await assert.rejects(readManagementResponse(new Response("")))
  await assert.rejects(readManagementResponse(new Response("not-json"), true))
  assert.equal(await readManagementResponse(new Response(null, { status: 204 })), undefined)
})
test("successful JSON account response preserves its returned fields", async () => {
  const data = { userId: "test-user", username: "employee", temporaryPassword: "synthetic-test-secret" }
  const value = await readManagementResponse(new Response(JSON.stringify(data), { status: 201 }))
  assert.equal(JSON.stringify(value), JSON.stringify(data))
})

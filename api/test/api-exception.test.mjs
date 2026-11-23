import test from "node:test"
import assert from "node:assert/strict"
import { ConflictException } from "@nestjs/common"
import { ApiExceptionFilter } from "../dist/platform/http/api-exception.filter.js"
function capture(error) {
  let payload, status
  const headers = {}
  const filter = new ApiExceptionFilter()
  filter.logger = { error() {} }
  filter.catch(error, { switchToHttp: () => ({ getRequest: () => ({ method: "POST", route: { path: "/employees" } }), getResponse: () => ({ setHeader: (key, value) => { headers[key] = value }, status: code => { status = code; return { json: value => { payload = value } } } }) }) })
  return { payload, status, headers }
}
test("database schema failures return safe diagnostics without exposing SQL or parameters", () => {
  const value = capture({ name: "QueryFailedError", driverError: { code: "42703", message: "SECRET SQL/PARAMETERS" } })
  assert.equal(value.status, 503); assert.equal(value.payload.code, "DATABASE_SCHEMA_MISMATCH")
  assert.equal(value.headers["X-Request-Id"], value.payload.requestId)
  assert.equal(JSON.stringify(value).includes("SECRET"), false)
})
test("field conflicts stay actionable and unexpected errors have a reference ID", () => {
  const conflict = capture(new ConflictException({ code: "HRS_CODE_EXISTS", field: "externalHrId", row: 3, message: "Duplicate HRS" }))
  assert.equal(conflict.status, 409); assert.equal(conflict.payload.field, "externalHrId"); assert.equal(conflict.payload.row, 3)
  const unknown = capture(new Error("secret internal value"))
  assert.equal(unknown.status, 500); assert.ok(unknown.payload.requestId)
  assert.equal(JSON.stringify(unknown).includes("secret internal value"), false)
})

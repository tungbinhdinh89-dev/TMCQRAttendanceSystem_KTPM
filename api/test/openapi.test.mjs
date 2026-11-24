import { WebScannerController } from "../dist/modules/gate/presentation/web-scanner.controller.js"
import { AttendanceHistoryController } from "../dist/modules/att/presentation/attendance-history.controller.js"
import { AttendanceHistoryService } from "../dist/modules/att/application/attendance-history.service.js"
import { GateHistoryController } from "../dist/modules/gate/presentation/gate-history.controller.js"
import { GateHistoryService } from "../dist/modules/gate/application/gate-history.service.js"
import { WebScannerService } from "../dist/modules/gate/application/web-scanner.service.js"
import test from "node:test"
import assert from "node:assert/strict"
import { Test } from "@nestjs/testing"
import { configureApiDocumentation } from "../dist/platform/http/openapi.js"
import { AuthController } from "../dist/modules/iam/presentation/auth.controller.js"
import { AuthService } from "../dist/modules/iam/application/auth.service.js"
import { AuditController } from "../dist/modules/iam/presentation/audit.controller.js"
import { AuditService } from "../dist/modules/iam/application/audit.service.js"
import { EmployeeController } from "../dist/modules/eqr/presentation/employee.controller.js"
import { EmployeeService } from "../dist/modules/eqr/application/employee.service.js"
import { QrController } from "../dist/modules/eqr/presentation/qr.controller.js"
import { QrService } from "../dist/modules/eqr/application/qr.service.js"
import { OrganizationController } from "../dist/modules/cfg/presentation/organization.controller.js"
import { OrganizationService } from "../dist/modules/cfg/application/organization.service.js"
import { StationConfigurationController, StationHeartbeatController } from "../dist/modules/gate/presentation/station-configuration.controller.js"
import { StationConfigurationService } from "../dist/modules/gate/application/station-configuration.service.js"

async function fixture(t) {
  const module = await Test.createTestingModule({
    controllers: [AttendanceHistoryController, GateHistoryController, WebScannerController, AuthController, AuditController, EmployeeController, QrController, OrganizationController, StationConfigurationController, StationHeartbeatController],
    providers: [AttendanceHistoryService, GateHistoryService, WebScannerService, AuthService, AuditService, EmployeeService, QrService, OrganizationService, StationConfigurationService].map(provide => ({ provide, useValue: {} })),
  }).compile()
  const app = module.createNestApplication()
  app.setGlobalPrefix("api")
  t.after(() => app.close())
  const previous = process.env.API_DOCS_ENABLED
  t.after(() => { if (previous === undefined) delete process.env.API_DOCS_ENABLED; else process.env.API_DOCS_ENABLED = previous })
  return app
}

test("Swagger serves actual routes, typed employee requests, correct cookie/station security and HTTP statuses without DB", async t => {
  const app = await fixture(t)
  delete process.env.API_DOCS_ENABLED
  const document = configureApiDocumentation(app)
  assert.ok(document.paths["/api/employees/next-code"])
  assert.equal(document.paths["/api/employees/next-code"].get.parameters[0].required, true)
  assert.deepEqual(document.components.schemas.EmployeeCreate.required, ["externalHrId", "fullName", "factoryId"])
  assert.equal(document.components.schemas.EmployeeCreate.properties.generateEmployeeCode.type, "boolean")
  assert.equal(document.paths["/api/employees/import"].post.requestBody.content["application/json"].schema.properties.rows.maxItems, 2000)
  assert.equal(document.components.securitySchemes.session.in, "cookie")
  assert.equal(document.components.securitySchemes.session.name, "tmc_session")
  assert.deepEqual(document.paths["/api/auth/login"].post.security, [])
  assert.deepEqual(document.paths["/api/employees"].post.security, [{ session: [] }])
  assert.deepEqual(document.paths["/api/stations/{id}/heartbeat"].post.security, [{ station: [] }])
  assert.ok(document.paths["/api/auth/login"].post.responses["201"])
  assert.ok(document.paths["/api/auth/logout"].post.responses["204"])
  assert.equal(document.paths["/api/auth/logout"].post.responses["201"], undefined)
  assert.equal(document.paths["/api/qr/validate"], undefined, "No invented validator HTTP route")
  await app.listen(0, "127.0.0.1")
  const base = await app.getUrl()
  const json = await fetch(`${base}/api/openapi.json`)
  assert.equal(json.status, 200)
  assert.equal((await json.json()).info.title, "TMC Access API")
  const ui = await fetch(`${base}/api/docs/`)
  assert.equal(ui.status, 200)
  assert.match(await ui.text(), /swagger-ui/)
})

test("API_DOCS_ENABLED=false disables both documentation endpoints", async t => {
  const app = await fixture(t)
  process.env.API_DOCS_ENABLED = "false"
  assert.equal(configureApiDocumentation(app), undefined)
  await app.listen(0, "127.0.0.1")
  for (const path of ["/api/docs/", "/api/openapi.json"]) assert.equal((await fetch(`${await app.getUrl()}${path}`)).status, 404)
})

test("scanner documentation uses SEC session security and explicit demo attendance contract", async t => {
  const app = await fixture(t)
  configureApiDocumentation(app)
  await app.listen(0, "127.0.0.1")
  const doc = await (await fetch(`${await app.getUrl()}/api/openapi.json`)).json()
  const operation = doc.paths["/api/scanner/stations/{id}/scans"].post
  assert.deepEqual(operation.security, [{ session: [] }])
  const request = operation.requestBody.content["application/json"].schema
  assert.deepEqual(request.required, ["eventId", "token"])
  assert.equal(request.additionalProperties, false)
  assert.equal(request.properties.direction, undefined)
  assert.equal(operation.responses["200"].content["application/json"].schema.$ref, "#/components/schemas/WebScanResult")
  assert.deepEqual(doc.components.schemas.WebScanResult.properties.mode.enum, ["CLASSROOM_DEMO"])
})

test("history documentation describes read-only scopes, bounded filters and aggregate redaction", async t => {
  const app = await fixture(t)
  const doc = configureApiDocumentation(app)
  for (const path of ["/api/attendance/history", "/api/attendance/summary", "/api/gate/history"]) {
    assert.deepEqual(doc.paths[path].get.security, [{ session: [] }])
    assert.equal(doc.paths[path].post, undefined)
    assert.equal(doc.paths[path].get.parameters.find(p => p.name === "pageSize").schema.maximum, 100)
  }
  assert.ok(doc.paths["/api/attendance/history/{id}"].get.responses["404"])
  assert.ok(doc.paths["/api/gate/history/{id}"].get.responses["404"])
  assert.equal(doc.paths["/api/attendance/summary"].get.parameters.some(p => p.name === "employeeId"), false)
  const aggregate = doc.components.schemas.AttendanceSummaryItem.properties
  for (const key of ["employeeId", "employeeCode", "fullName", "token"]) assert.equal(aggregate[key], undefined)
  for (const item of ["AttendanceHistoryItem", "GateHistoryItem"]) {
    for (const key of ["token", "tokenFingerprint", "requestHash", "passwordHash"]) assert.equal(doc.components.schemas[item].properties[key], undefined)
  }
})

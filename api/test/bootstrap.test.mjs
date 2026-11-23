import assert from "node:assert/strict"
import test from "node:test"
import { Test } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { AppModule } from "../dist/app.module.js"
import { AuditService } from "../dist/modules/iam/application/audit.service.js"

test("auth routes bootstrap and removed demo endpoint stays unavailable", async (t) => {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource)
    .useValue({ query: async () => { throw new Error("Anonymous routes must not query business data") } })
    .overrideProvider(AuditService)
    .useValue({ write: async () => undefined, search: async () => ({ items: [], total: 0, page: 1, pageSize: 25 }) })
    .compile()
  const app = module.createNestApplication()
  t.after(() => app.close())
  app.setGlobalPrefix("api")
  await app.listen(0, "127.0.0.1")
  const baseUrl = await app.getUrl()

  const me = await fetch(`${baseUrl}/api/me`)
  assert.equal(me.status, 401)

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  assert.equal(login.status, 400)

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" })
  assert.equal(logout.status, 204)

  for (const path of ["employees", "employees/00000000-0000-4000-8000-000000000001/account", "qr/self", "qr/self/code", "organization", "configuration/stations", "configuration/integrations", "configuration/readiness", "audit-entries"]) {
    const denied = await fetch(`${baseUrl}/api/${path}`)
    assert.equal(denied.status, 401, `Anonymous ${path}`)
  }

  const bootstrap = await fetch(`${baseUrl}/api/demo/bootstrap`)
  assert.equal(bootstrap.status, 404)
})

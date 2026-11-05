import assert from "node:assert/strict"
import test from "node:test"
import { Test } from "@nestjs/testing"
import { DataSource } from "typeorm"
import { AppModule } from "../dist/app.module.js"

test("auth and demo routes bootstrap with the shared database provider", async (t) => {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource)
    .useValue({ query: async () => [] })
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

  const bootstrap = await fetch(`${baseUrl}/api/demo/bootstrap`)
  assert.equal(bootstrap.status, 200)
  const payload = await bootstrap.json()
  assert.deepEqual(payload.data.employees, [])
  assert.deepEqual(payload.data.accounts, [])
  assert.deepEqual(payload.data.gates, [])
})

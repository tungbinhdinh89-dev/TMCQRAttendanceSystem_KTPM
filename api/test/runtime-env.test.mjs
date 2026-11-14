import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { configureDatabaseEnvironment } from "../scripts/runtime-env.mjs"

function configFile(t, contents) {
  const directory = mkdtempSync(join(tmpdir(), "tmc-runtime-env-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const path = join(directory, "env-variable.txt")
  if (contents !== undefined) writeFileSync(path, contents)
  return path
}

test("startup reads the configured database host and port and escapes credentials", (t) => {
  const password = "p@ss:/?#%"
  const path = configFile(t, `host: db.example.invalid: port 5433, username: demo.user, pass: ${password}`)
  const env = { DATABASE_NAME: "tmc test" }

  assert.equal(configureDatabaseEnvironment({ env, configPath: path }), "env-variable.txt")
  const url = new URL(env.DATABASE_URL)
  assert.equal(url.hostname, "db.example.invalid")
  assert.equal(url.port, "5433")
  assert.equal(decodeURIComponent(url.username), "demo.user")
  assert.equal(decodeURIComponent(url.password), password)
  assert.equal(decodeURIComponent(url.pathname), "/tmc test")
})

test("an explicit DATABASE_URL takes precedence over the local configuration", (t) => {
  const env = { DATABASE_URL: "postgresql://explicit.example.invalid:5434/other" }
  const original = env.DATABASE_URL
  assert.equal(configureDatabaseEnvironment({ env, configPath: configFile(t) }), "DATABASE_URL")
  assert.equal(env.DATABASE_URL, original)
})

test("missing database configuration fails clearly instead of using localhost defaults", (t) => {
  assert.throws(
    () => configureDatabaseEnvironment({ env: {}, configPath: configFile(t) }),
    /DATABASE_URL is required/,
  )
})

test("invalid local configuration fails without exposing credentials", (t) => {
  const password = "local-test-password"
  const path = configFile(t, `username: demo, pass: ${password}`)
  assert.throws(
    () => configureDatabaseEnvironment({ env: {}, configPath: path }),
    (error) => error.message.includes("valid host, port") && !error.message.includes(password),
  )
})

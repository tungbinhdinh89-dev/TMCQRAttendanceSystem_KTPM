import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { Client } from "pg"

const databaseUrl = process.env.DATABASE_URL
const password = process.env.DEMO_PASSWORD
const stationSecret = process.env.DEMO_STATION_SECRET
const fixture = JSON.parse(
  await readFile(new URL("../fixtures/demo-scenarios.json", import.meta.url), "utf8"),
)

test("TMC-006 demo seed satisfies identity, scope, and station scenarios", async () => {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the TMC-006 integration test.")

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    const factories = await client.query(
      "SELECT code FROM factories WHERE code = ANY($1::varchar[])",
      [fixture.requiredFactories],
    )
    assert.deepEqual(
      factories.rows.map((row) => row.code).sort(),
      fixture.requiredFactories.slice().sort(),
    )

    const roles = await client.query(
      "SELECT code FROM roles WHERE code = ANY($1::varchar[])",
      [fixture.requiredRoles],
    )
    assert.deepEqual(
      roles.rows.map((row) => row.code).sort(),
      fixture.requiredRoles.slice().sort(),
    )

    const positiveUsers = await client.query(
      "SELECT u.username, u.status AS user_status, e.status AS employee_status FROM users u JOIN employees e ON e.id = u.employee_id WHERE u.username = ANY($1::varchar[])",
      [["emp.demo", "hr.demo", "adm.demo", "exe.demo", "sup.active.demo", "sec.active.demo"]],
    )
    assert.equal(positiveUsers.rows.length, 6)
    assert.ok(positiveUsers.rows.every(row => row.user_status === "ACTIVE" && row.employee_status === "ACTIVE"))

    const employees = await client.query(
      `SELECT employee_code, status FROM employees
       WHERE employee_code = ANY($1::varchar[])`,
      [[fixture.crossFactoryEmployeeCode, fixture.revokedEmployeeCode, fixture.inactiveEmployeeCode]],
    )
    assert.equal(employees.rows.length, 3)
    assert.equal(employees.rows.find((row) => row.employee_code === fixture.revokedEmployeeCode).status, "REVOKED")
    assert.equal(employees.rows.find((row) => row.employee_code === fixture.inactiveEmployeeCode).status, "INACTIVE")

    const crossFactory = await client.query(
      `SELECT count(*)::int AS count
       FROM access_grants grant_row
       JOIN employees employee ON employee.id = grant_row.employee_id
       WHERE employee.employee_code = $1 AND grant_row.revoked_at IS NULL`,
      [fixture.crossFactoryEmployeeCode],
    )
    assert.equal(crossFactory.rows[0].count, 2)

    const stations = await client.query(
      "SELECT direction FROM gate_stations WHERE direction = ANY($1::varchar[])",
      [fixture.requiredDirections],
    )
    assert.equal(stations.rows.length, 4)
    assert.deepEqual([...new Set(stations.rows.map((row) => row.direction))].sort(), ["IN", "OUT"])

    const secrets = await client.query(
      "SELECT password_hash FROM users UNION ALL SELECT secret_hash FROM station_credentials",
    )
    assert.ok(secrets.rows.length >= 10)
    for (const row of secrets.rows) {
      const hash = row.password_hash ?? row.secret_hash
      assert.match(hash, /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
      if (password) assert.notEqual(hash, password)
      if (stationSecret) assert.notEqual(hash, stationSecret)
    }

    const foreignKeys = await client.query(`
      SELECT count(*)::int AS broken
      FROM information_schema.table_constraints constraint_row
      WHERE constraint_row.constraint_type = 'FOREIGN KEY'
        AND constraint_row.table_schema = 'public'
    `)
    assert.ok(foreignKeys.rows[0].broken > 0)
  } finally {
    await client.end()
  }
})

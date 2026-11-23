import test from "node:test"
import assert from "node:assert/strict"
import { DataSource } from "typeorm"
import { databaseEntities } from "../dist/platform/infrastructure/database/entities.js"
import { EmployeeService } from "../dist/modules/eqr/application/employee.service.js"

test("employee join pagination resolves the property-path order using real TypeORM metadata", async () => {
  const ds = new DataSource({ type: "postgres", entities: databaseEntities })
  await ds.buildMetadatas()
  const runner = ds.createQueryRunner()
  const statements = []
  runner.query = async sql => {
    statements.push(sql)
    // No database connection: retain TypeORM's real pagination/metadata generation.
    const records = sql.includes("COUNT(") ? [{ cnt: "0" }] : []
    return { records, raw: records, affected: 0 }
  }
  runner.release = async () => {}
  ds.createQueryRunner = () => runner
  const service = new EmployeeService(ds, {})
  const result = await service.list({ userId: "00000000-0000-4000-8000-000000000001", roles: [{ code: "HR", scopeType: "FACTORY", factoryId: "00000000-0000-4000-8000-000000000001", permissions: [] }] }, { page: "1", pageSize: "20" })
  assert.deepEqual(result, { items: [], total: 0, page: 1, pageSize: 20 })
  assert.ok(statements.some(sql => sql.includes("DISTINCT") && sql.includes("e_employee_code")))
})

import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"
const source = await readFile(new URL("../src/features/management/employee-csv.ts", import.meta.url), "utf8")
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
const { parseEmployeeCsv } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`)
const org = { factories: [{ id: "f", code: "BD", status: "ACTIVE" }], departments: [{ id: "d", factoryId: "f", code: "HR", isActive: true }], teams: [{ id: "t", departmentId: "d", code: "A", isActive: true }] }
test("CSV preserves manual HRS, resolves hierarchy and leaves internal code for server allocation", () => {
  const rows = parseEmployeeCsv('\uFEFFemployeeCode,externalHrId,fullName,factoryCode,departmentCode,teamCode\r\n,HRS01,"Nguyễn, An",BD,HR,A\r\n', org)
  assert.equal(rows[0].externalHrId, "HRS01"); assert.equal(rows[0].employeeCode, undefined)
  assert.equal(rows[0].fullName, "Nguyễn, An"); assert.equal(rows[0].teamId, "t")
  assert.equal(parseEmployeeCsv('externalHrId;fullName;factoryCode\nH02;An;BD', org).length, 1)
})
test("CSV rejects duplicates, unknown organization and invalid quotes before upload", () => {
  for (const value of ['externalHrId,fullName,factoryCode\nH1,An,BD\nH1,Binh,BD', 'externalHrId,fullName,factoryCode\nH1,An,LA', 'externalHrId,fullName,factoryCode\nH1,"An,BD']) assert.throws(() => parseEmployeeCsv(value, org))
})

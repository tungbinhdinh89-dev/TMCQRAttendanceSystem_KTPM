import type { Organization, RecordRow } from "../../data/management"

export const employeeCsvTemplate = "employeeCode,externalHrId,fullName,email,factoryCode,departmentCode,teamCode\r\n,HRS-EXAMPLE,Nguyễn Văn An,,BD,,\r\n"
export function parseEmployeeCsv(source: string, org: Organization) {
  if (source.length > 2_000_000) throw new Error("CSV tối đa 2 MB.")
  const content = source.replace(/^\uFEFF/, "")
  const firstLine = content.split(/\r?\n/, 1)[0]
  const delimiter = firstLine.includes(";") ? ";" : ","
  const records: string[][] = []; let row: string[] = [], value = "", quoted = false, closed = false
  for (let i = 0; i <= content.length; i++) {
    const c = content[i]
    if (quoted) {
      if (c === undefined) throw new Error("CSV có dấu ngoặc kép chưa đóng.")
      if (c === '"') { if (content[i + 1] === '"') { value += '"'; i++ } else { quoted = false; closed = true } } else value += c
    } else if (c === '"' && !value && !closed) quoted = true
    else if (c === delimiter) { row.push(value.trim()); value = ""; closed = false }
    else if (c === "\n" || c === "\r" || c === undefined) {
      row.push(value.trim()); if (row.some(Boolean)) records.push(row)
      row = []; value = ""; closed = false
      if (c === "\r" && content[i + 1] === "\n") i++
    } else { if (closed && c?.trim()) throw new Error("CSV có ký tự sau ô đã đóng ngoặc kép."); value += c }
  }
  const headers = records.shift() ?? []
  const allowed = ["employeeCode", "externalHrId", "fullName", "email", "factoryCode", "departmentCode", "teamCode"]
  if (new Set(headers).size !== headers.length || headers.some(h => !allowed.includes(h)) || ["externalHrId", "fullName", "factoryCode"].some(h => !headers.includes(h))) throw new Error("Header CSV chưa đúng. Dùng file mẫu và giữ tên cột externalHrId, fullName, factoryCode.")
  if (!records.length || records.length > 2000) throw new Error("Mỗi file cần từ 1 đến 2.000 nhân viên.")
  const hrs = new Set<string>(), codes = new Set<string>()
  return records.map((fields, index) => {
    const line = index + 2
    if (fields.length !== headers.length) throw new Error(`Dòng ${line}: số ô không khớp header.`)
    const data = Object.fromEntries(headers.map((h, i) => [h, fields[i]]))
    if (!data.externalHrId || !data.fullName || !data.factoryCode) throw new Error(`Dòng ${line}: thiếu mã HRS, họ tên hoặc mã nhà máy.`)
    if (hrs.has(data.externalHrId) || data.employeeCode && codes.has(data.employeeCode)) throw new Error(`Dòng ${line}: mã HRS hoặc mã nhân viên bị trùng trong file.`)
    hrs.add(data.externalHrId); if (data.employeeCode) codes.add(data.employeeCode)
    const find = (rows: RecordRow[], code: string, kind: string) => {
      const matches = rows.filter(r => r.code === code)
      if (matches.length !== 1) throw new Error(`Dòng ${line}: ${kind} '${code}' không tồn tại/không hoạt động trong phạm vi HR.`)
      return matches[0]
    }
    const factory = find(org.factories.filter(f => f.status === "ACTIVE"), data.factoryCode, "nhà máy")
    const department = data.departmentCode ? find(org.departments.filter(d => d.factoryId === factory.id && d.isActive === true), data.departmentCode, "phòng ban") : null
    if (data.teamCode && !department) throw new Error(`Dòng ${line}: có mã tổ nhưng chưa có mã phòng ban.`)
    const team = data.teamCode ? find(org.teams.filter(t => t.departmentId === department?.id && t.isActive === true), data.teamCode, "tổ") : null
    return { employeeCode: data.employeeCode || undefined, externalHrId: data.externalHrId, fullName: data.fullName, email: data.email || null, factoryId: factory.id, departmentId: department?.id ?? null, teamId: team?.id ?? null }
  })
}

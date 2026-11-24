import { BadRequestException } from "@nestjs/common"
export const historyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export interface HistoryQuery {
  page: number; pageSize: number; from: string; to: string
  factoryId?: string; stationId?: string; employeeId?: string; direction?: string; eventId?: string
}
export function historyId(value: string): string {
  if (!historyUuid.test(value)) throw new BadRequestException("Invalid identifier")
  return value.toLowerCase()
}
/** Range is half-open [from,to), with an explicit timezone; browser dates must be converted first. */
export function historyQuery(input: Record<string, unknown>, extra: string[] = []): HistoryQuery {
  const bad = (): never => { throw new BadRequestException("Invalid history query (range maximum 93 days, pageSize maximum 100)") }
  const allowed = ["page", "pageSize", "from", "to", "factoryId", "stationId", "direction", ...extra]
  if (Object.keys(input).some(k => !allowed.includes(k))) bad()
  const result: HistoryQuery = { page: 1, pageSize: 25, from: "", to: "" }
  for (const [key, max] of [["page", 100000], ["pageSize", 100]] as const) {
    const v = input[key] ?? result[key]
    if ((typeof v !== "number" && typeof v !== "string") || !/^\d+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) < 1 || Number(v) > max) bad()
    result[key] = Number(v)
  }
  for (const key of ["factoryId", "stationId", ...extra] as const) {
    const v = input[key]
    if (v === undefined || v === "") continue
    if (typeof v !== "string" || !historyUuid.test(v)) bad()
    ;(result as unknown as Record<string, unknown>)[key] = (v as string).toLowerCase()
  }
  if (input.direction !== undefined && input.direction !== "") {
    if (!["IN", "OUT"].includes(input.direction as string)) bad()
    result.direction = input.direction as string
  }
  const now = Date.now()
  for (const key of ["from", "to"] as const) {
    const v = input[key]
    if (v === undefined || v === "") continue
    if (typeof v !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(v) || !Number.isFinite(Date.parse(v))) bad()
    const s = v as string, [y, m, d] = s.slice(0, 10).split("-").map(Number)
    if (m < 1 || m > 12 || d < 1 || d > new Date(Date.UTC(y, m, 0)).getUTCDate() || Number(s.slice(11, 13)) > 23 || Number(s.slice(14, 16)) > 59 || Number(s.slice(17, 19)) > 59) bad()
    result[key] = new Date(s).toISOString()
  }
  result.to ||= new Date(now).toISOString()
  result.from ||= new Date(Date.parse(result.to) - 30 * 86400000).toISOString()
  const duration = Date.parse(result.to) - Date.parse(result.from)
  if (duration <= 0 || duration > 93 * 86400000) bad()
  return result
}
export class HistoryWhere {
  readonly params: unknown[] = []
  readonly clauses: string[] = []
  bind(value: unknown): string { this.params.push(value); return `$${this.params.length}` }
  sql(): string { return this.clauses.join(" AND ") }
}

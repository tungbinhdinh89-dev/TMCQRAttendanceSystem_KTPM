import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { DataSource } from "typeorm"
import type { AttendanceHistoryItem, AttendanceHistoryPage, AttendanceSummaryPage } from "@tmc/contracts"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { HistoryWhere, historyId, historyQuery, historyUuid, type HistoryQuery } from "../../../platform/http/history-query"

export function attendanceGrants(identity: SessionIdentity, summary = false) {
  const grants = identity.roles.filter(r => r.permissions.includes("attendance:read") && (
    summary ? r.code === "EXE" : ["HR", "EMP", "SUP"].includes(r.code)
  )).filter(r => {
    if (!summary && r.code === "EMP") return historyUuid.test(identity.employeeId)
    if (r.code === "SUP") return r.scopeType === "TEAM" && !!r.factoryId && historyUuid.test(r.factoryId) && !!r.teamId && historyUuid.test(r.teamId)
    if (r.scopeType === "GLOBAL") return true
    if (!r.factoryId || !historyUuid.test(r.factoryId)) return false
    if (r.scopeType === "FACTORY") return true
    if (r.scopeType === "DEPARTMENT") return !!r.departmentId && historyUuid.test(r.departmentId)
    return r.scopeType === "TEAM" && !!r.teamId && historyUuid.test(r.teamId)
  })
  if (!grants.length) throw new ForbiddenException("Attendance access is not permitted for this role and scope")
  return grants
}
export function attendanceWhere(identity: SessionIdentity, q: HistoryQuery, summary = false) {
  const grants = attendanceGrants(identity, summary), w = new HistoryWhere()
  const scopes = grants.map(r => {
    if (r.code === "EMP") return `e.employee_id=${w.bind(identity.employeeId)}::uuid`
    if (r.scopeType === "GLOBAL") return "TRUE"
    const factory = `r.activity_factory_id=${w.bind(r.factoryId)}::uuid`
    if (r.scopeType === "FACTORY") return factory
    // Use the recorded organization snapshot, never today's employee assignment.
    const field = r.scopeType === "TEAM" ? "team_id" : "department_id"
    const target = r.scopeType === "TEAM" ? r.teamId : r.departmentId
    return `(${factory} AND EXISTS (SELECT 1 FROM employee_assignments oa WHERE oa.id=r.organization_assignment_id AND oa.employee_id=e.employee_id AND oa.factory_id=r.activity_factory_id AND oa.${field}=${w.bind(target)}::uuid))`
  })
  w.clauses.push(`(${scopes.join(" OR ")})`, `r.occurred_at>=${w.bind(q.from)}::timestamptz`, `r.occurred_at<${w.bind(q.to)}::timestamptz`)
  if (summary) w.clauses.push("r.is_voided=false")
  if (q.factoryId) w.clauses.push(`r.activity_factory_id=${w.bind(q.factoryId)}::uuid`)
  if (q.employeeId) w.clauses.push(`e.employee_id=${w.bind(q.employeeId)}::uuid`)
  if (q.stationId) w.clauses.push(`a.station_id=${w.bind(q.stationId)}::uuid`)
  if (q.direction) w.clauses.push(`r.direction=${w.bind(q.direction)}`)
  return w
}
const joins = `FROM attendance_events e JOIN attendance_event_revisions r ON r.event_id=e.id AND r.revision_no=e.current_revision_no JOIN employees p ON p.id=e.employee_id JOIN factories f ON f.id=r.activity_factory_id LEFT JOIN access_attempts a ON a.id=e.access_attempt_id LEFT JOIN gate_stations s ON s.id=a.station_id`
const projection = `e.id,e.employee_id,p.employee_code,p.full_name,r.occurred_at,r.direction,r.activity_factory_id,f.name AS factory_name,a.station_id,s.code AS station_code,e.source_type,e.evidence_type,r.revision_no,r.is_voided,a.correlation_id,e.access_attempt_id`
const mapItem = (r: any): AttendanceHistoryItem => ({ id: r.id, employeeId: r.employee_id, employeeCode: r.employee_code, fullName: r.full_name, occurredAt: new Date(r.occurred_at).toISOString(), direction: r.direction, factoryId: r.activity_factory_id, factoryName: r.factory_name, stationId: r.station_id ?? null, stationCode: r.station_code ?? null, sourceType: r.source_type, evidenceType: r.evidence_type, revisionNo: r.revision_no, isVoided: r.is_voided, correlationId: r.correlation_id ?? null, attemptId: r.access_attempt_id ?? null })
@Injectable()
export class AttendanceHistoryService {
  constructor(private readonly ds: DataSource) {}
  async history(identity: SessionIdentity, input: Record<string, unknown>): Promise<AttendanceHistoryPage> {
    attendanceGrants(identity)
    const q = historyQuery(input, ["employeeId"]), w = attendanceWhere(identity, q)
    const rows = await this.ds.query(`WITH scoped AS (SELECT ${projection} ${joins} WHERE ${w.sql()}) SELECT (SELECT COUNT(*)::int FROM scoped) AS total, COALESCE((SELECT json_agg(page) FROM (SELECT * FROM scoped ORDER BY occurred_at DESC,id DESC LIMIT ${w.bind(q.pageSize)} OFFSET ${w.bind((q.page - 1) * q.pageSize)}) page),'[]'::json) AS items`, w.params)
    return { items: (rows[0]?.items ?? []).map(mapItem), total: Number(rows[0]?.total ?? 0), page: q.page, pageSize: q.pageSize }
  }
  async detail(identity: SessionIdentity, eventId: string): Promise<AttendanceHistoryItem> {
    attendanceGrants(identity)
    historyId(eventId)
    // Detail is not limited to the list's default time window; revoked/expired QR is irrelevant.
    const q: HistoryQuery = { from: "1970-01-01T00:00:00.000Z", to: "9999-12-31T23:59:59.999Z", page: 1, pageSize: 1 }
    const w = attendanceWhere(identity, q)
    w.clauses.push(`e.id=${w.bind(eventId)}::uuid`)
    const [row] = await this.ds.query(`SELECT ${projection} ${joins} WHERE ${w.sql()}`, w.params)
    if (!row) throw new NotFoundException("Attendance event not found")
    return mapItem(row)
  }
  async summary(identity: SessionIdentity, input: Record<string, unknown>): Promise<AttendanceSummaryPage> {
    attendanceGrants(identity, true)
    // Aggregate endpoints never accept an employee selector.
    const q = historyQuery(input), w = attendanceWhere(identity, q, true)
    const rows = await this.ds.query(`WITH grouped AS (SELECT (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text AS day,r.activity_factory_id AS factory_id,f.name AS factory_name,COUNT(*) FILTER (WHERE r.direction='IN')::int AS in_count,COUNT(*) FILTER (WHERE r.direction='OUT')::int AS out_count,COUNT(*)::int AS event_count,COUNT(DISTINCT e.employee_id)::int AS employee_count,COUNT(*) FILTER (WHERE e.source_type='DEMO')::int AS demo_count ${joins} WHERE ${w.sql()} GROUP BY day,r.activity_factory_id,f.name) SELECT (SELECT COUNT(*)::int FROM grouped) AS total,COALESCE((SELECT json_agg(page) FROM (SELECT * FROM grouped ORDER BY day DESC,factory_id LIMIT ${w.bind(q.pageSize)} OFFSET ${w.bind((q.page - 1) * q.pageSize)}) page),'[]'::json) AS items`, w.params)
    return { items: (rows[0]?.items ?? []).map((r: any) => ({ day: r.day, factoryId: r.factory_id, factoryName: r.factory_name, inCount: r.in_count, outCount: r.out_count, eventCount: r.event_count, employeeCount: r.employee_count, demoCount: r.demo_count })), total: Number(rows[0]?.total ?? 0), page: q.page, pageSize: q.pageSize, from: q.from, to: q.to }
  }
}

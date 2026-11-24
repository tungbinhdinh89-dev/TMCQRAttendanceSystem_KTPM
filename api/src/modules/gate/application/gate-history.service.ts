import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { DataSource } from "typeorm"
import type { GateHistoryItem, GateHistoryPage } from "@tmc/contracts"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { HistoryWhere, historyId, historyQuery, historyUuid, type HistoryQuery } from "../../../platform/http/history-query"

export function gateHistoryScope(identity: SessionIdentity) {
  const grants = identity.roles.filter(r => r.code === "SEC" && r.permissions.includes("access:decide"))
  const global = grants.some(r => r.scopeType === "GLOBAL")
  const factoryIds = [...new Set(grants.filter(r => r.scopeType === "FACTORY" && r.factoryId && historyUuid.test(r.factoryId)).map(r => r.factoryId!))]
  if (!global && !factoryIds.length) throw new ForbiddenException("SEC access:decide in a factory scope is required")
  return { global, factoryIds }
}
export function gateHistoryWhere(identity: SessionIdentity, q: HistoryQuery) {
  const scope = gateHistoryScope(identity), w = new HistoryWhere()
  w.clauses.push(`(${w.bind(scope.global)}::boolean OR a.factory_id=ANY(${w.bind(scope.factoryIds)}::uuid[]))`, `a.received_at>=${w.bind(q.from)}::timestamptz`, `a.received_at<${w.bind(q.to)}::timestamptz`)
  if (q.factoryId) w.clauses.push(`a.factory_id=${w.bind(q.factoryId)}::uuid`)
  if (q.stationId) w.clauses.push(`a.station_id=${w.bind(q.stationId)}::uuid`)
  if (q.direction) w.clauses.push(`a.direction=${w.bind(q.direction)}`)
  if (q.eventId) w.clauses.push(`a.event_id=${w.bind(q.eventId)}::uuid`)
  return w
}
// Do not expose QR token/fingerprint, user sessions, request snapshots or employee HR identifiers.
const projection = `a.id,a.event_id,a.received_at,a.direction,a.factory_id,f.name AS factory_name,a.station_id,s.code AS station_code,a.decision,a.reason_code,a.source_kind,p.employee_code,p.full_name,a.correlation_id,ae.id AS attendance_event_id,ae.evidence_type,cmd.state AS command_state`
const joins = `FROM access_attempts a JOIN factories f ON f.id=a.factory_id JOIN gate_stations s ON s.id=a.station_id LEFT JOIN employees p ON p.id=a.employee_id LEFT JOIN LATERAL (SELECT e.id,e.evidence_type FROM attendance_events e JOIN attendance_event_revisions r ON r.event_id=e.id AND r.revision_no=e.current_revision_no WHERE e.access_attempt_id=a.id AND r.is_voided=false ORDER BY e.id LIMIT 1) ae ON true LEFT JOIN LATERAL (SELECT c.state FROM gate_commands c WHERE c.access_attempt_id=a.id AND c.kind='OPEN' ORDER BY c.created_at DESC,c.id DESC LIMIT 1) cmd ON true`
const mapItem = (r: any): GateHistoryItem => ({ id: r.id, eventId: r.event_id, occurredAt: new Date(r.received_at).toISOString(), direction: r.direction, factoryId: r.factory_id, factoryName: r.factory_name, stationId: r.station_id, stationCode: r.station_code, decision: r.decision, reasonCode: r.reason_code, sourceKind: r.source_kind, employeeCode: r.employee_code ?? null, fullName: r.full_name ?? null, attendanceState: r.attendance_event_id ? "RECORDED" : "NOT_RECORDED", attendanceEventId: r.attendance_event_id ?? null, correlationId: r.correlation_id, commandState: r.command_state ?? null, evidenceType: r.evidence_type ?? null })
@Injectable()
export class GateHistoryService {
  constructor(private readonly ds: DataSource) {}
  async history(identity: SessionIdentity, input: Record<string, unknown>): Promise<GateHistoryPage> {
    gateHistoryScope(identity)
    const q = historyQuery(input, ["eventId"]), w = gateHistoryWhere(identity, q)
    const [row] = await this.ds.query(`WITH scoped AS (SELECT ${projection} ${joins} WHERE ${w.sql()}) SELECT (SELECT COUNT(*)::int FROM scoped) AS total,COALESCE((SELECT json_agg(page) FROM (SELECT * FROM scoped ORDER BY received_at DESC,id DESC LIMIT ${w.bind(q.pageSize)} OFFSET ${w.bind((q.page - 1) * q.pageSize)}) page),'[]'::json) AS items`, w.params)
    return { items: (row?.items ?? []).map(mapItem), total: Number(row?.total ?? 0), page: q.page, pageSize: q.pageSize }
  }
  async detail(identity: SessionIdentity, attemptId: string): Promise<GateHistoryItem> {
    gateHistoryScope(identity)
    historyId(attemptId)
    const q: HistoryQuery = { from: "1970-01-01T00:00:00.000Z", to: "9999-12-31T23:59:59.999Z", page: 1, pageSize: 1 }, w = gateHistoryWhere(identity, q)
    w.clauses.push(`a.id=${w.bind(attemptId)}::uuid`)
    const [row] = await this.ds.query(`SELECT ${projection} ${joins} WHERE ${w.sql()}`, w.params)
    if (!row) throw new NotFoundException("Gate attempt not found")
    return mapItem(row)
  }
}

import { Controller, Get, Req, ForbiddenException, ServiceUnavailableException } from "@nestjs/common"
import type { SessionIdentity } from "@tmc/contracts"
import { DataSource } from "typeorm"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"

type ScopeRow = { id: string; factory_id: string | null; department_id: string | null; team_id: string | null }
export function withinScope(row: ScopeRow, identity: SessionIdentity, role: SessionIdentity["roles"][number]) {
  if (role.code === "EMP" || role.scopeType === "SELF") return row.id === identity.employeeId
  if (role.scopeType === "GLOBAL") return true
  if (role.scopeType === "FACTORY") return !!role.factoryId && role.factoryId === row.factory_id
  if (role.scopeType === "DEPARTMENT") return !!role.departmentId && role.departmentId === row.department_id
  if (role.scopeType === "TEAM") return !!role.teamId && role.teamId === row.team_id
  return false
}
const roleNames: Record<string, string> = { ADM: "SYSTEM_ADMIN", HR: "HR_MANAGER", SUP: "DEPARTMENT_MANAGER", SEC: "SECURITY_MANAGER", EMP: "EMPLOYEE", EXE: "EXECUTIVE" }
const site = (code: string) => code === "BD" ? "bd" : code === "LA" ? "la" : "unknown"

@Controller("workspace")
export class WorkspaceController {
  constructor(private readonly dataSource: DataSource, private readonly auth: AuthService) {}

  @Get("bootstrap")
  async bootstrap(@Req() request: { headers: { cookie?: string } }) {
    const identity = await this.auth.me(readCookie(request, SESSION_COOKIE))
    const role = ["ADM", "HR", "SUP", "SEC", "EXE", "EMP"].map(code => identity.roles.find(r => r.code === code)).find(Boolean)
    if (!role) throw new ForbiddenException("No active application role")
    try {
      const all = await this.dataSource.query(`
        SELECT DISTINCT ON (e.id) e.id, e.employee_code AS code, e.full_name AS name, e.status,
          d.name AS department, f.code AS factory_code, a.factory_id, a.department_id, a.team_id
        FROM employees e
        LEFT JOIN employee_assignments a ON a.employee_id = e.id AND a.valid_from <= NOW()
          AND (a.valid_to IS NULL OR a.valid_to > NOW())
        LEFT JOIN departments d ON d.id = a.department_id LEFT JOIN factories f ON f.id = a.factory_id
        ORDER BY e.id, a.valid_from DESC NULLS LAST`)
      const scoped = all.filter((row: ScopeRow) => withinScope(row, identity, role))
      const rows = role.code === "EXE" ? [] : role.code === "ADM" ? scoped.filter((r: ScopeRow) => r.id === identity.employeeId) : scoped
      const ids = rows.map((r: ScopeRow) => r.id)
      const attempts = role.code === "ADM" || role.code === "EXE" ? [] : await this.dataSource.query(`
        SELECT a.id, a.employee_id, a.received_at, a.direction, a.decision, a.reason_code,
          s.code AS gate, f.code AS factory_code
        FROM access_attempts a JOIN gate_stations s ON s.id = a.station_id
        JOIN factories f ON f.id = a.factory_id WHERE a.employee_id = ANY($1::uuid[])
        ORDER BY a.received_at DESC LIMIT 500`, [ids])
      const stations = ["ADM", "SEC"].includes(role.code) ? await this.dataSource.query(`
        SELECT s.id, s.code, s.factory_id, s.last_seen_at, f.code AS factory_code
        FROM gate_stations s JOIN factories f ON f.id = s.factory_id
        WHERE ($1::boolean OR s.factory_id = $2::uuid) ORDER BY s.code`, [role.scopeType === "GLOBAL", role.factoryId]) : []
      const countIds = role.code === "EXE" ? scoped.map((r: ScopeRow) => r.id) : ids
      const [confirmed] = await this.dataSource.query(`
        SELECT COUNT(*)::int AS count FROM attendance_events e
        JOIN attendance_event_revisions r ON r.event_id = e.id AND r.revision_no = e.current_revision_no
        WHERE e.employee_id = ANY($1::uuid[]) AND NOT r.is_voided`, [countIds])
      const confirmedEvents = ["HR", "SUP", "EMP"].includes(role.code) ? await this.dataSource.query(`
        SELECT e.id, e.employee_id AS "employeeId", r.occurred_at AS time, r.direction
        FROM attendance_events e JOIN attendance_event_revisions r
          ON r.event_id=e.id AND r.revision_no=e.current_revision_no
        WHERE e.employee_id=ANY($1::uuid[]) AND NOT r.is_voided
        ORDER BY r.occurred_at DESC LIMIT 500`, [ids]) : []
      const own = all.find((r: ScopeRow) => r.id === identity.employeeId)
      return { data: {
        version: 1,
        employees: rows.map((r: any) => ({ id: r.id, code: r.code, name: r.name,
          department: r.department ?? "Chưa phân bộ phận", site: site(r.factory_code), title: "",
          status: r.status === "ACTIVE" ? "active" : "inactive", qrLocked: r.status !== "ACTIVE", shiftId: "",
          factoryId: r.factory_id, departmentId: r.department_id, teamId: r.team_id })),
        accounts: [{ id: identity.userId, username: identity.username, name: identity.employee.fullName,
          employeeId: identity.employeeId, role: roleNames[role.code], site: site(own?.factory_code), department: own?.department ?? "" }],
        // No shift/pairing/correction/notification API exists yet. Return no invented records.
        shifts: [], attendance: [], adjustments: [], notifications: [],
        confirmedEvents,
        events: attempts.map((r: any) => ({ id: r.id, employeeId: r.employee_id, time: r.received_at,
          direction: r.direction === "IN" ? "ENTRY" : "EXIT", site: site(r.factory_code), gate: r.gate,
          allowed: r.decision === "ALLOW", reason: r.reason_code ?? r.decision })),
        gates: stations.map((r: any) => ({ id: r.id, name: r.code, site: site(r.factory_code),
          online: !!r.last_seen_at && Date.now() - new Date(r.last_seen_at).getTime() < 300000 })),
        summary: { employees: scoped.length, confirmedAttendance: confirmed?.count ?? 0, attempts: attempts.length },
      } }
    } catch {
      throw new ServiceUnavailableException("Không thể tải dữ liệu từ cơ sở dữ liệu.")
    }
  }
}

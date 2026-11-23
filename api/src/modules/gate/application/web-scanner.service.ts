import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { createHash, randomUUID } from "node:crypto"
import { DataSource, EntityManager } from "typeorm"
import type { GateDirection, ScannerStation, WebScanResult } from "@tmc/contracts"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { AuditService } from "../../iam/application/audit.service"
import { QrService } from "../../eqr/application/qr.service"
import { fingerprintQr } from "../../eqr/application/qr-crypto"
import { EmployeeOrmEntity } from "../../eqr/infrastructure/persistence/entities/employee.orm-entity"
import { FactoryOrmEntity } from "../../cfg/infrastructure/persistence/entities/factory.orm-entity"
import { DemoAttendanceRecorder } from "../../att/application/demo-attendance-recorder"
import { GateStationOrmEntity } from "../infrastructure/persistence/entities/gate-station.orm-entity"
import { AccessAttemptOrmEntity } from "../infrastructure/persistence/entities/access-attempt.orm-entity"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function scannerScope(identity: SessionIdentity) {
  const grants = identity.roles.filter(r => r.code === "SEC" && r.permissions.includes("access:decide"))
  const global = grants.some(r => r.scopeType === "GLOBAL")
  const factoryIds = [...new Set(grants.filter(r => r.scopeType === "FACTORY" && r.factoryId && uuid.test(r.factoryId)).map(r => r.factoryId!))]
  if (!global && !factoryIds.length) throw new ForbiddenException("SEC access:decide within a factory scope is required")
  return { global, factoryIds }
}
function id(value: unknown): string { if (typeof value !== "string" || !uuid.test(value)) throw new BadRequestException("Invalid identifier"); return value.toLowerCase() }
@Injectable()
export class WebScannerService {
  constructor(private readonly ds: DataSource, private readonly qr: QrService, private readonly attendance: DemoAttendanceRecorder, private readonly audit: AuditService) {}
  async stations(identity: SessionIdentity): Promise<{ items: ScannerStation[] }> {
    const scope = scannerScope(identity)
    const rows = await this.ds.query(`SELECT s.id,s.code,s.factory_id,s.direction,f.name AS factory_name FROM gate_stations s JOIN factories f ON f.id=s.factory_id WHERE s.status='ACTIVE' AND f.status='ACTIVE' AND s.direction IN ('IN','OUT') AND ($1::boolean OR s.factory_id=ANY($2::uuid[])) ORDER BY f.name,s.code`, [scope.global, scope.factoryIds])
    return { items: rows.map((r: any) => ({ id: r.id, code: r.code, factoryId: r.factory_id, factoryName: r.factory_name, direction: r.direction })) }
  }
  private async result(manager: EntityManager, attempt: AccessAttemptOrmEntity, duplicate: boolean): Promise<WebScanResult> {
    const recorded = await this.attendance.findByAttempt(manager, attempt.id)
    const showEmployee = attempt.decision === "ALLOW" || attempt.reasonCode === "DEMO_DUPLICATE_SCAN"
    const employee = showEmployee && attempt.employeeId ? await manager.getRepository(EmployeeOrmEntity).findOneBy({ id: attempt.employeeId }) : null
    return { eventId: attempt.eventId, attemptId: attempt.id, mode: "CLASSROOM_DEMO", direction: attempt.direction as GateDirection, decision: attempt.decision === "ALLOW" ? "ALLOW" : "DENIED", reasonCode: attempt.reasonCode, attendanceState: recorded ? duplicate ? "ALREADY_RECORDED" : "RECORDED" : "NOT_RECORDED", attendanceEventId: recorded?.id ?? null, occurredAt: (recorded?.occurredAt ?? attempt.receivedAt).toISOString(), duplicate: duplicate || attempt.reasonCode === "DEMO_DUPLICATE_SCAN", employee: employee ? { employeeCode: employee.employeeCode, fullName: employee.fullName } : null }
  }
  async scan(identity: SessionIdentity, stationId: string, input: Record<string, unknown>): Promise<WebScanResult> {
    const scope = scannerScope(identity)
    stationId = id(stationId)
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(k => !["eventId", "token"].includes(k))) throw new BadRequestException("Only eventId and token are accepted")
    const eventId = id(input.eventId)
    if (typeof input.token !== "string" || !input.token || input.token.length > 4096) throw new BadRequestException("QR token is required (maximum4096 characters)")
    const token = input.token, fingerprint = fingerprintQr(token)
    const requestHash = createHash("sha256").update(JSON.stringify([stationId, eventId, fingerprint, identity.userId])).digest("hex")
    return this.ds.transaction(async manager => {
      // Station lock serializes event retries with station retirement; no hardware dispatch occurs.
      const station = await manager.getRepository(GateStationOrmEntity).findOne({ where: { id: stationId }, lock: { mode: "pessimistic_write" } })
      if (!station) throw new NotFoundException("Station not found")
      if (!scope.global && !scope.factoryIds.includes(station.factoryId)) throw new ForbiddenException("Station outside operator scope")
      const factory = await manager.getRepository(FactoryOrmEntity).findOne({ where: { id: station.factoryId }, lock: { mode: "pessimistic_read" } })
      if (station.status !== "ACTIVE" || factory?.status !== "ACTIVE" || !["IN", "OUT"].includes(station.direction)) throw new ConflictException("Station or factory is inactive")
      const attempts = manager.getRepository(AccessAttemptOrmEntity)
      const prior = await attempts.findOneBy({ stationId, eventId })
      if (prior) {
        if (prior.sourceKind !== "WEB_DEMO" || prior.requestHash !== requestHash) throw new ConflictException({ code: "SCAN_EVENT_CONFLICT", message: "eventId was already used with different scan data" })
        return this.result(manager, prior, true)
      }
      const now = new Date()
      const attempt = attempts.create({ id: randomUUID(), stationId, stationCredentialId: null, factoryId: station.factoryId, eventId, requestHash, sourceKind: "WEB_DEMO", actingUserId: identity.userId, employeeId: null, qrTokenId: null, tokenFingerprint: fingerprint, direction: station.direction, decision: "DENIED", reasonCode: null, receivedAt: now, deadlineAt: new Date(now.getTime() + 30000), correlationId: randomUUID() })
      let validation = await this.qr.validate(token, manager)
      if (validation.valid) {
        // Same employee lock used by credential revoke/deactivation/access-grant changes.
        await manager.getRepository(EmployeeOrmEntity).findOne({ where: { id: validation.employeeId }, lock: { mode: "pessimistic_write" } })
        validation = await this.qr.validate(token, manager)
      }
      let assignmentId: string | null = null
      if (!validation.valid) attempt.reasonCode = validation.reasonCode
      else {
        attempt.employeeId = validation.employeeId; attempt.qrTokenId = validation.tokenId
        const [grant] = await manager.query("SELECT id FROM access_grants WHERE employee_id=$1 AND factory_id=$2 AND revoked_at IS NULL AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW()) LIMIT 1", [validation.employeeId, station.factoryId])
        const [assignment] = await manager.query("SELECT id FROM employee_assignments WHERE employee_id=$1 AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW()) ORDER BY valid_from DESC LIMIT 1", [validation.employeeId])
        assignmentId = assignment?.id ?? null
        if (!grant) attempt.reasonCode = "QR_ACCESS_DENIED"
        else if (!assignmentId) attempt.reasonCode = "EMPLOYEE_ASSIGNMENT_REQUIRED"
        else if (await this.attendance.recent(manager, validation.employeeId, station.factoryId, station.direction as GateDirection, now)) attempt.reasonCode = "DEMO_DUPLICATE_SCAN"
        else attempt.decision = "ALLOW"
      }
      await attempts.save(attempt)
      if (attempt.decision === "ALLOW") {
        await this.attendance.record(manager, { employeeId: attempt.employeeId!, attemptId: attempt.id, sourceId: `demo:${stationId}:${eventId}`, factoryId: station.factoryId, direction: station.direction as GateDirection, occurredAt: now, actorUserId: identity.userId, assignmentId: assignmentId! })
      }
      await this.audit.write({ actorType: "USER", actorUserId: identity.userId, factoryId: station.factoryId, action: "WEB_DEMO_SCAN", objectType: "ACCESS_ATTEMPT", objectId: attempt.id, correlationId: attempt.correlationId, outcome: attempt.decision === "ALLOW" ? "SUCCESS" : "DENIED", reason: attempt.reasonCode, afterData: { mode: "CLASSROOM_DEMO", direction: station.direction, attendanceCreated: attempt.decision === "ALLOW" } }, manager)
      return this.result(manager, attempt, false)
    })
  }
}

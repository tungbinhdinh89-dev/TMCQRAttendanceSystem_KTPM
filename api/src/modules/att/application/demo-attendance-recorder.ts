import { BadRequestException, Injectable } from "@nestjs/common"
import { randomUUID } from "node:crypto"
import type { EntityManager } from "typeorm"
import type { GateDirection } from "@tmc/contracts"
import { AttendanceEventOrmEntity } from "../infrastructure/persistence/entities/attendance-event.orm-entity"
import { AttendanceEventRevisionOrmEntity } from "../infrastructure/persistence/entities/attendance-event-revision.orm-entity"

export interface DemoRecordedAttendance { id: string; employeeId: string; occurredAt: Date; direction: GateDirection }
@Injectable()
export class DemoAttendanceRecorder {
  async findByAttempt(manager: EntityManager, attemptId: string): Promise<DemoRecordedAttendance | null> {
    const [row] = await manager.query(`SELECT e.id,e.employee_id,r.occurred_at,r.direction FROM attendance_events e JOIN attendance_event_revisions r ON r.event_id=e.id AND r.revision_no=e.current_revision_no WHERE e.access_attempt_id=$1 AND e.source_type='DEMO' AND e.evidence_type='DEMO_QR_SCAN' AND r.is_voided=false`, [attemptId])
    return row ? { id: row.id, employeeId: row.employee_id, occurredAt: new Date(row.occurred_at), direction: row.direction } : null
  }
  async recent(manager: EntityManager, employeeId: string, factoryId: string, direction: GateDirection, at: Date): Promise<boolean> {
    const [row] = await manager.query(`SELECT e.id FROM attendance_events e JOIN attendance_event_revisions r ON r.event_id=e.id AND r.revision_no=e.current_revision_no WHERE e.employee_id=$1 AND e.source_type='DEMO' AND e.evidence_type='DEMO_QR_SCAN' AND r.activity_factory_id=$2 AND r.direction=$3 AND r.is_voided=false AND r.occurred_at>$4 ORDER BY r.occurred_at DESC LIMIT 1`, [employeeId, factoryId, direction, new Date(at.getTime() - 10000)])
    return !!row
  }
  async record(manager: EntityManager, input: { employeeId: string; attemptId: string; sourceId: string; factoryId: string; direction: GateDirection; occurredAt: Date; actorUserId: string; assignmentId: string }): Promise<DemoRecordedAttendance> {
    if (!manager.queryRunner?.isTransactionActive) throw new BadRequestException("Demo attendance requires the caller-owned transaction")
    const id = randomUUID()
    await manager.save(manager.getRepository(AttendanceEventOrmEntity).create({ id, employeeId: input.employeeId, sourceType: "DEMO", sourceId: input.sourceId, accessAttemptId: input.attemptId, reconciliationCaseId: null, evidenceDeviceEventId: null, evidenceType: "DEMO_QR_SCAN", recordedByUserId: input.actorUserId, currentRevisionNo: 1, rowVersion: 1 }))
    await manager.save(manager.getRepository(AttendanceEventRevisionOrmEntity).create({ eventId: id, revisionNo: 1, occurredAt: input.occurredAt, direction: input.direction, activityFactoryId: input.factoryId, organizationAssignmentId: input.assignmentId, isVoided: false, correctionId: null, createdByUserId: input.actorUserId }))
    return { id, employeeId: input.employeeId, occurredAt: input.occurredAt, direction: input.direction }
  }
}

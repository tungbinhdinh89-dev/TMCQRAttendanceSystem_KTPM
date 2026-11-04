import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "attendance_events" })
@Index("uq_attendance_events_source_id", ["sourceId"], { unique: true })
export class AttendanceEventOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "source_type", type: "varchar", length: 10 }) sourceType!: string
  @Column({ name: "source_id", type: "varchar", length: 180 }) sourceId!: string
  @Column({ name: "access_attempt_id", type: "uuid", nullable: true }) accessAttemptId!: string | null
  @Column({ name: "reconciliation_case_id", type: "uuid", nullable: true }) reconciliationCaseId!: string | null
  @Column({ name: "evidence_device_event_id", type: "uuid", nullable: true }) evidenceDeviceEventId!: string | null
  @Column({ name: "evidence_type", type: "varchar", length: 24 }) evidenceType!: string
  @Column({ name: "recorded_by_user_id", type: "uuid", nullable: true }) recordedByUserId!: string | null
  @Column({ name: "current_revision_no", type: "integer", default: 1 }) currentRevisionNo!: number
}

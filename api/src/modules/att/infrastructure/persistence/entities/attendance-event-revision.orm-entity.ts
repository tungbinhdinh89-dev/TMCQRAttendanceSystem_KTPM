import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"

@Entity({ name: "attendance_event_revisions" })
@Index("pk_attendance_event_revisions", ["eventId", "revisionNo"], { unique: true })
export class AttendanceEventRevisionOrmEntity {
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date
  @PrimaryColumn({ name: "event_id", type: "uuid" }) eventId!: string
  @PrimaryColumn({ name: "revision_no", type: "integer" }) revisionNo!: number
  @Column({ name: "occurred_at", type: "timestamptz" }) occurredAt!: Date
  @Column({ type: "varchar", length: 3 }) direction!: string
  @Column({ name: "activity_factory_id", type: "uuid" }) activityFactoryId!: string
  @Column({ name: "organization_assignment_id", type: "uuid", nullable: true }) organizationAssignmentId!: string | null
  @Column({ name: "is_voided", type: "boolean", default: false }) isVoided!: boolean
  @Column({ name: "correction_id", type: "uuid", nullable: true }) correctionId!: string | null
  @Column({ name: "created_by_user_id", type: "uuid", nullable: true }) createdByUserId!: string | null
}

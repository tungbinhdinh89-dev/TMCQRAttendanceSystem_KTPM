import { Column, Entity } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "attendance_review_requests" })
export class AttendanceReviewRequestOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "submitted_by_user_id", type: "uuid" }) submittedByUserId!: string
  @Column({ name: "event_id", type: "uuid", nullable: true }) eventId!: string | null
  @Column({ name: "period_start", type: "date" }) periodStart!: string
  @Column({ type: "text" }) reason!: string
  @Column({ type: "varchar", length: 16, default: "OPEN" }) status!: string
  @Column({ name: "assigned_hr_user_id", type: "uuid", nullable: true }) assignedHrUserId!: string | null
  @Column({ type: "text", nullable: true }) resolution!: string | null
  @Column({ name: "closed_by_user_id", type: "uuid", nullable: true }) closedByUserId!: string | null
  @Column({ name: "closed_at", type: "timestamptz", nullable: true }) closedAt!: Date | null
}

import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "attendance_corrections" })
@Index("uq_attendance_corrections_event_version", ["eventId", "newVersion"], { unique: true })
export class AttendanceCorrectionOrmEntity extends CreatedOrmEntity {
  @Column({ name: "event_id", type: "uuid" }) eventId!: string
  @Column({ name: "expected_version", type: "integer" }) expectedVersion!: number
  @Column({ name: "new_version", type: "integer" }) newVersion!: number
  @Column({ type: "text" }) reason!: string
  @Column({ name: "actor_user_id", type: "uuid" }) actorUserId!: string
  @Column({ name: "review_request_id", type: "uuid", nullable: true }) reviewRequestId!: string | null
  @Column({ name: "evidence_refs", type: "jsonb", default: () => "'[]'" }) evidenceRefs!: JsonValue
}

import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "background_jobs" })
@Index("uq_background_jobs_job_key", ["jobKey"], { unique: true })
@Index("uq_background_jobs_outbox", ["outboxMessageId"], { unique: true })
export class BackgroundJobOrmEntity extends VersionedOrmEntity {
  @Column({ name: "job_key", type: "varchar", length: 180 }) jobKey!: string
  @Column({ name: "job_type", type: "varchar", length: 32 }) jobType!: string
  @Column({ name: "outbox_message_id", type: "uuid", nullable: true }) outboxMessageId!: string | null
  @Column({ name: "gate_command_id", type: "uuid", nullable: true }) gateCommandId!: string | null
  @Column({ name: "employee_id", type: "uuid", nullable: true }) employeeId!: string | null
  @Column({ type: "jsonb", default: () => "'{}'" }) payload!: JsonValue
  @Column({ type: "varchar", length: 16, default: "PENDING" }) state!: string
  @Column({ name: "next_run_at", type: "timestamptz" }) nextRunAt!: Date
  @Column({ name: "attempt_count", type: "integer", default: 0 }) attemptCount!: number
  @Column({ name: "max_attempts", type: "integer" }) maxAttempts!: number
  @Column({ name: "locked_by", type: "varchar", length: 100, nullable: true }) lockedBy!: string | null
  @Column({ name: "locked_until", type: "timestamptz", nullable: true }) lockedUntil!: Date | null
  @Column({ name: "lease_version", type: "bigint", default: 0 }) leaseVersion!: string
  @Column({ name: "started_at", type: "timestamptz", nullable: true }) startedAt!: Date | null
  @Column({ name: "finished_at", type: "timestamptz", nullable: true }) finishedAt!: Date | null
  @Column({ name: "last_error_code", type: "varchar", length: 64, nullable: true }) lastErrorCode!: string | null
  @Column({ name: "last_error_detail", type: "text", nullable: true }) lastErrorDetail!: string | null
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

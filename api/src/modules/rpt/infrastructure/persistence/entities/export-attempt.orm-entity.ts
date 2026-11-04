import { Column, Entity, Index } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "export_attempts" })
@Index("uq_export_attempts_batch_attempt_no", ["batchId", "attemptNo"], { unique: true })
export class ExportAttemptOrmEntity extends CreatedOrmEntity {
  @Column({ name: "batch_id", type: "uuid" }) batchId!: string
  @Column({ name: "job_id", type: "uuid" }) jobId!: string
  @Column({ name: "attempt_no", type: "integer" }) attemptNo!: number
  @Column({ type: "varchar", length: 10 }) operation!: string
  @Column({ name: "idempotency_key", type: "varchar", length: 180 }) idempotencyKey!: string
  @Column({ name: "endpoint_config_version_id", type: "uuid" }) endpointConfigVersionId!: string
  @Column({ name: "job_lease_version", type: "bigint" }) jobLeaseVersion!: string
  @Column({ name: "started_at", type: "timestamptz" }) startedAt!: Date
  @Column({ name: "finished_at", type: "timestamptz", nullable: true }) finishedAt!: Date | null
  @Column({ name: "http_status", type: "smallint", nullable: true }) httpStatus!: number | null
  @Column({ type: "varchar", length: 24, default: "STARTED" }) outcome!: string
  @Column({ name: "remote_reference", type: "varchar", length: 150, nullable: true }) remoteReference!: string | null
  @Column({ name: "ack_period_start", type: "date", nullable: true }) ackPeriodStart!: string | null
  @Column({ name: "ack_batch_version", type: "integer", nullable: true }) ackBatchVersion!: number | null
  @Column({ name: "ack_checksum", type: "char", length: 64, nullable: true }) ackChecksum!: string | null
  @Column({ name: "ack_record_count", type: "integer", nullable: true }) ackRecordCount!: number | null
  @Column({ name: "accepted_count", type: "integer", nullable: true }) acceptedCount!: number | null
  @Column({ name: "rejected_count", type: "integer", nullable: true }) rejectedCount!: number | null
  @Column({ name: "remote_ready_at", type: "timestamptz", nullable: true }) remoteReadyAt!: Date | null
  @Column({ name: "error_code", type: "varchar", length: 64, nullable: true }) errorCode!: string | null
  @Column({ name: "error_detail", type: "text", nullable: true }) errorDetail!: string | null
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

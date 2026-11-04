import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "export_batches" })
@Index("uq_export_batches_scope_version", ["periodStart", "scopeType", "factoryId", "batchVersion"], { unique: true })
export class ExportBatchOrmEntity extends VersionedOrmEntity {
  @Column({ name: "period_start", type: "date" }) periodStart!: string
  @Column({ name: "scope_type", type: "varchar", length: 12 }) scopeType!: string
  @Column({ name: "factory_id", type: "uuid", nullable: true }) factoryId!: string | null
  @Column({ name: "batch_version", type: "integer" }) batchVersion!: number
  @Column({ name: "supersedes_batch_id", type: "uuid", nullable: true }) supersedesBatchId!: string | null
  @Column({ type: "varchar", length: 64, default: "Asia/Ho_Chi_Minh" }) timezone!: string
  @Column({ name: "window_start", type: "timestamptz" }) windowStart!: Date
  @Column({ name: "window_end", type: "timestamptz" }) windowEnd!: Date
  @Column({ name: "snapshot_at", type: "timestamptz" }) snapshotAt!: Date
  @Column({ name: "schema_version", type: "varchar", length: 32 }) schemaVersion!: string
  @Column({ name: "payload_text", type: "text" }) payloadText!: string
  @Column({ name: "payload_checksum", type: "char", length: 64 }) payloadChecksum!: string
  @Column({ name: "record_count", type: "integer" }) recordCount!: number
  @Column({ name: "integration_endpoint_id", type: "uuid" }) integrationEndpointId!: string
  @Column({ name: "endpoint_config_version_id", type: "uuid" }) endpointConfigVersionId!: string
  @Column({ type: "varchar", length: 20, default: "PREPARED" }) status!: string
  @Column({ name: "due_at", type: "timestamptz" }) dueAt!: Date
  @Column({ name: "accepted_at", type: "timestamptz", nullable: true }) acceptedAt!: Date | null
  @Column({ name: "remote_ready_at", type: "timestamptz", nullable: true }) remoteReadyAt!: Date | null
  @Column({ name: "created_by_user_id", type: "uuid", nullable: true }) createdByUserId!: string | null
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

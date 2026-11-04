import { Column, Entity } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "gate_commands" })
export class GateCommandOrmEntity extends VersionedOrmEntity {
  @Column({ name: "access_attempt_id", type: "uuid" }) accessAttemptId!: string
  @Column({ name: "parent_open_command_id", type: "uuid", nullable: true }) parentOpenCommandId!: string | null
  @Column({ name: "integration_endpoint_id", type: "uuid" }) integrationEndpointId!: string
  @Column({ name: "endpoint_config_version_id", type: "uuid" }) endpointConfigVersionId!: string
  @Column({ name: "turnstile_id", type: "varchar", length: 100 }) turnstileId!: string
  @Column({ type: "varchar", length: 5 }) kind!: string
  @Column({ type: "varchar", length: 20, default: "PREPARED" }) state!: string
  @Column({ name: "request_snapshot", type: "jsonb" }) requestSnapshot!: JsonValue
  @Column({ name: "deadline_at", type: "timestamptz" }) deadlineAt!: Date
  @Column({ name: "claimed_by", type: "varchar", length: 100, nullable: true }) claimedBy!: string | null
  @Column({ name: "claimed_at", type: "timestamptz", nullable: true }) claimedAt!: Date | null
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt!: Date | null
  @Column({ name: "acknowledged_at", type: "timestamptz", nullable: true }) acknowledgedAt!: Date | null
  @Column({ name: "confirmed_at", type: "timestamptz", nullable: true }) confirmedAt!: Date | null
  @Column({ name: "vendor_reference", type: "varchar", length: 150, nullable: true }) vendorReference!: string | null
  @Column({ name: "result_code", type: "varchar", length: 64, nullable: true }) resultCode!: string | null
  @Column({ name: "last_error", type: "text", nullable: true }) lastError!: string | null
}

import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "gate_device_events" })
@Index("uq_gate_device_events_endpoint_vendor", ["integrationEndpointId", "vendorEventId"], { unique: true })
export class GateDeviceEventOrmEntity extends CreatedOrmEntity {
  @Column({ name: "integration_endpoint_id", type: "uuid" }) integrationEndpointId!: string
  @Column({ name: "vendor_event_id", type: "varchar", length: 150 }) vendorEventId!: string
  @Column({ name: "command_id", type: "uuid", nullable: true }) commandId!: string | null
  @Column({ name: "event_type", type: "varchar", length: 32 }) eventType!: string
  @Column({ name: "occurred_at", type: "timestamptz", nullable: true }) occurredAt!: Date | null
  @Column({ name: "received_at", type: "timestamptz" }) receivedAt!: Date
  @Column({ name: "payload_hash", type: "char", length: 64 }) payloadHash!: string
  @Column({ type: "jsonb" }) payload!: JsonValue
  @Column({ name: "processing_state", type: "varchar", length: 16, default: "RECEIVED" }) processingState!: string
  @Column({ name: "processed_at", type: "timestamptz", nullable: true }) processedAt!: Date | null
}

import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "outbox_messages" })
@Index("uq_outbox_messages_dedupe_key", ["dedupeKey"], { unique: true })
export class OutboxMessageOrmEntity extends CreatedOrmEntity {
  @Column({ name: "message_type", type: "varchar", length: 50 }) messageType!: string
  @Column({ name: "dedupe_key", type: "varchar", length: 180 }) dedupeKey!: string
  @Column({ name: "export_batch_id", type: "uuid", nullable: true }) exportBatchId!: string | null
  @Column({ type: "jsonb" }) payload!: JsonValue
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

import { Column, Entity } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "audit_entries" })
export class AuditEntryOrmEntity extends CreatedOrmEntity {
  @Column({ name: "actor_type", type: "varchar", length: 16 }) actorType!: string
  @Column({ name: "actor_user_id", type: "uuid", nullable: true }) actorUserId!: string | null
  @Column({ name: "actor_station_id", type: "uuid", nullable: true }) actorStationId!: string | null
  @Column({ name: "factory_id", type: "uuid", nullable: true }) factoryId!: string | null
  @Column({ type: "varchar", length: 100 }) action!: string
  @Column({ name: "object_type", type: "varchar", length: 64 }) objectType!: string
  @Column({ name: "object_id", type: "text" }) objectId!: string
  @Column({ type: "varchar", length: 16 }) outcome!: string
  @Column({ type: "text", nullable: true }) reason!: string | null
  @Column({ name: "before_data", type: "jsonb", nullable: true }) beforeData!: JsonValue | null
  @Column({ name: "after_data", type: "jsonb", nullable: true }) afterData!: JsonValue | null
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

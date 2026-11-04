import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "gate_stations" })
@Index("uq_gate_stations_factory_code", ["factoryId", "code"], { unique: true })
export class GateStationOrmEntity extends VersionedOrmEntity {
  @Column({ name: "factory_id", type: "uuid" }) factoryId!: string
  @Column({ name: "integration_endpoint_id", type: "uuid" }) integrationEndpointId!: string
  @Column({ name: "config_version_id", type: "uuid" }) configVersionId!: string
  @Column({ type: "varchar", length: 50 }) code!: string
  @Column({ type: "varchar", length: 3 }) direction!: string
  @Column({ name: "turnstile_id", type: "varchar", length: 100 }) turnstileId!: string
  @Column({ type: "varchar", length: 20, default: "ACTIVE" }) status!: string
  @Column({ name: "last_seen_at", type: "timestamptz", nullable: true }) lastSeenAt!: Date | null
}

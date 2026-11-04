import { Column, Entity } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "presence_intervals" })
export class PresenceIntervalOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "activity_factory_id", type: "uuid" }) activityFactoryId!: string
  @Column({ name: "in_event_id", type: "uuid", nullable: true }) inEventId!: string | null
  @Column({ name: "in_revision_no", type: "integer", nullable: true }) inRevisionNo!: number | null
  @Column({ name: "out_event_id", type: "uuid", nullable: true }) outEventId!: string | null
  @Column({ name: "out_revision_no", type: "integer", nullable: true }) outRevisionNo!: number | null
  @Column({ name: "starts_at", type: "timestamptz", nullable: true }) startsAt!: Date | null
  @Column({ name: "ends_at", type: "timestamptz", nullable: true }) endsAt!: Date | null
  @Column({ name: "duration_seconds", type: "integer", nullable: true }) durationSeconds!: number | null
  @Column({ type: "varchar", length: 16 }) status!: string
  @Column({ name: "anomaly_codes", type: "jsonb", default: () => "'[]'" }) anomalyCodes!: JsonValue
  @Column({ name: "computed_at", type: "timestamptz" }) computedAt!: Date
  @Column({ name: "calculation_version", type: "varchar", length: 32 }) calculationVersion!: string
}

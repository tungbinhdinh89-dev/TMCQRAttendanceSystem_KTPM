import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "reconciliation_cases" })
@Index("uq_reconciliation_cases_case_key", ["caseKey"], { unique: true })
export class ReconciliationCaseOrmEntity extends VersionedOrmEntity {
  @Column({ name: "case_key", type: "uuid" }) caseKey!: string
  @Column({ name: "case_type", type: "varchar", length: 24 }) caseType!: string
  @Column({ name: "access_attempt_id", type: "uuid", nullable: true }) accessAttemptId!: string | null
  @Column({ name: "target_command_id", type: "uuid", nullable: true }) targetCommandId!: string | null
  @Column({ name: "station_id", type: "uuid" }) stationId!: string
  @Column({ name: "employee_id", type: "uuid", nullable: true }) employeeId!: string | null
  @Column({ type: "varchar", length: 3, nullable: true }) direction!: string | null
  @Column({ name: "occurred_at", type: "timestamptz", nullable: true }) occurredAt!: Date | null
  @Column({ type: "text" }) reason!: string
  @Column({ name: "evidence_refs", type: "jsonb", default: () => "'[]'" }) evidenceRefs!: JsonValue
  @Column({ type: "varchar", length: 16, default: "OPEN" }) status!: string
  @Column({ type: "varchar", length: 32, nullable: true }) outcome!: string | null
  @Column({ name: "opened_by_user_id", type: "uuid" }) openedByUserId!: string
  @Column({ name: "assigned_to_user_id", type: "uuid", nullable: true }) assignedToUserId!: string | null
  @Column({ name: "resolved_by_user_id", type: "uuid", nullable: true }) resolvedByUserId!: string | null
  @Column({ name: "resolved_at", type: "timestamptz", nullable: true }) resolvedAt!: Date | null
}

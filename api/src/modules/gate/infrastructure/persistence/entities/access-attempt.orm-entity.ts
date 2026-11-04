import { Column, Entity, Index } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "access_attempts" })
@Index("uq_access_attempts_station_event", ["stationId", "eventId"], { unique: true })
export class AccessAttemptOrmEntity extends CreatedOrmEntity {
  @Column({ name: "station_id", type: "uuid" }) stationId!: string
  @Column({ name: "station_credential_id", type: "uuid", nullable: true }) stationCredentialId!: string | null
  @Column({ name: "factory_id", type: "uuid" }) factoryId!: string
  @Column({ name: "event_id", type: "uuid" }) eventId!: string
  @Column({ name: "request_hash", type: "char", length: 64 }) requestHash!: string
  @Column({ name: "source_kind", type: "varchar", length: 20 }) sourceKind!: string
  @Column({ name: "acting_user_id", type: "uuid", nullable: true }) actingUserId!: string | null
  @Column({ name: "employee_id", type: "uuid", nullable: true }) employeeId!: string | null
  @Column({ name: "qr_token_id", type: "uuid", nullable: true }) qrTokenId!: string | null
  @Column({ name: "token_fingerprint", type: "char", length: 64, nullable: true }) tokenFingerprint!: string | null
  @Column({ type: "varchar", length: 3 }) direction!: string
  @Column({ type: "varchar", length: 16, default: "PENDING" }) decision!: string
  @Column({ name: "reason_code", type: "varchar", length: 64, nullable: true }) reasonCode!: string | null
  @Column({ name: "received_at", type: "timestamptz" }) receivedAt!: Date
  @Column({ name: "deadline_at", type: "timestamptz" }) deadlineAt!: Date
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

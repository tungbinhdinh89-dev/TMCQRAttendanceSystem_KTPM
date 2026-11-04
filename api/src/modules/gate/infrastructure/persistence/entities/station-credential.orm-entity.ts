import { Column, Entity } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "station_credentials" })
export class StationCredentialOrmEntity extends CreatedOrmEntity {
  @Column({ name: "station_id", type: "uuid" }) stationId!: string
  @Column({ name: "secret_hash", type: "text" }) secretHash!: string
  @Column({ name: "expires_at", type: "timestamptz", nullable: true }) expiresAt!: Date | null
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
  @Column({ name: "issued_by_user_id", type: "uuid" }) issuedByUserId!: string
  @Column({ name: "revoked_by_user_id", type: "uuid", nullable: true }) revokedByUserId!: string | null
  @Column({ name: "revoke_reason", type: "text", nullable: true }) revokeReason!: string | null
}

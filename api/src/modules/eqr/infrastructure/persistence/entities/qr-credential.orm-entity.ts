import { Column, Entity } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "qr_credentials" })
export class QrCredentialOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "credential_ref", type: "varchar", length: 128 }) credentialRef!: string
  @Column({ type: "varchar", length: 16, default: "ACTIVE" }) status!: string
  @Column({ name: "issued_by_user_id", type: "uuid" }) issuedByUserId!: string
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
  @Column({ name: "revoked_by_user_id", type: "uuid", nullable: true }) revokedByUserId!: string | null
  @Column({ name: "revoke_reason", type: "text", nullable: true }) revokeReason!: string | null
}

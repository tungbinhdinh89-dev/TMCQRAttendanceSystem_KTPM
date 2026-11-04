import { Column, Entity } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "qr_tokens" })
export class QrTokenOrmEntity extends CreatedOrmEntity {
  @Column({ name: "credential_id", type: "uuid" }) credentialId!: string
  @Column({ name: "signing_key_id", type: "varchar", length: 64 }) signingKeyId!: string
  @Column({ name: "issued_by_user_id", type: "uuid" }) issuedByUserId!: string
  @Column({ name: "token_hash", type: "char", length: 64 }) tokenHash!: string
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
}

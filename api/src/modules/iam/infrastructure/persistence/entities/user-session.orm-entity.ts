import { Column, Entity, Index } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "user_sessions" })
@Index("uq_user_sessions_token_hash", ["tokenHash"], { unique: true })
export class UserSessionOrmEntity extends CreatedOrmEntity {
  @Column({ name: "user_id", type: "uuid" }) userId!: string
  @Column({ name: "token_hash", type: "char", length: 64 }) tokenHash!: string
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date
  @Column({ name: "last_seen_at", type: "timestamptz", nullable: true }) lastSeenAt!: Date | null
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
  @Column({ name: "revoke_reason", type: "varchar", length: 100, nullable: true }) revokeReason!: string | null
}

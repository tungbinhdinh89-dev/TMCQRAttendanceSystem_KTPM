import { Column, Entity } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "access_grants" })
export class AccessGrantOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "factory_id", type: "uuid" }) factoryId!: string
  @Column({ name: "valid_from", type: "timestamptz" }) validFrom!: Date
  @Column({ name: "valid_to", type: "timestamptz", nullable: true }) validTo!: Date | null
  @Column({ name: "granted_by_user_id", type: "uuid" }) grantedByUserId!: string
  @Column({ name: "grant_reason", type: "text" }) grantReason!: string
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
  @Column({ name: "revoked_by_user_id", type: "uuid", nullable: true }) revokedByUserId!: string | null
  @Column({ name: "revoke_reason", type: "text", nullable: true }) revokeReason!: string | null
}

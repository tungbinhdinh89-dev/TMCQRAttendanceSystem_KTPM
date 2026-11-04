import { Column, Entity } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "user_role_assignments" })
export class RoleAssignmentOrmEntity extends VersionedOrmEntity {
  @Column({ name: "user_id", type: "uuid" }) userId!: string
  @Column({ name: "role_id", type: "uuid" }) roleId!: string
  @Column({ name: "scope_type", type: "varchar", length: 16 }) scopeType!: string
  @Column({ name: "factory_id", type: "uuid", nullable: true }) factoryId!: string | null
  @Column({ name: "department_id", type: "uuid", nullable: true }) departmentId!: string | null
  @Column({ name: "team_id", type: "uuid", nullable: true }) teamId!: string | null
  @Column({ name: "valid_from", type: "timestamptz" }) validFrom!: Date
  @Column({ name: "valid_to", type: "timestamptz", nullable: true }) validTo!: Date | null
  @Column({ name: "assigned_by_user_id", type: "uuid", nullable: true }) assignedByUserId!: string | null
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt!: Date | null
  @Column({ name: "revoked_by_user_id", type: "uuid", nullable: true }) revokedByUserId!: string | null
  @Column({ name: "revoke_reason", type: "text", nullable: true }) revokeReason!: string | null
}

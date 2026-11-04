import { CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"

@Entity({ name: "role_permissions" })
@Index("pk_role_permissions", ["roleId", "permissionId"], { unique: true })
export class RolePermissionOrmEntity {
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date
  @PrimaryColumn({ name: "role_id", type: "uuid" }) roleId!: string
  @PrimaryColumn({ name: "permission_id", type: "uuid" }) permissionId!: string
}

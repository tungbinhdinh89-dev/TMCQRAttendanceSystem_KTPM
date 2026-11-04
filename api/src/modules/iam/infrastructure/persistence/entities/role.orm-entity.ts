import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "roles" })
@Index("uq_roles_code", ["code"], { unique: true })
export class RoleOrmEntity extends VersionedOrmEntity {
  @Column({ type: "varchar", length: 32 }) code!: string
  @Column({ type: "varchar", length: 100 }) name!: string
  @Column({ type: "text", nullable: true }) description!: string | null
  @Column({ name: "is_active", type: "boolean", default: true }) isActive!: boolean
}

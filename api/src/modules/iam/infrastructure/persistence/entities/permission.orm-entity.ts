import { Column, Entity, Index } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "permissions" })
@Index("uq_permissions_code", ["code"], { unique: true })
export class PermissionOrmEntity extends CreatedOrmEntity {
  @Column({ type: "varchar", length: 100 }) code!: string
  @Column({ type: "varchar", length: 150 }) name!: string
  @Column({ type: "text", nullable: true }) description!: string | null
}

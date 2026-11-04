import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "departments" })
@Index("uq_departments_factory_code", ["factoryId", "code"], { unique: true })
export class DepartmentOrmEntity extends VersionedOrmEntity {
  @Column({ name: "factory_id", type: "uuid" }) factoryId!: string
  @Column({ type: "varchar", length: 32 }) code!: string
  @Column({ type: "varchar", length: 150 }) name!: string
  @Column({ name: "is_active", type: "boolean", default: true }) isActive!: boolean
}

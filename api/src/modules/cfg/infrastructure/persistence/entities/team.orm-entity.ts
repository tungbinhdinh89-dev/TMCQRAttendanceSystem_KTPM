import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "teams" })
@Index("uq_teams_department_code", ["departmentId", "code"], { unique: true })
export class TeamOrmEntity extends VersionedOrmEntity {
  @Column({ name: "department_id", type: "uuid" }) departmentId!: string
  @Column({ type: "varchar", length: 32 }) code!: string
  @Column({ type: "varchar", length: 150 }) name!: string
  @Column({ name: "is_active", type: "boolean", default: true }) isActive!: boolean
}

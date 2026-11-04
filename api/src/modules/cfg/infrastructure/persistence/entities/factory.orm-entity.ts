import { Entity, Index, Column } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "factories" })
@Index("uq_factories_code", ["code"], { unique: true })
export class FactoryOrmEntity extends VersionedOrmEntity {
  @Column({ type: "varchar", length: 32 }) code!: string
  @Column({ type: "varchar", length: 150 }) name!: string
  @Column({ type: "varchar", length: 64, default: "Asia/Ho_Chi_Minh" }) timezone!: string
  @Column({ type: "varchar", length: 20, default: "ACTIVE" }) status!: string
}

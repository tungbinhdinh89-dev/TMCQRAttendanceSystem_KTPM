import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "export_items" })
@Index("uq_export_items_batch_employee", ["batchId", "employeeId"], { unique: true })
@Index("uq_export_items_batch_item_no", ["batchId", "itemNo"], { unique: true })
export class ExportItemOrmEntity extends CreatedOrmEntity {
  @Column({ name: "batch_id", type: "uuid" }) batchId!: string
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "item_no", type: "integer" }) itemNo!: number
  @Column({ name: "external_hr_id_snapshot", type: "varchar", length: 64 }) externalHrIdSnapshot!: string
  @Column({ name: "organization_snapshot", type: "jsonb" }) organizationSnapshot!: JsonValue
  @Column({ name: "payload_snapshot", type: "jsonb" }) payloadSnapshot!: JsonValue
  @Column({ name: "item_checksum", type: "char", length: 64 }) itemChecksum!: string
}

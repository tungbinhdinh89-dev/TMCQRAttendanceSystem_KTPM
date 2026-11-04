import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "employees" })
@Index("uq_employees_employee_code", ["employeeCode"], { unique: true })
@Index("uq_employees_external_hr_id", ["externalHrId"], { unique: true })
export class EmployeeOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_code", type: "varchar", length: 32 }) employeeCode!: string
  @Column({ name: "external_hr_id", type: "varchar", length: 64 }) externalHrId!: string
  @Column({ name: "full_name", type: "varchar", length: 150 }) fullName!: string
  @Column({ type: "varchar", length: 254, nullable: true }) email!: string | null
  @Column({ type: "varchar", length: 16, default: "ACTIVE" }) status!: string
  @Column({ name: "deactivated_at", type: "timestamptz", nullable: true }) deactivatedAt!: Date | null
}

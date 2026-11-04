import { Column, Entity } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "employee_assignments" })
export class EmployeeAssignmentOrmEntity extends CreatedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ name: "factory_id", type: "uuid" }) factoryId!: string
  @Column({ name: "department_id", type: "uuid", nullable: true }) departmentId!: string | null
  @Column({ name: "team_id", type: "uuid", nullable: true }) teamId!: string | null
  @Column({ name: "valid_from", type: "timestamptz" }) validFrom!: Date
  @Column({ name: "valid_to", type: "timestamptz", nullable: true }) validTo!: Date | null
  @Column({ name: "assigned_by_user_id", type: "uuid", nullable: true }) assignedByUserId!: string | null
}

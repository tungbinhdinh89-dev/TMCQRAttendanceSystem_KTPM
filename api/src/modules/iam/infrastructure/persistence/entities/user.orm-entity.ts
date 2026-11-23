import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "users" })
@Index("uq_users_employee", ["employeeId"], { unique: true })
@Index("uq_users_username", ["username"], { unique: true })
export class UserOrmEntity extends VersionedOrmEntity {
  @Column({ name: "employee_id", type: "uuid" }) employeeId!: string
  @Column({ type: "varchar", length: 100 }) username!: string
  @Column({ name: "password_hash", type: "text" }) passwordHash!: string
  @Column({ type: "varchar", length: 16, default: "ACTIVE" }) status!: string
  @Column({ name: "must_change_password", type: "boolean", default: false }) mustChangePassword!: boolean
  @Column({ name: "last_login_at", type: "timestamptz", nullable: true }) lastLoginAt!: Date | null
}

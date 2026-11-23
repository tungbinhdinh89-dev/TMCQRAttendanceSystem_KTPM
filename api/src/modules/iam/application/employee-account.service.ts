import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common"
import { randomBytes, randomUUID } from "node:crypto"
import { DataSource, EntityManager } from "typeorm"
import { employeeId, employeeScope } from "../../eqr/application/employee.service"
import { EmployeeOrmEntity } from "../../eqr/infrastructure/persistence/entities/employee.orm-entity"
import { UserOrmEntity } from "../infrastructure/persistence/entities/user.orm-entity"
import { RoleOrmEntity } from "../infrastructure/persistence/entities/role.orm-entity"
import { RoleAssignmentOrmEntity } from "../infrastructure/persistence/entities/role-assignment.orm-entity"
import { encodePassword, type SessionIdentity } from "./auth.service"
import { AuditService } from "./audit.service"

@Injectable()
export class EmployeeAccountService {
  constructor(private readonly ds: DataSource, private readonly audit: AuditService) {}

  private async authorize(m: EntityManager, identity: SessionIdentity, id: string, write = false) {
    const scope = employeeScope(identity)
    const employee = await m.getRepository(EmployeeOrmEntity).findOne({ where: { id }, ...(write ? { lock: { mode: "pessimistic_write" as const } } : {}) })
    if (!employee) throw new NotFoundException("Employee not found")
    const [assignment] = await m.query("SELECT factory_id FROM employee_assignments WHERE employee_id=$1 AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW()) ORDER BY valid_from DESC LIMIT 1", [id])
    if (!scope.global && (!assignment || !scope.factoryIds.includes(assignment.factory_id))) throw new ForbiddenException("Employee outside HR scope")
    return { employee, factoryId: assignment?.factory_id ?? null }
  }

  async get(identity: SessionIdentity, id: string) {
    employeeId(id)
    await this.authorize(this.ds.manager, identity, id)
    const user = await this.ds.getRepository(UserOrmEntity).findOne({ where: { employeeId: id } })
    return user ? { userId: user.id, username: user.username, status: user.status, mustChangePassword: user.mustChangePassword } : null
  }

  async provision(identity: SessionIdentity, id: string, input: Record<string, unknown>) {
    employeeId(id)
    // HR cannot inject roles, passwords, account status or a different employee binding.
    if (Object.keys(input).some(key => key !== "username") || typeof input.username !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.@-]{2,99}$/.test(input.username)) {
      throw new BadRequestException({ code: "ACCOUNT_USERNAME_INVALID", message: "Username must contain 3?100 letters, digits, dots, underscores, @ or hyphens" })
    }
    const username = input.username
    try {
      return await this.ds.transaction(async m => {
        const { employee, factoryId } = await this.authorize(m, identity, id, true)
        if (employee.status !== "ACTIVE") throw new ConflictException("Inactive employee cannot receive an account")
        const users = m.getRepository(UserOrmEntity)
        if (await users.findOne({ where: { employeeId: id } })) throw new ConflictException({ code: "ACCOUNT_EMPLOYEE_EXISTS", message: "Employee already has an account" })
        const role = await m.getRepository(RoleOrmEntity).findOne({ where: { code: "EMP", isActive: true } })
        if (!role) throw new ServiceUnavailableException("Employee role is not configured")
        const temporaryPassword = randomBytes(18).toString("base64url")
        const user = users.create({ id: randomUUID(), employeeId: id, username, passwordHash: encodePassword(temporaryPassword), status: "ACTIVE", mustChangePassword: true, lastLoginAt: null, rowVersion: 1 })
        await m.save(user)
        const assignment = m.getRepository(RoleAssignmentOrmEntity).create({ id: randomUUID(), userId: user.id, roleId: role.id, scopeType: "SELF", factoryId: null, departmentId: null, teamId: null, validFrom: new Date(), validTo: null, assignedByUserId: identity.userId, revokedAt: null, revokedByUserId: null, revokeReason: null, rowVersion: 1 })
        await m.save(assignment)
        await this.audit.write({ actorType: "USER", actorUserId: identity.userId, factoryId, action: "EMPLOYEE_ACCOUNT_PROVISION", objectType: "USER", objectId: user.id, outcome: "SUCCESS", afterData: { employeeId: id, role: "EMP", scopeType: "SELF" } }, m)
        return { userId: user.id, username: user.username, temporaryPassword }
      })
    } catch (error) {
      if ((error as { code?: string }).code === "23505") throw new ConflictException({ code: "ACCOUNT_EXISTS", message: "Username or employee account already exists" })
      throw error
    }
  }
}

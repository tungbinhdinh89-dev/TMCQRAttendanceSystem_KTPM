import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common"
import { allowedOrigins } from "../../../platform/http/allowed-origins"
import { AuditService } from "./audit.service"
import type { AuditPort } from "./ports/audit.port"
import { DataSource } from "typeorm"
import { EmployeeOrmEntity } from "../../eqr/infrastructure/persistence/entities/employee.orm-entity"
import { PermissionOrmEntity } from "../infrastructure/persistence/entities/permission.orm-entity"
import { RoleAssignmentOrmEntity } from "../infrastructure/persistence/entities/role-assignment.orm-entity"
import { RolePermissionOrmEntity } from "../infrastructure/persistence/entities/role-permission.orm-entity"
import { RoleOrmEntity } from "../infrastructure/persistence/entities/role.orm-entity"
import { UserOrmEntity } from "../infrastructure/persistence/entities/user.orm-entity"
import { UserSessionOrmEntity } from "../infrastructure/persistence/entities/user-session.orm-entity"

export const SESSION_COOKIE = "tmc_session"
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

export type SessionIdentity = {
  userId: string
  username: string
  employeeId: string
  employee: { employeeCode: string; fullName: string; status: string }
  roles: Array<{
    code: string
    scopeType: string
    factoryId: string | null
    departmentId: string | null
    teamId: string | null
    permissions: string[]
  }>
}

@Injectable()
export class AuthService {
  constructor(private readonly dataSource: DataSource, private readonly audit: AuditPort = new AuditService(dataSource)) {}

  async verifyRequestOrigin(origin: string | undefined, action: "AUTH_LOGIN" | "AUTH_LOGOUT"): Promise<void> {
    if (origin && !allowedOrigins().includes(origin)) {
      await this.audit.write({ actorType:"ANONYMOUS",action,objectType:"AUTH",objectId:"request",outcome:"DENIED",reason:"ORIGIN_NOT_ALLOWED" })
      throw new ForbiddenException({code:"AUTH_ORIGIN_FORBIDDEN",message:"Origin is not allowed"})
    }
  }

  async login(username: string, password: string): Promise<{ token: string; expiresAt: Date; identity: SessionIdentity }> {
    const user = await this.dataSource.getRepository(UserOrmEntity).findOne({ where: { username } })
    if (!user || user.status !== "ACTIVE" || !verifyPassword(password, user.passwordHash)) {
      await this.audit.write({ actorType: "ANONYMOUS", action: "AUTH_LOGIN", objectType: "AUTH", objectId: "login", outcome: "FAILURE", reason: "INVALID_CREDENTIALS" })
      throw new UnauthorizedException({ code: "AUTH_INVALID_CREDENTIALS", message: "Invalid username or password" })
    }

    const employee = await this.dataSource.getRepository(EmployeeOrmEntity).findOne({ where: { id: user.employeeId } })
    if (!employee || employee.status !== "ACTIVE") {
      await this.audit.write({ actorType: "USER", actorUserId: user.id, action: "AUTH_LOGIN", objectType: "AUTH", objectId: "login", outcome: "DENIED", reason: "EMPLOYEE_INACTIVE" })
      throw new UnauthorizedException({ code: "AUTH_EMPLOYEE_INACTIVE", message: "Employee is inactive" })
    }

    const token = randomBytes(32).toString("base64url")
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    const identity = await this.identityFor(user, employee)
    const correlationId = randomUUID()
    const session = this.dataSource.getRepository(UserSessionOrmEntity).create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
      lastSeenAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    })
    await this.dataSource.transaction(async (manager) => {
      await manager.save(session)
      await manager.update(UserOrmEntity, user.id, { lastLoginAt: new Date() })
      await this.audit.write({ actorType: "USER", actorUserId: user.id, action: "AUTH_LOGIN", objectType: "AUTH", objectId: user.id, outcome: "SUCCESS", correlationId }, manager)
    })

    return { token, expiresAt, identity }
  }

  async me(token: string | undefined): Promise<SessionIdentity> {
    const session = await this.findSession(token)
    const user = await this.dataSource.getRepository(UserOrmEntity).findOne({ where: { id: session.userId } })
    if (!user || user.status !== "ACTIVE") {
      await this.audit.write({actorType:"ANONYMOUS",action:"AUTH_SESSION",objectType:"AUTH",objectId:"session",outcome:"DENIED",reason:"USER_INACTIVE"})
      throw new UnauthorizedException({ code: "AUTH_SESSION_INVALID", message: "Session is invalid" })
    }
    const employee = await this.dataSource.getRepository(EmployeeOrmEntity).findOne({ where: { id: user.employeeId } })
    if (!employee || employee.status !== "ACTIVE") {
      await this.audit.write({actorType:"USER",actorUserId:user.id,action:"AUTH_SESSION",objectType:"AUTH",objectId:"session",outcome:"DENIED",reason:"EMPLOYEE_INACTIVE"})
      throw new UnauthorizedException({ code: "AUTH_EMPLOYEE_INACTIVE", message: "Employee is inactive" })
    }
    await this.dataSource.getRepository(UserSessionOrmEntity).update(session.id, { lastSeenAt: new Date() })
    return this.identityFor(user, employee)
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return
    const session = await this.dataSource.getRepository(UserSessionOrmEntity).findOne({
      where: { tokenHash: hashToken(token) },
    })
    if (session && !session.revokedAt) {
      await this.dataSource.transaction(async manager => {
        await manager.update(UserSessionOrmEntity, session.id, {
          revokedAt: new Date(), revokeReason: "USER_LOGOUT",
        })
        await this.audit.write({ actorType: "USER", actorUserId: session.userId,
          action: "AUTH_LOGOUT", objectType: "AUTH", objectId: session.userId,
          outcome: "SUCCESS" }, manager)
      })
    }
  }

  private async findSession(token: string | undefined): Promise<UserSessionOrmEntity> {
    if (!token) {
      await this.audit.write({ actorType: "ANONYMOUS", action: "AUTH_SESSION", objectType: "AUTH", objectId: "session", outcome: "DENIED", reason: "SESSION_REQUIRED" })
      throw new UnauthorizedException({ code: "AUTH_SESSION_REQUIRED", message: "Authentication required" })
    }
    const session = await this.dataSource.getRepository(UserSessionOrmEntity).findOne({
      where: { tokenHash: hashToken(token) },
    })
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      await this.audit.write({ actorType: "ANONYMOUS", action: "AUTH_SESSION", objectType: "AUTH", objectId: "session", outcome: "DENIED", reason: "SESSION_INVALID" })
      throw new UnauthorizedException({ code: "AUTH_SESSION_INVALID", message: "Session is invalid or expired" })
    }
    return session
  }

  private async identityFor(user: UserOrmEntity, employee: EmployeeOrmEntity): Promise<SessionIdentity> {
    const assignments = await this.dataSource.getRepository(RoleAssignmentOrmEntity)
      .createQueryBuilder("assignment")
      .innerJoin(RoleOrmEntity, "role", "role.id = assignment.role_id AND role.is_active = true")
      .leftJoin(RolePermissionOrmEntity, "rolePermission", "rolePermission.role_id = role.id")
      .leftJoin(PermissionOrmEntity, "permission", "permission.id = rolePermission.permission_id")
      .select([
        "role.code AS code",
        'assignment.scope_type AS "scopeType"',
        'assignment.factory_id AS "factoryId"',
        'assignment.department_id AS "departmentId"',
        'assignment.team_id AS "teamId"',
        "permission.code AS permission",
      ])
      .where("assignment.user_id = :userId", { userId: user.id })
      .andWhere("assignment.revoked_at IS NULL")
      .andWhere("assignment.valid_from <= NOW()")
      .andWhere("(assignment.valid_to IS NULL OR assignment.valid_to > NOW())")
      .getRawMany<{
        code: string
        scopeType: string
        factoryId: string | null
        departmentId: string | null
        teamId: string | null
        permission: string | null
      }>()

    const roleMap = new Map<string, SessionIdentity["roles"][number]>()
    for (const assignment of assignments) {
      const key = `${assignment.code}:${assignment.scopeType}:${assignment.factoryId ?? ""}:${assignment.departmentId ?? ""}:${assignment.teamId ?? ""}`
      const role = roleMap.get(key) ?? {
        code: assignment.code,
        scopeType: assignment.scopeType,
        factoryId: assignment.factoryId,
        departmentId: assignment.departmentId,
        teamId: assignment.teamId,
        permissions: [],
      }
      if (assignment.permission && !role.permissions.includes(assignment.permission)) {
        role.permissions.push(assignment.permission)
      }
      roleMap.set(key, role)
    }

    return {
      userId: user.id,
      username: user.username,
      employeeId: employee.id,
      employee: { employeeCode: employee.employeeCode, fullName: employee.fullName, status: employee.status },
      roles: [...roleMap.values()],
    }
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function verifyPassword(password: string, encoded: string): boolean {
  const [scheme, salt, expected] = encoded.split("$")
  if (scheme !== "scrypt" || !salt || !expected) return false
  try {
    const actual = scryptSync(password, salt, 64).toString("hex")
    return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  } catch {
    return false
  }
}

export function encodePassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`
}

import { randomBytes, scryptSync } from "node:crypto"
import { In, type EntityManager } from "typeorm"
import { UserOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/user.orm-entity"
import { RoleAssignmentOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/role-assignment.orm-entity"
import { RoleOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/role.orm-entity"
import { EmployeeOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/employee.orm-entity"
import { EmployeeAssignmentOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/employee-assignment.orm-entity"
import { AccessGrantOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/access-grant.orm-entity"

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`
export const demoUiUsers = [
  { id: id(201), username: "emp.demo" }, { id: id(202), username: "hr.demo" },
  { id: id(203), username: "sup.demo" }, { id: id(204), username: "sec.demo" },
  { id: id(205), username: "adm.demo" }, { id: id(206), username: "exe.demo" },
  { id: id(207), username: "sup.active.demo" }, { id: id(208), username: "sec.active.demo" },
]

export async function seedDemoUiAccounts(manager: EntityManager, existingHash?: string): Promise<void> {
  const password = process.env.DEMO_PASSWORD
  if (!existingHash && !password) throw new Error("Set DEMO_PASSWORD before preparing demo UI accounts.")
  const users = await manager.getRepository(UserOrmEntity).findBy({ id: In(demoUiUsers.map(user => user.id)) })
  for (const user of users) {
    if (demoUiUsers.find(expected => expected.id === user.id)?.username !== user.username) {
      throw new Error("Demo user ID belongs to a different username; refusing to overwrite it.")
    }
  }
  if (demoUiUsers.slice(0, 6).some(expected => !users.some(user => user.id === expected.id))) {
    throw new Error("Base demo fixtures are missing. Run the full demo seed first.")
  }
  const salt = randomBytes(16).toString("hex")
  const passwordHash = existingHash ?? `scrypt$${salt}$${scryptSync(password!, salt, 64).toString("hex")}`
  const validFrom = new Date("2026-01-01T00:00:00.000Z")
  const activeProfiles = [
    { employeeId: id(107), user: demoUiUsers[6], code: "TMC0007", name: "Giám sát demo", roleId: id(303), scopeType: "TEAM", teamId: id(21) },
    { employeeId: id(108), user: demoUiUsers[7], code: "TMC0008", name: "Bảo vệ demo", roleId: id(304), scopeType: "FACTORY", teamId: null },
  ]
  for (const [index, profile] of activeProfiles.entries()) {
    const role = await manager.getRepository(RoleOrmEntity).findOneBy({ id: profile.roleId })
    if (role?.code !== (index === 0 ? "SUP" : "SEC")) throw new Error("Expected demo role is missing or changed.")
    const roleAssignment = await manager.getRepository(RoleAssignmentOrmEntity).findOneBy({ id: id(707 + index) })
    const employeeAssignment = await manager.getRepository(EmployeeAssignmentOrmEntity).findOneBy({ id: id(805 + index) })
    const grant = await manager.getRepository(AccessGrantOrmEntity).findOneBy({ id: id(904 + index) })
    if ((roleAssignment && roleAssignment.userId !== profile.user.id)
      || (employeeAssignment && employeeAssignment.employeeId !== profile.employeeId)
      || (grant && grant.employeeId !== profile.employeeId)) {
      throw new Error("Demo assignment/grant ID belongs to other data; refusing to overwrite it.")
    }
    const employee = await manager.getRepository(EmployeeOrmEntity).findOneBy({ id: profile.employeeId })
    if (employee && (employee.employeeCode !== profile.code || employee.externalHrId !== `HR-DEMO-${profile.code}`)) {
      throw new Error("Demo employee ID belongs to different data; refusing to overwrite it.")
    }
    await manager.getRepository(EmployeeOrmEntity).upsert({
      id: profile.employeeId, employeeCode: profile.code, externalHrId: `HR-DEMO-${profile.code}`,
      fullName: profile.name, email: `${profile.user.username}@example.invalid`, status: "ACTIVE", deactivatedAt: null,
    }, ["id"])
    await manager.getRepository(UserOrmEntity).upsert({
      id: profile.user.id, employeeId: profile.employeeId, username: profile.user.username,
      passwordHash, status: "ACTIVE", lastLoginAt: null,
    }, ["id"])
    await manager.getRepository(EmployeeAssignmentOrmEntity).upsert({
      id: id(805 + index), employeeId: profile.employeeId, factoryId: id(1), departmentId: id(12), teamId: id(21),
      validFrom, validTo: null, assignedByUserId: id(202),
    }, ["id"])
    await manager.getRepository(RoleAssignmentOrmEntity).upsert({
      id: id(707 + index), userId: profile.user.id, roleId: profile.roleId, scopeType: profile.scopeType,
      factoryId: id(1), departmentId: profile.scopeType === "TEAM" ? id(12) : null, teamId: profile.teamId,
      validFrom, validTo: null, assignedByUserId: id(205), revokedAt: null, revokedByUserId: null, revokeReason: null,
    }, ["id"])
    await manager.getRepository(AccessGrantOrmEntity).upsert({
      id: id(904 + index), employeeId: profile.employeeId, factoryId: id(1), validFrom, validTo: null,
      grantedByUserId: id(202), grantReason: "Local UI demo fixture", revokedAt: null, revokedByUserId: null, revokeReason: null,
    }, ["id"])
  }
  // Keep the revoked/inactive employees behind sup.demo/sec.demo as negative fixtures.
  for (const user of demoUiUsers.slice(0, 6)) {
    await manager.getRepository(UserOrmEntity).update(user.id, { passwordHash })
  }
}

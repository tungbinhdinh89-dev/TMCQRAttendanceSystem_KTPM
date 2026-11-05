import type { SessionIdentity } from "@tmc/contracts"
import type { Account, Database, Role } from "../data/types"

const roleMap: Record<string, Role> = {
  ADM: "SYSTEM_ADMIN", HR: "HR_MANAGER", SUP: "DEPARTMENT_MANAGER",
  SEC: "SECURITY_MANAGER", EXE: "EXECUTIVE", EMP: "EMPLOYEE",
}
const rolePriority = ["ADM", "HR", "SUP", "SEC", "EXE", "EMP"]

export function accountFromSession(identity: SessionIdentity, db: Database): Account | undefined {
  const assignment = rolePriority.map(code => identity.roles.find(role => role.code === code)).find(Boolean)
  if (!assignment || identity.employee.status !== "ACTIVE") return undefined
  const profile = db.accounts.find(account => account.id === identity.userId)
  const employee = db.employees.find(employee => employee.id === identity.employeeId)
  return {
    id: identity.userId, username: identity.username, name: identity.employee.fullName,
    employeeId: identity.employeeId, role: roleMap[assignment.code],
    site: profile?.site ?? employee?.site ?? "bd", department: employee?.department ?? "",
    scopeType: assignment.scopeType, factoryId: assignment.factoryId,
    departmentId: assignment.departmentId, teamId: assignment.teamId, permissions: assignment.permissions,
  }
}

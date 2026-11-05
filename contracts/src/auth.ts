import type { Uuid } from "./common"

export type SessionRoleAssignment = {
  code: string
  scopeType: string
  factoryId: Uuid | null
  departmentId: Uuid | null
  teamId: Uuid | null
  permissions: string[]
}

export type SessionIdentity = {
  userId: Uuid
  username: string
  employeeId: Uuid
  employee: { employeeCode: string; fullName: string; status: string }
  roles: SessionRoleAssignment[]
}

export type LoginRequest = { username: string; password: string }
export type LoginResponse = { user: SessionIdentity; expiresAt: string }

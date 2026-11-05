import { randomBytes, scryptSync } from "node:crypto"
import type { EntityManager } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { DepartmentOrmEntity } from "../../../../modules/cfg/infrastructure/persistence/entities/department.orm-entity"
import { FactoryOrmEntity } from "../../../../modules/cfg/infrastructure/persistence/entities/factory.orm-entity"
import { IntegrationEndpointOrmEntity } from "../../../../modules/cfg/infrastructure/persistence/entities/integration-endpoint.orm-entity"
import { TeamOrmEntity } from "../../../../modules/cfg/infrastructure/persistence/entities/team.orm-entity"
import { GateStationOrmEntity } from "../../../../modules/gate/infrastructure/persistence/entities/gate-station.orm-entity"
import { StationCredentialOrmEntity } from "../../../../modules/gate/infrastructure/persistence/entities/station-credential.orm-entity"
import { PermissionOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/permission.orm-entity"
import { RoleAssignmentOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/role-assignment.orm-entity"
import { RolePermissionOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/role-permission.orm-entity"
import { RoleOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/role.orm-entity"
import { UserOrmEntity } from "../../../../modules/iam/infrastructure/persistence/entities/user.orm-entity"
import { AccessGrantOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/access-grant.orm-entity"
import { EmployeeAssignmentOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/employee-assignment.orm-entity"
import { EmployeeOrmEntity } from "../../../../modules/eqr/infrastructure/persistence/entities/employee.orm-entity"

export const demoIds = {
  factories: { bd: "00000000-0000-4000-8000-000000000001", la: "00000000-0000-4000-8000-000000000002" },
  departments: { bdHr: "00000000-0000-4000-8000-000000000011", bdProd: "00000000-0000-4000-8000-000000000012", laOps: "00000000-0000-4000-8000-000000000013" },
  teams: { bdA: "00000000-0000-4000-8000-000000000021", laA: "00000000-0000-4000-8000-000000000022" },
  config: "00000000-0000-4000-8000-000000000031",
  endpoints: { tcs: "00000000-0000-4000-8000-000000000041", hrs: "00000000-0000-4000-8000-000000000042" },
  employees: ["00000000-0000-4000-8000-000000000101", "00000000-0000-4000-8000-000000000102", "00000000-0000-4000-8000-000000000103", "00000000-0000-4000-8000-000000000104", "00000000-0000-4000-8000-000000000105", "00000000-0000-4000-8000-000000000106"],
  users: ["00000000-0000-4000-8000-000000000201", "00000000-0000-4000-8000-000000000202", "00000000-0000-4000-8000-000000000203", "00000000-0000-4000-8000-000000000204", "00000000-0000-4000-8000-000000000205", "00000000-0000-4000-8000-000000000206"],
  roles: ["00000000-0000-4000-8000-000000000301", "00000000-0000-4000-8000-000000000302", "00000000-0000-4000-8000-000000000303", "00000000-0000-4000-8000-000000000304", "00000000-0000-4000-8000-000000000305", "00000000-0000-4000-8000-000000000306"],
  permissions: ["00000000-0000-4000-8000-000000000401", "00000000-0000-4000-8000-000000000402", "00000000-0000-4000-8000-000000000403"],
  stations: { bdIn: "00000000-0000-4000-8000-000000000501", bdOut: "00000000-0000-4000-8000-000000000502", laIn: "00000000-0000-4000-8000-000000000503", laOut: "00000000-0000-4000-8000-000000000504" },
  credentials: ["00000000-0000-4000-8000-000000000601", "00000000-0000-4000-8000-000000000602", "00000000-0000-4000-8000-000000000603", "00000000-0000-4000-8000-000000000604"],
} as const

function requiredSecret(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}; refusing to seed demo credentials without an environment secret.`)
  return value
}

function hashSecret(secret: string): string {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString("hex")}$${scryptSync(secret, salt, 64).toString("hex")}`
}

export async function seedDemoData(manager: EntityManager): Promise<void> {
  const passwordHash = hashSecret(requiredSecret("DEMO_PASSWORD"))
  const stationSecretHash = hashSecret(requiredSecret("DEMO_STATION_SECRET"))
  const now = new Date()
  const validFrom = new Date("2026-01-01T00:00:00.000Z")

  await manager.getRepository(FactoryOrmEntity).upsert([
    { id: demoIds.factories.bd, code: "BD", name: "Nhà máy Bình Dương", timezone: "Asia/Ho_Chi_Minh", status: "ACTIVE" },
    { id: demoIds.factories.la, code: "LA", name: "Nhà máy Long An", timezone: "Asia/Ho_Chi_Minh", status: "ACTIVE" },
  ], ["id"])
  await manager.getRepository(DepartmentOrmEntity).upsert([
    { id: demoIds.departments.bdHr, factoryId: demoIds.factories.bd, code: "HR", name: "Nhân sự", isActive: true },
    { id: demoIds.departments.bdProd, factoryId: demoIds.factories.bd, code: "PROD", name: "Sản xuất", isActive: true },
    { id: demoIds.departments.laOps, factoryId: demoIds.factories.la, code: "OPS", name: "Vận hành", isActive: true },
  ], ["id"])
  await manager.getRepository(TeamOrmEntity).upsert([
    { id: demoIds.teams.bdA, departmentId: demoIds.departments.bdProd, code: "A", name: "Tổ sản xuất A", isActive: true },
    { id: demoIds.teams.laA, departmentId: demoIds.departments.laOps, code: "A", name: "Tổ vận hành A", isActive: true },
  ], ["id"])
  const configPayload = { decisionDeadlineMs: 2000, directions: ["IN", "OUT"] } as JsonValue
  await manager.query(
    `INSERT INTO "config_versions" ("id", "config_key", "version", "payload", "supersedes_id", "effective_from", "created_by_user_id")
     VALUES ($1, $2, $3, $4::jsonb, NULL, $5, NULL)
     ON CONFLICT ("id") DO UPDATE SET "payload" = EXCLUDED."payload", "effective_from" = EXCLUDED."effective_from"`,
    [demoIds.config, "gate.access.default", 1, JSON.stringify(configPayload), validFrom],
  )
  await manager.getRepository(IntegrationEndpointOrmEntity).upsert([
    { id: demoIds.endpoints.tcs, code: "TCS-DEMO", providerType: "TCS", factoryId: null, baseUrl: process.env.TCS_BASE_URL ?? "http://localhost:4001", authSecretRef: "TCS_STATION_SECRET", requestTimeoutMs: 1500, contractVersion: "v1", configVersionId: demoIds.config, isEnabled: true },
    { id: demoIds.endpoints.hrs, code: "HRS-DEMO", providerType: "HRS", factoryId: null, baseUrl: process.env.HRS_BASE_URL ?? "http://localhost:4002", authSecretRef: "HRS_SERVICE_SECRET", requestTimeoutMs: 2000, contractVersion: "v1", configVersionId: demoIds.config, isEnabled: true },
  ], ["id"])
  await manager.getRepository(EmployeeOrmEntity).upsert([
    { id: demoIds.employees[0], employeeCode: "TMC0001", externalHrId: "HR-DEMO-0001", fullName: "Nguyễn Minh Anh", email: "demo.emp@example.invalid", status: "ACTIVE", deactivatedAt: null },
    { id: demoIds.employees[1], employeeCode: "TMC0002", externalHrId: "HR-DEMO-0002", fullName: "Trần Hoàng Nam", email: "demo.hr@example.invalid", status: "ACTIVE", deactivatedAt: null },
    { id: demoIds.employees[2], employeeCode: "TMC0003", externalHrId: "HR-DEMO-0003", fullName: "Lê Thị Ngọc", email: "demo.revoked@example.invalid", status: "REVOKED", deactivatedAt: now },
    { id: demoIds.employees[3], employeeCode: "TMC0004", externalHrId: "HR-DEMO-0004", fullName: "Phạm Quốc Huy", email: "demo.inactive@example.invalid", status: "INACTIVE", deactivatedAt: now },
    { id: demoIds.employees[4], employeeCode: "TMC0005", externalHrId: "HR-DEMO-0005", fullName: "Võ Thanh Hà", email: "demo.admin@example.invalid", status: "ACTIVE", deactivatedAt: null },
    { id: demoIds.employees[5], employeeCode: "TMC0006", externalHrId: "HR-DEMO-0006", fullName: "Đặng Tuấn Kiệt", email: "demo.executor@example.invalid", status: "ACTIVE", deactivatedAt: null },
  ], ["id"])
  await manager.getRepository(RoleOrmEntity).upsert(["EMP", "HR", "SUP", "SEC", "ADM", "EXE"].map((code, index) => ({
    id: demoIds.roles[index], code, name: code, description: `Demo role ${code}`, isActive: true,
  })), ["id"])
  await manager.getRepository(PermissionOrmEntity).upsert([
    { id: demoIds.permissions[0], code: "attendance:read", name: "Read attendance", description: null },
    { id: demoIds.permissions[1], code: "access:decide", name: "Decide access", description: null },
    { id: demoIds.permissions[2], code: "iam:manage", name: "Manage identity", description: null },
  ], ["id"])
  await manager.getRepository(UserOrmEntity).upsert(demoIds.users.map((id, index) => ({
    id, employeeId: demoIds.employees[Math.min(index, demoIds.employees.length - 1)], username: ["emp.demo", "hr.demo", "sup.demo", "sec.demo", "adm.demo", "exe.demo"][index],
    passwordHash, status: "ACTIVE", lastLoginAt: null,
  })), ["id"])
  await manager.getRepository(RolePermissionOrmEntity).upsert([
    { roleId: demoIds.roles[0], permissionId: demoIds.permissions[0] },
    { roleId: demoIds.roles[1], permissionId: demoIds.permissions[0] },
    { roleId: demoIds.roles[2], permissionId: demoIds.permissions[0] },
    { roleId: demoIds.roles[3], permissionId: demoIds.permissions[1] },
    { roleId: demoIds.roles[4], permissionId: demoIds.permissions[2] },
    { roleId: demoIds.roles[5], permissionId: demoIds.permissions[0] },
  ], ["roleId", "permissionId"])
  await manager.getRepository(RoleAssignmentOrmEntity).upsert(demoIds.users.map((userId, index) => ({
    id: `00000000-0000-4000-8000-${String(700 + index).padStart(12, "0")}`,
    userId, roleId: demoIds.roles[index], scopeType: index === 4 ? "GLOBAL" : "FACTORY",
    factoryId: index === 4 ? null : index === 5 ? demoIds.factories.la : demoIds.factories.bd,
    departmentId: null, teamId: null, validFrom, validTo: null, assignedByUserId: null, revokedAt: null, revokedByUserId: null, revokeReason: null,
  })), ["id"])
  await manager.getRepository(EmployeeAssignmentOrmEntity).upsert([
    { id: "00000000-0000-4000-8000-000000000801", employeeId: demoIds.employees[0], factoryId: demoIds.factories.bd, departmentId: demoIds.departments.bdProd, teamId: demoIds.teams.bdA, validFrom, validTo: null, assignedByUserId: demoIds.users[1] },
    { id: "00000000-0000-4000-8000-000000000802", employeeId: demoIds.employees[0], factoryId: demoIds.factories.la, departmentId: demoIds.departments.laOps, teamId: demoIds.teams.laA, validFrom, validTo: null, assignedByUserId: demoIds.users[1] },
    { id: "00000000-0000-4000-8000-000000000803", employeeId: demoIds.employees[1], factoryId: demoIds.factories.bd, departmentId: demoIds.departments.bdHr, teamId: null, validFrom, validTo: null, assignedByUserId: demoIds.users[1] },
    { id: "00000000-0000-4000-8000-000000000804", employeeId: demoIds.employees[2], factoryId: demoIds.factories.bd, departmentId: demoIds.departments.bdProd, teamId: demoIds.teams.bdA, validFrom, validTo: null, assignedByUserId: demoIds.users[1] },
  ], ["id"])
  await manager.getRepository(AccessGrantOrmEntity).upsert([
    { id: "00000000-0000-4000-8000-000000000901", employeeId: demoIds.employees[0], factoryId: demoIds.factories.bd, validFrom, validTo: null, grantedByUserId: demoIds.users[1], grantReason: "Demo primary factory", revokedAt: null, revokedByUserId: null, revokeReason: null },
    { id: "00000000-0000-4000-8000-000000000902", employeeId: demoIds.employees[0], factoryId: demoIds.factories.la, validFrom, validTo: null, grantedByUserId: demoIds.users[1], grantReason: "Demo cross-factory grant", revokedAt: null, revokedByUserId: null, revokeReason: null },
    { id: "00000000-0000-4000-8000-000000000903", employeeId: demoIds.employees[2], factoryId: demoIds.factories.bd, validFrom, validTo: null, grantedByUserId: demoIds.users[1], grantReason: "Demo revoked grant", revokedAt: now, revokedByUserId: demoIds.users[1], revokeReason: "Negative test fixture" },
  ], ["id"])
  await manager.getRepository(GateStationOrmEntity).upsert([
    { id: demoIds.stations.bdIn, factoryId: demoIds.factories.bd, integrationEndpointId: demoIds.endpoints.tcs, configVersionId: demoIds.config, code: "BD-IN", direction: "IN", turnstileId: "BD-TURNSTILE-IN", status: "ACTIVE", lastSeenAt: now },
    { id: demoIds.stations.bdOut, factoryId: demoIds.factories.bd, integrationEndpointId: demoIds.endpoints.tcs, configVersionId: demoIds.config, code: "BD-OUT", direction: "OUT", turnstileId: "BD-TURNSTILE-OUT", status: "ACTIVE", lastSeenAt: now },
    { id: demoIds.stations.laIn, factoryId: demoIds.factories.la, integrationEndpointId: demoIds.endpoints.tcs, configVersionId: demoIds.config, code: "LA-IN", direction: "IN", turnstileId: "LA-TURNSTILE-IN", status: "ACTIVE", lastSeenAt: now },
    { id: demoIds.stations.laOut, factoryId: demoIds.factories.la, integrationEndpointId: demoIds.endpoints.tcs, configVersionId: demoIds.config, code: "LA-OUT", direction: "OUT", turnstileId: "LA-TURNSTILE-OUT", status: "ACTIVE", lastSeenAt: now },
  ], ["id"])
  await manager.getRepository(StationCredentialOrmEntity).upsert(demoIds.credentials.map((id, index) => ({
    id, stationId: Object.values(demoIds.stations)[index], secretHash: stationSecretHash, expiresAt: null, revokedAt: null, issuedByUserId: demoIds.users[4], revokedByUserId: null, revokeReason: null,
  })), ["id"])
}

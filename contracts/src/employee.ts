import type { Uuid } from "./common"
export type EmployeeSummary = { id: Uuid; employeeCode: string; fullName: string; status: "ACTIVE" | "INACTIVE" | string }
export interface EmployeeProfile extends EmployeeSummary {
  externalHrId: string; email: string | null; rowVersion: number; deactivatedAt: string | null;
  factoryId: string | null; departmentId: string | null; teamId: string | null;
}
export interface EmployeeAssignment {
  id: string; employeeId: string; factoryId: string; departmentId: string | null; teamId: string | null;
  validFrom: string; validTo: string | null; assignedByUserId: string | null;
}
export interface EmployeeAccessGrant {
  id: string; employeeId: string; factoryId: string; validFrom: string; validTo: string | null;
  rowVersion: number; grantReason: string; revokedAt: string | null; revokeReason: string | null;
}
export interface EmployeeDetail extends EmployeeProfile { assignments: EmployeeAssignment[]; accessGrants: EmployeeAccessGrant[] }
export interface EmployeePage { items: EmployeeProfile[]; total: number; page: number; pageSize: number }
export interface CreateEmployeeRequest { employeeCode?: string; generateEmployeeCode?: boolean; externalHrId: string; fullName: string; email?: string | null; factoryId: string; departmentId?: string | null; teamId?: string | null }
export interface EmployeeCodeSuggestion { employeeCode: string; prefix: string; suggested: true }
export interface ImportEmployeesRequest { rows: CreateEmployeeRequest[] }
export interface ImportEmployeesResult { imported: number; items: Array<Pick<EmployeeProfile,"id"|"employeeCode"|"externalHrId"|"fullName">> }
export interface UpdateEmployeeRequest { expectedVersion: number; fullName?: string; externalHrId?: string; email?: string | null }
export interface EmployeeStatusRequest { expectedVersion: number; status: "ACTIVE" | "INACTIVE"; reason: string }
export interface AssignEmployeeRequest { factoryId: string; departmentId?: string | null; teamId?: string | null; validFrom: string; validTo?: string | null; reason: string }
export interface GrantEmployeeAccessRequest { factoryId: string; validFrom: string; validTo?: string | null; reason: string }

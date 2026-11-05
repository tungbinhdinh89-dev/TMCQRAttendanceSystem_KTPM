import type { Account, Database, Role } from "../data/types"
export const roleLabels: Record<Role, string> = {
  SYSTEM_ADMIN: "Quản trị hệ thống",
  HR_MANAGER: "Quản lý nhân sự",
  SECURITY_MANAGER: "Quản lý an ninh",
  GATE_OPERATOR: "Nhân viên bảo vệ",
  DEPARTMENT_MANAGER: "Quản lý bộ phận",
  EMPLOYEE: "Nhân viên",
  EXECUTIVE: "Ban điều hành",
}
const modules: Record<Role, string[]> = {
  SYSTEM_ADMIN: [
    "tong-quan",
    "kiem-soat",
    "cai-dat",
  ],
  HR_MANAGER: ["tong-quan", "nhan-su", "cham-cong", "ca-lam", "bao-cao"],
  SECURITY_MANAGER: ["tong-quan", "kiem-soat", "bao-cao", "kiosk"],
  GATE_OPERATOR: ["kiem-soat", "kiosk"],
  DEPARTMENT_MANAGER: ["tong-quan", "cham-cong", "ca-lam", "bao-cao"],
  EMPLOYEE: ["mobile"],
  EXECUTIVE: ["tong-quan", "bao-cao"],
}
export const hasAccess = (role: Role, module: string) =>
  modules[role].includes(module)
export const canManage = (role: Role, resource: string) =>
  (
    {
      employees: ["HR_MANAGER"],
      attendance: ["HR_MANAGER"],
      shifts: ["HR_MANAGER"],
      gates: ["SYSTEM_ADMIN"],
      settings: ["SYSTEM_ADMIN"],
      override: ["SECURITY_MANAGER", "GATE_OPERATOR"],
    }[resource] ?? []
  ).includes(role)
export const homeFor = (role: Role) =>
  role === "EMPLOYEE"
    ? "/mobile/trang-chu"
    : role === "GATE_OPERATOR"
      ? "/app/kiem-soat"
      : "/app/tong-quan"
export const scopeEmployees = (db: Database, account: Account) =>
  db.employees.filter((employee) => {
    if (account.role === "EMPLOYEE") return employee.id === account.employeeId
    if (account.scopeType === "GLOBAL") return true
    if (account.scopeType === "SELF") return employee.id === account.employeeId
    if (account.scopeType === "TEAM") return Boolean(account.teamId) && employee.teamId === account.teamId
    if (account.scopeType === "DEPARTMENT") return Boolean(account.departmentId) && employee.departmentId === account.departmentId
    if (account.scopeType === "FACTORY") return Boolean(account.factoryId) && employee.factoryId === account.factoryId
    return false
  })

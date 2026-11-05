import type { Account, Database, Role } from "../data/types"
export const roleLabels: Record<Role, string> = {
  SYSTEM_ADMIN: "Quản trị hệ thống",
  HR_MANAGER: "Quản lý nhân sự",
  SECURITY_MANAGER: "Quản lý an ninh",
  GATE_OPERATOR: "Nhân viên bảo vệ",
  DEPARTMENT_MANAGER: "Quản lý bộ phận",
  EMPLOYEE: "Nhân viên",
}
const modules: Record<Role, string[]> = {
  SYSTEM_ADMIN: [
    "tong-quan",
    "nhan-su",
    "cham-cong",
    "kiem-soat",
    "ca-lam",
    "bao-cao",
    "cai-dat",
    "mobile",
    "kiosk",
  ],
  HR_MANAGER: ["tong-quan", "nhan-su", "cham-cong", "ca-lam", "bao-cao"],
  SECURITY_MANAGER: ["tong-quan", "nhan-su", "kiem-soat", "bao-cao", "kiosk"],
  GATE_OPERATOR: ["kiem-soat", "kiosk"],
  DEPARTMENT_MANAGER: ["tong-quan", "cham-cong", "ca-lam", "bao-cao"],
  EMPLOYEE: ["mobile"],
}
export const hasAccess = (role: Role, module: string) =>
  modules[role].includes(module)
export const canManage = (role: Role, resource: string) =>
  role === "SYSTEM_ADMIN" ||
  (
    {
      employees: ["HR_MANAGER"],
      attendance: ["HR_MANAGER", "DEPARTMENT_MANAGER"],
      shifts: ["HR_MANAGER"],
      gates: ["SECURITY_MANAGER"],
      settings: [],
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
  db.employees.filter((e) =>
    account.role === "EMPLOYEE"
      ? e.id === account.employeeId
      : account.role === "DEPARTMENT_MANAGER"
        ? e.department === account.department && e.site === account.site
        : account.role === "GATE_OPERATOR"
          ? e.site === account.site
          : true,
  )

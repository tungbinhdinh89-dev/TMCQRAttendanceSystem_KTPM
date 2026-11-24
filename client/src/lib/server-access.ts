export type AccessIdentity = {
  mustChangePassword?: boolean
  roles: Array<{ code: string; scopeType: string; factoryId?: string | null; departmentId?: string | null; teamId?: string | null; permissions: string[] }>
}
export type ManagementTab = "employees" | "organization" | "stations" | "integrations" | "readiness"
const scoped = (r: AccessIdentity["roles"][number]) => r.scopeType === "GLOBAL" || (r.scopeType === "FACTORY" && !!r.factoryId)
export const isHr = (u: AccessIdentity) => u.roles.some(r => r.code === "HR" && scoped(r))
export const isAdmin = (u: AccessIdentity) => u.roles.some(r => r.code === "ADM" && scoped(r) && r.permissions.includes("iam:manage"))
export const isSecurity = (u: AccessIdentity) => u.roles.some(r => r.code === "SEC" && scoped(r))
export const canUseScanner = (u: AccessIdentity) => u.roles.some(r => r.code === "SEC" && scoped(r) && r.permissions.includes("access:decide"))
export const canUsePersonalQr = (u: AccessIdentity) => u.roles.some(r => r.code === "EMP")
const attendanceScope = (r: AccessIdentity["roles"][number]) => scoped(r) || (r.scopeType === "DEPARTMENT" && !!r.factoryId && !!r.departmentId) || (r.scopeType === "TEAM" && !!r.factoryId && !!r.teamId)
export const canReadAttendance = (u: AccessIdentity) => u.roles.some(r => r.permissions.includes("attendance:read") && (r.code === "EMP" || r.code === "HR" && attendanceScope(r) || r.code === "SUP" && r.scopeType === "TEAM" && !!r.factoryId && !!r.teamId))
export const canReadGateHistory = (u: AccessIdentity) => u.roles.some(r => r.code === "SEC" && scoped(r) && r.permissions.includes("access:decide"))
export const canReadAttendanceSummary = (u: AccessIdentity) => u.roles.some(r => r.code === "EXE" && attendanceScope(r) && r.permissions.includes("attendance:read"))
export const canUseAudit = (u: AccessIdentity) => u.roles.some(r => scoped(r) && ["ADM", "HR", "SEC"].includes(r.code) && (r.permissions.includes("audit:read") || r.code === "ADM" && r.permissions.includes("iam:manage")))
export function managementTabs(u: AccessIdentity): ManagementTab[] {
  const hr = isHr(u), admin = isAdmin(u), security = isSecurity(u)
  return [hr && "employees", (hr || admin || security) && "organization", (admin || security) && "stations", admin && "integrations", (admin || security) && "readiness"].filter(Boolean) as ManagementTab[]
}
export function serverHome(u: AccessIdentity): string {
  const tabs = managementTabs(u)
  if (tabs.length) return `/management?tab=${tabs.includes("employees") ? "employees" : isSecurity(u) && !isAdmin(u) ? "stations" : tabs[0]}`
  if (canUsePersonalQr(u)) return "/qr"
  if (canReadAttendance(u)) return "/attendance"
  if (canReadAttendanceSummary(u)) return "/attendance-summary"
  if (canUseAudit(u)) return "/audit"
  return "/workspace"
}
export function canVisit(u: AccessIdentity, path: string, search = ""): boolean {
  if (u.mustChangePassword) return false
  if (path === "/workspace") return true
  if (path === "/qr" || path === "/mobile/ma-qr") return canUsePersonalQr(u)
  if (path === "/scanner") return canUseScanner(u)
  if (path === "/attendance") return canReadAttendance(u)
  if (path === "/gate-history") return canReadGateHistory(u)
  if (path === "/attendance-summary") return canReadAttendanceSummary(u)
  if (path === "/audit") return canUseAudit(u)
  if (/^\/management\/employees\/[^/]+$/.test(path)) return isHr(u)
  if (path === "/management") {
    const tabs = managementTabs(u), tab = new URLSearchParams(search).get("tab")
    return tab ? tabs.includes(tab as ManagementTab) : tabs.length > 0
  }
  return false
}

export type Role = "SYSTEM_ADMIN" | "HR_MANAGER" | "SECURITY_MANAGER" | "GATE_OPERATOR" | "DEPARTMENT_MANAGER" | "EMPLOYEE"
export type SiteId = "bd" | "la"
export const attendanceLabels = {
  "on-time": "Đúng giờ",
  late: "Đi muộn",
  absent: "Vắng mặt",
  leave: "Nghỉ phép",
}
export interface Employee {
  id: string
  code: string
  name: string
  department: string
  site: SiteId
  title: string
  status: "active" | "inactive"
  qrLocked: boolean
  shiftId: string
}
export interface Account {
  id: string
  name: string
  username: string
  role: Role
  employeeId: string
  site: SiteId
  department: string
}
export interface Shift {
  id: string
  name: string
  start: string
  end: string
  grace: number
}
export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  status: "on-time" | "late" | "absent" | "leave"
}
export interface AccessEvent {
  id: string
  employeeId: string
  time: string
  site: SiteId
  gate: string
  direction: "ENTRY" | "EXIT"
  allowed: boolean
  reason: string
  operator?: string
}
export interface Adjustment {
  id: string
  employeeId: string
  date: string
  reason: string
  checkIn: string
  checkOut: string
  status: "pending" | "approved" | "rejected"
}
export interface Notification {
  id: string
  employeeId: string
  title: string
  body: string
  time: string
  read: boolean
}
export interface Gate {
  id: string
  name: string
  site: SiteId
  online: boolean
}
export interface Database {
  version: 1
  employees: Employee[]
  accounts: Account[]
  shifts: Shift[]
  attendance: Attendance[]
  events: AccessEvent[]
  adjustments: Adjustment[]
  notifications: Notification[]
  gates: Gate[]
}
export const sites: Record<SiteId, string> = { bd: "Bình Dương", la: "Long An" }
export const departments = [
  "Sản xuất",
  "Kiểm soát chất lượng",
  "Kỹ thuật",
  "Kho vận",
  "Nhân sự",
]

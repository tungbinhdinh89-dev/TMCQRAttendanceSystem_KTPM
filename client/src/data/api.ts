import { z } from "zod"
import type { Database, Employee, Shift, Adjustment } from "./types"
const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
const person = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  department: z.string(),
  site: z.enum(["bd", "la", "unknown"]),
  title: z.string(),
  status: z.enum(["active", "inactive"]),
  qrLocked: z.boolean(),
  shiftId: z.string(),
  factoryId: z.string().nullish(), departmentId: z.string().nullish(), teamId: z.string().nullish(),
})
const schema = z.object({
  confirmedEvents: z.array(z.object({ id: z.string(), employeeId: z.string(), time: z.string(), direction: z.string() })).optional(),
  summary: z.object({ employees: z.number(), confirmedAttendance: z.number(), attempts: z.number() }).optional(),
  version: z.literal(1),
  employees: z.array(person),
  accounts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      username: z.string(),
      role: z.enum([
        "SYSTEM_ADMIN",
        "HR_MANAGER",
        "SECURITY_MANAGER",
        "GATE_OPERATOR",
        "DEPARTMENT_MANAGER",
        "EMPLOYEE", "EXECUTIVE",
      ]),
      employeeId: z.string(),
      site: z.enum(["bd", "la", "unknown"]),
      department: z.string(),
    }),
  ),
  shifts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      start: z.string(),
      end: z.string(),
      grace: z.number(),
    }),
  ),
  attendance: z.array(
    z.object({
      id: z.string(),
      employeeId: z.string(),
      date: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      status: z.enum(["on-time", "late", "absent", "leave"]),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      employeeId: z.string(),
      time: z.string(),
      site: z.enum(["bd", "la", "unknown"]),
      gate: z.string(),
      direction: z.enum(["ENTRY", "EXIT"]),
      allowed: z.boolean(),
      reason: z.string(),
      operator: z.string().optional(),
    }),
  ),
  adjustments: z.array(
    z.object({
      id: z.string(),
      employeeId: z.string(),
      date: z.string(),
      reason: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      status: z.enum(["pending", "approved", "rejected"]),
    }),
  ),
  notifications: z.array(
    z.object({
      id: z.string(),
      employeeId: z.string(),
      title: z.string(),
      body: z.string(),
      time: z.string(),
      read: z.boolean(),
    }),
  ),
  gates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      site: z.enum(["bd", "la", "unknown"]),
      online: z.boolean(),
    }),
  ),
})

export const emptyDatabase = (): Database => ({ version: 1, employees: [], accounts: [], shifts: [], attendance: [], events: [], adjustments: [], notifications: [], gates: [] })
const unavailable = async (): Promise<never> => { throw new Error("Chức năng này chưa có API. Không có thay đổi nào được lưu.") }
export const api = {
  async getDatabase(): Promise<Database> {
    const response = await fetch(`${baseUrl}/workspace/bootstrap`, { credentials: "include", cache: "no-store" })
    if (!response.ok) throw new Error(response.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "Không thể tải dữ liệu từ máy chủ.")
    return schema.parse((await response.json()).data)
  },
  saveEmployee: (_employee: Employee) => unavailable(),
  saveShift: (_shift: Shift) => unavailable(),
  assignShift: (_ids: string[], _shiftId: string) => unavailable(),
  requestAdjustment: (_input: Omit<Adjustment, "id" | "status">) => unavailable(),
  decideAdjustment: (_id: string, _status: "approved" | "rejected") => unavailable(),
  setGate: (_id: string, _online: boolean) => unavailable(),
  markNotifications: (_employeeId: string) => unavailable(),
}

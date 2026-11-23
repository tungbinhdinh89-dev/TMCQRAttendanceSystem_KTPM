import { z } from "zod"
import type {
  AccessEvent,
  Adjustment,
  Database,
  Employee,
  Shift,
  SiteId,
} from "./types"
import { seedDatabase } from "./seed"
import { dayOf, formatTime, minutes, today } from "../lib/date"
import { parseQr } from "../lib/qr"
const KEY = "tmc-access-db:v1"
const person = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  department: z.string(),
  site: z.enum(["bd", "la"]),
  title: z.string(),
  status: z.enum(["active", "inactive"]),
  qrLocked: z.boolean(),
  shiftId: z.string(),
})
const schema = z.object({
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
        "EMPLOYEE",
      ]),
      employeeId: z.string(),
      site: z.enum(["bd", "la"]),
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
      site: z.enum(["bd", "la"]),
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
      site: z.enum(["bd", "la"]),
      online: z.boolean(),
    }),
  ),
})
function read(): Database {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return schema.parse(JSON.parse(raw))
  } catch {
    sessionStorage.setItem("tmc-recovered", "true")
  }
  const db = seedDatabase()
  write(db)
  return db
}
function write(db: Database) {
  localStorage.setItem(KEY, JSON.stringify(db))
}
const delay = () => new Promise((resolve) => setTimeout(resolve, 100))
async function mutate(fn: (db: Database) => void) {
  await delay()
  const db = read()
  fn(db)
  write(db)
}
export const api = {
  saveEmployee: (employee: Employee) =>
    mutate((db) => {
      const index = db.employees.findIndex((e) => e.id === employee.id)
      if (
        db.employees.some(
          (e) => e.code === employee.code && e.id !== employee.id,
        )
      )
        throw new Error("Mã nhân viên đã tồn tại")
      if (index >= 0) db.employees[index] = employee
      else db.employees.push(employee)
    }),
  saveShift: (shift: Shift) =>
    mutate((db) => {
      const index = db.shifts.findIndex((s) => s.id === shift.id)
      if (index >= 0) db.shifts[index] = shift
      else db.shifts.push(shift)
    }),
  assignShift: (ids: string[], shiftId: string) =>
    mutate((db) => {
      db.employees.forEach((e) => {
        if (ids.includes(e.id)) e.shiftId = shiftId
      })
    }),
  requestAdjustment: (input: Omit<Adjustment, "id" | "status">) =>
    mutate((db) => {
      db.adjustments.push({
        ...input,
        id: crypto.randomUUID(),
        status: "pending",
      })
    }),
  decideAdjustment: (id: string, status: "approved" | "rejected") =>
    mutate((db) => {
      const request = db.adjustments.find((a) => a.id === id)
      if (!request || request.status !== "pending")
        throw new Error("Đề nghị này đã được xử lý")
      request.status = status
      if (status === "approved") {
        const record = db.attendance.find(
          (a) => a.employeeId === request.employeeId && a.date === request.date,
        )
        const employee = db.employees.find((e) => e.id === request.employeeId)!
        const shift = db.shifts.find((s) => s.id === employee.shiftId)!
        const data = {
          checkIn: request.checkIn,
          checkOut: request.checkOut,
          status:
            minutes(request.checkIn) > minutes(shift.start) + shift.grace
              ? "late" as const
              : "on-time" as const,
        }
        if (record) Object.assign(record, data)
        else
          db.attendance.push({
            id: crypto.randomUUID(),
            employeeId: request.employeeId,
            date: request.date,
            ...data,
          })
        db.notifications.push({
          id: crypto.randomUUID(),
          employeeId: request.employeeId,
          title: "Đề nghị đã được duyệt",
          body: `Giờ công ngày ${request.date} đã được cập nhật.`,
          time: new Date().toISOString(),
          read: false,
        })
      }
    }),
  setGate: (id: string, online: boolean) =>
    mutate((db) => {
      const gate = db.gates.find((g) => g.id === id)
      if (gate) gate.online = online
    }),
  markNotifications: (id: string) =>
    mutate((db) => {
      db.notifications
        .filter((n) => n.employeeId === id)
        .forEach((n) => {
          n.read = true
        })
    }),
  async reset() {
    await delay()
    write(seedDatabase())
  },
  async scan(
    payload: string,
    site: SiteId,
    gate: string,
    operator?: string,
    overrideReason?: string,
  ) {
    await delay()
    const db = read()
    let employee: Employee | undefined
    let reason = "",
      allowed = false
    try {
      const qr = parseQr(payload)
      employee = db.employees.find((e) => e.id === qr.employeeId)
      if (!employee) throw new Error("Không tìm thấy nhân viên")
      if (overrideReason && overrideReason.trim().length >= 5) {
        allowed = true
        reason = `Xác nhận thủ công: ${overrideReason}`
      } else {
        if (qr.expiresAt <= Date.now()) throw new Error("Mã QR đã hết hạn")
        if (employee.status !== "active")
          throw new Error("Nhân viên đã ngừng hoạt động")
        if (employee.qrLocked) throw new Error("Mã QR đã bị khóa")
        if (employee.site !== site)
          throw new Error("Không có quyền vào nhà máy này")
        if (
          db.events.some(
            (e) =>
              e.employeeId === employee!.id &&
              e.allowed &&
              Date.now() - new Date(e.time).getTime() < 30000 &&
              new Date(e.time).getTime() <= Date.now(),
          )
        )
          throw new Error("Vừa quét mã — vui lòng đợi 30 giây")
        const device = db.gates.find((g) => g.id === gate && g.site === site)
        if (!device || !device.online)
          throw new Error("Thiết bị tại cổng đang ngoại tuyến")
        allowed = true
        reason = "Mã QR hợp lệ"
      }
    } catch (error) {
      reason = error instanceof Error ? error.message : "Không thể đọc mã QR"
    }
    const shift = db.shifts.find((s) => s.id === employee?.shiftId)
    const time = formatTime(new Date().toISOString()).slice(0, 5)
    const workDate =
      shift && shift.end < shift.start && minutes(time) < 720
        ? dayOf(new Date(Date.now() - 86400000).toISOString())
        : today()
    const workStart = new Date(`${workDate}T00:00:00+07:00`).getTime()
    const previous = db.events
      .filter(
        (e) =>
          e.employeeId === employee?.id &&
          e.allowed &&
          new Date(e.time).getTime() >= workStart &&
          new Date(e.time).getTime() <= Date.now(),
      )
      .sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      )[0]
    const direction =
      previous?.direction === "ENTRY" ? "EXIT" as const : "ENTRY" as const
    const event: AccessEvent = {
      id: crypto.randomUUID(),
      employeeId: employee?.id ?? "",
      time: new Date().toISOString(),
      site,
      gate,
      direction,
      allowed,
      reason,
      operator,
    }
    db.events.push(event)
    if (allowed && employee) {
      let attendance = db.attendance.find(
        (a) => a.employeeId === employee!.id && a.date === workDate,
      )
      if (!attendance) {
        attendance = {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          date: workDate,
          checkIn: "",
          checkOut: "",
          status: "on-time",
        }
        db.attendance.push(attendance)
      }
      if (direction === "ENTRY" && !attendance.checkIn) {
        attendance.checkIn = time
        attendance.status =
          shift && minutes(time) > minutes(shift.start) + shift.grace
            ? "late"
            : "on-time"
      }
      if (direction === "EXIT") attendance.checkOut = time
    }
    write(db)
    return { allowed, reason, event, employee }
  },
}

import type { GateDirection } from "./gate"
export interface ScannerStation { id: string; code: string; factoryId: string; factoryName: string; direction: GateDirection }
export interface WebScanRequest { eventId: string; token: string }
export interface WebScanResult {
  eventId: string
  attemptId: string
  mode: "CLASSROOM_DEMO"
  direction: GateDirection
  decision: "ALLOW" | "DENIED"
  reasonCode: string | null
  attendanceState: "RECORDED" | "NOT_RECORDED" | "ALREADY_RECORDED"
  attendanceEventId: string | null
  occurredAt: string
  duplicate: boolean
  employee: { employeeCode: string; fullName: string } | null
}

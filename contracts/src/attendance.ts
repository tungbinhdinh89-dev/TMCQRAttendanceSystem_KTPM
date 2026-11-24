import type { GateDirection } from "./gate"
import type { IsoDateTime, Uuid } from "./common"

export type AttendanceEventResponse = {
  id: Uuid
  employeeId: Uuid
  sourceType: "GATE" | "MANUAL" | "DEMO"
  sourceId: string
  occurredAt: IsoDateTime
  direction: GateDirection
  activityFactoryId: Uuid
  revisionNo: number
  isVoided: boolean
}

export interface AttendanceHistoryQuery {
  from?: string; to?: string; page?: number; pageSize?: number
  factoryId?: string; stationId?: string; employeeId?: string; direction?: "IN" | "OUT"
}
export interface HistoryPage<T> { items: T[]; page: number; pageSize: number; total: number }
export interface AttendanceHistoryItem {
  id: string; employeeId: string; employeeCode: string; fullName: string
  occurredAt: string; direction: "IN" | "OUT"; factoryId: string; factoryName: string
  stationId: string | null; stationCode: string | null; sourceType: string; evidenceType: string
  revisionNo: number; isVoided: boolean; correlationId: string | null; attemptId: string | null
}
export type AttendanceHistoryPage = HistoryPage<AttendanceHistoryItem>
export interface AttendanceSummaryItem {
  day: string; factoryId: string; factoryName: string; inCount: number; outCount: number
  eventCount: number; employeeCount: number; demoCount: number
}
export interface AttendanceSummaryPage extends HistoryPage<AttendanceSummaryItem> { from: string; to: string }
export interface GateHistoryItem {
  id: string; eventId: string; occurredAt: string; direction: "IN" | "OUT"
  factoryId: string; factoryName: string; stationId: string; stationCode: string
  decision: string; reasonCode: string | null; sourceKind: string
  employeeCode: string | null; fullName: string | null
  attendanceState: "RECORDED" | "NOT_RECORDED"; attendanceEventId: string | null
  correlationId: string; commandState: string | null; evidenceType: string | null
}
export type GateHistoryPage = HistoryPage<GateHistoryItem>

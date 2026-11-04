import type { Uuid } from "./common"

export type GateDirection = "IN" | "OUT"
export type GateDecision = "PENDING" | "ALLOW" | "DENIED"
export type GateCommandState =
  | "PREPARED"
  | "DISPATCHING"
  | "ACKNOWLEDGED"
  | "CONFIRMED"
  | "REJECTED"
  | "UNKNOWN"
  | "EXPIRED"
  | "CANCELLED"

export type SubmitQrScanRequest = {
  eventId: Uuid
  token: string
}

export type GateAttemptResponse = {
  eventId: Uuid
  decision: GateDecision
  commandState: GateCommandState | string
  attendanceState: "NOT_CREATED" | "PROVISIONAL" | "CONFIRMED"
  reasonCode: string | null
  correlationId: Uuid
}

export interface GateAttempt {
  eventId: string
  decision: "ALLOW" | "DENIED"
  commandState: string
  attendanceState: "NOT_CREATED" | "PROVISIONAL" | "CONFIRMED"
  reasonCode: string
  correlationId: string
}
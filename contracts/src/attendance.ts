import type { GateDirection } from "./gate"
import type { IsoDateTime, Uuid } from "./common"

export type AttendanceEventResponse = {
  id: Uuid
  employeeId: Uuid
  sourceType: "GATE" | "MANUAL"
  sourceId: string
  occurredAt: IsoDateTime
  direction: GateDirection
  activityFactoryId: Uuid
  revisionNo: number
  isVoided: boolean
}

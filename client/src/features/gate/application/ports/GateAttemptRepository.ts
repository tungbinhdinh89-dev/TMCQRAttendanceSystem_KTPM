import type { GateAttempt } from "../../domain/models/GateAttempt"
import type { SubmitQrScanInput } from "../models/SubmitQrScanInput"

export interface GateAttemptRepository {
  submit(input: SubmitQrScanInput): Promise<GateAttempt>
  findByEventId(eventId: string): Promise<GateAttempt | null>
}
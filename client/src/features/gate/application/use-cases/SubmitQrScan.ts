import type { GateAttempt } from "../../domain/models/GateAttempt"
import type { GateAttemptRepository } from "../ports/GateAttemptRepository"
import type { SubmitQrScanInput } from "../models/SubmitQrScanInput"

export class SubmitQrScan {
  constructor(private readonly repository: GateAttemptRepository) {}

  execute(input: SubmitQrScanInput): Promise<GateAttempt> {
    if (!input.eventId || !input.token.trim()) {
      throw new Error("Thieu eventId hoac du lieu QR.")
    }
    return this.repository.submit(input)
  }
}
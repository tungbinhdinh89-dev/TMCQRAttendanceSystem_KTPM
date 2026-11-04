import type { GateAttemptRepository } from "../../application/ports/GateAttemptRepository"
import type { SubmitQrScanInput } from "../../application/models/SubmitQrScanInput"
import type { GateAttempt } from "../../domain/models/GateAttempt"

export class HttpGateAttemptRepository implements GateAttemptRepository {
  constructor(private readonly baseUrl: string) {}

  async submit(input: SubmitQrScanInput): Promise<GateAttempt> {
    const response = await fetch(`${this.baseUrl}/kiosk/access-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!response.ok) throw new Error("Khong the gui yeu cau quet QR.")
    return response.json() as Promise<GateAttempt>
  }

  async findByEventId(eventId: string): Promise<GateAttempt | null> {
    const response = await fetch(`${this.baseUrl}/kiosk/access-attempts/${eventId}`)
    if (response.status === 404) return null
    if (!response.ok) throw new Error("Khong the tai trang thai luot quet.")
    return response.json() as Promise<GateAttempt>
  }
}
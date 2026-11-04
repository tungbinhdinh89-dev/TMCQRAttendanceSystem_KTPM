export interface OpenGateRequest {
  commandId: string
  turnstileId: string
  deadlineAt: Date
}

export type OpenGateResult =
  | { kind: "OPEN_CONFIRMED"; vendorRef?: string }
  | { kind: "OPEN_REJECTED"; reason: string }
  | { kind: "UNKNOWN"; reason: string }

export interface TurnstileGateway {
  open(request: OpenGateRequest): Promise<OpenGateResult>
}
import type { JsonValue } from "@tmc/contracts"
import type { EntityManager } from "typeorm"
export interface AuditEvent {
  actorType: "USER" | "STATION" | "SYSTEM" | "ANONYMOUS";
  actorUserId?: string | null; actorStationId?: string | null; factoryId?: string | null;
  action: string; objectType: string; objectId: string;
  outcome: "SUCCESS" | "FAILURE" | "DENIED"; reason?: string | null;
  beforeData?: JsonValue | null; afterData?: JsonValue | null; correlationId?: string;
}
export interface AuditPort {
  write(event: AuditEvent, manager?: EntityManager): Promise<void>
}

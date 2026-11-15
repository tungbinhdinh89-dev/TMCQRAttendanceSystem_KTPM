import type { JsonValue, PageResponse } from "./common"
export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED"
export interface AuditEntry {
  id: string; createdAt: string; actorType: string; actorUserId: string | null;
  actorStationId: string | null; factoryId: string | null; action: string; objectType: string;
  objectId: string; outcome: string; reason: string | null; beforeData: JsonValue | null;
  afterData: JsonValue | null; correlationId: string;
}
export type AuditPage = PageResponse<AuditEntry>
export interface AuditQuery {
  page?: number; pageSize?: number; action?: string; outcome?: AuditOutcome;
  objectType?: string; objectId?: string; correlationId?: string; factoryId?: string;
  from?: string; to?: string;
}

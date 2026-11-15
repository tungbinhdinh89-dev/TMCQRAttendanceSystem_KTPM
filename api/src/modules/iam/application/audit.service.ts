import { randomUUID } from "node:crypto"
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common"
import type { AuditEntry, AuditPage, AuditQuery, JsonValue } from "@tmc/contracts"
import type { DataSource, EntityManager } from "typeorm"
import { AuditEntryOrmEntity } from "../infrastructure/persistence/entities/audit-entry.orm-entity"
import type { AuditEvent, AuditPort } from "./ports/audit.port"

export type AuditIdentity = { userId: string; roles: Array<{ code: string; scopeType: string; factoryId: string | null; permissions: string[] }> }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const secretKey = /password|token|secret|cookie|authorization|privatekey|credential|session|signingkey|apikey|qrpayload|qrdata|qrcode|hash/i
export function redactAuditData(value: unknown, depth = 0): JsonValue {
  if (depth > 12) return "[REDACTED]"
  if (value == null || typeof value === "boolean") return value as null | boolean
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    if (uuid.test(value)) return value
    if (/-----BEGIN|bearer\s|(?:password|token|secret)\s*[=:]|^[A-Za-z0-9_\-]{32,}$|^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/i.test(value)) return "[REDACTED]"
    return value.slice(0, 1000)
  }
  if (Array.isArray(value)) return value.slice(0,100).map(v => redactAuditData(v,depth+1))
  if (typeof value === "object") {
    const output: Record<string, JsonValue> = Object.create(null)
    for (const [key, v] of Object.entries(value).slice(0,100)) {
      output[key] = secretKey.test(key.replace(/[^a-z0-9]/gi,"")) ? "[REDACTED]" : redactAuditData(v,depth+1)
    }
    return output
  }
  return "[REDACTED]"
}
export function auditScope(identity: AuditIdentity): { global: boolean; factoryIds: string[] } {
  const grants = identity.roles.filter(r =>
    (["ADM", "HR", "SEC"].includes(r.code)) &&
    (r.permissions.includes("audit:read") || (r.code === "ADM" && r.permissions.includes("iam:manage"))))
  const global = grants.some(r => r.scopeType === "GLOBAL")
  const factoryIds = [...new Set(grants.filter(r => r.scopeType === "FACTORY" && r.factoryId && uuid.test(r.factoryId)).map(r => r.factoryId!))]
  if (!global && !factoryIds.length) throw new ForbiddenException({ code:"AUDIT_FORBIDDEN", message:"Audit access is not permitted in this scope" })
  return { global, factoryIds }
}
export function validateAuditQuery(input: Record<string, unknown>): Required<Pick<AuditQuery,"page"|"pageSize">> & AuditQuery {
  const out: Record<string, unknown> = {}
  const bad = () => { throw new BadRequestException({ code:"AUDIT_INVALID_QUERY",message:"Invalid audit query" }) }
  for (const key of Object.keys(input)) if (!["page","pageSize","action","outcome","objectType","objectId","correlationId","factoryId","from","to"].includes(key)) bad()
  for (const [key, fallback, max] of [["page",1,100000],["pageSize",25,100]] as const) {
    const value=input[key] ?? fallback
    if ((typeof value !== "number" && typeof value !== "string") || !/^\d+$/.test(String(value))) bad()
    const parsed=Number(value); if (!Number.isSafeInteger(parsed) || parsed<1 || parsed>max) bad()
    out[key]=parsed
  }
  for (const key of ["action","objectType","objectId","correlationId","factoryId","outcome","from","to"]) {
    const value=input[key]; if (value === undefined || value === "") continue
    if (typeof value !== "string" || value.length>200) bad()
    const s=value as string
    if (["factoryId","correlationId"].includes(key) && !uuid.test(s)) bad()
    if (key === "outcome" && !["SUCCESS","FAILURE","DENIED"].includes(s)) bad()
    if (["from","to"].includes(key) && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(s) || !Number.isFinite(Date.parse(s)))) bad()
    if (["from","to"].includes(key)) {
      const [year,month,day]=s.slice(0,10).split("-").map(Number)
      if (month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate()) bad()
      const [hour,minute,second]=s.slice(11,19).split(":").map(Number)
      if (hour>23 || minute>59 || second>59) bad()
    }
    out[key]=s
  }
  if (out.from && out.to && Date.parse(out.from as string)>Date.parse(out.to as string)) bad()
  return out as unknown as Required<Pick<AuditQuery,"page"|"pageSize">> & AuditQuery
}
@Injectable()
export class AuditService implements AuditPort {
  constructor(private readonly dataSource: DataSource) {}
  async write(event: AuditEvent, manager: EntityManager = this.dataSource.manager): Promise<void> {
    if (!["USER","STATION","SYSTEM","ANONYMOUS"].includes(event.actorType) ||
      !["SUCCESS","FAILURE","DENIED"].includes(event.outcome) ||
      !/^[A-Z][A-Z0-9_.:-]{0,99}$/.test(event.action) ||
      !/^[A-Z][A-Z0-9_:-]{0,63}$/.test(event.objectType) ||
      typeof event.objectId !== "string" || !event.objectId || event.objectId.length > 200 ||
      [event.actorUserId,event.actorStationId,event.factoryId,event.correlationId].some(value => value != null && !uuid.test(value))) {
      throw new BadRequestException({code:"AUDIT_INVALID_EVENT",message:"Invalid audit event"})
    }
    const repository=manager.getRepository(AuditEntryOrmEntity)
    const entry=repository.create({ id:randomUUID(), actorType:event.actorType,
      actorUserId:event.actorUserId ?? null, actorStationId:event.actorStationId ?? null,
      factoryId:event.factoryId ?? null, action:event.action, objectType:event.objectType,
      objectId:String(redactAuditData(event.objectId)), outcome:event.outcome,
      reason:event.reason ? String(redactAuditData(event.reason)) : null,
      beforeData:redactAuditData(event.beforeData),afterData:redactAuditData(event.afterData),
      correlationId:event.correlationId ?? randomUUID() })
    await repository.save(entry)
  }
  async transaction<T>(event: AuditEvent, work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async manager => {
      const result=await work(manager)
      await this.write(event,manager)
      return result
    })
  }
  async search(identity: AuditIdentity, input: Record<string, unknown> = {}): Promise<AuditPage> {
    let scope: ReturnType<typeof auditScope>
    try { scope=auditScope(identity) } catch (error) {
      await this.write({actorType:"USER",actorUserId:identity.userId,action:"AUDIT_READ",objectType:"AUDIT",objectId:"collection",outcome:"DENIED",reason:"OUTSIDE_AUDIT_SCOPE"})
      throw error
    }
    let query: ReturnType<typeof validateAuditQuery>
    try { query=validateAuditQuery(input) } catch (error) {
      await this.write({actorType:"USER",actorUserId:identity.userId,action:"AUDIT_READ",objectType:"AUDIT",objectId:"collection",outcome:"FAILURE",reason:"INVALID_QUERY"})
      throw error
    }
    if (query.factoryId && !scope.global && !scope.factoryIds.includes(query.factoryId)) {
      await this.write({actorType:"USER",actorUserId:identity.userId,action:"AUDIT_READ",objectType:"AUDIT",objectId:"collection",outcome:"DENIED",reason:"OUTSIDE_FACTORY_SCOPE"})
      throw new ForbiddenException({code:"AUDIT_FORBIDDEN",message:"Factory is outside assigned scope"})
    }
    const qb=this.dataSource.getRepository(AuditEntryOrmEntity).createQueryBuilder("audit")
    if (!scope.global) qb.where("audit.factory_id IN (:...scopeFactoryIds)",{scopeFactoryIds:scope.factoryIds})
    else qb.where("1=1")
    for (const [key,column] of [["action","action"],["outcome","outcome"],["objectType","object_type"],["objectId","object_id"],["factoryId","factory_id"],["correlationId","correlation_id"]] as const) {
      if (query[key]) qb.andWhere(`audit.${column} = :${key}`,{[key]:query[key]})
    }
    if (query.from) qb.andWhere("audit.created_at >= :from",{from:query.from})
    if (query.to) qb.andWhere("audit.created_at <= :to",{to:query.to})
    const [entries,total]=await qb.orderBy("audit.created_at","DESC").addOrderBy("audit.id","DESC").skip((query.page-1)*query.pageSize).take(query.pageSize).getManyAndCount()
    const safe = (value: string) => String(redactAuditData(value))
    const items: AuditEntry[]=entries.map(entry => ({id:entry.id,createdAt:entry.createdAt.toISOString(),
      actorType:safe(entry.actorType),actorUserId:entry.actorUserId,actorStationId:entry.actorStationId,
      factoryId:entry.factoryId,action:safe(entry.action),objectType:safe(entry.objectType),
      objectId:safe(entry.objectId),outcome:safe(entry.outcome),correlationId:entry.correlationId,
      reason:entry.reason ? safe(entry.reason) : null,
      beforeData:redactAuditData(entry.beforeData),afterData:redactAuditData(entry.afterData)}))
    await this.write({actorType:"USER",actorUserId:identity.userId,factoryId:query.factoryId,
      action:"AUDIT_READ",objectType:"AUDIT",objectId:"collection",outcome:"SUCCESS",
      afterData:{page:query.page,pageSize:query.pageSize,returned:items.length}})
    return {items,total,page:query.page,pageSize:query.pageSize}
  }
}

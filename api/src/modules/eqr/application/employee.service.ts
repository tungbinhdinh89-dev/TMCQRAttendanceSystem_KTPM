import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { randomUUID } from "node:crypto"
import { DataSource, EntityManager } from "typeorm"
import { AuditService } from "../../iam/application/audit.service"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { EmployeeOrmEntity } from "../infrastructure/persistence/entities/employee.orm-entity"
import { EmployeeAssignmentOrmEntity } from "../infrastructure/persistence/entities/employee-assignment.orm-entity"
import { AccessGrantOrmEntity } from "../infrastructure/persistence/entities/access-grant.orm-entity"
import type { EmployeeDetail, EmployeePage, EmployeeProfile } from "@tmc/contracts"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function employeeId(value: unknown): string { if (typeof value !== "string" || !uuid.test(value)) throw new BadRequestException("Invalid ID"); return value }
export function employeeText(value: unknown, max: number, required = true): string {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new BadRequestException("Invalid text field")
  return value.trim()
}
export function employeeCode(value: unknown, max: number): string {
  const code=employeeText(value,max)
  if(!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(code)) throw new BadRequestException("Invalid employee or HR code")
  return code
}
export function employeeScope(identity: SessionIdentity): { global: boolean; factoryIds: string[] } {
  const roles = identity.roles.filter(r => r.code === "HR")
  const global = roles.some(r => r.scopeType === "GLOBAL")
  const factoryIds = roles.filter(r => r.scopeType === "FACTORY" && r.factoryId && uuid.test(r.factoryId)).map(r => r.factoryId!)
  if (!global && !factoryIds.length) throw new ForbiddenException("HR factory permission required")
  return { global, factoryIds: [...new Set(factoryIds)] }
}
export function employeeInterval(from: unknown, to: unknown): { validFrom: Date; validTo: Date | null } {
  const date = (v: unknown) => {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) throw new BadRequestException("Invalid effective timestamp")
    const [y,mo,d]=v.slice(0,10).split("-").map(Number)
    const check=new Date(Date.UTC(y,mo-1,d))
    if(check.getUTCFullYear()!==y || check.getUTCMonth()!==mo-1 || check.getUTCDate()!==d)throw new BadRequestException("Invalid calendar date")
    return new Date(v)
  }
  const validFrom = date(from), validTo = to == null || to === "" ? null : date(to)
  if (validTo && validTo <= validFrom) throw new BadRequestException("validTo must follow validFrom")
  return { validFrom, validTo }
}
@Injectable()
export class EmployeeService {
  constructor(private readonly ds: DataSource, private readonly audit: AuditService) {}
  private factory(identity: SessionIdentity, factoryId: string) {
    const scope = employeeScope(identity)
    if (!scope.global && !scope.factoryIds.includes(factoryId)) throw new ForbiddenException("Factory outside HR scope")
  }
  private version(entity: EmployeeOrmEntity | AccessGrantOrmEntity, version: unknown) {
    if (!Number.isSafeInteger(version) || Number(version) < 1) throw new BadRequestException("expectedVersion required")
    if (entity.rowVersion !== version) throw new ConflictException("Record changed; reload before saving")
  }
  private async transaction<T>(work: (m: EntityManager) => Promise<T>): Promise<T> {
    try { return await this.ds.transaction(work) } catch (e) {
      if ((e as {code?: string}).code === "23505") throw new ConflictException("Employee code or HR mapping already exists")
      throw e
    }
  }
  private async auditWrite(m: EntityManager, identity: SessionIdentity, action: string, employee: EmployeeOrmEntity, factoryId: string | null, data: Record<string, string | number | null> = {}) {
    await this.audit.write({ actorType: "USER", actorUserId: identity.userId, factoryId, action, objectType: "EMPLOYEE", objectId: employee.id, outcome: "SUCCESS", afterData: data }, m)
  }
  private async hierarchy(m: EntityManager, identity: SessionIdentity, input: Record<string, unknown>) {
    const factoryId = employeeId(input.factoryId); this.factory(identity, factoryId)
    const departmentId = input.departmentId ? employeeId(input.departmentId) : null
    const teamId = input.teamId ? employeeId(input.teamId) : null
    const [factory] = await m.query("SELECT id FROM factories WHERE id=$1 AND status='ACTIVE'", [factoryId])
    if (!factory) throw new BadRequestException("Active factory required")
    if (departmentId) {
      const [department] = await m.query("SELECT id FROM departments WHERE id=$1 AND factory_id=$2 AND is_active=true", [departmentId, factoryId])
      if (!department) throw new BadRequestException("Department does not belong to active factory")
    }
    if (teamId) {
      if (!departmentId) throw new BadRequestException("Team requires department")
      const [team] = await m.query("SELECT id FROM teams WHERE id=$1 AND department_id=$2 AND is_active=true", [teamId, departmentId])
      if (!team) throw new BadRequestException("Team does not belong to active department")
    }
    return { factoryId, departmentId, teamId }
  }
  private async current(m: EntityManager, employeeId: string, at = new Date()) {
    return m.getRepository(EmployeeAssignmentOrmEntity).createQueryBuilder("a").where("a.employee_id=:employeeId", {employeeId})
      .andWhere("a.valid_from<=:at AND (a.valid_to IS NULL OR a.valid_to>:at)", {at}).orderBy("a.valid_from", "DESC").getOne()
  }
  private async owned(m: EntityManager, identity: SessionIdentity, id: string, lock = false) {
    employeeScope(identity); employeeId(id)
    const employee = await m.getRepository(EmployeeOrmEntity).findOne({ where: {id}, ...(lock ? {lock:{mode:"pessimistic_write" as const}} : {}) })
    if (!employee) throw new NotFoundException("Employee not found")
    const assignment = await this.current(m, id)
    if (assignment) this.factory(identity, assignment.factoryId)
    else if (!employeeScope(identity).global) throw new ForbiddenException("Employee has no assignment in HR scope")
    return employee
  }
  private profile(employee: EmployeeOrmEntity, assignment: EmployeeAssignmentOrmEntity | null): EmployeeProfile {
    return { id:employee.id, employeeCode:employee.employeeCode, externalHrId:employee.externalHrId, fullName:employee.fullName, email:employee.email,
      status:employee.status, rowVersion:employee.rowVersion, deactivatedAt:employee.deactivatedAt?.toISOString() ?? null,
      factoryId:assignment?.factoryId ?? null, departmentId:assignment?.departmentId ?? null, teamId:assignment?.teamId ?? null }
  }
  async list(identity: SessionIdentity, query: Record<string, unknown>): Promise<EmployeePage> {
    const scope = employeeScope(identity)
    const page = Number(query.page ?? 1), pageSize = Number(query.pageSize ?? 25)
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new BadRequestException("Invalid page")
    const at = query.at ? employeeInterval(query.at, null).validFrom : new Date()
    const qb = this.ds.getRepository(EmployeeOrmEntity).createQueryBuilder("e")
      .leftJoin(EmployeeAssignmentOrmEntity,"a","a.employee_id=e.id AND a.valid_from<=:at AND (a.valid_to IS NULL OR a.valid_to>:at)",{at})
    if (!scope.global) qb.andWhere("a.factory_id IN (:...scopeFactories)",{scopeFactories:scope.factoryIds})
    if (query.factoryId) { const id=employeeId(query.factoryId); this.factory(identity,id); qb.andWhere("a.factory_id=:factoryId",{factoryId:id}) }
    if (query.status) { if (!["ACTIVE","INACTIVE"].includes(String(query.status))) throw new BadRequestException("Invalid status"); qb.andWhere("e.status=:status",{status:query.status}) }
    if (query.q) { const q=employeeText(query.q,150); qb.andWhere("(e.employee_code ILIKE :q OR e.full_name ILIKE :q OR e.external_hr_id ILIKE :q)",{q:`%${q}%`}) }
    const [employees,total]=await qb.orderBy("e.employeeCode","ASC").skip((page-1)*pageSize).take(pageSize).getManyAndCount()
    return {items:await Promise.all(employees.map(async e=>this.profile(e,await this.current(this.ds.manager,e.id,at)))),total,page,pageSize}
  }
  async detail(identity: SessionIdentity, id: string): Promise<EmployeeDetail> {
    const employee=await this.owned(this.ds.manager,identity,id)
    const scope=employeeScope(identity)
    const assignments=await this.ds.getRepository(EmployeeAssignmentOrmEntity).find({where:{employeeId:id},order:{validFrom:"DESC"}})
    const grants=await this.ds.getRepository(AccessGrantOrmEntity).find({where:{employeeId:id},order:{validFrom:"DESC"}})
    return {...this.profile(employee,await this.current(this.ds.manager,id)),
      assignments:assignments.filter(a=>scope.global||scope.factoryIds.includes(a.factoryId)).map(a=>({...a,validFrom:a.validFrom.toISOString(),validTo:a.validTo?.toISOString()??null})),
      accessGrants:grants.filter(g=>scope.global||scope.factoryIds.includes(g.factoryId)).map(g=>({...g,validFrom:g.validFrom.toISOString(),validTo:g.validTo?.toISOString()??null,revokedAt:g.revokedAt?.toISOString()??null}))}
  }
  async create(identity: SessionIdentity, input: Record<string, unknown>) {
    employeeScope(identity)
    const result=await this.transaction(async m=>{
      const org=await this.hierarchy(m,identity,input)
      const employee=m.getRepository(EmployeeOrmEntity).create({id:randomUUID(),employeeCode:employeeCode(input.employeeCode,32),externalHrId:employeeCode(input.externalHrId,64),fullName:employeeText(input.fullName,150),email:this.email(input.email),status:"ACTIVE",deactivatedAt:null,rowVersion:1})
      await m.save(employee)
      await m.save(m.getRepository(EmployeeAssignmentOrmEntity).create({id:randomUUID(),employeeId:employee.id,...org,validFrom:new Date(),validTo:null,assignedByUserId:identity.userId}))
      await this.auditWrite(m,identity,"EMPLOYEE_CREATE",employee,org.factoryId,{employeeCode:employee.employeeCode})
      return employee.id
    })
    return this.detail(identity,result)
  }
  private email(input: unknown): string | null {
    if (input == null || input === "") return null
    const email=employeeText(input,254)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException("Invalid email")
    return email
  }
  async update(identity: SessionIdentity,id: string,input: Record<string,unknown>) {
    await this.transaction(async m=>{
      const e=await this.owned(m,identity,id,true); this.version(e,input.expectedVersion)
      if(input.fullName!==undefined)e.fullName=employeeText(input.fullName,150)
      if(input.externalHrId!==undefined)e.externalHrId=employeeCode(input.externalHrId,64)
      if(input.email!==undefined)e.email=this.email(input.email)
      e.rowVersion++;await m.save(e)
      await this.auditWrite(m,identity,"EMPLOYEE_UPDATE",e,(await this.current(m,id))?.factoryId??null,{rowVersion:e.rowVersion})
    });return this.detail(identity,id)
  }
  async status(identity:SessionIdentity,id:string,input:Record<string,unknown>) {
    const reason=employeeText(input.reason,1000)
    if(!["ACTIVE","INACTIVE"].includes(String(input.status)))throw new BadRequestException("Invalid status")
    await this.transaction(async m=>{
      const e=await this.owned(m,identity,id,true);this.version(e,input.expectedVersion)
      e.status=String(input.status);e.deactivatedAt=e.status==="INACTIVE"?new Date():null;e.rowVersion++;await m.save(e)
      if(e.status==="INACTIVE") {
        await m.query("UPDATE user_sessions SET revoked_at=NOW(),revoke_reason='EMPLOYEE_INACTIVE' WHERE revoked_at IS NULL AND user_id IN (SELECT id FROM users WHERE employee_id=$1)",[id])
        await m.query("UPDATE qr_tokens SET revoked_at=NOW() WHERE revoked_at IS NULL AND credential_id IN (SELECT id FROM qr_credentials WHERE employee_id=$1)",[id])
        await m.query("UPDATE qr_credentials SET status='REVOKED',revoked_at=NOW(),revoked_by_user_id=$2,revoke_reason=$3,row_version=row_version+1 WHERE employee_id=$1 AND revoked_at IS NULL",[id,identity.userId,reason])
        await m.query("UPDATE access_grants SET revoked_at=NOW(),revoked_by_user_id=$2,revoke_reason=$3,row_version=row_version+1 WHERE employee_id=$1 AND revoked_at IS NULL",[id,identity.userId,reason])
      }
      await this.auditWrite(m,identity,"EMPLOYEE_STATUS",e,(await this.current(m,id))?.factoryId??null,{status:e.status,reason})
    });return this.detail(identity,id)
  }
  async assign(identity:SessionIdentity,id:string,input:Record<string,unknown>) {
    const interval=employeeInterval(input.validFrom,input.validTo),reason=employeeText(input.reason,1000)
    await this.transaction(async m=>{
      const e=await this.owned(m,identity,id,true),org=await this.hierarchy(m,identity,input)
      if(interval.validFrom.getTime() < Date.now()-1000) throw new BadRequestException("Assignments cannot rewrite past organization history")
      const overlaps=await m.getRepository(EmployeeAssignmentOrmEntity).createQueryBuilder("a").where("a.employee_id=:id",{id})
        .andWhere("a.valid_from < COALESCE(:until::timestamptz,'infinity') AND COALESCE(a.valid_to,'infinity') > :from::timestamptz",{from:interval.validFrom,until:interval.validTo}).getMany()
      if(overlaps.length===1 && overlaps[0].validFrom<interval.validFrom && overlaps[0].validTo===null) {
        this.factory(identity,overlaps[0].factoryId)
        overlaps[0].validTo=interval.validFrom;await m.save(overlaps[0])
      } else if(overlaps.length)throw new ConflictException("Assignment overlaps existing history")
      await m.save(m.getRepository(EmployeeAssignmentOrmEntity).create({id:randomUUID(),employeeId:id,...org,...interval,assignedByUserId:identity.userId}))
      await this.auditWrite(m,identity,"EMPLOYEE_ASSIGN",e,org.factoryId,{reason,validFrom:interval.validFrom.toISOString()})
    });return this.detail(identity,id)
  }
  async grant(identity:SessionIdentity,id:string,input:Record<string,unknown>) {
    const interval=employeeInterval(input.validFrom,input.validTo),reason=employeeText(input.reason,1000),factoryId=employeeId(input.factoryId)
    await this.transaction(async m=>{
      const e=await this.owned(m,identity,id,true);this.factory(identity,factoryId)
      if(e.status!=="ACTIVE")throw new ConflictException("Inactive employee cannot receive access")
      await this.hierarchy(m,identity,{factoryId})
      const overlaps=await m.query("SELECT id FROM access_grants WHERE employee_id=$1 AND factory_id=$2 AND revoked_at IS NULL AND valid_from < COALESCE($4::timestamptz,'infinity') AND COALESCE(valid_to,'infinity') > $3::timestamptz",[id,factoryId,interval.validFrom,interval.validTo])
      if(overlaps.length)throw new ConflictException("Access interval overlaps")
      await m.save(m.getRepository(AccessGrantOrmEntity).create({id:randomUUID(),employeeId:id,factoryId,...interval,grantedByUserId:identity.userId,grantReason:reason,revokedAt:null,revokedByUserId:null,revokeReason:null,rowVersion:1}))
      await this.auditWrite(m,identity,"EMPLOYEE_GRANT",e,factoryId,{reason})
    });return this.detail(identity,id)
  }
  async revoke(identity:SessionIdentity,id:string,grantId:string,input:Record<string,unknown>) {
    const reason=employeeText(input.reason,1000);employeeId(grantId)
    await this.transaction(async m=>{
      const e=await this.owned(m,identity,id,true)
      const g=await m.getRepository(AccessGrantOrmEntity).findOne({where:{id:grantId,employeeId:id},lock:{mode:"pessimistic_write"}})
      if(!g)throw new NotFoundException("Grant not found");this.factory(identity,g.factoryId);this.version(g,input.expectedVersion)
      if(g.revokedAt)throw new ConflictException("Grant already revoked")
      g.revokedAt=new Date();g.revokedByUserId=identity.userId;g.revokeReason=reason;g.rowVersion++;await m.save(g)
      await this.auditWrite(m,identity,"EMPLOYEE_REVOKE",e,g.factoryId,{reason})
    });return this.detail(identity,id)
  }
}

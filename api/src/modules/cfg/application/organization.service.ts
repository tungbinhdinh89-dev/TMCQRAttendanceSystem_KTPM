import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { randomUUID } from "node:crypto"
import { DataSource } from "typeorm"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { AuditService } from "../../iam/application/audit.service"
import { FactoryOrmEntity } from "../infrastructure/persistence/entities/factory.orm-entity"
import { DepartmentOrmEntity } from "../infrastructure/persistence/entities/department.orm-entity"
import { TeamOrmEntity } from "../infrastructure/persistence/entities/team.orm-entity"
import { configurationScope,assertFactory,text,uuid,version,dbConflict } from "./configuration-policy"
const types={factories:FactoryOrmEntity,departments:DepartmentOrmEntity,teams:TeamOrmEntity}
@Injectable()
export class OrganizationService {
 constructor(private readonly ds:DataSource,private readonly audit:AuditService){}
 async lookup(identity:SessionIdentity){
  const scope=configurationScope(identity)
  const factories=await this.ds.getRepository(FactoryOrmEntity).find({order:{code:"ASC"}})
  const visible=factories.filter(f=>scope.global||scope.factoryIds.includes(f.id))
  const ids=new Set(visible.map(f=>f.id))
  const departments=(await this.ds.getRepository(DepartmentOrmEntity).find({order:{code:"ASC"}})).filter(d=>ids.has(d.factoryId))
  const deptIds=new Set(departments.map(d=>d.id))
  const teams=(await this.ds.getRepository(TeamOrmEntity).find({order:{code:"ASC"}})).filter(t=>deptIds.has(t.departmentId))
  return {factories:visible,departments,teams}
 }
 async save(identity:SessionIdentity,kind:string,input:Record<string,unknown>,id?:string){
  if(!Object.hasOwn(types,kind))throw new BadRequestException("Invalid organization kind")
  configurationScope(identity,true)
  return this.ds.transaction(async manager=>{
   const repo=manager.getRepository(types[kind as keyof typeof types])
   const row:any=id?await repo.findOne({where:{id:uuid(id)},lock:{mode:"pessimistic_write"}}):{id:randomUUID(),rowVersion:1}
   if(!row)throw new NotFoundException()
   if(id)version(row,input.expectedVersion)
   let factoryId=kind==="factories"?row.id:row.factoryId
   if(kind==="departments"){
    if(id&&input.factoryId&&input.factoryId!==row.factoryId)throw new BadRequestException("Cannot move a department with history")
    factoryId=uuid(input.factoryId??row.factoryId)
    const parent=await manager.getRepository(FactoryOrmEntity).findOneBy({id:factoryId})
    if(!parent||parent.status!=="ACTIVE")throw new BadRequestException("Factory inactive or missing")
    row.factoryId=factoryId
   }
   if(kind==="teams"){
    if(id&&input.departmentId&&input.departmentId!==row.departmentId)throw new BadRequestException("Cannot move a team with history")
    const parent=await manager.getRepository(DepartmentOrmEntity).findOneBy({id:uuid(input.departmentId??row.departmentId)})
    if(!parent||!parent.isActive)throw new BadRequestException("Department inactive or missing")
    row.departmentId=parent.id;factoryId=parent.factoryId
   }
   if(kind==="factories"&&!id){const scope=configurationScope(identity,true);if(!scope.global)throw new BadRequestException("Global administrator required to create factory")}
   else assertFactory(identity,factoryId,true)
   row.code=text(input.code??row.code,32);row.name=text(input.name??row.name)
   if(kind==="factories"){
    row.status=input.status??row.status??"ACTIVE";if(!["ACTIVE","INACTIVE"].includes(row.status))throw new BadRequestException("Invalid status")
    row.timezone=text(input.timezone??row.timezone??"Asia/Ho_Chi_Minh",64)
    try{new Intl.DateTimeFormat("en",{timeZone:row.timezone})}catch{throw new BadRequestException("Invalid timezone")}
   }else{row.isActive=input.isActive??row.isActive??true;if(typeof row.isActive!=="boolean")throw new BadRequestException("Invalid active flag")}
   if(id)row.rowVersion++
   const saved=await repo.save(row)
   await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId,action:"ORGANIZATION_SAVE",objectType:kind.toUpperCase(),objectId:row.id,outcome:"SUCCESS",afterData:{code:row.code}},manager)
   return saved
  }).catch(dbConflict)
 }
}

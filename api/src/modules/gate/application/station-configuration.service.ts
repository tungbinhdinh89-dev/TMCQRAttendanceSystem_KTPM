import { BadRequestException,ConflictException,Injectable,NotFoundException,UnauthorizedException,ServiceUnavailableException } from "@nestjs/common"
import { createHash,randomBytes,randomUUID,timingSafeEqual } from "node:crypto"
import { DataSource,EntityManager } from "typeorm"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { AuditService } from "../../iam/application/audit.service"
import { assertFactory,configurationScope,text,uuid,version,dbConflict } from "../../cfg/application/configuration-policy"
import { FactoryOrmEntity } from "../../cfg/infrastructure/persistence/entities/factory.orm-entity"
import { ConfigVersionOrmEntity } from "../../cfg/infrastructure/persistence/entities/config-version.orm-entity"
import { IntegrationEndpointOrmEntity } from "../../cfg/infrastructure/persistence/entities/integration-endpoint.orm-entity"
import { GateStationOrmEntity } from "../infrastructure/persistence/entities/gate-station.orm-entity"
import { StationCredentialOrmEntity } from "../infrastructure/persistence/entities/station-credential.orm-entity"
export const hashStationSecret=(secret:string)=>createHash("sha256").update(secret).digest("hex")
export function heartbeatThreshold(){const v=Number(process.env.STATION_STALE_SECONDS??300);return Number.isFinite(v)&&v>=10&&v<=86400?v:300}
export function stationOnline(last:Date|null,now=Date.now()){return !!last&&now-last.getTime()>=0&&now-last.getTime()<heartbeatThreshold()*1000}
@Injectable()
export class StationConfigurationService {
 constructor(private readonly ds:DataSource,private readonly audit:AuditService){}
 private async snapshot(manager:EntityManager,key:string,payload:any,userId:string,previous?:string){
  // Serialize a config key even for its first version; immutable snapshots are retained.
  await manager.query("SELECT pg_advisory_xact_lock(hashtext($1))",[key])
  const repo=manager.getRepository(ConfigVersionOrmEntity)
  const last=await repo.findOne({where:{configKey:key},order:{version:"DESC"}})
  const row=repo.create({id:randomUUID(),configKey:key,version:(last?.version??0)+1,payload,supersedesId:previous??last?.id??null,effectiveFrom:new Date(),createdByUserId:userId})
  await repo.save(row);return row.id
 }
 private integrationDto(row:IntegrationEndpointOrmEntity){return {id:row.id,code:row.code,providerType:row.providerType,factoryId:row.factoryId,baseUrl:row.baseUrl,requestTimeoutMs:row.requestTimeoutMs,contractVersion:row.contractVersion,configVersionId:row.configVersionId,isEnabled:row.isEnabled,rowVersion:row.rowVersion,hasSecretReference:!!row.authSecretRef}}
 async integrations(identity:SessionIdentity){const scope=configurationScope(identity);return {items:(await this.ds.getRepository(IntegrationEndpointOrmEntity).find({order:{code:"ASC"}})).filter(r=>scope.global||(r.factoryId&&scope.factoryIds.includes(r.factoryId))).map(r=>this.integrationDto(r))}}
 async saveIntegration(identity:SessionIdentity,input:Record<string,unknown>,id?:string){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new BadRequestException("Invalid request body")
  configurationScope(identity,true)
  return this.ds.transaction(async manager=>{
   const repo=manager.getRepository(IntegrationEndpointOrmEntity)
   const row=id?await repo.findOne({where:{id:uuid(id)},lock:{mode:"pessimistic_write"}}):repo.create({id:randomUUID(),rowVersion:1})
   if(!row)throw new NotFoundException();if(id)version(row,input.expectedVersion)
   const factoryId=input.factoryId===null?null:input.factoryId===undefined?(row.factoryId??null):uuid(input.factoryId)
   assertFactory(identity,row.factoryId??factoryId,true);assertFactory(identity,factoryId,true)
   if(id&&row.factoryId!==factoryId)throw new BadRequestException("Cannot change endpoint factory; create a new endpoint")
   if(factoryId){const f=await manager.getRepository(FactoryOrmEntity).findOneBy({id:factoryId});if(!f||f.status!=="ACTIVE")throw new BadRequestException("Factory inactive or missing")}
   row.factoryId=factoryId;row.code=text(input.code??row.code,64)
   row.providerType=text(input.providerType??row.providerType,16);if(!["TCS","HRS"].includes(row.providerType))throw new BadRequestException("Invalid provider")
   row.baseUrl=text(input.baseUrl??row.baseUrl,1000)
   let url:URL;try{url=new URL(row.baseUrl)}catch{throw new BadRequestException("Invalid URL")}
   if(!["https:","http:"].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new BadRequestException("URL cannot include credentials/query/fragment")
   row.authSecretRef=text(input.authSecretRef===undefined||input.authSecretRef===""?row.authSecretRef:input.authSecretRef,200)
   if(!/^(env|vault|secret):[A-Za-z0-9_./:-]+$/.test(row.authSecretRef))throw new BadRequestException("Only secret references are accepted")
   row.requestTimeoutMs=Number(input.requestTimeoutMs??row.requestTimeoutMs??1500);if(!Number.isInteger(row.requestTimeoutMs)||row.requestTimeoutMs<100||row.requestTimeoutMs>30000)throw new BadRequestException("Invalid timeout")
   row.contractVersion=text(input.contractVersion??row.contractVersion,50)
   row.isEnabled=(input.isEnabled??row.isEnabled??true) as boolean;if(typeof row.isEnabled!=="boolean")throw new BadRequestException("Invalid enabled flag")
   if(id)row.rowVersion++
   row.configVersionId=await this.snapshot(manager,`endpoint:${row.id}`,{code:row.code,providerType:row.providerType,factoryId:row.factoryId,baseUrl:row.baseUrl,authSecretRef:row.authSecretRef,requestTimeoutMs:row.requestTimeoutMs,contractVersion:row.contractVersion,isEnabled:row.isEnabled},identity.userId,row.configVersionId)
   await repo.save(row)
   await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId,action:"INTEGRATION_SAVE",objectType:"INTEGRATION",objectId:row.id,outcome:"SUCCESS",afterData:{configVersionId:row.configVersionId}},manager)
   return this.integrationDto(row)
  }).catch(dbConflict)
 }
 async stations(identity:SessionIdentity){const scope=configurationScope(identity);return {items:(await this.ds.getRepository(GateStationOrmEntity).find({order:{code:"ASC"}})).filter(r=>scope.global||scope.factoryIds.includes(r.factoryId)).map(r=>({...r,online:r.status==="ACTIVE"&&stationOnline(r.lastSeenAt),physicalState:"UNKNOWN" as const}))}}
 async saveStation(identity:SessionIdentity,input:Record<string,unknown>,id?:string){
  if(!input||typeof input!=="object"||Array.isArray(input))throw new BadRequestException("Invalid request body")
  configurationScope(identity,true)
  return this.ds.transaction(async manager=>{
   const repo=manager.getRepository(GateStationOrmEntity)
   const row=id?await repo.findOne({where:{id:uuid(id)},lock:{mode:"pessimistic_write"}}):repo.create({id:randomUUID(),rowVersion:1,lastSeenAt:null,status:"ACTIVE"})
   if(!row)throw new NotFoundException();if(id)version(row,input.expectedVersion)
   const factoryId=uuid(input.factoryId??row.factoryId);if(id){assertFactory(identity,row.factoryId,true);if(factoryId!==row.factoryId)throw new BadRequestException("Cannot move station history to another factory")}
   assertFactory(identity,factoryId,true)
   const targetStatus=text(input.status??row.status,20)
   const factory=await manager.getRepository(FactoryOrmEntity).findOneBy({id:factoryId});if(!factory||(targetStatus==="ACTIVE"&&factory.status!=="ACTIVE"))throw new BadRequestException("Factory inactive or missing")
   const endpoint=await manager.getRepository(IntegrationEndpointOrmEntity).findOneBy({id:uuid(input.integrationEndpointId??row.integrationEndpointId)})
   if(!endpoint||(targetStatus==="ACTIVE"&&!endpoint.isEnabled)||endpoint.providerType!=="TCS"||(endpoint.factoryId!==null&&endpoint.factoryId!==factoryId))throw new BadRequestException("Invalid TCS endpoint for factory")
   row.factoryId=factoryId;row.integrationEndpointId=endpoint.id;row.code=text(input.code??row.code,50);row.turnstileId=text(input.turnstileId??row.turnstileId,100)
   row.direction=text(input.direction??row.direction,3);if(!["IN","OUT"].includes(row.direction))throw new BadRequestException("Invalid direction")
   const status=targetStatus;if(!["ACTIVE","INACTIVE","RETIRED"].includes(status)||row.status==="RETIRED"&&status!=="RETIRED")throw new BadRequestException("Invalid station status")
   row.status=status;if(id)row.rowVersion++
   row.configVersionId=await this.snapshot(manager,`station:${row.id}`,{factoryId,direction:row.direction,turnstileId:row.turnstileId,integrationEndpointId:endpoint.id,endpointConfigVersionId:endpoint.configVersionId,status},identity.userId,row.configVersionId)
   await repo.save(row)
   if(status!=="ACTIVE")await manager.getRepository(StationCredentialOrmEntity).createQueryBuilder().update().set({revokedAt:new Date(),revokedByUserId:identity.userId,revokeReason:"STATION_DISABLED"}).where("station_id = :id AND revoked_at IS NULL",{id:row.id}).execute()
   await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId,action:"STATION_SAVE",objectType:"STATION",objectId:row.id,outcome:"SUCCESS",afterData:{direction:row.direction,status,configVersionId:row.configVersionId}},manager)
   return {...row,online:status==="ACTIVE"&&stationOnline(row.lastSeenAt),physicalState:"UNKNOWN"}
  }).catch(dbConflict)
 }
 async credential(identity:SessionIdentity,stationId:string,input:Record<string,unknown>,credentialId?:string){
  configurationScope(identity,true)
  return this.ds.transaction(async manager=>{
   const station=await manager.getRepository(GateStationOrmEntity).findOne({where:{id:uuid(stationId)},lock:{mode:"pessimistic_write"}})
   if(!station)throw new NotFoundException();assertFactory(identity,station.factoryId,true)
   const repo=manager.getRepository(StationCredentialOrmEntity)
   if(credentialId){
    const row=await repo.findOneBy({id:uuid(credentialId),stationId:station.id});if(!row)throw new NotFoundException()
    row.revokedAt=new Date();row.revokedByUserId=identity.userId;row.revokeReason=text(input.reason,500);await repo.save(row)
    await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId:station.factoryId,action:"STATION_REVOKE",objectType:"STATION",objectId:station.id,outcome:"SUCCESS"},manager)
    return {revoked:true}
   }
   if(station.status!=="ACTIVE")throw new BadRequestException("Station is not active")
   const expiresAt=input.expiresAt?new Date(text(input.expiresAt,50)):null
   if(expiresAt&&(!Number.isFinite(expiresAt.getTime())||expiresAt.getTime()<=Date.now()))throw new BadRequestException("Invalid expiration")
   await repo.createQueryBuilder().update().set({revokedAt:new Date(),revokedByUserId:identity.userId,revokeReason:"ROTATED"}).where("station_id = :id AND revoked_at IS NULL",{id:station.id}).execute()
   const secret=randomBytes(32).toString("base64url"),id=randomUUID()
   await repo.save(repo.create({id,stationId:station.id,secretHash:hashStationSecret(secret),expiresAt,issuedByUserId:identity.userId,revokedAt:null}))
   await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId:station.factoryId,action:"STATION_PROVISION",objectType:"STATION",objectId:station.id,outcome:"SUCCESS"},manager)
   return {credentialId:id,secret,expiresAt:expiresAt?.toISOString()??null}
  })
 }
 async heartbeat(stationId:string,bearer:string|undefined,input:Record<string,unknown>){
  if(Object.keys(input??{}).length)throw new BadRequestException("Heartbeat body must be empty; identity and direction are server-owned")
  const match=/^Bearer ([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/.exec(bearer??"")
  if(!match||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(match[1]))throw new UnauthorizedException("Station credential required")
  return this.ds.transaction(async manager=>{
   // Same station lock order as rotation/revocation prevents revoked credentials racing heartbeat.
   const station=await manager.getRepository(GateStationOrmEntity).findOne({where:{id:uuid(stationId)},lock:{mode:"pessimistic_write"}})
   const cred=await manager.getRepository(StationCredentialOrmEntity).findOneBy({id:match[1],stationId:uuid(stationId)})
   const hash=hashStationSecret(match[2])
   if(!station||station.status!=="ACTIVE"||!cred||cred.revokedAt||cred.expiresAt&&cred.expiresAt.getTime()<=Date.now()||cred.secretHash.length!==hash.length||!timingSafeEqual(Buffer.from(hash),Buffer.from(cred.secretHash)))throw new UnauthorizedException("Station credential invalid")
   const factory=await manager.getRepository(FactoryOrmEntity).findOneBy({id:station.factoryId});if(factory?.status!=="ACTIVE")throw new UnauthorizedException("Factory disabled")
   if(station.lastSeenAt&&Date.now()-station.lastSeenAt.getTime()<1000)throw new ConflictException("Heartbeat rate limited; retry later")
   station.lastSeenAt=new Date();await manager.getRepository(GateStationOrmEntity).save(station)
   return {stationId:station.id,factoryId:station.factoryId,direction:station.direction,configVersionId:station.configVersionId,receivedAt:station.lastSeenAt.toISOString(),physicalState:"UNKNOWN"}
  })
 }
 async readiness(identity:SessionIdentity){
  const scope=configurationScope(identity)
  try {
  const stations=(await this.stations(identity)).items
  const params:any[]=[scope.global,scope.factoryIds]
  const [counts]=await this.ds.query(`SELECT COUNT(*) FILTER (WHERE c.state='UNKNOWN')::int AS unknown_commands FROM gate_commands c JOIN access_attempts a ON a.id=c.access_attempt_id WHERE ($1::boolean OR a.factory_id=ANY($2::uuid[]))`,params)
  const [cases]=await this.ds.query(`SELECT COUNT(*)::int AS open_cases,MIN(c.created_at) AS oldest_case_at FROM reconciliation_cases c JOIN gate_stations s ON s.id=c.station_id WHERE c.status='OPEN' AND ($1::boolean OR s.factory_id=ANY($2::uuid[]))`,params)
  const [jobs]=await this.ds.query(`SELECT COUNT(*) FILTER (WHERE j.state='PENDING')::int AS pending_jobs,COUNT(*) FILTER (WHERE j.state='FAILED')::int AS failed_jobs,MIN(j.created_at) FILTER (WHERE j.state IN ('PENDING','FAILED')) AS oldest_job_at FROM background_jobs j LEFT JOIN gate_commands c ON c.id=j.gate_command_id LEFT JOIN access_attempts a ON a.id=c.access_attempt_id LEFT JOIN export_batches b ON b.id=(SELECT o.export_batch_id FROM outbox_messages o WHERE o.id=j.outbox_message_id) WHERE ($1::boolean OR a.factory_id=ANY($2::uuid[]) OR b.factory_id=ANY($2::uuid[]))`,params)
  const alerts=[]
  if(jobs.failed_jobs>0||counts.unknown_commands>0||cases.open_cases>0)alerts.push({code:"RECONCILIATION_REQUIRED",recipientRole:"ADM",acknowledgement:"NOT_IMPLEMENTED",escalation:"MANUAL_REVIEW",reason:"Review pending failures and unknown commands"})
  return {observedAt:new Date().toISOString(),database:"AVAILABLE",stations,metrics:{...counts,...cases,...jobs},alerts,physicalState:"UNKNOWN",upstreamState:"NOT_PROBED",latencyMs:null,staleThresholdSeconds:heartbeatThreshold()}
  } catch {throw new ServiceUnavailableException({code:"CONFIGURATION_READINESS_UNAVAILABLE",message:"Readiness data unavailable",observedAt:new Date().toISOString()})}
 }
}

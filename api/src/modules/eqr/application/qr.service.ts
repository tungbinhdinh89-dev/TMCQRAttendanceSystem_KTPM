import { BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common"
import { randomUUID, type JsonWebKey } from "node:crypto"
import { DataSource, EntityManager, IsNull } from "typeorm"
import type { IssuedQrToken, QrValidationResult, SelfQrStatus } from "@tmc/contracts"
import { AuditService } from "../../iam/application/audit.service"
import type { SessionIdentity } from "../../iam/application/auth.service"
import { EmployeeOrmEntity } from "../infrastructure/persistence/entities/employee.orm-entity"
import { QrCredentialOrmEntity } from "../infrastructure/persistence/entities/qr-credential.orm-entity"
import { QrTokenOrmEntity } from "../infrastructure/persistence/entities/qr-token.orm-entity"
import { QrSigningKeyOrmEntity } from "../infrastructure/persistence/entities/qr-signing-key.orm-entity"
import { employeeId, employeeScope, employeeText } from "./employee.service"
import { configuredSigningKey, fingerprintQr, parseQrHeader, qrAudience, qrIssuer, signCompactQr, verifyCompactQr } from "./qr-crypto"
import type { QrValidator } from "./ports/qr-validator.port"

@Injectable()
export class QrService implements QrValidator {
  constructor(private readonly ds: DataSource, private readonly audit: AuditService) {}
  private self(identity:SessionIdentity) {if(!identity.roles.some(r=>r.code==="EMP"))throw new ForbiddenException("Employee role required");return employeeId(identity.employeeId)}
  private async hr(m:EntityManager,identity:SessionIdentity,id:string) {
    const scope=employeeScope(identity)
    const [a]=await m.query("SELECT factory_id FROM employee_assignments WHERE employee_id=$1 AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW()) ORDER BY valid_from DESC LIMIT 1",[id])
    if(!scope.global&&(!a||!scope.factoryIds.includes(a.factory_id)))throw new ForbiddenException("Employee outside HR scope")
    return a?.factory_id??null
  }
  private async active(m:EntityManager,id:string) {return m.getRepository(QrCredentialOrmEntity).findOne({where:{employeeId:id,status:"ACTIVE",revokedAt:IsNull()}})}
  async status(identity:SessionIdentity):Promise<SelfQrStatus> {
    const credential=await this.active(this.ds.manager,this.self(identity))
    let signing:ReturnType<typeof configuredSigningKey>|null=null
    try{signing=configuredSigningKey()}catch{}
    let signingAvailable=false
    if(signing){
      const key=await this.ds.manager.getRepository(QrSigningKeyOrmEntity).createQueryBuilder("key").where("key.key_id=:keyId",{keyId:signing.keyId}).getOne()
      const jwk=key?.publicJwk as JsonWebKey|undefined,now=Date.now()
      signingAvailable=!key||key.algorithm==="EdDSA"&&key.status==="ACTIVE"&&key.validFrom.getTime()<=now&&(!key.validTo||key.validTo.getTime()>now)&&jwk?.kty===signing.publicJwk.kty&&jwk?.crv===signing.publicJwk.crv&&jwk?.x===signing.publicJwk.x&&!jwk?.d
    }
    return {credential:credential?{id:credential.id,status:credential.status,credentialRef:credential.credentialRef}:null,signingAvailable,serverTime:new Date().toISOString()}
  }
  async provision(identity:SessionIdentity,id:string,input:Record<string,unknown>) {
    employeeId(id);const reason=employeeText(input.reason,1000)
    if(input.regenerate!==undefined&&typeof input.regenerate!=="boolean")throw new BadRequestException("Invalid regenerate flag")
    return this.ds.transaction(async m=>{
      const e=await m.getRepository(EmployeeOrmEntity).findOne({where:{id},lock:{mode:"pessimistic_write"}})
      if(!e)throw new NotFoundException();const factoryId=await this.hr(m,identity,id)
      if(e.status!=="ACTIVE")throw new ConflictException("Inactive employee")
      const prior=await this.active(m,id)
      if(prior&&!input.regenerate)throw new ConflictException("Active credential already exists")
      if(prior)await this.revokeRows(m,identity,id,reason)
      const c=m.getRepository(QrCredentialOrmEntity).create({id:randomUUID(),employeeId:id,credentialRef:randomUUID(),status:"ACTIVE",issuedByUserId:identity.userId,revokedAt:null,rowVersion:1})
      await m.save(c)
      await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId,action:"QR_CREDENTIAL_ISSUE",objectType:"EMPLOYEE",objectId:id,outcome:"SUCCESS",afterData:{reason,regenerated:!!prior}},m)
      return {id:c.id,status:c.status,credentialRef:c.credentialRef}
    })
  }
  private async revokeRows(m:EntityManager,identity:SessionIdentity,id:string,reason:string) {
    await m.query("UPDATE qr_tokens SET revoked_at=NOW() WHERE revoked_at IS NULL AND credential_id IN (SELECT id FROM qr_credentials WHERE employee_id=$1)",[id])
    await m.query("UPDATE qr_credentials SET status='REVOKED',revoked_at=NOW(),revoked_by_user_id=$2,revoke_reason=$3,row_version=row_version+1 WHERE employee_id=$1 AND revoked_at IS NULL",[id,identity.userId,reason])
  }
  async revoke(identity:SessionIdentity,id:string,input:Record<string,unknown>) {
    employeeId(id);const reason=employeeText(input.reason,1000)
    return this.ds.transaction(async m=>{
      const e=await m.getRepository(EmployeeOrmEntity).findOne({where:{id},lock:{mode:"pessimistic_write"}});if(!e)throw new NotFoundException()
      const factoryId=await this.hr(m,identity,id);await this.revokeRows(m,identity,id,reason)
      await this.audit.write({actorType:"USER",actorUserId:identity.userId,factoryId,action:"QR_CREDENTIAL_REVOKE",objectType:"EMPLOYEE",objectId:id,outcome:"SUCCESS",afterData:{reason}},m)
      return {revoked:true}
    })
  }
  async issue(identity:SessionIdentity):Promise<IssuedQrToken> {
    const id=this.self(identity)
    let signing:ReturnType<typeof configuredSigningKey>
    try{signing=configuredSigningKey()}catch{throw new ServiceUnavailableException({code:"QR_SIGNING_UNAVAILABLE",message:"QR signing is not configured"})}
    return this.ds.transaction(async m=>{
      const e=await m.getRepository(EmployeeOrmEntity).findOne({where:{id},lock:{mode:"pessimistic_write"}})
      if(!e||e.status!=="ACTIVE")throw new ForbiddenException("Employee inactive")
      const credential=await this.active(m,id);if(!credential)throw new ConflictException({code:"QR_CREDENTIAL_REQUIRED",message:"HR must provision a credential"})
      const now=Date.now(),tokens=m.getRepository(QrTokenOrmEntity)
      const latest=await tokens.findOne({where:{credentialId:credential.id},order:{createdAt:"DESC"}})
      if(latest&&now-latest.createdAt.getTime()<5000)throw new HttpException({code:"QR_RATE_LIMITED",message:"Wait before refreshing QR"},429)
      // Serialize metadata initialization across different employees; never persist key material.
      await m.query("SELECT pg_advisory_xact_lock(hashtext($1))",[`qr-key:${signing.keyId}`])
      const keys=m.getRepository(QrSigningKeyOrmEntity)
      let key=await keys.createQueryBuilder("key").where("key.key_id=:keyId",{keyId:signing.keyId}).getOne()
      if(!key){key=keys.create({keyId:signing.keyId,algorithm:"EdDSA",publicJwk:signing.publicJwk as any,privateSecretRef:"env:QR_PRIVATE_KEY_PEM",status:"ACTIVE",validFrom:new Date(now),validTo:null});await keys.save(key)}
      const publicJwk=key.publicJwk as JsonWebKey
      if(key.algorithm!=="EdDSA"||key.status!=="ACTIVE"||key.validFrom.getTime()>now||key.validTo&&key.validTo.getTime()<=now||publicJwk.kty!==signing.publicJwk.kty||publicJwk.crv!==signing.publicJwk.crv||publicJwk.x!==signing.publicJwk.x||publicJwk.d)throw new ServiceUnavailableException({code:"QR_KEY_UNAVAILABLE",message:"Signing key metadata unavailable"})
      const ttl=Number(process.env.QR_TOKEN_TTL_SECONDS??60)
      if(!Number.isInteger(ttl)||ttl<10||ttl>300)throw new ServiceUnavailableException("Invalid QR token TTL")
      const tokenId=randomUUID(),iat=Math.floor(now/1000),expiresAt=new Date((iat+ttl)*1000)
      const token=signCompactQr({iss:qrIssuer(),aud:qrAudience(),sub:id,jti:tokenId,iat,exp:iat+ttl},signing)
      await tokens.save(tokens.create({id:tokenId,credentialId:credential.id,signingKeyId:signing.keyId,issuedByUserId:identity.userId,tokenHash:fingerprintQr(token),expiresAt,revokedAt:null}))
      await this.audit.write({actorType:"USER",actorUserId:identity.userId,action:"QR_TOKEN_ISSUE",objectType:"EMPLOYEE",objectId:id,outcome:"SUCCESS"},m)
      return {token,expiresAt:expiresAt.toISOString(),serverTime:new Date(now).toISOString(),refreshAfterSeconds:5}
    })
  }
  async validate(token:unknown,m:EntityManager=this.ds.manager):Promise<QrValidationResult> {
    const result=await this.validateStoredToken(token,m)
    await this.audit.write({actorType:"SYSTEM",action:"QR_VALIDATE",objectType:"QR",objectId:result.valid?result.tokenId:"unverified",outcome:result.valid?"SUCCESS":"DENIED",reason:result.valid?null:result.reasonCode},m)
    return result
  }
  private async validateStoredToken(token:unknown,m:EntityManager):Promise<QrValidationResult> {
    const fail=(reasonCode:string)=>({valid:false as const,reasonCode})
    const header=parseQrHeader(token);if(!header)return fail("QR_MALFORMED")
    const key=await m.getRepository(QrSigningKeyOrmEntity).createQueryBuilder("key").where("key.key_id=:keyId",{keyId:header.kid}).getOne();if(!key)return fail("QR_UNKNOWN_KEY")
    const parsed=verifyCompactQr(token,{...key,publicJwk:key.publicJwk as JsonWebKey});if(!parsed.valid)return parsed
    const c=parsed.claims,row=await m.getRepository(QrTokenOrmEntity).findOneBy({id:c.jti})
    if(!row||row.signingKeyId!==header.kid||row.tokenHash!==fingerprintQr(token as string)||row.expiresAt.getTime()!==c.exp*1000)return fail("QR_TOKEN_MISMATCH")
    if(row.revokedAt)return fail("QR_TOKEN_REVOKED")
    const credential=await m.getRepository(QrCredentialOrmEntity).findOneBy({id:row.credentialId})
    if(!credential||credential.employeeId!==c.sub||credential.status!=="ACTIVE"||credential.revokedAt)return fail("QR_CREDENTIAL_REVOKED")
    const employee=await m.getRepository(EmployeeOrmEntity).findOneBy({id:c.sub})
    if(!employee||employee.status!=="ACTIVE")return fail("QR_EMPLOYEE_INACTIVE")
    return {valid:true,employeeId:c.sub,tokenId:c.jti,credentialId:credential.id,expiresAt:row.expiresAt.toISOString()}
  }
  /** Caller owns the PREPARED attempt transaction. Never sends OPEN or commits independently. */
  async redeem(token:unknown,attemptId:string,stationId:string,m:EntityManager):Promise<QrValidationResult & {duplicate?:boolean}> {
    if(!m.queryRunner?.isTransactionActive)throw new BadRequestException("Redemption requires caller-owned active transaction")
    employeeId(attemptId);employeeId(stationId)
    const header=parseQrHeader(token);if(!header)return {valid:false,reasonCode:"QR_MALFORMED"}
    const validated=await this.validate(token,m);if(!validated.valid)return validated
    // Same employee lock order as issue/revoke/deactivation; validation is repeated under lock.
    await m.getRepository(EmployeeOrmEntity).findOne({where:{id:validated.employeeId},lock:{mode:"pessimistic_write"}})
    const live=await this.validate(token,m);if(!live.valid)return live
    const [attempt]=await m.query("SELECT id,factory_id,employee_id,qr_token_id,token_fingerprint,decision FROM access_attempts WHERE id=$1 AND station_id=$2 FOR UPDATE",[attemptId,stationId])
    if(!attempt||attempt.employee_id!==live.employeeId||attempt.qr_token_id!==live.tokenId||attempt.token_fingerprint!==fingerprintQr(token as string)||attempt.decision==="DENIED")return {valid:false,reasonCode:"QR_ATTEMPT_MISMATCH"}
    const [grant]=await m.query("SELECT id FROM access_grants WHERE employee_id=$1 AND factory_id=$2 AND revoked_at IS NULL AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW())",[live.employeeId,attempt.factory_id])
    if(!grant)return {valid:false,reasonCode:"QR_ACCESS_REVOKED"}
    const [station]=await m.query("SELECT s.id FROM gate_stations s JOIN factories f ON f.id=s.factory_id WHERE s.id=$1 AND s.factory_id=$2 AND s.status='ACTIVE' AND f.status='ACTIVE'",[stationId,attempt.factory_id])
    if(!station)return {valid:false,reasonCode:"QR_STATION_INACTIVE"}
    const inserted=await m.query("INSERT INTO qr_redemptions(token_id,access_attempt_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING token_id",[live.tokenId,attemptId])
    if(inserted.length)return {...live,duplicate:false}
    const [existing]=await m.query("SELECT access_attempt_id FROM qr_redemptions WHERE token_id=$1",[live.tokenId])
    return existing?.access_attempt_id===attemptId?{...live,duplicate:true}:{valid:false,reasonCode:"QR_REPLAY"}
  }
}

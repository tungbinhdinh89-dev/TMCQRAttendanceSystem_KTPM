import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common"
import { randomUUID, type JsonWebKey } from "node:crypto"
import { DataSource, EntityManager, IsNull } from "typeorm"
import type { StaticQrCode, QrValidationResult, SelfQrStatus } from "@tmc/contracts"
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
  private self(identity: SessionIdentity) {
    if (!identity.roles.some(r => r.code === "EMP")) throw new ForbiddenException("Employee role required")
    return employeeId(identity.employeeId)
  }
  private async hr(m: EntityManager, identity: SessionIdentity, id: string) {
    const scope = employeeScope(identity)
    const [a] = await m.query("SELECT factory_id FROM employee_assignments WHERE employee_id=$1 AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW()) ORDER BY valid_from DESC LIMIT 1", [id])
    if (!scope.global && (!a || !scope.factoryIds.includes(a.factory_id))) throw new ForbiddenException("Employee outside HR scope")
    return a?.factory_id ?? null
  }
  private active(m: EntityManager, id: string) {
    return m.getRepository(QrCredentialOrmEntity).findOne({ where: { employeeId: id, status: "ACTIVE", revokedAt: IsNull() } })
  }
  private payload(m: EntityManager, id: string) {
    return m.getRepository(QrCredentialOrmEntity).createQueryBuilder("credential")
      .addSelect("credential.signedPayload").where("credential.id = :id", { id }).getOne()
  }
  async status(identity: SessionIdentity): Promise<SelfQrStatus> {
    const credential = await this.active(this.ds.manager, this.self(identity))
    let signingAvailable = false
    if (credential) {
      const stored = await this.payload(this.ds.manager, credential.id)
      signingAvailable = !!stored?.signedPayload && (await this.validateStoredToken(stored.signedPayload, this.ds.manager)).valid
    }
    return { credential: credential ? { id: credential.id, status: credential.status, credentialRef: credential.credentialRef } : null, signingAvailable, serverTime: new Date().toISOString() }
  }
  private async signingKey(m: EntityManager) {
    let signing: ReturnType<typeof configuredSigningKey>
    try { signing = configuredSigningKey() } catch { throw new ServiceUnavailableException({ code: "QR_SIGNING_UNAVAILABLE", message: "QR signing is not configured" }) }
    await m.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`qr-key:${signing.keyId}`])
    const keys = m.getRepository(QrSigningKeyOrmEntity)
    let key = await keys.createQueryBuilder("key").where("key.key_id=:keyId", { keyId: signing.keyId }).getOne()
    if (!key) {
      key = keys.create({ keyId: signing.keyId, algorithm: "EdDSA", publicJwk: signing.publicJwk as any, privateSecretRef: "env:QR_PRIVATE_KEY_PEM", status: "ACTIVE", validFrom: new Date(), validTo: null })
      await keys.save(key)
    }
    const publicJwk = key.publicJwk as JsonWebKey, now = Date.now()
    if (key.algorithm !== "EdDSA" || key.status !== "ACTIVE" || key.validFrom.getTime() > now || key.validTo && key.validTo.getTime() <= now || publicJwk.kty !== signing.publicJwk.kty || publicJwk.crv !== signing.publicJwk.crv || publicJwk.x !== signing.publicJwk.x || publicJwk.d) throw new ServiceUnavailableException({ code: "QR_KEY_UNAVAILABLE", message: "Signing key metadata unavailable" })
    return signing
  }
  async provision(identity: SessionIdentity, id: string, input: Record<string, unknown>) {
    employeeId(id); const reason = employeeText(input.reason, 1000)
    if (input.regenerate !== undefined && typeof input.regenerate !== "boolean") throw new BadRequestException("Invalid regenerate flag")
    return this.ds.transaction(async m => {
      const e = await m.getRepository(EmployeeOrmEntity).findOne({ where: { id }, lock: { mode: "pessimistic_write" } })
      if (!e) throw new NotFoundException()
      const factoryId = await this.hr(m, identity, id)
      if (e.status !== "ACTIVE") throw new ConflictException("Inactive employee")
      const prior = await this.active(m, id)
      if (prior && !input.regenerate) throw new ConflictException("Active credential already exists; reissue to replace it")
      const signing = await this.signingKey(m)
      if (prior) await this.revokeRows(m, identity, id, reason)
      const issuedAt = new Date(), credentialRef = randomUUID(), tokenId = randomUUID()
      const token = signCompactQr({ iss: qrIssuer(), aud: qrAudience(), sub: credentialRef, jti: tokenId, iat: Math.floor(issuedAt.getTime() / 1000), kind: "STATIC" }, signing)
      const credential = m.getRepository(QrCredentialOrmEntity).create({ id: randomUUID(), employeeId: id, credentialRef, signedPayload: token, status: "ACTIVE", issuedByUserId: identity.userId, revokedAt: null, rowVersion: 1, createdAt: issuedAt })
      await m.save(credential)
      const tokens = m.getRepository(QrTokenOrmEntity)
      await tokens.save(tokens.create({ id: tokenId, credentialId: credential.id, signingKeyId: signing.keyId, issuedByUserId: identity.userId, tokenHash: fingerprintQr(token), expiresAt: null, revokedAt: null, createdAt: issuedAt }))
      await this.audit.write({ actorType: "USER", actorUserId: identity.userId, factoryId, action: "QR_CREDENTIAL_ISSUE", objectType: "EMPLOYEE", objectId: id, outcome: "SUCCESS", afterData: { reason, regenerated: !!prior, mode: "STATIC" } }, m)
      return { id: credential.id, status: credential.status, credentialRef: credential.credentialRef }
    })
  }
  private async revokeRows(m: EntityManager, identity: SessionIdentity, id: string, reason: string) {
    await m.query("UPDATE qr_tokens SET revoked_at=NOW() WHERE revoked_at IS NULL AND credential_id IN (SELECT id FROM qr_credentials WHERE employee_id=$1)", [id])
    await m.query("UPDATE qr_credentials SET status='REVOKED',revoked_at=NOW(),revoked_by_user_id=$2,revoke_reason=$3,row_version=row_version+1 WHERE employee_id=$1 AND revoked_at IS NULL", [id, identity.userId, reason])
  }
  async revoke(identity: SessionIdentity, id: string, input: Record<string, unknown>) {
    employeeId(id); const reason = employeeText(input.reason, 1000)
    return this.ds.transaction(async m => {
      const e = await m.getRepository(EmployeeOrmEntity).findOne({ where: { id }, lock: { mode: "pessimistic_write" } })
      if (!e) throw new NotFoundException()
      const factoryId = await this.hr(m, identity, id)
      await this.revokeRows(m, identity, id, reason)
      await this.audit.write({ actorType: "USER", actorUserId: identity.userId, factoryId, action: "QR_CREDENTIAL_REVOKE", objectType: "EMPLOYEE", objectId: id, outcome: "SUCCESS", afterData: { reason } }, m)
      return { revoked: true }
    })
  }
  /** Retrieval never signs or creates a credential, even across sessions/key rotation. */
  async issue(identity: SessionIdentity): Promise<StaticQrCode> {
    const id = this.self(identity)
    return this.ds.transaction(async m => {
      const employee = await m.getRepository(EmployeeOrmEntity).findOne({ where: { id }, lock: { mode: "pessimistic_write" } })
      if (!employee || employee.status !== "ACTIVE") throw new ForbiddenException("Employee inactive")
      const active = await this.active(m, id)
      const credential = active && await this.payload(m, active.id)
      if (!credential?.signedPayload) throw new ConflictException({ code: "QR_CREDENTIAL_REQUIRED", message: "HR must provision or reissue a static QR credential" })
      const valid = await this.validateStoredToken(credential.signedPayload, m)
      if (!valid.valid) throw new ConflictException({ code: valid.reasonCode, message: "Credential unavailable; contact HR" })
      return { token: credential.signedPayload, credentialId: credential.id, issuedAt: credential.createdAt.toISOString(), serverTime: new Date().toISOString() }
    })
  }
  async validate(token: unknown, m: EntityManager = this.ds.manager): Promise<QrValidationResult> {
    const result = await this.validateStoredToken(token, m)
    await this.audit.write({ actorType: "SYSTEM", action: "QR_VALIDATE", objectType: "QR", objectId: result.valid ? result.tokenId : "unverified", outcome: result.valid ? "SUCCESS" : "DENIED", reason: result.valid ? null : result.reasonCode }, m)
    return result
  }
  private async validateStoredToken(token: unknown, m: EntityManager): Promise<QrValidationResult> {
    const fail = (reasonCode: string) => ({ valid: false as const, reasonCode })
    const header = parseQrHeader(token)
    if (!header) return fail("QR_MALFORMED")
    const key = await m.getRepository(QrSigningKeyOrmEntity).createQueryBuilder("key").where("key.key_id=:keyId", { keyId: header.kid }).getOne()
    if (!key) return fail("QR_UNKNOWN_KEY")
    const parsed = verifyCompactQr(token, { ...key, publicJwk: key.publicJwk as JsonWebKey })
    if (!parsed.valid) return parsed
    const claims = parsed.claims, row = await m.getRepository(QrTokenOrmEntity).findOneBy({ id: claims.jti })
    if (!row || row.expiresAt !== null || row.signingKeyId !== header.kid || row.tokenHash !== fingerprintQr(token as string)) return fail("QR_TOKEN_MISMATCH")
    if (row.revokedAt) return fail("QR_TOKEN_REVOKED")
    const credential = await this.payload(m, row.credentialId)
    if (!credential || credential.credentialRef !== claims.sub || credential.signedPayload !== token || credential.status !== "ACTIVE" || credential.revokedAt) return fail("QR_CREDENTIAL_REVOKED")
    const employee = await m.getRepository(EmployeeOrmEntity).findOneBy({ id: credential.employeeId })
    if (!employee || employee.status !== "ACTIVE") return fail("QR_EMPLOYEE_INACTIVE")
    return { valid: true, employeeId: credential.employeeId, tokenId: claims.jti, credentialId: credential.id, expiresAt: null }
  }
  /** Static QR may be reused for distinct attempts. The caller owns attempt idempotency and dispatch. */
  async redeem(token: unknown, attemptId: string, stationId: string, m: EntityManager): Promise<QrValidationResult & { duplicate?: boolean }> {
    if (!m.queryRunner?.isTransactionActive) throw new BadRequestException("Redemption requires caller-owned active transaction")
    employeeId(attemptId); employeeId(stationId)
    const validated = await this.validate(token, m)
    if (!validated.valid) return validated
    await m.getRepository(EmployeeOrmEntity).findOne({ where: { id: validated.employeeId }, lock: { mode: "pessimistic_write" } })
    const live = await this.validate(token, m)
    if (!live.valid) return live
    const [attempt] = await m.query("SELECT id,factory_id,employee_id,qr_token_id,token_fingerprint,decision FROM access_attempts WHERE id=$1 AND station_id=$2 FOR UPDATE", [attemptId, stationId])
    if (!attempt || attempt.employee_id !== live.employeeId || attempt.qr_token_id !== live.tokenId || attempt.token_fingerprint !== fingerprintQr(token as string) || attempt.decision === "DENIED") return { valid: false, reasonCode: "QR_ATTEMPT_MISMATCH" }
    const [grant] = await m.query("SELECT id FROM access_grants WHERE employee_id=$1 AND factory_id=$2 AND revoked_at IS NULL AND valid_from<=NOW() AND (valid_to IS NULL OR valid_to>NOW())", [live.employeeId, attempt.factory_id])
    if (!grant) return { valid: false, reasonCode: "QR_ACCESS_REVOKED" }
    const [station] = await m.query("SELECT s.id FROM gate_stations s JOIN factories f ON f.id=s.factory_id WHERE s.id=$1 AND s.factory_id=$2 AND s.status='ACTIVE' AND f.status='ACTIVE'", [stationId, attempt.factory_id])
    if (!station) return { valid: false, reasonCode: "QR_STATION_INACTIVE" }
    return { ...live, duplicate: false }
  }
}

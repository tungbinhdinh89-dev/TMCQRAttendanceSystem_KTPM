import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { signCompactQr, verifyCompactQr, parseQrHeader, fingerprintQr } from "../dist/modules/eqr/application/qr-crypto.js"
import { QrService } from "../dist/modules/eqr/application/qr.service.js"
import { QrController } from "../dist/modules/eqr/presentation/qr.controller.js"

const now = Date.parse("2026-11-18T03:00:00Z")
const employeeId = "00000000-0000-4000-8000-000000000001"
const tokenId = "00000000-0000-4000-8000-000000000002"
const pair = generateKeyPairSync("ed25519")
const signer = { keyId: "test-key", privateKeyPem: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString() }
const key = { keyId: signer.keyId, algorithm: "EdDSA", publicJwk: pair.publicKey.export({ format: "jwk" }), status: "ACTIVE", validFrom: new Date(now - 1000), validTo: null }
const claims = { iss: process.env.QR_ISSUER || "tmc-access", aud: process.env.QR_AUDIENCE || "tmc-gate", sub: employeeId, jti: tokenId, iat: now / 1000, exp: now / 1000 + 60 }
const mint = (changes = {}) => signCompactQr({ ...claims, ...changes }, signer)

test("Ed25519 QR verifies exact signed claims without exposing private material", () => {
  const token = mint()
  assert.deepEqual(verifyCompactQr(token, key, now), { valid: true, claims })
  assert.equal(fingerprintQr(token).length, 64)
  assert.notEqual(fingerprintQr(token), token)
  assert.equal(key.publicJwk.d, undefined)
  assert.equal(token.includes("PRIVATE KEY"), false)
  assert.deepEqual(verifyCompactQr(token, { ...key, status: "VERIFY_ONLY" }, now), { valid: true, claims })
})

test("tampered, malformed, wrong-audience and unknown-key QR are rejected", () => {
  const token = mint(), [header, payload, signature] = token.split(".")
  const changed = Buffer.from(JSON.stringify({ ...claims, sub: tokenId })).toString("base64url")
  for (const candidate of ["not-a-token", "a".repeat(4097), `${header}.${changed}.${signature}`]) {
    assert.equal(verifyCompactQr(candidate, key, now).valid, false)
  }
  assert.equal(verifyCompactQr(mint({ aud: "another-gate" }), key, now).valid, false)
  assert.equal(verifyCompactQr(token, { ...key, keyId: "unknown" }, now).reasonCode, "QR_UNKNOWN_KEY")
  assert.equal(parseQrHeader(`${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT", kid: key.keyId })).toString("base64url")}.${payload}.${signature}`), null)
})

test("expiry boundary, future claims and revoked/private-bearing verification keys fail closed", () => {
  assert.equal(verifyCompactQr(mint(), key, now + 59999).valid, true)
  assert.equal(verifyCompactQr(mint(), key, now + 60000).reasonCode, "QR_EXPIRED")
  assert.equal(verifyCompactQr(mint({ iat: now / 1000 + 1 }), key, now).valid, false)
  assert.equal(verifyCompactQr(mint(), { ...key, status: "REVOKED" }, now).valid, false)
  assert.equal(verifyCompactQr(mint(), { ...key, validTo: new Date(now) }, now).valid, false)
  assert.equal(verifyCompactQr(mint(), { ...key, publicJwk: { ...key.publicJwk, d: "not-public" } }, now).valid, false)
})

function liveFixture() {
  const current = Math.floor(Date.now() / 1000)
  const token = mint({ iat: current, exp: current + 60 })
  const credential = { id: "00000000-0000-4000-8000-000000000003", employeeId, status: "ACTIVE", revokedAt: null }
  const tokenRow = { id: tokenId, credentialId: credential.id, signingKeyId: key.keyId, tokenHash: fingerprintQr(token), expiresAt: new Date((current + 60) * 1000), revokedAt: null }
  const employee = { id: employeeId, status: "ACTIVE" }
  const liveKey = { ...key, validFrom: new Date(0) }
  const rows = { QrSigningKeyOrmEntity: liveKey, QrTokenOrmEntity: tokenRow, QrCredentialOrmEntity: credential, EmployeeOrmEntity: employee }
  const manager = { queryRunner: { isTransactionActive: true }, getRepository: type => ({
    findOneBy: async () => rows[type.name], findOne: async () => rows[type.name],
    createQueryBuilder: () => ({ where() { return this }, getOne: async () => rows[type.name] }),
  }) }
  return { token, tokenRow, credential, employee, liveKey, manager, service: new QrService({ manager }, { write: async () => {} }) }
}

test("validator rechecks stored fingerprint, token/credential/key revocation and employee status", async () => {
  const f = liveFixture()
  assert.equal((await f.service.validate(f.token)).valid, true)
  f.tokenRow.tokenHash = "mismatch"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_TOKEN_MISMATCH")
  f.tokenRow.tokenHash = fingerprintQr(f.token)
  f.tokenRow.revokedAt = new Date()
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_TOKEN_REVOKED")
  f.tokenRow.revokedAt = null; f.credential.status = "REVOKED"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_CREDENTIAL_REVOKED")
  f.credential.status = "ACTIVE"; f.employee.status = "INACTIVE"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_EMPLOYEE_INACTIVE")
  f.employee.status = "ACTIVE"; f.liveKey.status = "REVOKED"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_KEY_UNAVAILABLE")
})

test("redemption helper distinguishes the same attempt retry from a different-attempt replay (unit adapter)", async () => {
  const f = liveFixture()
  const attemptId = "00000000-0000-4000-8000-000000000004", stationId = "00000000-0000-4000-8000-000000000005"
  await assert.rejects(f.service.redeem(f.token, attemptId, stationId, { ...f.manager, queryRunner: { isTransactionActive: false } }), error => error.getStatus() === 400)
  let redeemedBy = null
  f.manager.query = async sql => {
    if (sql.includes("FROM access_attempts")) return [{ id: attemptId, factory_id: employeeId, employee_id: employeeId, qr_token_id: tokenId, token_fingerprint: fingerprintQr(f.token), decision: "PENDING" }]
    if (sql.includes("FROM access_grants") || sql.includes("FROM gate_stations")) return [{ id: employeeId }]
    if (sql.includes("INSERT INTO qr_redemptions")) { if (redeemedBy) return []; redeemedBy = attemptId; return [{ token_id: tokenId }] }
    if (sql.includes("FROM qr_redemptions")) return [{ access_attempt_id: redeemedBy }]
    throw new Error("Unexpected query")
  }
  assert.equal((await f.service.redeem(f.token, attemptId, stationId, f.manager)).duplicate, false)
  assert.equal((await f.service.redeem(f.token, attemptId, stationId, f.manager)).duplicate, true)
  redeemedBy = stationId
  assert.equal((await f.service.redeem(f.token, attemptId, stationId, f.manager)).reasonCode, "QR_REPLAY")
})

test("self token endpoint rejects a caller-selected employee and uses only the authenticated identity", async () => {
  const identity = { employeeId, roles: [{ code: "EMP" }] }
  let issuedFor = null
  const controller = new QrController({ issue: async user => { issuedFor = user.employeeId; return { token: "fixture" } } }, {
    me: async () => identity, verifyRequestOrigin: async () => {},
  })
  const request = { headers: { cookie: "tmc_session=fixture" } }
  await assert.rejects(controller.issue(request, { employeeId: tokenId }), error => error.getStatus() === 400)
  assert.equal(issuedFor, null)
  await controller.issue(request, {})
  assert.equal(issuedFor, employeeId)
})

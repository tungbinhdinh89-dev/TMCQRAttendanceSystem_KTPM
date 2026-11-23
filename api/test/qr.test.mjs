import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { signCompactQr, verifyCompactQr, parseQrHeader, fingerprintQr } from "../dist/modules/eqr/application/qr-crypto.js"
import { QrService } from "../dist/modules/eqr/application/qr.service.js"
import { QrController } from "../dist/modules/eqr/presentation/qr.controller.js"

const employeeId = "00000000-0000-4000-8000-000000000001"
const tokenId = "00000000-0000-4000-8000-000000000002"
const credentialId = "00000000-0000-4000-8000-000000000003"
const credentialRef = "00000000-0000-4000-8000-000000000006"
const now = Date.now(), iat = Math.floor(now / 1000)
const pair = generateKeyPairSync("ed25519")
const signer = { keyId: "test-key", privateKeyPem: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString() }
const key = { keyId: signer.keyId, algorithm: "EdDSA", publicJwk: pair.publicKey.export({ format: "jwk" }), status: "ACTIVE", validFrom: new Date(0), validTo: null }
const claims = { iss: process.env.QR_ISSUER || "tmc-access", aud: process.env.QR_AUDIENCE || "tmc-gate", sub: credentialRef, jti: tokenId, iat, kind: "STATIC" }
const mint = (changes = {}) => signCompactQr({ ...claims, ...changes }, signer)
const identity = { employeeId, userId: employeeId, roles: [{ code: "EMP" }] }

test("static QR is signed, opaque and remains valid across elapsed short-token TTL", () => {
  const token = mint()
  assert.deepEqual(verifyCompactQr(token, key, now), { valid: true, claims })
  assert.deepEqual(verifyCompactQr(token, key, now + 365 * 86400000), { valid: true, claims })
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url"))
  assert.notEqual(payload.sub, employeeId)
  assert.equal(payload.exp, undefined)
  assert.deepEqual(Object.keys(payload).sort(), ["aud", "iat", "iss", "jti", "kind", "sub"])
  assert.equal(token.includes("PRIVATE KEY"), false)
  assert.equal(key.publicJwk.d, undefined)
  assert.equal(fingerprintQr(token).length, 64)
  assert.deepEqual(verifyCompactQr(token, { ...key, status: "VERIFY_ONLY" }, now), { valid: true, claims })
})

test("tampering, legacy ephemeral payloads, invalid claims and unavailable keys fail closed", () => {
  const token = mint(), [header, payload, signature] = token.split(".")
  const changed = Buffer.from(JSON.stringify({ ...claims, sub: employeeId })).toString("base64url")
  for (const value of ["not-a-token", "a".repeat(4097), `${header}.${changed}.${signature}`, mint({ exp: iat + 60 }), mint({ kind: undefined, exp: iat + 60 }), mint({ aud: "another-gate" }), mint({ iat: iat + 5 })]) assert.equal(verifyCompactQr(value, key, now).valid, false)
  assert.equal(verifyCompactQr(token, { ...key, status: "REVOKED" }, now).reasonCode, "QR_KEY_UNAVAILABLE")
  assert.equal(verifyCompactQr(token, { ...key, validTo: new Date(now) }, now).valid, false)
  assert.equal(verifyCompactQr(token, { ...key, publicJwk: { ...key.publicJwk, d: "private" } }, now).valid, false)
  assert.equal(parseQrHeader(`${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT", kid: key.keyId })).toString("base64url")}.${payload}.${signature}`), null)
})

function liveFixture() {
  const token = mint()
  const credential = { id: credentialId, employeeId, credentialRef, signedPayload: token, status: "ACTIVE", revokedAt: null, createdAt: new Date(iat * 1000) }
  const tokenRow = { id: tokenId, credentialId, signingKeyId: key.keyId, tokenHash: fingerprintQr(token), expiresAt: null, revokedAt: null }
  const employee = { id: employeeId, status: "ACTIVE" }
  const liveKey = { ...key }
  const rows = { QrSigningKeyOrmEntity: liveKey, QrTokenOrmEntity: tokenRow, QrCredentialOrmEntity: credential, EmployeeOrmEntity: employee }
  const manager = { queryRunner: { isTransactionActive: true }, getRepository: type => ({
    findOneBy: async () => rows[type.name], findOne: async () => rows[type.name],
    createQueryBuilder: () => ({ where() { return this }, addSelect() { return this }, getOne: async () => rows[type.name] }),
  }) }
  const ds = { manager, transaction: async callback => callback(manager) }
  return { token, tokenRow, credential, employee, liveKey, manager, service: new QrService(ds, { write: async () => {} }) }
}

test("employee retrieves identical HR-issued payload repeatedly; revoked/inactive/unissued QR is unavailable", async () => {
  const f = liveFixture()
  const first = await f.service.issue(identity), second = await f.service.issue({ ...identity })
  assert.equal(first.token, second.token)
  assert.equal(first.credentialId, credentialId)
  assert.equal(first.issuedAt, second.issuedAt)
  f.credential.status = "REVOKED"
  await assert.rejects(f.service.issue(identity), error => error.getStatus() === 409)
  f.credential.status = "ACTIVE"; f.employee.status = "INACTIVE"
  await assert.rejects(f.service.issue(identity), error => error.getStatus() === 403)
  f.employee.status = "ACTIVE"; f.credential.signedPayload = null
  await assert.rejects(f.service.issue(identity), error => error.getStatus() === 409)
  await assert.rejects(f.service.issue({ ...identity, roles: [{ code: "HR" }] }), error => error.getStatus() === 403)
})

test("validator checks live fingerprint, token/key/credential revocation, replacement and inactive employee", async () => {
  const f = liveFixture()
  assert.equal((await f.service.validate(f.token)).valid, true)
  f.tokenRow.tokenHash = "mismatch"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_TOKEN_MISMATCH")
  f.tokenRow.tokenHash = fingerprintQr(f.token); f.tokenRow.revokedAt = new Date()
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_TOKEN_REVOKED")
  f.tokenRow.revokedAt = null; f.credential.status = "REVOKED"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_CREDENTIAL_REVOKED")
  f.credential.status = "ACTIVE"; f.credential.credentialRef = tokenId
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_CREDENTIAL_REVOKED")
  f.credential.credentialRef = credentialRef; f.employee.status = "INACTIVE"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_EMPLOYEE_INACTIVE")
  f.employee.status = "ACTIVE"; f.liveKey.status = "REVOKED"
  assert.equal((await f.service.validate(f.token)).reasonCode, "QR_KEY_UNAVAILABLE")
})

test("static QR reusable across attempts without global one-use redemption; grants/station still checked", async () => {
  const f = liveFixture()
  const attemptId = "00000000-0000-4000-8000-000000000004", stationId = "00000000-0000-4000-8000-000000000005"
  await assert.rejects(f.service.redeem(f.token, attemptId, stationId, { ...f.manager, queryRunner: { isTransactionActive: false } }), error => error.getStatus() === 400)
  let grant = true
  f.manager.query = async (sql, args) => {
    assert.equal(sql.includes("qr_redemptions"), false)
    if (sql.includes("FROM access_attempts")) return [{ id: args[0], factory_id: employeeId, employee_id: employeeId, qr_token_id: tokenId, token_fingerprint: fingerprintQr(f.token), decision: "ALLOW" }]
    if (sql.includes("FROM access_grants")) return grant ? [{ id: employeeId }] : []
    if (sql.includes("FROM gate_stations")) return [{ id: stationId }]
    throw new Error("Unexpected query")
  }
  assert.equal((await f.service.redeem(f.token, attemptId, stationId, f.manager)).valid, true)
  assert.equal((await f.service.redeem(f.token, credentialRef, stationId, f.manager)).valid, true)
  grant = false
  assert.equal((await f.service.redeem(f.token, attemptId, stationId, f.manager)).reasonCode, "QR_ACCESS_REVOKED")
})

test("self QR endpoints never accept employee selector and use authenticated identity", async () => {
  let issuedFor = null
  const controller = new QrController({ issue: async user => { issuedFor = user.employeeId; return { token: "fixture" } } }, { me: async () => identity, verifyRequestOrigin: async () => {} })
  const request = { headers: { cookie: "tmc_session=fixture" } }
  await assert.rejects(controller.issue(request, { employeeId: tokenId }), error => error.getStatus() === 400)
  assert.equal(issuedFor, null)
  await controller.code(request)
  assert.equal(issuedFor, employeeId)
})

test("HR provisioning stores one immutable signed payload; reissue revokes prior credential and tokens", async () => {
  const previousKey = process.env.QR_KEY_ID, previousPem = process.env.QR_PRIVATE_KEY_PEM
  process.env.QR_KEY_ID = signer.keyId; process.env.QR_PRIVATE_KEY_PEM = signer.privateKeyPem
  try {
    const f = liveFixture(), hr = { ...identity, roles: [{ code: "HR", scopeType: "GLOBAL" }] }
    let storedCredential = null, storedToken = null, revocationUpdates = 0
    const original = f.manager.getRepository
    f.manager.getRepository = type => {
      const repository = original(type)
      return { ...repository, create: value => value, save: async value => {
        if (type.name === "QrTokenOrmEntity") storedToken = value
        return value
      } }
    }
    f.manager.save = async value => { storedCredential = value; return value }
    f.manager.query = async sql => {
      if (sql.includes("employee_assignments")) return [{ factory_id: employeeId }]
      if (sql.startsWith("UPDATE qr_")) { revocationUpdates++; return [] }
      if (sql.includes("pg_advisory_xact_lock")) return []
      throw new Error("Unexpected query")
    }
    await assert.rejects(f.service.provision(identity, employeeId, { reason: "New hire" }), error => error.getStatus() === 403)
    await assert.rejects(f.service.provision(hr, employeeId, { reason: "New hire" }), error => error.getStatus() === 409)
    await f.service.provision(hr, employeeId, { reason: "Replace compromised QR", regenerate: true })
    assert.equal(revocationUpdates, 2)
    assert.notEqual(storedCredential.signedPayload, f.token)
    assert.equal(storedToken.expiresAt, null)
    assert.equal(storedToken.tokenHash, fingerprintQr(storedCredential.signedPayload))
    const decoded = verifyCompactQr(storedCredential.signedPayload, key)
    assert.equal(decoded.valid, true)
    assert.equal(decoded.claims.sub, storedCredential.credentialRef)
    assert.notEqual(decoded.claims.sub, employeeId)
    assert.equal(decoded.claims.jti, storedToken.id)
    assert.equal(storedCredential.employeeId, employeeId)
  } finally {
    if (previousKey === undefined) delete process.env.QR_KEY_ID; else process.env.QR_KEY_ID = previousKey
    if (previousPem === undefined) delete process.env.QR_PRIVATE_KEY_PEM; else process.env.QR_PRIVATE_KEY_PEM = previousPem
  }
})

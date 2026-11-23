import { createHash, createPrivateKey, createPublicKey, sign, verify, type JsonWebKey } from "node:crypto"

/** No employee identifier or personal data is embedded in a static credential. */
export type QrClaims = { iss: string; aud: string; sub: string; jti: string; iat: number; kind: "STATIC" }
export interface VerificationKey { keyId: string; algorithm: string; publicJwk: JsonWebKey; status: string; validFrom: Date; validTo: Date | null }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const fingerprintQr = (token: string) => createHash("sha256").update(token).digest("hex")
export const qrIssuer = () => process.env.QR_ISSUER || "tmc-access"
export const qrAudience = () => process.env.QR_AUDIENCE || "tmc-gate"
function segment(value: unknown) { return Buffer.from(JSON.stringify(value)).toString("base64url") }
export function parseQrHeader(token: unknown): { kid: string } | null {
  try {
    if (typeof token !== "string" || token.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null
    const h = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"))
    if (h.alg !== "EdDSA" || h.typ !== "JWT" || typeof h.kid !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(h.kid) || Object.keys(h).some(k => !["alg", "typ", "kid"].includes(k))) return null
    return { kid: h.kid }
  } catch { return null }
}
export function signCompactQr(claims: QrClaims, key: { keyId: string; privateKeyPem: string }): string {
  const privateKey = createPrivateKey(key.privateKeyPem)
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("QR signing key must be Ed25519")
  const data = `${segment({ alg: "EdDSA", typ: "JWT", kid: key.keyId })}.${segment(claims)}`
  return `${data}.${sign(null, Buffer.from(data), privateKey).toString("base64url")}`
}
export function verifyCompactQr(token: unknown, key: VerificationKey, nowMs = Date.now()): { valid: true; claims: QrClaims } | { valid: false; reasonCode: string } {
  const fail = (reasonCode: string) => ({ valid: false as const, reasonCode })
  const header = parseQrHeader(token)
  if (!header) return fail("QR_MALFORMED")
  if (header.kid !== key.keyId) return fail("QR_UNKNOWN_KEY")
  if (key.algorithm !== "EdDSA" || !["ACTIVE", "VERIFY_ONLY"].includes(key.status) || key.validFrom.getTime() > nowMs || key.validTo && key.validTo.getTime() <= nowMs) return fail("QR_KEY_UNAVAILABLE")
  try {
    const [h, p, s] = (token as string).split(".")
    if (key.publicJwk.kty !== "OKP" || key.publicJwk.crv !== "Ed25519" || key.publicJwk.d) return fail("QR_KEY_UNAVAILABLE")
    const publicKey = createPublicKey({ key: key.publicJwk, format: "jwk" })
    if (!verify(null, Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, "base64url"))) return fail("QR_SIGNATURE_INVALID")
    const c = JSON.parse(Buffer.from(p, "base64url").toString("utf8"))
    if (!c || typeof c !== "object" || Array.isArray(c) || c.kind !== "STATIC" || c.iss !== qrIssuer() || c.aud !== qrAudience() || typeof c.sub !== "string" || !uuid.test(c.sub) || typeof c.jti !== "string" || !uuid.test(c.jti) || !Number.isSafeInteger(c.iat) || c.iat < 0 || c.iat > Math.floor(nowMs / 1000) || Object.keys(c).some(k => !["iss", "aud", "sub", "jti", "iat", "kind"].includes(k))) return fail("QR_CLAIMS_INVALID")
    return { valid: true, claims: c }
  } catch { return fail("QR_SIGNATURE_INVALID") }
}
export function configuredSigningKey() {
  const keyId = process.env.QR_KEY_ID, privateKeyPem = process.env.QR_PRIVATE_KEY_PEM?.replace(/\\n/g, "\n")
  if (!keyId || !privateKeyPem || !/^[A-Za-z0-9_-]{1,64}$/.test(keyId)) throw new Error("QR signing configuration unavailable")
  const privateKey = createPrivateKey(privateKeyPem)
  if (privateKey.asymmetricKeyType !== "ed25519") throw new Error("QR signing configuration unavailable")
  const { kty, crv, x } = createPublicKey(privateKey).export({ format: "jwk" })
  return { keyId, privateKeyPem, publicJwk: { kty, crv, x } as JsonWebKey }
}

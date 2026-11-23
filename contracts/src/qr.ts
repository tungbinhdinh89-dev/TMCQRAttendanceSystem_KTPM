export interface QrCredentialSummary { id: string; status: string; credentialRef: string }
export interface SelfQrStatus { credential: QrCredentialSummary | null; signingAvailable: boolean; serverTime: string }
/** HR-issued reusable code, valid until explicit revocation or key retirement. */
export interface StaticQrCode { token: string; credentialId: string; issuedAt: string; serverTime: string }
/** @deprecated Personal QR now uses StaticQrCode. */
export interface IssuedQrToken { token: string; expiresAt: string; serverTime: string; refreshAfterSeconds: number }
export interface QrClaims { iss: string; aud: string; sub: string; jti: string; iat: number; kind: "STATIC" }
export type QrValidationResult = { valid: true; employeeId: string; tokenId: string; credentialId: string; expiresAt: string | null } | { valid: false; reasonCode: string }

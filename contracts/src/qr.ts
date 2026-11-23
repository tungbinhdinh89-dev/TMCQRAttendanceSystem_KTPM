export interface QrCredentialSummary { id: string; status: string; credentialRef: string }
export interface SelfQrStatus { credential: QrCredentialSummary | null; signingAvailable: boolean; serverTime: string }
export interface IssuedQrToken { token: string; expiresAt: string; serverTime: string; refreshAfterSeconds: number }
export interface QrClaims { iss: string; aud: string; sub: string; jti: string; iat: number; exp: number }
export type QrValidationResult = { valid: true; employeeId: string; tokenId: string; credentialId: string; expiresAt: string } | { valid: false; reasonCode: string }

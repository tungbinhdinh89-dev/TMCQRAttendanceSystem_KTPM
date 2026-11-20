# QR credential operation — TMC-091

## Runtime configuration (server only)

Set `QR_KEY_ID` to a unique 1–64 character key ID (letters/digits/_/-), and inject an Ed25519 PKCS#8 PEM private key as `QR_PRIVATE_KEY_PEM` via process environment/secret manager. Literal backslash-n PEM line separators are accepted. Do not commit the key, print it to terminal/logs, add it to VITE_* or save it in a DB payload. No default/private demo key is bundled.

An operator can generate a key with Node crypto `generateKeyPairSync("ed25519")` in their secure key-management process and supply the private export directly to the secret store; this repository does not run key generation/seed automatically. The first successful self-token issue registers only the derived **public** JWK and `env:QR_PRIVATE_KEY_PEM` reference, under a per-key DB advisory lock. Existing key metadata must match the configured public key and be ACTIVE/in its validity window; it is never silently reactivated or overwritten.

`QR_TOKEN_TTL_SECONDS`: default60, allowed10..300. `QR_ISSUER`: default tmc-access. `QR_AUDIENCE`: default tmc-gate. The verifier permits EdDSA/Ed25519 only, zero clock skew, iat not in the future and exp strictly after current server time. Synchronize server clocks. Token carries only iss/aud/sub/jti/iat/exp; JWT header only alg/typ/kid.

For rotation, supply a **new** key ID/private key, retaining old public metadata as VERIFY_ONLY while old tokens expire. Set compromised key metadata REVOKED to stop validation immediately. Metadata changes belong to authorized operator/config workflows; no general-purpose public key-administration endpoint is exposed here. Key-status fixtures in tests cover ACTIVE/VERIFY_ONLY/REVOKED without writing operational seed data.

## Database migration

New migration `1794960000000-ActiveQrCredential.ts` creates a partial unique index on employee_id where status=ACTIVE and revoked_at IS NULL. It is **authored/reviewed, not generated against or applied to a live DB**. Existing duplicate active credentials make migration fail safely; reconcile explicitly without deleting history before retry. Down removes only the new index. Existing token/redemption tables/PK/unique attempt index are reused; synchronize remains false. Apply only against the explicitly authorized environment using the migration skill/runbook.

## API and UI

- HR: POST `/api/employees/:id/qr-credential` with `{reason, regenerate?:boolean}`. Same-factory/global HR scope is checked on server; regeneration revokes old credential/tokens and issues a new credential in one transaction.
- HR: POST `/api/employees/:id/qr-credential/revoke` with `{reason}`. Requires current HR scope, preserves history, records audit. Management employee detail has these controls.
- EMP: GET `/api/qr/self` returns current credential state, serverTime and signing availability; POST `/api/qr/self/token` with empty JSON body issues only for session.employeeId. Arbitrary employee selectors are rejected. Five-second issue throttle is serialized on employee row; each issuance creates a new jti/fingerprint/expiry, not an extension of an old token.
- Open `/qr` or `/mobile/ma-qr` and log in with a real EMP cookie session. Client displays react-qr-code for the server token, counts down with a monotonic clock and deducts request transit; no client signing or legacy tmc-access:v1 token. It hides QR on expiry, logout, detected account/credential change, offline/visibility/focus changes and failed refresh. Credential/session polling is every5seconds; revocation is enforced by server validation immediately even before UI observes it.

Only a fingerprint and expiry/key/credential references are stored in qr_tokens; raw QR is returned for transient display, not persisted in browser storage/journals/logs. No CORS wildcard or public validator endpoint is introduced. Production uses HTTPS Secure cookies and explicit CORS_ORIGINS from existing auth setup.

## Validation and replay boundary

QrValidator/QrService.validate returns typed validity/reason only, never ALLOW, OPEN or attendance. It verifies format/size/algorithm/kid/signature/issuer/audience/time, then live key/token fingerprint/credential/employee state. Identity verification is separate from factory access authorization.

`QrService.redeem(token, attemptId, stationId, manager)` requires an active caller-owned transaction containing the real PREPARED access attempt. It locks employee (matching issue/revoke/deactivate order), revalidates live state, matches attempt employee/token/fingerprint/station, checks live factory grant/station, and inserts redemption with DB uniqueness. Same attempt/token retry is a duplicate; another attempt is replay. It neither commits nor sends OPEN. Caller must authenticate station credentials, own request/event idempotency and recheck at command claim; after expiry or completion use existing-attempt lookup instead of treating a new validation as an idempotent lookup.

The GATE scan/claim/TCS path is **not** implemented by this QR change. Consequently TMC-015's end-to-end cross-station race/single-OPEN/claim-window revocation criteria are not asserted. Redeem provides the reusable atomic primitive; a future gate transaction must integrate it and roll back intent/redemption together. Do not accept offline QR when revocation/grants cannot be verified. If redeemed OPEN fails, issue a new QR; no automatic second OPEN. Short TTL and one-time redemption reduce replay but do not eliminate live code sharing.

## Lean verification limits

Focused crypto/live-state/unit-transaction tests and API/client builds only. Real PostgreSQL migration/rollback/race and hardware scans are not run, and no DB reset/seed/deployment occurs. UI visual checks are reported separately; a build is not visual acceptance or real-server proof. User review is required; closed child-issue status was retained rather than used as evidence of implementation.

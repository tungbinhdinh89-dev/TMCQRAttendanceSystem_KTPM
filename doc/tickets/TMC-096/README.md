# Audit implementation: #102 / #92

## Usage and scope

Open `/audit` on the web client. This page uses real `/api/auth/login`, `/api/me`, `/api/auth/logout` cookie sessions, independently of main's legacy demo portal. No password/session/role is persisted in localStorage by the audit page.

Read-only API: `GET /api/audit-entries`. Query: `page` (default 1), `pageSize` (default 25, max 100), `action`, `outcome`, `objectType`, `objectId`, `correlationId`, `factoryId`, `from`, `to` (ISO timestamp). Unknown/invalid filters are rejected. Response: items, total, page, pageSize. No create/update/delete audit routes.

ADM needs `iam:manage` or `audit:read`; HR/SEC need `audit:read`. Only GLOBAL or valid FACTORY grants are supported. Permission and scope must come from the same grant. Multiple eligible factory grants are combined; EMP/EXE alone cannot read audit. Server is authoritative.

Records use the existing audit_entries entity/table; no new migration or DB reset/seed was performed. Event writes accept a transaction EntityManager; AuditService.transaction supports mutation + audit in one transaction. Failed mandatory audit prevents success. Existing implemented auth login/logout writes are wired; invalid login/session/origin and audit-read denials have separate durable events. Audit reads are themselves audited.

Employee CRUD, QR revocation, role/station changes, attendance corrections and HRS exports have no mutation endpoints on this main baseline. This change supplies their reusable audit port/transaction helper, not nonexistent business implementations. Future operations must call it inside their own transaction.

## Security and deployment

Configure `CORS_ORIGINS` as an explicit comma-separated list of trusted frontend origins (scheme, hostname, port). Production defaults to no cross-origin access; development defaults to localhost/127.0.0.1 on 5173/8443. When using another development port, configure that origin explicitly. Login/logout reject untrusted Origin; cookies use HttpOnly/SameSite=Lax and Secure in production. Same-host HTTPS deployment is recommended for cookie sessions.

Audit rows expose an explicit DTO allowlist. Sensitive keys and recognizable secret values are redacted on write and read; UUID identities remain traceable. Do not pass raw secrets in event metadata, action or object identifiers. Before/after payloads are bounded. Original unredacted values cannot be recovered from the API.

## Verification boundary

Unit/provider-backed HTTP checks are separate from real PostgreSQL integration. The existing `api test:integration` script automatically seeds its configured DB and was deliberately not run without an authorized disposable target. No claim of real PostgreSQL rollback, real production auth session or hardware behavior is made from mocks. Browser checks using intercepted API responses must be labeled mocked evidence.

The legacy demo bootstrap outside this page remains outside this ticket. This implementation does not imply the entire portal has migrated to real authentication.

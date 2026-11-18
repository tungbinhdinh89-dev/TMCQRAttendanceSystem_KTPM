# TMC-090 / TMC-092 execution

Assigned: TMC-090 (#96), TMC-092 (#98), TMC-055/056/057 (#59/#60/#61).
Repository: tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM.
Branch: feat/tmc-090-092-employee-gate-config; isolated .tmp-employee-gates from origin/main 2924561.
Native children: #96 -> #59,#60,#61; #98 -> #6,#39,#76,#77,#78,#87,#88. All children have no native descendants (paginated API inspected).

## Ownership

- employee_api: EQR CRUD, status, effective assignments/access grants and contracts employee.ts.
- gate_configuration: CFG/GATE organization, station provisioning/heartbeat, config versions/readiness and their contracts.
- management_ui: client management UI only, real cookie session; no fake save/localStorage role fallback.
- Coordinator: shared IAM exports, integration, commits, minimum necessary verification and PR.

User requests lean verification: build/typecheck plus essential authorization/validation/transaction checks, no elaborate or repeated test matrix. No database reset, automatic seed, arbitrary migration apply or deployment. Existing schema preferred. No hardware/HRS integration claims from configured endpoints or last-seen timestamps.

## Progress

Issue/AC intake, native tree inspection, clean main branch and frozen-lockfile dependency installation complete. Implementation in progress. Current permissions: employee write requires scoped HR business role; ADM does not automatically receive HR write. Configuration mutations require ADM with iam:manage on the same applicable scope. API remains authoritative.

## Implementation and lean verification

Commits: e016808 (baseline/shared IAM exports), 774e91a (backend/contracts), 66ae97e (portal + final validation). Verified committed application code at 66ae97e.

| Ticket | Delivered | Evidence / limits |
|---|---|---|
| TMC-090 / #96 | Employee task integration across three child tickets | Code/contract integration complete; user acceptance pending |
| TMC-055 / #59 | HR scoped create/query/update/status, conflict/version, immutable code/HRS mapping validation; deactivate sessions/QR/grants with audit in transaction; reactivate does not restore | API build; focused HR scope checks. Actual database mutation/reload/rollback NOT RUN |
| TMC-056 / #60 | Effective assignments, past-safe transfers, hierarchy/overlap checks, grant/revoke/history and audit | Interval checks PASS; revoked grant persisted for access-policy consumers. Gate scan execution not part of these tasks |
| TMC-057 / #61 | Real /management employee UI, filters/pagination/forms/reasons/error409, no fake local save or sample badge | Client TypeScript/build PASS; end-to-end DB reload and screenshots NOT RUN |
| TMC-092 / #98 | Org/station/integration/readiness APIs and UI below | Parent acceptance pending operational verification, no physical-device claim |
| TMC-006 / #6 | Reused current identity/station entities; heartbeat server owns direction/factory | Previously CLOSED; no new fixture seed or six-role DB verification performed |
| TMC-039 / #39 | Credentialed heartbeat, stale threshold, scoped real queue/case/UNKNOWN counts with timestamps | Freshness/hash unit checks PASS; counts not exercised against PG. Physical state UNKNOWN, latency null |
| TMC-072 / #76 | Factory/department/team scoped CRUD state, parent checks, version/unique errors, audit; no hard delete | API build/policy checks; real cross-factory DB mutation unverified |
| TMC-073 / #77 | Station lifecycle, hash-only credential storage, rotation/revoke, authenticated empty-body heartbeat, no physical confirmation | Policy/hash checks; real station and rotation race NOT RUN |
| TMC-074 / #78 | Role-separated org/station portal; one-time credential modal and reload/error handling | Client build PASS. Manual visual verification unavailable |
| TMC-083 / #87 | Endpoint settings with immutable config versions and optimistic version; secret references only, DTO never returns secret reference | Compiles; existing command/export snapshots untouched. Actual pending-worker behavior NOT RUN |
| TMC-084 / #88 | Protected scoped readiness, unavailable DB ->503 with timestamp, minimal no-secret errors; recipient ADM/manual escalation decision | Persisted alert ACK/delivery NOT IMPLEMENTED. Hardware/upstream NOT_PROBED; no fabricated latency |

Final commands (2026-11-18):
- pnpm.cmd --dir api test:management: PASS, API build + 6/6 focused tests (0 failure/skipped).
- pnpm.cmd --dir client build: PASS, TypeScript + Vite; existing large-chunk warning only.
- git diff --check: PASS.

Per user request, no broad/regression/load/browser matrix. Existing DB integration script seeds automatically: not run. No schema/migration/apply/reset/seed/deployment. Edge screenshot attempt failed profile permission, no visual PASS claimed.

## Usage / policy

Open /management (own real cookie login via /api/auth/login/me/logout). Old employee feature redirects here instead of retaining fake saves; SUP/EMP cannot use this HR administration page. Existing unrelated legacy demo portal remains as-is. HR role GLOBAL/FACTORY grants employee write (explicit business policy; attendance read is not repurposed as write); ADM with iam:manage writes config only within the SAME grant scope. SEC can read station config, not change credentials.

Organization lookup GET /api/organization; write POST/PATCH /api/organization/{factories|departments|teams}[/:id]. Employee GET/POST /api/employees, GET/PATCH /:id, POST /:id/status, GET/POST /:id/assignments, GET/POST /:id/access-grants, POST /:id/access-grants/:grantId/revoke. Update/status/grant revoke require expectedVersion; assignment/grant/status changes require reason. Effective intervals are half-open with timezone.

Configuration under /api/configuration/{stations,integrations,readiness}; station credentials POST /stations/:id/credentials and DELETE /stations/:id/credentials/:credentialId (reason). Provisioned credential secret is returned once only; heartbeat POST /api/stations/:id/heartbeat with empty body and Authorization: Bearer <credentialId>.<secret>. Rotation/retirement/revocation share station lock with heartbeat. Do not log/store returned secret in frontend persistence.

CORS_ORIGINS must include exact trusted client origin; auth cookies use Secure in production. STATION_STALE_SECONDS defaults300, bounded10..86400. Integration secret fields accept env:/vault:/secret: references only. Existing references/config versions remain for pending work; no outbound upstream probe is sent. Readiness alerts explicitly route manual review to ADM, without pretending to persist ACK or deliver messages.

Employee session revocation uses scalar IAM table IDs within the employee status transaction; no cross-module ORM coupling introduced. This is a pragmatic coordination boundary and not a new session-admin API. No issue closed or marked Done; PR requires user review.

PR: https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/pull/111 — OPEN targeting main, awaiting user review. No automatic merge/issue closure/Done.

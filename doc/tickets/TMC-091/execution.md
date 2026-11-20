# TMC-091 QR execution

Assigned parent TMC-091 (#97) and explicit children TMC-009 (#9), TMC-010 (#10), TMC-011 (#11), TMC-017 (#17).
Native parent children additionally include TMC-015 (#15); all five are native leaves, inspected with pagination. Children are CLOSED remotely but source lacks QR services; no automatic reopen/close or Done changes.
Repository: tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM.
Branch: feat/tmc-091-qr-credentials, isolated worktree .tmp-qr-credentials from origin/main 0850dcf (Employee/Gate management merged).

## Ownership and scope

- qr_api: EQR credential/key lifecycle, server signed short-lived tokens, strict online validation, QR contracts and atomic redemption application helper. Any migration authored but not applied.
- qr_ui: client real self QR display and HR lifecycle controls; frontend-design skill.
- qr_verification: small focused security/expiry/replay tests; no broad test matrix.
- Coordinator: shared package exports/scripts, integration, commits/evidence and PR.

Existing GATE scan PREPARED/claim pipeline and TCS execution are not implemented here. Redemption must use caller transaction/attempt; helper evidence is not physical OPEN or cross-station PG race evidence. Never issue from client employeeId, never store private key/raw tokens in DB, browser storage, journal or logs. QR payload exists only transiently for display. Residual live-sharing risk must be documented.

User's lean verification preference retained: API/client build + few essential QR cases. No arbitrary DB apply/seed/reset or deployment. Key material only env/secret provider; public metadata/explicit provisioning documented; no automatic demo operational data.

## Progress

Main/issue intake complete, roles assigned and frozen dependency install initiated. Implementation in progress.

## Final code and lean checks (2026-11-20)

Backend commit d1fe320; frontend commit 9df0886. On committed application code 9df0886:
- pnpm.cmd --dir api test:qr: PASS API build +6/6 focused grouped tests, zero failed/skipped.
- pnpm.cmd --dir client build: PASS TypeScript+Vite; existing chunk-size warning remains.
- git diff --check: PASS.
- Visual: NOT RUN; headless Edge GPU process failed with no screenshot. No visual PASS or real-server browser proof claimed.

| Ticket / checklist / AC | Delivered / evaluation |
| --- | --- |
| Parent TMC-091 refine/assign/integrate | Native children examined; backend/UI/QA ownership above; source integrated, user acceptance pending |
| TMC-009 model/key metadata / AC1 | Credential service serializes on employee and partialunique index prevents multiple active credentials after authorized migration. DB index application/race unverified |
| TMC-009 private material / AC2 | Ed25519 private PEM only server env; DB holds derived public JWK + envreference. Public-field metadata comparison avoids JSONB ordering issues. No private-key fixture/log/DB/browser secret |
| TMC-009 unknown/revoked key / AC3 | Strict crypto/live key checks PASS; VERIFY_ONLY accepted for verification but cannot sign |
| TMC-009 seeded rotation fixture checklist | Tests use generated in-memory ACTIVE/VERIFY_ONLY/REVOKED key fixtures; no operational DB seed performed |
| TMC-010 issue/revoke/refresh / AC1-3 | Selfidentity from real cookie; arbitrary selectors rejected; HRscope lifecycle/audit; fresh jti/hash/expiry; employee-lock five-second throttle. Relevant selfidentity/crypto/live-state tests PASS; full HTTP/PG lifecycle unverified |
| TMC-011 validator / AC1-3 | Format/size/kid/alg/signature/issuer/audience/strictclaims/server expiry and live state; typed results only, sanitized SYSTEM audit, never OPEN or attendance. Six grouped tests cover tampering/expiry/key/fingerprint/revoke |
| TMC-017 UI / AC1-3 | Real server QR component/countdown, independent cookie session, no employee selector; clears expired/offline/refresh errors/logout/account change; periodic serverstate checks; HR controls wired. Build/typecheck PASS, visual/E2E NOT RUN |
| TMC-015 replay helper / AC2 partial | Active caller transaction required; employee lock/live recheck, matching attempt/tokenfingerprint, valid grant/station and atomic insert; duplicate/replay unit adapter PASS |
| TMC-015 AC1/AC3 and parent integrated acceptance | NOT FULLY VERIFIED/INTEGRATED: GATE PREPARED/claim/OPEN path absent, no PG concurrent race/rollback or physical scans. Helper does not imply single physical OPEN. Future gate integration must authenticate station, lookup existing events and recheck before claim |

Migration1794960000000 is hand-authored, reviewed up/down, not DB-diff/generated/applied. It fails safely on pre-existing duplicate active credentials rather than deleting history. No apply/reset/seed/deployment was performed. Existing redemption PK/unique attempt constraint reused; synchronize/migrationsRun false remain.

Key configuration, rollout/rotation, API paths and replay tradeoffs: README.md in this directory. Validation audit intentionally contains no full token. Issuance/audit uses same transaction; raw token transient response only. Real session/DB behavior and migration integration still need authorized-environment verification. Parent/closed children not reopened or marked Done. Await user review; no automatic merge/approval.

PR: https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/pull/112 — OPEN targeting main, awaiting user review/approval. Application checks at9df0886; subsequent commits documentation only.

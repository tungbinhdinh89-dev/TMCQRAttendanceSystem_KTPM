# TMC Access

## Authorization: web routes and API boundaries (TMC-107)

Web pages (`/qr`, `/management`) and backend endpoints (`/api/...`) are separate boundaries.
Every real business API checks the server session and its role/scope; hiding a menu is not authorization.
Use `/dang-nhap` for real username/password login. Legacy role selection and localStorage account IDs
cannot grant access to business pages. The demo bootstrap endpoint and its client fetch have been removed entirely.
Legacy prototype pages are redirected or explicitly unavailable.

| Role | Actual web area | Allowed API capabilities | Denied / not implemented |
| --- | --- | --- | --- |
| EMP | `/qr`, `/mobile/ma-qr` | `/api/qr/self`, `/api/qr/self/code` (and old self token alias), own session only | Employee lists, other employees' QR, account provisioning, configuration, audit |
| HR | `/management?tab=employees`, `tab=organization` read | Scoped `/api/employees/**`, EMP-only account provisioning, QR issue/reissue/revoke, organization lookup | Personal QR without explicit EMP; station/readiness/integration configuration; general role administration |
| SEC | `/management?tab=stations`, `tab=readiness`; `/scanner` with `access:decide` | Scoped station/readiness/organization reads; scoped classroom demo scans with `access:decide` | Employee management, personal QR without EMP, config writes/credentials and integration settings |
| ADM + `iam:manage` | Organization/stations/integrations/readiness administration | Scoped organization/configuration writes, station credentials, integrations and audit read | HR employee CRUD or personal QR unless separately assigned HR/EMP; no wildcard admin bypass |
| HR/SEC + `audit:read` | `/audit` | Scoped audit query | Mutation/deletion of audit; a role label alone does not grant audit permission |
| SUP | Authenticated workspace explaining current availability | Session endpoints | Team attendance/report API remains unimplemented; no fallback to factory-wide HR data |
| EXE | Authenticated workspace explaining current availability | Session endpoints | Aggregate report API remains unimplemented; no employee/account details or SEC role mapping |

All roles can log in, inspect their own session (`GET /api/me`), change password and log out.
`/api/my-profile` is not implemented and is not implied by `/api/me`. Employee history, reporting,
attendance corrections, security reconciliation and general account/role administration are future APIs;
this matrix does not pretend those features are implemented. Station heartbeat uses separate station
bearer credentials, not a human SEC session. OpenAPI describes routes, not a grant to call them.

### Policy rules

- No session: protected APIs return 401. Valid session with insufficient role/scope: 403. Unknown endpoint: 404.
- Temporary-password sessions may inspect session/change password/log out; business data remains blocked.
- Factory/global scope is taken from the SAME assignment granting the capability. HR GLOBAL cannot widen SEC FACTORY or ADM FACTORY.
- Explicit multi-role users combine capabilities. HR+EMP can view only their OWN QR; HR alone cannot retrieve any personal QR payload, even after issuing the credential.
- HR provisioning creates only EMP SELF, not arbitrary roles. This narrow onboarding operation was explicitly requested; it does not make HR an IAM administrator.
- Disabled/inactive users/employees and revoked/expired sessions remain denied by backend authentication.
- Do not use guessed URL parameters or localStorage role flags to authorize data. Server selects self employeeId from session and checks organization scope for managed objects.

Detailed matrix entries are implementation policy derived from the assignment's RBAC/privacy actors and
the approved project workflow; the assignment does not prescribe these exact URL names or every permission.

## Công nghệ và kiểm tra

React, TypeScript, Vite; Astra UI là nguồn component/token; MUI bổ sung bảng, date picker và drawer. React Router, TanStack Query, React Hook Form + Zod, Recharts, Lucide, react-qr-code và html5-qrcode phục vụ nghiệp vụ.

```sh
pnpm install
pnpm build
pnpm --dir api build
pnpm --dir api test
pnpm --dir api test:integration
```

Chạy riêng backend sau khi build:

```powershell
pnpm.cmd --dir api build
pnpm.cmd --dir api start
```

Lệnh `api start` ưu tiên `DATABASE_URL` của terminal, sau đó nạp `api/.env` nếu có. Khi vẫn chưa có `DATABASE_URL`, lệnh đọc host/port/username/pass từ `env-variable.txt` ở root, dùng `DATABASE_NAME` hoặc mặc định `tmc`. Không cần chép thông tin kết nối vào source; thiếu cấu hình sẽ báo lỗi rõ thay vì thử PostgreSQL mặc định ở localhost.

Chạy cả backend và frontend:

```powershell
pnpm.cmd dev:full
```

## Project scripts: Windows, macOS and Linux

Prerequisites: Node.js22+, pnpm, `pnpm install` at repository root, and an existing PostgreSQL database.
The four script pairs share one Node runner; they work from any current directory.
Database config precedence is terminal DATABASE_URL > api/.env > root env-variable.txt.
Secrets stay in api/.env (ignored by Git). Frontend-only mode does not need DB configuration.

| Action | Windows PowerShell | macOS / Linux terminal |
| --- | --- | --- |
| Start FE + BE | `.\scripts\run.ps1` | `./scripts/run.sh` |
| Frontend only | `.\scripts\run.ps1 --frontend` | `./scripts/run.sh --frontend` |
| Backend only | `.\scripts\run.ps1 --backend` | `./scripts/run.sh --backend` |
| Generate migration from entity/DB diff | `.\scripts\add.ps1 AddEmployeeEmail` | `./scripts/add.sh AddEmployeeEmail` |
| Create empty migration for manual SQL | `.\scripts\add.ps1 ManualChange --empty` | `./scripts/add.sh ManualChange --empty` |
| Apply pending migrations | `.\scripts\update.ps1` | `./scripts/update.sh` |
| Check DB + migration list/status | `.\scripts\check.ps1` | `./scripts/check.sh` |

If PowerShell execution policy blocks local scripts, invoke for example:
`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1 --frontend`.
Shell scripts are executable in Git; `bash scripts/run.sh` also works.
Pass `--help` to any script. `--database-name OtherDb` explicitly overrides only the database
name for backend/database commands; otherwise the configured DATABASE_URL target is preserved.

- `run` uses backend PORT (default3000) and frontend VITE_PORT (default5173), builds the API first,
  refuses occupied ports without killing existing apps, and stops companion services when one exits.
  Ctrl+C stops the processes started by this invocation. It never runs migrations or seeds automatically.
- `add Name` builds the API and generates a TypeORM TS migration in
  `api/src/platform/infrastructure/database/migrations/`. Apply existing pending migrations first.
  No schema diff means no file is created. `--empty` works offline. Always review both up/down before update.
- `update` applies only pending migrations with TypeORM transaction mode all and records history.
  A PostgreSQL advisory lock prevents overlapping updates through these scripts. No seed/reset/database creation.
  An already-current DB is a no-op. Missing historical source is an error, not permission to rewrite history.
- `check` is read-only and prints connection status plus every migration as APPLIED, PENDING / NOT APPLIED,
  or MISSING_SOURCE, with totals. Pending alone is a successful check; connection/source errors exit nonzero.
  It does not create a missing database or migration-history table and ignores legacy DB_ACTION values.
- API builds clean dist to avoid running orphaned compiled migrations. Migration scripts execute with API cwd
  and an absolute migrations glob, so launching from another folder gives the same result.

Cross-platform pnpm aliases: `pnpm dev` / `pnpm dev:full` (both), `pnpm dev:client`, `pnpm dev:api`,
`pnpm db:add -- AddEmployeeEmail`, `pnpm db:update`, `pnpm db:check`, `pnpm test:scripts`.
Old db:status/db:show/db:migrate aliases remain compatible; old dev.ps1/migrate.ps1/updatedb.ps1
and the separate db-check.mjs implementation are removed. `test:integration` includes demo seed;
do not use it against business data. Demo seeding remains a separate explicit API command.

Backend NestJS hiện cung cấp session auth tối thiểu:

- `POST /api/auth/login` nhận username/password và trả cookie `HttpOnly` opaque.
- `GET /api/me` kiểm tra session, trạng thái tài khoản và trả role/scope/permission hiện hành.
- `POST /api/auth/logout` thu hồi session hiện tại.

Chạy kiểm thử auth bằng `pnpm --dir api test`; seed và kiểm thử PostgreSQL chạy riêng bằng `pnpm --dir api seed:demo` và `pnpm --dir api test:integration`.

**Limitations:** Real session authentication, scoped employee management and static QR are implemented; kiosk/TCS, attendance and reporting remain outside the completed backend scope. Legacy prototype pages do not authorize business access.

## HR account onboarding and static QR (TMC-106)

This flow uses real backend cookie sessions, without the removed legacy demo role chooser.

1. HR signs in at `/management?tab=employees`, opens an active employee and provisions an account. The account receives only `EMP` with `SELF` scope; HR cannot select privileged roles. Username and employee binding are unique.
2. The generated temporary password is shown once in the successful response. HR hands it directly to the employee. Closing the panel clears it; no password is stored in browser persistence or audit. Email delivery and password recovery are outside this increment.
3. Employee opens `/qr` (also `/mobile/ma-qr`) and signs in. Until they change the temporary password, backend business APIs return `403 AUTH_PASSWORD_CHANGE_REQUIRED`. A new password must be 12–128 characters and differ from the current password. A successful change revokes all sessions; sign in again with the new password.
4. HR explicitly issues the employee's QR credential. The signed static payload contains an opaque credential reference, not employee name, HRS ID or employee code. Employee retrieval returns the same payload across refreshes and logins. HR reissue replaces it and invalidates the previous code.
5. HR revokes QR or marks the employee INACTIVE. Deactivation revokes sessions, QR credentials/tokens and access grants in the existing transaction. An inactive employee cannot log in. Reactivation does not restore revoked QR or access grants; HR must issue/grant again.

QR validation always requires the server to check the live credential, employee and signing-key state. A static code can be copied and is reusable while valid; it is not proof of physical passage. Kiosk/TCS/attendance processing is outside this increment. Direction must come from authenticated station configuration in future gate processing.

### Database and key setup

Schema migrations are authored, not automatically applied. `synchronize` and `migrationsRun` stay false. Review and apply only to your intended configured database using the normal migration workflow:

```powershell
pnpm.cmd --dir api build
pnpm.cmd --dir api exec node --import ./scripts/load-env.mjs ./node_modules/typeorm/cli.js migration:show -d dist/platform/infrastructure/database/data-source.js
# After verifying the intended DATABASE_URL target:
pnpm.cmd --dir api exec node --import ./scripts/load-env.mjs ./node_modules/typeorm/cli.js migration:run -d dist/platform/infrastructure/database/data-source.js
```

New migrations add `users.must_change_password`, persisted static QR payload and nullable QR token expiry. Existing users default to no forced password change; only newly provisioned accounts are forced. Old short-lived QR payloads are not accepted by the static QR validator; HR must reissue legacy credentials. Rollback revokes static tokens before restoring non-null expiry; it does not restore earlier QR codes. Back up before schema deployment.

Signing requires a server-only Ed25519 `QR_PRIVATE_KEY_PEM` and a stable `QR_KEY_ID`; do not commit or send private key material to the browser. Keep the key stable; changing the configured signer must not silently alter a previously issued code. Retiring/revoking verification metadata invalidates associated QR codes. No seed/reset is needed for this feature.

### API reference for this flow

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/employees/:id/account` | HR checks the scoped employee account without password/hash |
| POST | `/api/employees/:id/account` | HR provisions `{username}`; returns generated temporary password once |
| POST | `/api/auth/change-password` | Authenticated `{currentPassword,newPassword}`; invalidates sessions |
| GET | `/api/me` | Session identity, including `mustChangePassword` |
| POST | `/api/employees/:id/qr-credential` | HR issues/reissues signed static QR with reason |
| POST | `/api/employees/:id/qr-credential/revoke` | HR revokes QR with reason |
| GET | `/api/qr/self/code` | EMP retrieves the existing signed static payload |
| POST | `/api/employees/:id/status` | HR changes ACTIVE/INACTIVE with reason and expectedVersion |

The temporary-password response and static QR payload are sensitive. Do not save them in screenshots, console logs or shared evidence.

## iPhone classroom QR scanner (TMC-108)

This is the approved classroom simulation: SEC scans an employee's signed static QR and records a
DEMO attendance event, not proof of physical passage through a turnstile. No TCS command is sent.
The database distinguishes these rows with `attendance_events.source_type = DEMO` and
`evidence_type = DEMO_QR_SCAN`; future payroll/export logic must exclude or explicitly handle demo data.

### Prepare records

1. ADM configures two active stations in the same active factory, one IN and one OUT.
2. HR creates an active employee, current organization assignment, valid factory access grant,
   employee login account and active signed QR credential.
3. Employee logs in on the computer at `/qr` and displays their QR. Complete first-password change first.
4. iPhone operator logs in separately as SEC with `access:decide` and GLOBAL/FACTORY scope.
   HR/EMP/ADM alone cannot use `/scanner`; explicit multi-role grants still combine capabilities.

### HTTPS on the local network

Safari camera access requires a secure context and camera permission:
[MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
Opening `http://<LAN-IP>:5173` is not sufficient for the scanner. The same-origin `/api` Vite proxy
keeps login cookies and API requests on HTTPS without calling an HTTP API from an HTTPS page.
If the API uses another port, set DEV_API_TARGET=http://127.0.0.1:<port> in client/.env.local.

Find the computer's LAN IPv4 (`ipconfig` on Windows), then run from repository root:

```powershell
# Replace with the computer's current LAN IP; keep this terminal open while downloading the CA.
pnpm.cmd https:lan --ip 192.168.1.53 --serve-ca
```

On macOS/Linux use `pnpm https:lan --ip <LAN-IP> --serve-ca`. The helper requires OpenSSL
(uses Git for Windows' bundled OpenSSL when available, or OPENSSL_PATH / openssl on PATH).
It generates/reuses a local CA, signs a90-day LAN certificate, configures client/.env.local TLS paths
and appends exact HTTPS origins in api/.env. It never installs trust automatically, never prints private
keys, and never changes QR signing keys. All CA/TLS files are under ignored `.local-certs/`.
The optional LAN download server serves ONLY the public CA certificate, never a directory or private key.

On the iPhone, on the same LAN:

1. Safari opens `http://<LAN-IP>:5194/tmc-local-ca.cer` and downloads the certificate profile.
2. Install the downloaded profile through Settings > General > VPN & Device Management.
3. Enable full trust for **TMC Classroom Local CA** under Settings > General > About > Certificate Trust Settings.
   Manual certificate installation alone does not enable SSL trust:
   [Apple instructions](https://support.apple.com/en-us/102390).
4. Stop the public CA download helper with Ctrl+C once installed. Restart the app FE/BE to load TLS/origin changes.
5. If Windows requests firewall access, allow the app on the private LAN network; no router port forwarding is needed.
6. Safari opens `https://<LAN-IP>:5173/scanner`, logs in as SEC, selects the configured IN or OUT station,
   then taps **Mo camera quet QR** and allows the rear camera. Point at the QR displayed on the computer.
7. A green result means a demo attendance event was recorded. An information result means the same event
   was already recorded. Denied/unknown/network failure never means successful attendance.
8. Use the next-scan button for the next employee. For exit, select the separate OUT station; direction is
   never inferred by alternating earlier scans and cannot be supplied in the request body.

The page also supports local image capture/selection and a masked payload test input. Images are decoded
in the browser, not uploaded. No raw QR, image or session secret is stored in browser persistence.
On network timeout retry the SAME pending eventId; do not reload or create a fresh scan to guess the result.
Losing the page loses the in-memory retry state; this increment is online-only, not an offline attendance journal.
If the LAN IP changes, rerun the helper with the new IP and restart FE/BE; the CA is retained so it need not
be reinstalled unless the CA itself is replaced. Uninstall the local certificate profile when no longer needed.

### API and database evidence

- `GET /api/scanner/stations`: active stations in the SEC operator's qualifying scope.
- `POST /api/scanner/stations/:id/scans`: body `{eventId, token}` only; session cookie authentication.
  This human-operated DEMO namespace is separate from station bearer-authenticated hardware endpoints.
- Result includes `CLASSROOM_DEMO`, server direction/time, decision, reason, attendance state and minimal employee identity.
- Server verifies active station/factory, QR signature and current revocation/employee state, current assignment and access grant.
- Attempt + demo attendance event/revision + audit commit atomically. Same station/eventId retry is idempotent;
  changed data returns409; rapid same employee/factory/direction within10seconds is denied as duplicate.
- No new tables/migration are needed. Existing QR/account migrations must already be applied. No seed/reset required.

To inspect one scan (use its response attendanceEventId as a bound parameter):

```sql
SELECT e.id, e.source_type, e.evidence_type, r.direction, r.occurred_at, r.activity_factory_id
FROM attendance_events e
JOIN attendance_event_revisions r ON r.event_id=e.id AND r.revision_no=e.current_revision_no
WHERE e.id = $1;
```

Checks: `pnpm --dir api test:scanner`, `pnpm --dir client test:authorization`, `pnpm --dir client build`.
Physical iPhone camera permission/trust and QR readability must still be verified on the actual phone;
desktop mocked browser tests do not prove that hardware behavior.

Launcher troubleshooting: the shared Node runner used by `run.ps1` and `run.sh` waits up to30seconds for the configured API port before
starting Vite. If the backend exits, the frontend is not launched; inspect the backend output
in the launcher terminal. Frontend uses a strict port
instead of silently moving to5174. A502 from the HTTPS /api proxy means the backend is
unavailable; it is not an employee authorization error. Start one launcher instance only.

Camera readability follow-up: the scanner decodes the full video frame rather than a fixed220px crop,
requests rear-camera1280x720 as ideal video constraints, and shows a searching hint after8seconds.
The computer's employee QR is rendered360px with a white quiet zone and black modules. Keep the whole
QR and white border visible; move the phone farther away rather than filling/cropping the camera view.
Regression evidence uses real html5-qrcode decoding of a long QR from canvas video frames, not a mocked
success callback. Camera source/API result are synthetic; physical iPhone focus/lighting still need testing.

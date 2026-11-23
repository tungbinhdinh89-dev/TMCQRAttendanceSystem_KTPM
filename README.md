# TMC Access

Prototype frontend tiếng Việt cho hệ thống chấm công và kiểm soát ra vào bằng QR của TMC Manufacturing.

## Trải nghiệm

- `/`: website giới thiệu, điểm vào mặc định.
- `/dang-nhap`: đăng nhập và chọn một trong sáu vai trò demo.
- `/app`: tổng quan, nhân sự, chấm công, kiểm soát, ca làm, báo cáo, cài đặt.
- `/mobile/trang-chu`: ứng dụng nhân viên với QR động, lịch sử và thông báo.
- `/kiosk`: quét camera hoặc mô phỏng các tình huống tại cổng.

| Tài khoản | Vai trò |
| --- | --- |
| `admin` | Quản trị hệ thống |
| `hr` | Quản lý nhân sự |
| `security` | Quản lý an ninh |
| `guard` | Nhân viên bảo vệ |
| `manager` | Quản lý bộ phận |
| `employee` | Nhân viên |

**Mật khẩu chung: `Tmc@123`.** Mỗi vai trò có trang đích, menu, phạm vi dữ liệu và quyền thao tác riêng.

## Dữ liệu demo và backend

Dữ liệu nền được seed trong PostgreSQL. Frontend client lấy bootstrap data từ `GET /api/demo/bootstrap`; phiên UI hiện tại vẫn dùng `tmc-access-session:v1`.

Thêm/sửa nhân viên, khóa QR, phân ca, duyệt điều chỉnh và quét kiosk đều lưu lại sau khi tải trang. Tab cùng trình duyệt được cập nhật qua sự kiện `storage`.

Quản trị viên có thể vào **Cài đặt hệ thống → Dữ liệu demo → Đặt lại dữ liệu demo** để khôi phục dữ liệu. Giao diện sáng/tối được giữ nguyên.

## Luồng QR

1. Đăng nhập bằng `employee`, mở **Mã QR**.
2. QR có hiệu lực 60 giây; có thể sao chép payload để kiểm tra.
3. Đăng nhập `admin`, `security`, `guard`, hoặc dùng kiosk trải nghiệm công khai.
4. Chọn cổng, mô phỏng quét hoặc dán payload. Camera cần HTTPS/localhost và quyền thiết bị.
5. Lượt hợp lệ ghi nhật ký, luân phiên vào/ra và cập nhật bảng công; lượt lỗi chỉ ghi nhật ký. Quét lặp bị chặn trong 30 giây.

Kiosk có các tình huống hết hạn, khóa QR, sai nhà máy và payload lỗi. Người có quyền được xác nhận thủ công kèm lý do và tên người vận hành.

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

All API launch and database commands load the same configuration: terminal DATABASE_URL first,
then api/.env, then root env-variable.txt as a legacy fallback. No api/env-variable.txt is required.
Starting the app does not create, migrate or seed the database. The API is built before starting
so new routes cannot be missed because of an old dist directory. Stop an existing backend before
starting another on port 3000.

| Command from repository root | Action |
| --- | --- |
| `pnpm.cmd dev` | Frontend only |
| `pnpm.cmd dev:api` | Build/start backend only |
| `pnpm.cmd dev:full` | Build/start backend and frontend |
| `pnpm.cmd db:status` | Read-only connection/table-count check |
| `pnpm.cmd db:show` | Build and list applied/pending migrations; no app server |
| `pnpm.cmd db:migrate` | Build and apply pending migrations to the configured database; no seed |
| `powershell -ExecutionPolicy Bypass -File scripts/updatedb.ps1` | Migrate and check status |
| `powershell -ExecutionPolicy Bypass -File scripts/updatedb.ps1 -Seed` | Explicitly migrate/check AND seed demo data; requires demo secrets |

PowerShell wrappers use `-Frontend`, `-Backend`, `-All`; `-DatabaseName <name>` explicitly overrides
only the database name for that invocation. Otherwise the database in DATABASE_URL is preserved.
`db:status` always stays read-only even when the terminal has a stale DB_ACTION=ensure.
Do not run seed or test:integration against business data; the integration command includes demo seed.

Backend NestJS hiện cung cấp session auth tối thiểu:

- `POST /api/auth/login` nhận username/password và trả cookie `HttpOnly` opaque.
- `GET /api/me` kiểm tra session, trạng thái tài khoản và trả role/scope/permission hiện hành.
- `POST /api/auth/logout` thu hồi session hiện tại.

Chạy kiểm thử auth bằng `pnpm --dir api test`; seed và kiểm thử PostgreSQL chạy riêng bằng `pnpm --dir api seed:demo` và `pnpm --dir api test:integration`.

**Giới hạn:** Backend có bootstrap API cho dữ liệu demo và session auth tối thiểu. Frontend vẫn dùng phiên prototype; các API nghiệp vụ QR, kiosk, attendance và việc tích hợp session vào frontend chưa hoàn chỉnh. Không dùng hệ thống hiện tại để kiểm soát ra vào thực tế.

## HR account onboarding and static QR (TMC-106)

This flow uses real backend cookie sessions, separately from the legacy demo role chooser.

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

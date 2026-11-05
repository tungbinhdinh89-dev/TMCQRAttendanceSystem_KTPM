# TMC Access

Hệ thống chấm công và kiểm soát ra/vào bằng QR cho TMC Manufacturing. Repo dùng pnpm workspace: `client/` (React/Vite), `api/` (NestJS/PostgreSQL), `contracts/` (kiểu dữ liệu giao tiếp dùng chung). Xem [cấu trúc repo](doc/repository-layout.md) và [workflow/API map](doc/work-flow.md).

Đăng nhập hiện dùng **tài khoản PostgreSQL + cookie session HttpOnly**. Điều hướng/phạm vi UI lấy role và scope từ `/api/me`. Các thao tác ghi nghiệp vụ nhân sự, QR, kiosk, công, ca và báo cáo vẫn còn phần prototype; đăng nhập thật không đồng nghĩa mọi màn đã ghi DB hoặc kết nối TCS/HRS thật.

## 1. Yêu cầu và cấu hình

- Node.js **22.12+**, pnpm **10.34.3** theo `.mise.toml`/`packageManager`.
- PostgreSQL đang chạy và truy cập được. Script có thể tạo database khi tài khoản DB có quyền; không tự cài hoặc khởi động dịch vụ PostgreSQL.
- Các lệnh bên dưới chạy tại **root repo** trong Windows PowerShell, trừ khi ghi rõ đổi thư mục. Dùng `pnpm.cmd` để tránh bị chặn bởi `pnpm.ps1`.

```powershell
pnpm.cmd install --frozen-lockfile
```

**Chọn cấu hình DB phù hợp, không ghi thông tin kết nối thật vào Git:**

| Cách | Thao tác | Ưu tiên |
|---|---|---|
| Biến môi trường terminal | Đặt `DATABASE_URL` là PostgreSQL URI đúng host/port/database | Cao nhất |
| File chuẩn | Copy `api/.env.example` thành `api/.env`, sửa `DATABASE_URL` theo DB của bạn | Sau biến môi trường |
| File local đang có | Giữ `api/env-variable.txt` với định dạng `host: <host>: port <port>, username: <user>, pass: <password>` | Khi chưa có DATABASE_URL |

Nếu `api/env-variable.txt` đã trỏ đúng DB, **không cần copy một `api/.env` chứa URL localhost mặc định**; file `.env` đó sẽ được ưu tiên và làm đổi đích kết nối. Biến `DATABASE_NAME` hoặc tham số script `-DatabaseName` cho phép chọn database khác mà giữ host/port/thông tin xác thực.

Frontend dùng `VITE_API_URL`, mặc định `http://localhost:3000/api`. Có thể copy `client/.env.example` thành `client/.env` và sửa biến này khi chạy FE/BE ở địa chỉ khác. Sau khi đổi `.env`, khởi động lại tiến trình tương ứng.

## 2. Chuẩn bị dữ liệu demo

**Mật khẩu tài khoản demo dùng trong runbook: `10091989`.** Đây là mật khẩu test được người dùng chọn, không phải mật khẩu kết nối PostgreSQL. DB chỉ lưu hash; không thể đọc ngược mật khẩu cũ từ DB. Nếu DB đã được seed bằng mật khẩu khác, cần chạy bước chuẩn bị tài khoản dưới đây trước khi dùng mật khẩu này trên UI.

### DB đã có schema và seed nền

```powershell
$env:DEMO_PASSWORD = "10091989"

# Chỉ xem kế hoạch, chưa ghi dữ liệu:
pnpm.cmd --dir api seed:ui

# Áp dụng đúng các tài khoản demo trong kế hoạch:
pnpm.cmd --dir api seed:ui --apply
```

`seed:ui --apply` đặt lại hash mật khẩu của các user demo, bổ sung hai fixture ACTIVE cho SUP/SEC, giữ hai nhân viên REVOKED/INACTIVE để test lỗi. Lệnh không đổi mật khẩu PostgreSQL, không seed lại credential trạm, không chạy migration; nếu thiếu seed nền hoặc ID fixture trùng dữ liệu khác thì dừng/rollback. Chỉ dùng trên DB demo được chọn.

### DB mới / cần setup đầy đủ

Sau khi cấu hình DB:

```powershell
$env:DEMO_PASSWORD = "10091989"
$env:DEMO_STATION_SECRET = "local-station-demo-only"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/updatedb.ps1
# Tương đương:
# powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/db.ps1 -Action setup
```

Bước đầy đủ kiểm tra/tạo DB → build API → chạy migration → seed tổ chức, role, user, quyền và trạm IN/OUT → kiểm tra metadata. **Seed đầy đủ cập nhật cả mật khẩu demo và hash credential trạm** từ các biến trên; khác với `seed:ui`. Có thể đặt hai biến trong `api/.env` local thay vì terminal. Không dùng secret mẫu này cho hệ thống vận hành.

## 3. Chạy chung FE + BE

### Qua lệnh pnpm

```powershell
pnpm.cmd dev:full
```

Lệnh gọi `scripts/dev.ps1`: BE watch/rebuild khi đổi source, FE có HMR. Launcher đợi API sẵn sàng trước khi chạy FE và trỏ FE tới đúng API của lần chạy.

- UI: **http://localhost:5173/dang-nhap**
- API: **http://localhost:3000/api**
- Log API chạy nền: `api/logs/api-<run-id>.out.log` và `.err.log`.
- Dừng bằng `Ctrl+C`; nếu Windows hỏi `Terminate batch job (Y/N)?`, nhập `Y`. Launcher dọn cây tiến trình API do nó tạo; không dừng server có sẵn của người khác.

### Qua script trực tiếp

```powershell
# Dev: BE watch + FE HMR
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1

# Build BE rồi chạy bản dist; FE vẫn chạy Vite dev:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1

# Chọn cổng khác:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 -ApiPort 3001 -ClientPort 5174

# Chọn database khác trên cùng kết nối:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 -DatabaseName tmc_demo
```

Khi chạy chung, launcher đặt `VITE_API_URL` cho tiến trình FE trỏ tới API vừa tạo. Nếu cổng bị chiếm, script báo lỗi thay vì tự kill tiến trình. Không chạy đồng thời thêm một bộ server mặc định trên cùng hai cổng.

## 4. Chạy riêng frontend

```powershell
# Tại root, một trong hai lệnh:
pnpm.cmd dev
pnpm.cmd dev:client

# Hoặc script:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 -Target fe
```

FE mặc định cổng 5173; Figma-managed preview có thể cấp PORT=8443. Chạy FE riêng **không tự chạy BE**; muốn đăng nhập/tải tài khoản DB thì API tại `VITE_API_URL` phải hoạt động.

Chạy thủ công, không qua script root:

```powershell
cd client
pnpm.cmd dev
# Hoặc gọi Vite trực tiếp sau khi đã install:
# node node_modules/vite/bin/vite.js --port 5173
```

## 5. Chạy riêng backend

```powershell
# Watch, tự compile khi source thay đổi:
pnpm.cmd dev:api

# Hoặc build rồi start bản dist:
pnpm.cmd build:api
pnpm.cmd start:api

# Qua scripts:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1 -Target be
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Target be
```

Chạy thủ công trong terminal BE riêng:

```powershell
cd api
pnpm.cmd build
node --import ./scripts/load-env.mjs dist/main.js

# Watch trực tiếp:
# node --import ./scripts/load-env.mjs ./node_modules/@nestjs/cli/bin/nest.js start --watch
```

Dùng preload `load-env.mjs` để nạp cấu hình trước khi tạo DataSource. `node dist/main.js` thuần chỉ đọc biến môi trường đã được đặt, không tự đọc file local.

**Địa chỉ kiểm tra:** `GET /api/me` trả **401 khi chưa đăng nhập**, 200 khi có session hợp lệ. `GET /` và `GET /api` hiện không có controller nên 404 là đúng; cổng 3000 không phục vụ giao diện React.

## 6. Danh mục scripts database

| Script/lệnh | Mục đích | Có ghi dữ liệu? |
|---|---|---|
| `scripts/run.ps1 -Target all/fe/be` | Chạy ứng dụng; mặc định build BE trước | Không tự migrate/seed |
| `scripts/dev.ps1 -Target all/fe/be` | Chạy development, BE watch/FE HMR | Không tự migrate/seed |
| `scripts/db.ps1 -Action status` / `pnpm.cmd db:status` | Kiểm tra DB, user kết nối, số bảng | Chỉ đọc |
| `scripts/db.ps1 -Action ensure` | Kiểm tra/tạo database được chọn | Tạo DB nếu thiếu; cần quyền tương ứng |
| `scripts/migrate.ps1` | Ensure DB, build API, chạy migration | Đổi schema; không seed demo |
| `scripts/db.ps1 -Action seed` | Ensure DB, build và seed toàn bộ demo | Upsert fixture, có thể chạy migration còn thiếu qua seed entrypoint |
| `scripts/updatedb.ps1` / `pnpm.cmd db:setup` | Ensure + migrate + seed + status | Schema và fixture demo |
| `pnpm.cmd --dir api seed:ui` | Xem kế hoạch tài khoản UI | Không ghi |
| `pnpm.cmd --dir api seed:ui --apply` | Chuẩn bị/reset riêng bộ tài khoản UI | Tám user demo và hai hồ sơ ACTIVE bổ sung; giữ credential trạm |

Cú pháp gọi script DB:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/db.ps1 -Action status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/migrate.ps1 -DatabaseName tmc_demo
```

`run.ps1` hiện là launcher ứng dụng; chuẩn bị DB dùng `db.ps1 -Action ensure`, không dùng tên `run.ps1` theo cách cũ. Script dùng đường dẫn theo vị trí repo, không phụ thuộc terminal đang đứng trong `scripts/` hay root.

## 7. Tài khoản seed để test trực tiếp trên UI

Nguồn là các user/role trong PostgreSQL và seed dưới `api/src/platform/infrastructure/database/seeds/`, không phải danh sách account giả trong localStorage. Sau `seed:ui --apply` hoặc seed đầy đủ với DEMO_PASSWORD ở trên, các tài khoản dùng **mật khẩu `10091989`**:

| Username | Nhân viên | Role DB → UI | Scope | Kết quả đăng nhập / chức năng UI |
|---|---|---|---|---|
| `emp.demo` | TMC0001 — Nguyễn Minh Anh | EMP → Nhân viên | Cá nhân trên UI | Vào `/mobile/trang-chu`; xem QR/hồ sơ/công/thông báo của mình; không vào quản trị. |
| `hr.demo` | TMC0002 — Trần Hoàng Nam | HR → Quản lý nhân sự | FACTORY Bình Dương | Nhân sự, công, ca, báo cáo trong scope; không quản trị hệ thống/cổng. Các nút ghi nghiệp vụ còn thuộc prototype nếu API chưa có. |
| `sup.active.demo` | TMC0007 — Giám sát demo | SUP → Quản lý bộ phận | TEAM tổ A, Sản xuất, Bình Dương | Xem tổng quan/công/ca/báo cáo tổ; không duyệt/sửa công, phân ca hoặc phân quyền. |
| `sec.active.demo` | TMC0008 — Bảo vệ demo | SEC → Quản lý an ninh | FACTORY Bình Dương | Nhật ký cổng, kiosk/ngoại lệ mô phỏng, báo cáo an ninh; không sửa công HR hoặc cấu hình trạm. |
| `adm.demo` | TMC0005 — Võ Thanh Hà | ADM → Quản trị hệ thống | GLOBAL | Tổng quan, kiểm soát/cấu hình trạm và cài đặt; không mặc nhiên có quyền HR sửa công hoặc SEC xử lý ngoại lệ. |
| `exe.demo` | TMC0006 — Đặng Tuấn Kiệt | EXE → Ban điều hành | FACTORY Long An | Chỉ xem màn tổng hợp điều hành/báo cáo, không drill-down công cá nhân, không điều khiển cổng. |

Hai tài khoản gốc giữ lại để test từ chối:

| Username | Role | Trạng thái nhân viên | Kết quả đúng |
|---|---|---|---|
| `sup.demo` | SUP | TMC0003 — REVOKED | Mật khẩu đúng vẫn bị từ chối đăng nhập, HTTP 401. |
| `sec.demo` | SEC | TMC0004 — INACTIVE | Mật khẩu đúng vẫn bị từ chối đăng nhập, HTTP 401. |

Các tên cũ `admin`, `hr`, `security`, `guard`, `manager`, `employee` và mật khẩu cũ `Tmc@123` không phải bộ đăng nhập DB được tài liệu này sử dụng. Nút chọn tài khoản chỉ điền username; **không bỏ qua xác thực** và không tự chuyển session/role.

### Cách test nhanh

1. Mở `/dang-nhap`, chọn/nhập username seed, nhập `10091989` và đăng nhập.
2. Kiểm tra trang đích, tên và role trên UI. Reload phải giữ session bằng cookie `tmc_session` HttpOnly; không dùng user ID localStorage làm bằng chứng đăng nhập.
3. Test quyền bằng URL trực tiếp: EMP vào `/app/cai-dat`, EXE vào `/app/kiem-soat`, SUP vào `/app/nhan-su` phải thấy màn **403**. HR vào cài đặt cũng bị chặn.
4. Với SUP, nút sửa/duyệt công và phân ca phải bị ẩn/khóa; với EXE không có bảng tên/giờ công từng cá nhân hoặc nút điều khiển cổng.
5. Đăng xuất rồi thử lại trang riêng tư: phải về đăng nhập; cookie/session backend đã bị thu hồi. Đổi tài khoản cần nhập mật khẩu lại. Các tab chung browser dùng chung cookie; dùng profile/incognito khác nếu muốn test nhiều role đồng thời.
6. Test mật khẩu sai, user không tồn tại, `sup.demo`, `sec.demo`: không được tạo phiên UI hợp lệ.

Xác nhận session bằng dòng lệnh (API đang chạy):

```powershell
$body = @{ username = 'emp.demo'; password = '10091989' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType application/json -Body $body -SessionVariable tmcSession
Invoke-RestMethod -Uri http://localhost:3000/api/me -WebSession $tmcSession
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/logout -WebSession $tmcSession
```

## 8. Build và kiểm tra

```powershell
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd test

# Integration: DB đã migrate/seed; lệnh không tự seed lại:
pnpm.cmd --dir api test:integration
```

Không cần PostgreSQL cho unit/bootstrap test trong `pnpm.cmd test`; integration test dùng DATABASE_URL thật nên phải chọn DB demo đúng.

## 9. Phạm vi hiện thực và xử lý lỗi thường gặp

- Auth login/me/logout dùng DB thật, cookie HttpOnly và role/scope hiện hành. UI đã bỏ kiểm tra mật khẩu cố định và bỏ chuyển tài khoản bằng ID.
- `GET /api/demo/bootstrap` là endpoint phục vụ dữ liệu demo và còn được truy cập công khai; các guard/phạm vi UI **không thay thế authorization của API nghiệp vụ**. Không coi bản demo là hệ thống đã hoàn thiện bảo mật production.
- CRUD nhân sự, QR/kiosk/ghi công/điều chỉnh/CSV trên các màn vẫn còn phần mô phỏng/localStorage. Dữ liệu chưa có trong DB có thể hiển thị 0/rỗng; không phải đã chạy sensor hoặc tích hợp HRS. Không dùng demo để mở cổng thật hoặc tính lương.
- `ECONNREFUSED localhost:5432`: kiểm tra nguồn DATABASE_URL; đừng để file `.env` mặc định ghi đè cấu hình host/port đang dùng. Cổng DB và cổng API 3000 là hai thứ khác nhau.
- `Cannot GET /`: mở UI ở cổng FE, hoặc gọi đúng route có `/api/...` trên BE.
- Sai mật khẩu dù vừa sửa README: README không đổi hash trong DB; chạy preview rồi apply `seed:ui` với DEMO_PASSWORD mong muốn.
- `Port ... already in use`: dừng server cũ bằng terminal đã mở hoặc chọn cổng khác; launcher không tự tắt tiến trình không do nó tạo.
- Nếu từng dùng session localStorage cũ, phiên cũ sẽ bị loại bỏ; đăng nhập lại bằng tài khoản DB. Khi đổi VITE_API_URL cần khởi động lại Vite.

Thiết kế UI: React/TypeScript, Astra UI/Tailwind v4, MUI, React Router và TanStack Query. Font Instrument Sans và ảnh nhà máy nằm trong `client/public`; giấy phép font tại `client/public/fonts/OFL.txt`, ảnh Sam Moghadam / Unsplash.

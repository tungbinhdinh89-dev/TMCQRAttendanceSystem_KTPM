# TMC Access — Hệ thống QR chấm công

Ứng dụng phục vụ bài assignment: HR quản lý nhân viên, cấp tài khoản và QR tĩnh; SEC quét QR để giả lập vào/ra; nhân viên và người được phân quyền tra cứu lịch sử. Frontend React/Vite, backend NestJS/TypeORM, database PostgreSQL. Đây là mô phỏng chấm công trực tuyến; chưa tích hợp cổng vật lý/TCS hay tính lương HRS.

## 1. Chuẩn bị

- Node.js 22 và pnpm 10 (phiên bản dự án trong `.mise.toml`).
- Docker Desktop đang chạy, sử dụng Linux containers.
- OpenSSL khi dùng HTTPS trên iPhone; script hỗ trợ bản kèm Git for Windows.
- Chạy các lệnh dưới đây từ thư mục gốc dự án.

```powershell
pnpm install
```

## 2. PostgreSQL local bằng Docker Desktop

`docker-compose.yml` tạo dịch vụ `postgres` với cấu hình:

| Thông tin | Giá trị |
| --- | --- |
| Database | `tmc-local` |
| Username | `admin` |
| Password | `123456` |
| Host từ backend trên máy tính | `127.0.0.1` |
| Port | `5432` |
| Image | `postgres:18` |
| Volume lưu dữ liệu | `postgres-data` trong Compose project `tmc-local` |

Thông tin đăng nhập trên chỉ dành cho môi trường local của bài tập. Database chỉ mở cổng trên máy tính; iPhone gọi API qua frontend, không kết nối PostgreSQL trực tiếp.

```powershell
docker compose up -d --wait
docker compose ps
docker compose logs --tail 50 postgres
```

Compose có healthcheck `pg_isready`. PostgreSQL 18 dùng volume `/var/lib/postgresql`, theo [hướng dẫn image chính thức](https://hub.docker.com/_/postgres). Dữ liệu nằm trong Docker named volume, không nằm trong thư mục source.

Nếu cổng 5432 đang được một PostgreSQL khác sử dụng, dừng dịch vụ đó hoặc đổi đồng thời cổng host trong Compose và connection string. Không tự dừng container/dịch vụ khác.

### Tạo file kết nối backend

```powershell
.\scripts\setup-local-env.ps1
```

Hoặc dùng Node trên Windows/macOS/Linux:

```sh
node scripts/setup-local-env.mjs
# Cũng có thể dùng: bash scripts/setup-local-env.sh
```

Script tạo hoặc cập nhật **`api/.env`**:

```dotenv
DATABASE_URL="postgresql://admin:123456@127.0.0.1:5432/tmc-local"
```

Script chỉ thay `DATABASE_URL`, giữ nguyên cấu hình khác như khóa ký QR và CORS; không in khóa bí mật, không chạy migration, không tạo dữ liệu mẫu. `api/.env` được Git bỏ qua.

Backend ưu tiên `DATABASE_URL` trong terminal, rồi `api/.env`, cuối cùng `env-variable.txt` cũ. Nếu terminal còn biến kết nối database cũ, xóa biến trong phiên hiện tại trước khi chạy backend:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:TMC_DATABASE_OVERRIDE -ErrorAction SilentlyContinue
```

macOS/Linux dùng `unset DATABASE_URL TMC_DATABASE_OVERRIDE`. Khởi động lại backend sau khi đổi `.env`.

### Tạo bảng bằng migration

Container mới chỉ có database trống. Kiểm tra đúng target rồi áp dụng migration:

```powershell
.\scripts\check.ps1
.\scripts\update.ps1
.\scripts\check.ps1
```

Không dùng TypeORM `synchronize`; dự án để `synchronize=false`, `migrationsRun=false`. Migration không tự seed/reset dữ liệu.

### Seed dữ liệu ban đầu

Sau khi tạo `.env` và chạy migration:

```powershell
.\scripts\seed-data.ps1
# Kiểm tra trong giao dịch rồi rollback, không lưu dữ liệu:
.\scripts\seed-data.ps1 --dry-run
```

macOS/Linux dùng `bash scripts/seed-data.sh`; cả ba hệ điều hành có thể chạy `node scripts/seed-data.mjs`. Nếu PowerShell chặn script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\seed-data.ps1
```

Script chỉ chấp nhận **database `tmc-local` trên localhost**, in host/port/database nhưng không in mật khẩu kết nối. Script build API và yêu cầu migration đã áp dụng; không tự chạy migration, tạo database hoặc reset dữ liệu. Seed nằm trong một giao dịch, lỗi sẽ rollback.

Bộ seed local tái sử dụng hồ sơ/tổ chức/trạm mẫu của dự án; không sao chép hồ sơ hoặc mật khẩu từ database cũ:

- 2 nhà máy Bình Dương (`BD`), Long An (`LA`).
- 3 phòng ban Nhân sự, Sản xuất, Vận hành và 2 tổ A tương ứng hai nhà máy.
- 6 nhân viên/tài khoản hoạt động, 6 role và 3 permission nền tảng.
- 4 trạm `BD-IN`, `BD-OUT`, `LA-IN`, `LA-OUT`; cấu hình tích hợp mô phỏng và access grant nền tảng.
- Chưa tạo QR hay công giả; HR cấp QR trên giao diện trước khi SEC quét. Cần cấu hình khóa ký QR server riêng.

| Role | Tài khoản | Phạm vi seed local |
| --- | --- | --- |
| EMP | `emp.local` | SELF, dữ liệu bản thân |
| HR | `hr.local` | GLOBAL, nhân sự hai nhà máy |
| SUP | `sup.local` | TEAM, tổ sản xuất A tại Bình Dương |
| SEC | `sec.local` | Hai assignment FACTORY riêng: Bình Dương và Long An; scanner có BD-IN/BD-OUT/LA-IN/LA-OUT |
| ADM | `adm.local` | GLOBAL, quản trị hệ thống |
| EXE | `exe.local` | GLOBAL, số liệu tổng hợp |

Mật khẩu ban đầu lấy từ **`DEMO_PASSWORD`** trong terminal hoặc `api/.env`. Nếu chưa đặt, mặc định local là **`TmcLocal@123456`** cho sáu tài khoản. Mật khẩu database vẫn là `123456`, không phải mật khẩu đăng nhập ứng dụng. Đặt `DEMO_PASSWORD` trước lần seed đầu nếu muốn chọn mật khẩu khác; script không in mật khẩu tùy chỉnh.

Tài khoản mẫu đăng nhập ngay; tài khoản HR cấp qua UI vẫn phải đổi mật khẩu tạm lần đầu. Chạy lại khi bộ local đã tồn tại sẽ bỏ qua, giữ nguyên mật khẩu, trạng thái và quyền đã thay đổi; không khôi phục QR đã thu hồi. Nếu có dữ liệu nhân viên/tài khoản khác nhưng chưa có đủ bộ local, script từ chối ghi đè.

`pnpm --dir api seed:demo` là **fixture kiểm thử cũ**, dùng username `.demo`, yêu cầu `DEMO_PASSWORD`/`DEMO_STATION_SECRET` và cố ý vô hiệu SUP/SEC để kiểm tra từ chối đăng nhập. Dùng `seed-data` mới để demo đủ sáu role; không chạy hai bộ seed chồng nhau trên cùng database.

### Quản lý container

```powershell
docker compose stop                 # Dừng, giữ dữ liệu
docker compose start                # Chạy lại
docker compose down                 # Gỡ container/network, giữ named volume
docker compose exec postgres psql -U admin -d tmc-local
```

Không thêm `-v` vào `docker compose down` nếu muốn giữ dữ liệu. `POSTGRES_DB/USER/PASSWORD` khởi tạo khi volume trống; sửa Compose không đổi mật khẩu hoặc database trong volume cũ. Tạo database local không tự chuyển dữ liệu từ server trước đây.

## 3. Chạy frontend và backend

| Công việc | Windows PowerShell | macOS/Linux |
| --- | --- | --- |
| Cả frontend/backend | `.\scripts\run.ps1` | `bash scripts/run.sh` |
| Chỉ frontend | `.\scripts\run.ps1 --frontend` | `bash scripts/run.sh --frontend` |
| Chỉ backend | `.\scripts\run.ps1 --backend` | `bash scripts/run.sh --backend` |
| Tạo migration từ entity/database | `.\scripts\add.ps1 AddEmployeeEmail` | `bash scripts/add.sh AddEmployeeEmail` |
| Migration trống để viết SQL | `.\scripts\add.ps1 ManualChange --empty` | `bash scripts/add.sh ManualChange --empty` |
| Áp dụng migration pending | `.\scripts\update.ps1` | `bash scripts/update.sh` |
| Kiểm tra kết nối/migration | `.\scripts\check.ps1` | `bash scripts/check.sh` |

Nếu PowerShell chặn script, dùng ví dụ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1
```

Các script dùng đường dẫn tương đối với chính file, có thể gọi từ thư mục khác. `--help` hiển thị tham số. `--database-name TenKhac` chỉ đổi tên database cho lệnh backend/database; frontend-only không dùng tùy chọn này.

- Backend mặc định cổng 3000; frontend 5173. Có thể cấu hình `PORT` và `VITE_PORT` với launcher thường.
- Launcher build API trước, chờ cổng backend sẵn sàng rồi mới mở frontend khi chạy cả hai.
- Cổng đã bị chiếm sẽ báo lỗi, không tự tắt tiến trình khác. Ctrl+C dừng các dịch vụ do launcher tạo.
- `check` chỉ đọc: `APPLIED` đã áp dụng, `PENDING` chưa áp dụng, `MISSING_SOURCE` có lịch sử nhưng thiếu source migration.
- `add` sinh migration từ chênh lệch schema; xem lại cả `up/down` trước khi áp dụng. `update` chỉ chạy migration pending, có advisory lock chống chạy đồng thời; không tự tạo database hay seed.

Có thể dùng alias: `pnpm dev`, `pnpm dev:client`, `pnpm dev:api`, `pnpm db:check`, `pnpm db:update`, `pnpm db:add -- AddEmployeeEmail`.

## 4. Dùng iPhone làm máy quét QR

### Chạy ứng dụng trên LAN 192.168.1.53

```powershell
.\scripts\run-expose.ps1              # Cả frontend và backend
.\scripts\run-expose.ps1 --frontend   # Chỉ frontend; backend phải đang chạy cổng 3000
.\scripts\run-expose.ps1 --backend    # Chỉ backend
```

Launcher cấu hình HTTPS cho frontend, proxy `/api` về `http://127.0.0.1:3000`, cập nhật origin trong cấu hình local và giữ CA hiện có khi làm mới chứng chỉ server. File cấu hình/chứng chỉ nằm trong các đường dẫn được Git bỏ qua. Script không tự cài chứng chỉ tin cậy hay đổi firewall. Nếu IP máy tính đổi, cập nhật địa chỉ trong script trước khi dùng.

Dừng launcher cũ trước khi chạy, tránh trùng cổng 3000/5173. iPhone và máy tính phải chung LAN/Wi-Fi; cho phép Node qua firewall mạng riêng nếu Windows hỏi. Không cần mở cổng router.

### Cài chứng chỉ trên iPhone lần đầu

Camera Safari cần HTTPS tin cậy; HTTP qua IP LAN không đủ. Có thể tải chứng chỉ CA công khai bằng terminal riêng:

```powershell
node scripts/lan-https.mjs --ip 192.168.1.53 --serve-ca
```

1. Trên iPhone, mở `http://192.168.1.53:5194/tmc-local-ca.cer` bằng Safari.
2. Cài hồ sơ tại Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị.
3. Bật tin cậy đầy đủ cho **TMC Classroom Local CA** tại Cài đặt chung → Giới thiệu → Cài đặt tin cậy chứng nhận.
4. Dừng terminal phục vụ CA sau khi tải xong, rồi chạy lại FE/BE để nạp HTTPS mới.

Chỉ chứng chỉ CA công khai được phục vụ; không chia sẻ `ca-key.pem`, `lan-key.pem` hoặc khóa ký QR. Xem [hướng dẫn Apple về tin cậy chứng chỉ](https://support.apple.com/en-us/102390).

### Chuẩn bị và quét

1. ADM cấu hình nhà máy đang hoạt động và hai trạm: một `IN`, một `OUT`.
2. HR tạo nhân viên, phân công tổ chức, quyền vào nhà máy, tài khoản đăng nhập và cấp QR.
3. Nhân viên đăng nhập trên máy tính tại `https://192.168.1.53:5173/qr`; đổi mật khẩu tạm trước nếu được yêu cầu.
4. Trên iPhone mở `https://192.168.1.53:5173/scanner`, đăng nhập SEC có `access:decide` và scope GLOBAL/FACTORY phù hợp.
5. Chọn trạm IN hoặc OUT, mở camera sau và cho phép truy cập. Giữ toàn bộ QR cùng viền trắng trong khung hình; nếu không nhận, đưa điện thoại ra xa hơn hoặc chọn ảnh QR để kiểm tra.
6. Chỉ kết quả đã ghi nhận mới xác nhận có sự kiện công; từ chối, lỗi mạng hay trạng thái chưa rõ không được xem là thành công. Timeout thì thử lại cùng lượt quét đang chờ, không tự tạo lượt mới để đoán kết quả.

Hướng vào/ra lấy từ trạm; không tự luân phiên theo lượt trước. Sự kiện mô phỏng có `source_type=DEMO`, `evidence_type=DEMO_QR_SCAN`; không chứng minh đi qua cổng vật lý. Attempt, sự kiện/revision và audit ghi cùng giao dịch. Gửi lại cùng station/eventId không tạo công trùng; thay payload trả 409; quét lặp nhanh cùng người/nhà máy/hướng trong 10 giây bị từ chối. Mô hình hiện tại trực tuyến, không có nhật ký offline.

## 5. Phân quyền và trang nghiệp vụ

Backend kiểm tra session, permission và scope; ẩn menu không thay thế phân quyền API. Không có session trả 401; thiếu quyền trả 403; detail không tồn tại/không nhìn thấy trả 404. Role trong localStorage không cấp quyền. `/api/demo/bootstrap` đã được bỏ.

| Role | Trang/nghiệp vụ |
| --- | --- |
| EMP | `/qr`, `/attendance`: QR và lịch sử của chính mình; không tự sửa công |
| HR | `/management?tab=employees`: hồ sơ, tài khoản EMP, cấp/thu hồi QR; `/attendance` theo phạm vi được giao |
| SUP | `/attendance` trong tổ được giao; cần assignment TEAM với factory/team, không tự có quyền sửa |
| SEC | `/scanner`, `/gate-history` và đọc trạm trong nhà máy được giao; không quản lý bảng công nhân sự |
| EXE | `/attendance-summary`: số tổng hợp theo ngày/nhà máy, không có chi tiết từng người |
| ADM | Quản trị tổ chức/trạm/tích hợp với `iam:manage`; không tự có quyền HR/EMP |
| HR/SEC có `audit:read`, ADM có `iam:manage` | `/audit` trong scope phù hợp; không sửa/xóa audit |

Permission và scope phải thuộc cùng assignment. HR GLOBAL không mở rộng SEC FACTORY. Tài khoản có nhiều role hợp lệ được kết hợp các khả năng, nhưng EMP luôn chỉ xem QR/lịch sử cá nhân. SUP chỉ có FACTORY mà chưa có TEAM sẽ bị từ chối.

### HR cấp tài khoản và QR

HR mở chi tiết nhân viên đang hoạt động để tạo tài khoản EMP SELF. Mật khẩu tạm chỉ hiện một lần; giao trực tiếp cho nhân viên. Nhân viên phải đổi sang mật khẩu 12–128 ký tự khác mật khẩu cũ; đổi thành công thu hồi mọi session và phải đăng nhập lại.

HR cấp QR riêng cho nhân viên. QR tĩnh chứa tham chiếu credential, không chứa tên/mã HRS; payload giữ nguyên khi nhân viên tải lại trang. Cấp lại thay QR cũ. Thu hồi QR có hiệu lực khi máy chủ kiểm tra; cho nhân viên nghỉ còn thu hồi session, credential/token và access grant trong giao dịch. Kích hoạt lại không tự khôi phục quyền/QR cũ.

Backend cần khóa Ed25519 riêng `QR_PRIVATE_KEY_PEM` và `QR_KEY_ID` ổn định. Không đổi khóa tùy tiện, không commit hay đưa khóa ra trình duyệt. Script tạo connection string không tự tạo/thay khóa này. Chưa có luồng gửi email hoặc khôi phục mật khẩu tự động.

## 6. API và Swagger

Mở `http://localhost:3000/api/docs` hoặc `/api/openapi.json`. Đăng nhập bằng tài khoản đã được cấp; Swagger cùng origin dùng cookie HttpOnly. Tài liệu API không tự cấp quyền gọi endpoint.

| Phương thức | Endpoint | Mục đích |
| --- | --- | --- |
| POST | `/api/auth/login` | Đăng nhập username/password |
| GET | `/api/me` | Session và role/scope/permission hiện tại |
| POST | `/api/auth/change-password` | Đổi mật khẩu, thu hồi session |
| POST | `/api/auth/logout` | Đăng xuất |
| GET/POST | `/api/employees/:id/account` | HR xem/cấp tài khoản cho nhân viên trong scope |
| POST | `/api/employees/:id/qr-credential` | HR cấp/cấp lại QR với lý do |
| POST | `/api/employees/:id/qr-credential/revoke` | HR thu hồi QR |
| GET | `/api/qr/self/code` | EMP lấy payload QR đã được cấp |
| POST | `/api/employees/:id/status` | HR đổi ACTIVE/INACTIVE với reason/expectedVersion |
| GET | `/api/scanner/stations` | Trạm hoạt động trong scope SEC |
| POST | `/api/scanner/stations/:id/scans` | Nhận `{eventId, token}`, hướng/thời gian từ server |
| GET | `/api/attendance/history`, `/api/attendance/history/:id` | HR/SUP/EMP đọc lịch sử và chi tiết theo scope |
| GET | `/api/gate/history`, `/api/gate/history/:id` | SEC đọc nhật ký cổng; list hỗ trợ `eventId` |
| GET | `/api/attendance/summary` | EXE đọc số tổng hợp |

Lịch sử có phân trang, `pageSize` tối đa 100; khoảng thời gian tối đa 93 ngày, mặc định 30 ngày. `from` gồm thời điểm đầu, `to` không gồm thời điểm cuối, phải có timezone. Bộ lọc factory/station/employee chỉ thu hẹp phạm vi. API tổng hợp từ chối `employeeId`, bỏ revision voided, không tính giờ công/lương. HR/SUP đọc theo phân công được ghi cùng sự kiện, không lấy tổ hiện tại để thay lịch sử.

Trang hiển thị giờ Việt Nam, có loading/empty/error, chi tiết hỗ trợ `?id=...` sau reload. Không lưu payload QR, mật khẩu hay session secret trong browser storage. `/api/my-profile`, chỉnh sửa công, ghép ca/tính lương và quản trị role tổng quát không được ngầm xem là đã có.

## 7. Kiểm tra và xử lý lỗi

```powershell
pnpm --dir client build
pnpm --dir client test:authorization
pnpm --dir api test:history
pnpm --dir api test:scanner
pnpm test:scripts
```

`pnpm --dir api test:integration` có bước seed dữ liệu; chỉ dùng database test đã chỉ định. Không chạy tùy tiện trên dữ liệu cần giữ.

- **Cổng 3000/5173 đang dùng:** dừng đúng launcher cũ; script không tự kill dịch vụ khác.
- **502 ở `/api/me`:** frontend không kết nối được backend; xem terminal backend và `DEV_API_TARGET`.
- **`/api/me` pending nhưng Swagger trả ngay:** kiểm tra database và log PostgreSQL; session/audit có thao tác ghi nên có thể chờ WAL/ổ đĩa. Dùng `docker compose logs --tail 100 postgres`; không reset dữ liệu để chữa lỗi.
- **Vẫn kết nối database cũ:** kiểm tra biến `DATABASE_URL` trong terminal, file `api/.env`, rồi khởi động lại backend.
- **Thiếu bảng:** kiểm tra target, chạy `check` và `update` để áp dụng migration.
- **QR trả 503:** kiểm tra cấu hình khóa ký server và migration; không tạo QR thay thế trong frontend.
- **Scanner 403 với EMP/HR:** dùng SEC có quyền/scope phù hợp; role nhân viên không phải người vận hành scanner.
- **Camera không mở:** kiểm tra HTTPS tin cậy, quyền camera và mạng LAN. Ảnh/quét trên desktop không chứng minh camera iPhone thật đã hoạt động.

Đã có kiểm tra phân quyền API/UI và truy vấn PostgreSQL chỉ đọc cho lịch sử. Kiểm tra trình duyệt tự động dùng API mô phỏng; vẫn cần nghiệm thu bằng tài khoản thật trên hai trình duyệt và iPhone. Hiệu năng với lịch sử lớn chưa được đo; có thể cần index thời gian sau khi đánh giá query plan.

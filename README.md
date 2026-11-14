# TMC Access

Ứng dụng web kiểm soát truy cập và chấm công. Workspace gồm client/ (React), api/ (NestJS/Express + TypeORM/PostgreSQL) và contracts/ (wire types dùng chung).

## Cấu hình môi trường

Node 22.12 trở lên; pnpm 10.34.3 theo packageManager. Chạy từ repository root:

```powershell
pnpm.cmd install --frozen-lockfile
Copy-Item api/.env.example api/.env
Copy-Item client/.env.example client/.env
```

Chỉ copy khi file chưa tồn tại. Điền DATABASE_URL thật vào api/.env; biến môi trường từ process/deployment có ưu tiên hơn file local. api/.env và client/.env được Git ignore; chỉ commit .env.example với giá trị mẫu. Không dùng file credential dạng text riêng.

- DATABASE_URL: URL PostgreSQL đầy đủ, ví dụ postgresql://user:password@host:5432/database. Percent-encode ký tự đặc biệt trong username/password.
- DATABASE_NAME: tùy chọn ghi đè riêng tên database; không đổi host/credential.
- NODE_ENV: development cho local, production cho triển khai thật. Cookie có Secure trong production, cần HTTPS.
- PORT: cổng API (mặc định 3000).
- CORS_ORIGINS: danh sách origin frontend được phép, phân cách bằng dấu phẩy; không dùng wildcard khi có cookie.
- LOCAL_ACCOUNT_PASSWORD: mật khẩu khi chủ động chuẩn bị tài khoản local. Không phải mật khẩu PostgreSQL.
- VITE_API_URL: URL public của API dùng trong client. Không đưa mật khẩu DB, cookie secret hay token vào VITE_*.

Frontend/API nên dùng cùng hostname (đều localhost hoặc đều hostname triển khai), tránh trộn localhost với 127.0.0.1 khi dùng cookie SameSite=Lax. Khi đổi port frontend, cập nhật CORS_ORIGINS tương ứng. Với triển khai thật, cấp secrets từ môi trường/secret manager, không triển khai các tài khoản local bên dưới.

## Khởi tạo database và tài khoản

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/db.ps1 -Action migrate
# Chỉ xem kế hoạch chuẩn bị tài khoản, chưa ghi DB:
pnpm.cmd --dir api seed:accounts
# Chủ động tạo/cập nhật sáu tài khoản local và băm mật khẩu:
pnpm.cmd --dir api seed:accounts -- --apply
```

Nếu pnpm chuyển tiếp thêm dấu --, script vẫn nhận --apply; cũng có thể dùng:

```powershell
pnpm.cmd --dir api exec node --import ./scripts/load-env.mjs scripts/seed-accounts.mjs --apply
```

Script chỉ chuẩn bị tài khoản, role và phạm vi tổ chức tối thiểu; không tạo ngày công, lượt quét, QR, lịch ca hoặc thông báo. Mỗi lần apply xoay mật khẩu và thu hồi session cũ của các tài khoản local. Bị chặn khi NODE_ENV=production. Không chạy tự động khi khởi động API.

## Tài khoản đăng nhập theo role

Bảng dưới áp dụng sau khi chuẩn bị tài khoản với LOCAL_ACCOUNT_PASSWORD=10091989 (giá trị local trong .env.example). Mật khẩu chỉ được lưu dạng hash trong PostgreSQL. Đây là tài khoản kiểm thử có chủ đích, không phải tài khoản sản xuất.

| Role | Username | Password local | Phạm vi |
| --- | --- | --- | --- |
| EMP — Nhân viên | emp.local | 10091989 | Chỉ hồ sơ và lịch sử của mình |
| HR — Nhân sự | hr.local | 10091989 | Nhà máy được phân công |
| SUP — Giám sát | sup.local | 10091989 | Tổ được phân công |
| SEC — Bảo vệ | sec.local | 10091989 | Nhà máy/trạm được phân công |
| ADM — Quản trị | adm.local | 10091989 | Quản trị; không tự có quyền sửa công HR |
| EXE — Ban điều hành | exe.local | 10091989 | Số liệu tổng hợp, không nhận danh sách hồ sơ |

Đăng nhập tại /dang-nhap: nhập username/password, không chọn role. API kiểm tra user, mật khẩu, trạng thái nhân viên và role assignment đang hiệu lực. Trình duyệt dùng cookie HttpOnly; không lưu session ID hay quyền tự chọn trong localStorage. Logout thu hồi session ở server; có thể đăng nhập tài khoản khác sau đó.

## Chạy ứng dụng

```powershell
pnpm.cmd dev:full
# Hoặc tách frontend/backend:
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Target be
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Target fe
```

Mở http://localhost:5173/dang-nhap. Không chạy thêm server khi port đã có tiến trình sử dụng. Launcher all đợi API sẵn sàng trước khi mở client và dọn tiến trình con khi dừng.

## Trạng thái chức năng

- Auth thật: POST /api/auth/login, GET /api/me, POST /api/auth/logout; cookie HttpOnly, SameSite=Lax, Secure trong production.
- GET /api/workspace/bootstrap yêu cầu session và lọc dữ liệu theo role/scope ở server. Không có bootstrap public liệt kê tài khoản. Không có endpoint demo cũ.
- Hồ sơ/lượt quét/sự kiện chấm công hiển thị từ PostgreSQL. EXE chỉ nhận tổng hợp. Không có dữ liệu thì hiển thị trạng thái rỗng; không tự tạo số liệu.
- Ca làm, ghép ca/tính công ngày, hiệu chỉnh, QR ký bởi server, điều khiển kiosk/TCS và xuất HRS chưa có API hoàn chỉnh. Giao diện ghi rõ chưa khả dụng; không dùng mô phỏng thay thế và không giả báo lưu thành công. Các thao tác ghi chưa có API được ẩn hoặc từ chối rõ ràng.
- Trạng thái trực tuyến của trạm chỉ dựa trên last_seen_at trong 5 phút gần nhất, không suy từ status cấu hình ACTIVE. Không khẳng định đã tích hợp phần cứng.

Đã loại seed dữ liệu vận hành giả và cơ chế sửa DB giả trong trình duyệt. Script seed-accounts.mjs có cờ --remove-legacy để chuyển đúng sáu tài khoản fixture cũ thành tài khoản local và loại hai fixture âm tính đã biết. Nó kiểm tra ID/code và từ chối cleanup nếu có tham chiếu nghiệp vụ; không xóa lịch sử chấm công. Cờ này chỉ dành cho DB development cũ cần chuyển đổi, không chạy mặc định. Migrations đã apply được giữ nguyên.

## Kiểm tra

```powershell
pnpm.cmd typecheck
pnpm.cmd build
pnpm.cmd test
# API phải đang chạy và local accounts đã được chuẩn bị:
pnpm.cmd --dir api test:integration
```

Unit tests tách biệt DB. Integration kiểm tra thật sáu role, mật khẩu sai, cookie, me/logout, scope và không lộ dữ liệu chi tiết cho EXE; không tự reset database hay seed dữ liệu trong test.

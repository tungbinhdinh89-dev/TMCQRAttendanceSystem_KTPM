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
pnpm install
pnpm build
pnpm --dir api build
pnpm --dir api test:integration
```

Chạy cả backend và frontend:

```powershell
$env:DEMO_PASSWORD = "mat-khau-demo"
$env:DEMO_STATION_SECRET = "station-secret-demo"
pnpm --dir api seed:demo
pnpm.cmd dev:full
```

`run.ps1` đọc cấu hình PostgreSQL local từ `api/env-variable.txt` và tạo `DATABASE_URL` chỉ trong process chạy.
Các chế độ chạy:

```powershell
# Mặc định: kiểm tra database, build/chạy API và chạy Vite client
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1

# Chỉ frontend; API phải chạy sẵn tại VITE_API_URL
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1 --frontend

# Chỉ backend; kiểm tra database và build API trước
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\run.ps1 --backend
```

`pnpm.cmd dev` chỉ chạy frontend; `pnpm.cmd dev:full` chạy API và frontend cùng lúc.

Ảnh minh họa: Sam Moghadam / Unsplash, được lưu cục bộ để preview ổn định. Font Instrument Sans được lưu cục bộ; giấy phép ở `public/fonts/OFL.txt`.

**Giới hạn:** Backend hiện có bootstrap API cho dữ liệu demo; auth, scan, attendance và các API ghi nghiệp vụ đầy đủ vẫn đang triển khai theo các ticket tiếp theo. Không dùng hệ thống hiện tại để kiểm soát ra vào thực tế.

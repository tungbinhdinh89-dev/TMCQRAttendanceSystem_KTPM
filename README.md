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

## Dữ liệu demo

Dữ liệu được lưu ở `tmc-access-db:v1`, phiên đăng nhập ở `tmc-access-session:v1`. Bộ mẫu gồm 40 hồ sơ đại diện cho quy mô 1.400 nhân viên tại Bình Dương và Long An.

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
pnpm format src
pnpm exec tsc --noEmit
pnpm build
```

Trong Figma Make, dev server được môi trường quản lý tự động; không cần khởi động server khác.

Ảnh minh họa: Sam Moghadam / Unsplash, được lưu cục bộ để preview ổn định. Font Instrument Sans được lưu cục bộ; giấy phép ở `public/fonts/OFL.txt`.

**Giới hạn:** Đây là prototype không có backend. RBAC chỉ phục vụ trình diễn frontend, QR không có chữ ký bảo mật và không dùng để kiểm soát ra vào thực tế. Dữ liệu không đồng bộ giữa các thiết bị hoặc trình duyệt khác nhau.

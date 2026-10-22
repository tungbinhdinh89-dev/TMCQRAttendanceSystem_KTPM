# Kế hoạch triển khai prototype TMC Access

## 1. Mục tiêu và phạm vi đã chốt

Xây dựng một prototype frontend hoàn chỉnh cho **TMC Access — Hệ thống điểm danh và kiểm soát ra vào bằng mã QR** của TMC Manufacturing, phục vụ khoảng 1.400 nhân viên tại hai nhà máy Bình Dương và Long An.

Các quyết định sản phẩm đã chốt:

- Điểm vào mặc định là **website công khai**.
- Prototype phải **tương tác đầy đủ** nhưng không có backend thật; dữ liệu được seed và lưu bằng `localStorage`.
- Dùng **ma trận 6 vai trò đề xuất** ở mục 5.
- Toàn bộ nội dung giao diện, thông báo, dữ liệu mẫu và định dạng ngày giờ đều bằng tiếng Việt.
- Có đủ bốn trải nghiệm:
  1. Website công khai và đăng nhập.
  2. Dashboard doanh nghiệp có RBAC.
  3. Giao diện mobile cho nhân viên.
  4. Kiosk quét QR tại cổng nhà máy.

Ngoài phạm vi:

- Không xây backend, API mạng, SSO, chữ ký số QR thật, push notification thật hay đồng bộ đa thiết bị.
- Không mô phỏng bảng lương hoặc nghiệp vụ nhân sự ngoài các dữ liệu cần cho chấm công và kiểm soát ra vào.
- Không cam kết camera hoạt động trong mọi iframe/trình duyệt; luôn có chế độ mô phỏng quét để demo không bị chặn bởi quyền thiết bị.

## 2. Hiện trạng repository và ràng buộc

- Repo hiện là scaffold React 19 + TypeScript + Vite 8 + Tailwind CSS 4 tối giản.
- `src/App.tsx` chưa có UI; chưa có router, mock API hoặc dữ liệu mẫu.
- Hai package Astra đã là direct dependency:
  - `@figma/astraui-kit@0.1.3` cung cấp guideline.
  - `@figma/astraui@1.0.0` cung cấp component, token và stylesheet.
- Dev server do môi trường Figma Make quản lý; không khởi động thêm server.
- Astra là nguồn thiết kế chuẩn. MUI chỉ dùng cho những phần Astra không có: bảng dữ liệu, date picker và drawer.
- Không sửa file trong package Astra.

## 3. Dependency và thiết lập nền tảng

### 3.1 Dependency cần bổ sung trực tiếp

Thêm bằng `package.json` rồi chạy `pnpm install`:

- Routing và state server:
  - `react-router-dom`
  - `@tanstack/react-query`
- Form và validation:
  - `react-hook-form`
  - `zod`
  - `@hookform/resolvers`
- Phần bổ sung UI:
  - `@mui/material`
  - `@mui/x-date-pickers`
  - `@emotion/react`
  - `@emotion/styled`
  - `date-fns`
- Trực quan hóa và icon:
  - `recharts`
  - `lucide-react`
- QR:
  - `react-qr-code` để hiển thị QR nhân viên.
  - `html5-qrcode` để đọc camera khi trình duyệt cho phép.

Chỉ import component Astra từ `@figma/astraui`, không import API giao diện từ package kit.

### 3.2 CSS và provider

- Trong `src/index.css`, đặt tất cả `@import` ở đầu:
  - Google Fonts CSS2 cho Instrument Sans.
  - `@figma/astraui/styles.css`.
  - `tailwindcss`.
- Không thêm `@source` cho Astra.
- Dùng token/class ngữ nghĩa của Astra cho màu, chữ, khoảng cách, radius và elevation; không hardcode hex, font size hoặc khoảng cách tùy ý.
- Bọc app theo thứ tự:
  - `ThemeProvider` của Astra.
  - `QueryClientProvider`.
  - `BrowserRouter`.
  - `AuthProvider`.
  - `DemoDatabaseProvider` nếu repository cần lifecycle khởi tạo/reset.
- Thêm một MUI theme bridge nhỏ, ánh xạ typography, palette, radius và trạng thái sang CSS variable Astra; không dùng `CssBaseline` để tránh ghi đè Astra.

## 4. Kiến trúc thư mục

Tổ chức theo domain, không dồn logic vào `App.tsx`:

```text
src/
  app/
    App.tsx
    providers.tsx
    router.tsx
    route-guards.tsx
  components/
    layout/
    feedback/
    data-display/
    forms/
  features/
    public/
    auth/
    dashboard/
    employees/
    attendance/
    access-control/
    shifts/
    reports/
    settings/
    employee-mobile/
    kiosk/
  data/
    types.ts
    seed.ts
    storage.ts
    repositories/
    mock-api.ts
    query-keys.ts
  lib/
    rbac.ts
    qr.ts
    date.ts
    csv.ts
  styles/
    mui-theme.ts
  index.css
  main.tsx
```

Nguyên tắc:

- Component route chỉ điều phối dữ liệu và layout.
- Nghiệp vụ ghi/đọc nằm trong repository/mock API.
- Permission nằm ở một ma trận tập trung, dùng chung cho route guard, navigation và action guard.
- Query key tập trung để mutation invalidation nhất quán.
- Không dùng dữ liệu giả rải rác trong JSX.

## 5. Ma trận 6 vai trò và RBAC

### 5.1 Vai trò

| Mã | Tên hiển thị | Phạm vi |
|---|---|---|
| `SYSTEM_ADMIN` | Quản trị hệ thống | Toàn hệ thống, cả hai nhà máy; cấu hình, người dùng, phân quyền và reset dữ liệu demo |
| `HR_MANAGER` | Quản lý nhân sự | Nhân viên, phòng ban, ca làm, chấm công, điều chỉnh và báo cáo nhân sự |
| `SECURITY_MANAGER` | Quản lý an ninh | Cổng, thiết bị, nhật ký ra vào, cảnh báo, báo cáo an ninh; nhân viên chỉ đọc |
| `GATE_OPERATOR` | Nhân viên bảo vệ | Kiosk, sự kiện tại cổng được phân công, xác nhận thủ công; không sửa hồ sơ nhân sự |
| `DEPARTMENT_MANAGER` | Quản lý bộ phận | Chỉ xem đội nhóm của mình, lịch ca, chấm công nhóm, gửi/xử lý đề nghị điều chỉnh trong phạm vi nhóm |
| `EMPLOYEE` | Nhân viên | Chỉ trải nghiệm mobile: QR cá nhân, ca làm, lịch sử cá nhân, thông báo và hồ sơ |

### 5.2 Permission cụ thể

Định nghĩa permission dạng hằng số, ví dụ:

- `dashboard.view.global`, `dashboard.view.department`
- `employees.read`, `employees.write`
- `attendance.read.all`, `attendance.read.department`, `attendance.read.self`, `attendance.adjust`
- `shifts.manage`, `shifts.read.department`, `shifts.read.self`
- `access.read.all`, `access.scan`, `access.override`, `gates.manage`
- `reports.export.all`, `reports.export.department`
- `settings.manage`
- `mobile.use`

Route guard xử lý truy cập trực tiếp bằng URL:

- Chưa đăng nhập: chuyển tới `/dang-nhap`, giữ `returnTo`.
- Đã đăng nhập nhưng thiếu quyền: hiển thị trang “Bạn không có quyền truy cập”, có nút về trang hợp lệ gần nhất.
- Navigation và action bị ẩn nếu không có quyền; guard vẫn là lớp bảo vệ cuối.

Trang đăng nhập hiển thị sáu tài khoản demo có tên, vai trò, nhà máy/phòng ban và nút điền nhanh. Dùng chung mật khẩu demo `Tmc@123`; thông tin này được ghi rõ trên màn hình. Session lưu riêng khỏi database để reload không làm mất đăng nhập.

## 6. Route map và màn hình

### 6.1 Website công khai

- `/` — landing page:
  - Hero nêu giá trị “Một mã QR, một luồng ra vào liền mạch”.
  - Số liệu bối cảnh: 1.400 nhân viên, 2 nhà máy, nhật ký theo thời gian thực.
  - Ba lợi ích: chấm công nhanh, kiểm soát chính xác, báo cáo tập trung.
  - Quy trình bốn bước từ cấp QR đến báo cáo.
  - Khối giới thiệu Bình Dương và Long An.
  - CTA đăng nhập và CTA mở demo kiosk.
- `/dang-nhap` — form đăng nhập và bộ chọn tài khoản demo.

Landing dùng ảnh Unsplash về công nhân vận hành máy trong nhà máy:

- Ảnh của Sam Moghadam.
- URL: `https://images.unsplash.com/photo-1598299803204-b73796f43289?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBmYWN0b3J5JTIwd29ya2VyJTIwbWFudWZhY3R1cmluZ3xlbnwxfHx8fDE3OTI0ODUwNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080`
- Alt text: “Nhân viên đang vận hành máy móc trong nhà máy”.
- Dùng crop có chủ đích và lớp phủ token để chữ luôn đủ tương phản; ghi attribution nhỏ ở cuối trang.

### 6.2 Dashboard doanh nghiệp

Base route `/app`, chuyển đến route hợp lệ đầu tiên theo vai trò.

- `/app/tong-quan`
  - KPI hôm nay: có mặt, đi muộn, vắng, đang trong nhà máy.
  - Biểu đồ xu hướng 7 ngày.
  - Phân bổ trạng thái theo nhà máy.
  - Danh sách sự kiện/cảnh báo gần nhất.
- `/app/nhan-su`
  - Bảng nhân viên, tìm kiếm, lọc nhà máy/phòng ban/trạng thái.
  - Drawer xem chi tiết.
  - Modal thêm/sửa nhân viên cho người có quyền.
  - Khóa/mở QR và đổi trạng thái làm việc.
- `/app/cham-cong`
  - Bảng công theo ngày, lọc ngày/ca/nhà máy/trạng thái.
  - Tabs “Theo ngày” và “Đề nghị điều chỉnh”.
  - Form tạo hoặc duyệt điều chỉnh theo quyền.
- `/app/kiem-soat`
  - Dòng sự kiện vào/ra, trạng thái hợp lệ/từ chối/cảnh báo.
  - Bộ lọc cổng, nhà máy, loại sự kiện và thời gian.
  - Drawer chi tiết sự kiện và lý do từ chối.
  - Quản lý cổng/thiết bị cho quản trị và quản lý an ninh.
- `/app/ca-lam`
  - Danh sách ca; tạo/sửa ca.
  - Phân ca cho nhân viên hoặc phòng ban.
  - Lịch tuần cô đọng, không xây calendar engine riêng.
- `/app/bao-cao`
  - Chỉ số tổng hợp, biểu đồ Recharts.
  - Lọc khoảng ngày, nhà máy, phòng ban.
  - Xuất CSV thật từ dữ liệu đang lọc.
- `/app/cai-dat`
  - SecondaryNav cho “Hệ thống”, “Cổng & thiết bị”, “Tài khoản demo”, “Dữ liệu demo”.
  - Chuyển light/dark.
  - Reset dữ liệu về seed sau modal xác nhận.

Chi tiết và thao tác phụ dùng drawer/modal thay vì tạo quá nhiều route con. Query string giữ filter chính để reload không mất ngữ cảnh.

### 6.3 Mobile nhân viên

Base route `/mobile`, chỉ `EMPLOYEE` hoặc chế độ xem trước của admin được truy cập:

- `/mobile/trang-chu`
  - Lời chào, trạng thái hôm nay, ca sắp tới, nút mở QR.
- `/mobile/ma-qr`
  - QR động, countdown hết hạn, mã nhân viên, nhà máy được phép.
  - Nút làm mới khi mã hết hạn.
- `/mobile/lich-su`
  - Lịch sử chấm công và ra vào cá nhân, nhóm theo ngày.
- `/mobile/thong-bao`
  - Thông báo ca làm, điều chỉnh và cảnh báo QR.
- `/mobile/tai-khoan`
  - Hồ sơ, phòng ban, nhà máy, cài đặt theme và đăng xuất.

Mobile dùng bottom navigation riêng, safe-area, touch target phù hợp và không ép `SidebarNavigation`. Trên desktop, khung mobile được đặt trong preview shell có lối quay lại dashboard; trên viewport nhỏ, app chiếm toàn màn hình.

### 6.4 Kiosk

- `/kiosk`
  - Full-screen scan surface, đồng hồ, tên nhà máy/cổng và trạng thái kết nối mô phỏng.
  - Chọn nhà máy/cổng trước khi bắt đầu ca kiosk.
  - Tab “Camera” dùng `html5-qrcode`.
  - Tab “Mô phỏng” cho chọn nhanh một nhân viên hoặc dán payload QR.
  - Kết quả hiển thị lớn trong vài giây:
    - Cho phép vào/ra.
    - QR hết hạn.
    - QR không hợp lệ.
    - Nhân viên bị khóa/nghỉ việc.
    - Sai nhà máy.
    - Quét lặp quá nhanh.
  - Có lịch sử 10 lượt quét gần nhất và nút bảo vệ xác nhận thủ công khi có quyền.

Camera chỉ được khởi tạo sau thao tác người dùng, dừng stream khi đổi tab hoặc unmount, và hiển thị hướng dẫn rõ khi bị từ chối quyền. Chế độ mô phỏng luôn khả dụng.

## 7. Thiết kế Astra và cách dùng MUI

### 7.1 Astra là nguồn chuẩn

- Dùng `ThemeProvider` và hỗ trợ light/dark có lưu `astra-theme`.
- Desktop app dùng `SidebarNavigation`/`SidebarButton`; các trang có nhóm con dùng `SecondaryNav`; tabs chỉ dùng cấp nội dung.
- Điều chỉnh nội dung/icon sidebar theo nghiệp vụ TMC nhưng vẫn giữ cấu trúc, mật độ và hành vi Astra.
- Canvas desktop dùng `bg-brand-tertiary`; mỗi vùng nội dung là `bg-surface-bg rounded-corner-lg p-xl`, không thêm shadow/border thừa.
- Dùng Astra:
  - `Button`, `IconButton`, `ButtonGroup`.
  - `InputField`, `TextareaField`, `SelectField`, `SearchComponent`, `Checkbox`, `RadioGroup`, `SwitchField`.
  - `Badge`, `Toast`, `Tooltip`, `Modal`.
  - `Tabs`, `Avatar`, `SidebarNavigation`, `SecondaryNav`.
- Icon chỉ dùng Lucide và xác minh tên icon trước khi import.
- Không viết raw `button`, `input`, `select`, `textarea`, anchor hoặc heading khi Astra/component abstraction có thể đáp ứng.

### 7.2 MUI chỉ là lớp bổ sung

- MUI `Table` cho các bảng nhân viên, chấm công, ra vào.
- MUI X `DatePicker`/`DateRange` composition cho lọc ngày.
- MUI `Drawer` cho panel chi tiết.
- Các component MUI được bọc thành adapter cục bộ để:
  - Nội dung và control bên trong vẫn ưu tiên Astra.
  - Màu/chữ/radius/spacing lấy từ CSS variable Astra.
  - Không lan `sx` hardcode khắp feature.
- Không dùng MUI Button, TextField, Select, Dialog, Badge hoặc navigation khi Astra đã có.

### 7.3 Chất lượng giao diện

- Hệ thống mang cảm giác vận hành nhà máy hiện đại, rõ trạng thái, ít trang trí.
- Brand purple chỉ dành cho CTA, active state và điểm nhấn nhỏ.
- Trạng thái thành công/cảnh báo/lỗi luôn có cả chữ và icon, không chỉ dựa vào màu.
- Dashboard responsive:
  - Desktop: sidebar cố định, grid KPI/biểu đồ.
  - Tablet: grid giảm cột, drawer cho filter phụ.
  - Mobile: bảng chuyển sang card/list ưu tiên trường chính.

## 8. Mô hình dữ liệu và persistence

### 8.1 Entity

- `Site`: Bình Dương, Long An.
- `Gate`: cổng, site, trạng thái thiết bị.
- `Department`.
- `Employee`: mã, họ tên, phòng ban, site, chức danh, trạng thái, ảnh/initials, QR status.
- `UserAccount`: username, role, liên kết employee, phạm vi site/department.
- `Shift`: giờ bắt đầu/kết thúc, ngưỡng đi muộn.
- `ShiftAssignment`.
- `AttendanceRecord`: ngày, check-in/out, trạng thái, nguồn.
- `AttendanceAdjustment`: yêu cầu, lý do, trạng thái duyệt.
- `AccessEvent`: thời điểm, gate/site, hướng vào/ra, kết quả, lý do, operator.
- `Notification`.
- `AppSettings`.

### 8.2 Seed

- Seed đủ dữ liệu đại diện cho cả hai nhà máy, nhiều phòng ban, ca ngày/ca đêm và tất cả trạng thái.
- Không cần tạo 1.400 bản ghi thật; dùng khoảng 30–50 nhân viên chi tiết và KPI mô phỏng tổng quy mô 1.400 nhân viên. Mọi bảng/biểu đồ phát sinh nhất quán từ dataset mẫu hoặc trường summary được ghi rõ.
- Bao gồm sáu tài khoản demo và các tình huống QR hợp lệ, hết hạn, bị khóa, sai nhà máy.

### 8.3 localStorage và mock API

- Database versioned tại `tmc-access-db:v1`.
- Session tại `tmc-access-session:v1`.
- Filter/preference riêng nếu cần; theme do Astra quản lý.
- `storage.ts`:
  - Validate shape và version khi đọc.
  - Seed lại nếu chưa có hoặc dữ liệu hỏng.
  - Ghi nguyên tử một snapshot JSON sau mutation.
- `mock-api.ts` trả Promise với latency ngắn, cố định; không thêm lỗi ngẫu nhiên làm demo thiếu ổn định.
- Mọi mutation cập nhật repository trước, sau đó invalidation đúng query key.
- Nút reset xóa các key TMC, không xóa toàn bộ `localStorage` và không đụng `astra-theme`.

## 9. Contract QR và luồng nghiệp vụ

Payload prototype:

```text
tmc-access:v1:<employeeId>:<issuedAt>:<expiresAt>:<nonce>
```

- QR mobile có TTL 60 giây, countdown hiển thị rõ.
- Đây là payload demo, không gọi là token bảo mật hay chữ ký thật.
- Parser kiểm tra prefix, version, đủ trường, timestamp và employee tồn tại.
- Khi kiosk nhận payload:
  1. Parse và kiểm tra hết hạn.
  2. Kiểm tra trạng thái nhân viên và QR.
  3. Kiểm tra site được phép so với gate hiện tại.
  4. Chặn quét trùng cùng nhân viên trong 30 giây.
  5. Xác định hướng `ENTRY`/`EXIT` từ sự kiện hợp lệ gần nhất trong ngày.
  6. Ghi `AccessEvent`.
  7. Đồng bộ `AttendanceRecord`: entry đầu tiên tạo check-in; exit hợp lệ cập nhật check-out; tính đúng giờ/đi muộn theo ca.
  8. Invalidate query dashboard, access, attendance và mobile history.
- Lượt từ chối vẫn được ghi vào access log kèm reason code, nhưng không thay đổi attendance.
- Override của bảo vệ bắt buộc nhập lý do và ghi operator.

## 10. Form, filter và phản hồi

- Dùng React Hook Form + Zod cho đăng nhập, nhân viên, ca làm, điều chỉnh chấm công và override.
- Tạo controller adapter cho `InputField`, `SelectField`, `Checkbox` và date picker vì Astra dùng callback giá trị thay vì native event.
- Validation tiếng Việt, đặt cạnh trường liên quan và có summary ngắn khi submit lỗi.
- Thành công/thất bại mutation dùng Astra Toast.
- Action nguy hiểm như khóa QR, xóa ca hoặc reset dữ liệu dùng Astra Modal xác nhận.
- Loading có skeleton/surface placeholder; empty state có icon, tiêu đề, mô tả và CTA phù hợp.
- CSV dùng UTF-8 BOM để mở đúng tiếng Việt trong Excel; filename gồm module và khoảng ngày.

## 11. Thứ tự triển khai

1. **Thiết lập nền tảng**
   - Bổ sung dependency.
   - Import Astra CSS/font.
   - Thêm providers, router và cấu hình metadata tiếng Việt trong `.figma/make/site.json`.
2. **Data core**
   - Khai báo type, seed, storage versioning, repository, mock API, query keys.
   - Viết utility ngày giờ, CSV, QR parser/generator.
3. **Auth và RBAC**
   - Session, login presets, role/permission matrix, route/action guards.
4. **Layout và shared UI**
   - Public shell, desktop app shell, mobile shell, kiosk shell.
   - Page header, stat card, empty/loading/error states.
   - MUI adapters theo token Astra.
5. **Website công khai và đăng nhập**
   - Landing hoàn chỉnh, ảnh Unsplash, CTA và login flow.
6. **Dashboard**
   - Tổng quan trước, sau đó nhân sự, chấm công, kiểm soát, ca làm, báo cáo và cài đặt.
7. **Mobile**
   - Trang chủ, QR động, lịch sử, thông báo, tài khoản.
8. **Kiosk**
   - Setup site/gate, scanner camera, simulator, state machine kết quả, override và lịch sử gần nhất.
9. **Polish**
   - Responsive, dark mode, keyboard/focus, content tiếng Việt, RBAC edge cases, reset demo.

## 12. Failure modes và xử lý

- localStorage hỏng/version cũ: seed lại an toàn và báo Toast “Dữ liệu demo đã được khôi phục”.
- Tài khoản không đúng: lỗi tiếng Việt, không tiết lộ chi tiết thừa.
- Route không tồn tại: trang 404 trong shell phù hợp.
- Thiếu quyền: trang 403, không render dữ liệu nhạy cảm trước redirect.
- Camera không hỗ trợ/từ chối quyền: dừng scanner, giải thích và chuyển nhanh sang mô phỏng.
- Payload QR lỗi/hết hạn: trạng thái kiosk rõ ràng, không mutate attendance.
- Mutation trùng/quét nhanh: chặn idempotent bằng cửa sổ 30 giây.
- Không có dữ liệu sau filter: empty state và nút xóa bộ lọc.
- Recharts ở container chưa có kích thước: wrapper có min-height bằng token/composition hợp lệ.
- Mất session khi role bị khóa trong dataset: đăng xuất và quay về login.

## 13. Verification

Không khởi động dev server mới. Dùng server Figma Make đang chạy và hot reload.

### 13.1 Kiểm tra tự động

- Chạy `pnpm format` sau khi hoàn tất thay đổi.
- Chạy `pnpm exec tsc --noEmit` để kiểm tra TypeScript.
- Chạy `pnpm build`; đây là kiểm tra bắt buộc cuối cùng.
- Tìm trong file đã tạo để bảo đảm:
  - Không sửa package Astra.
  - Không có raw interactive HTML bị cấm.
  - Không có màu hex, arbitrary spacing/font size hoặc style inline thay token Astra.
  - Không dùng MUI cho component đã có trong Astra.

### 13.2 Smoke test thủ công trên preview hiện có

1. Mở `/`, kiểm tra landing, CTA và responsive.
2. Đăng nhập lần lượt bằng cả sáu tài khoản demo; xác nhận route mặc định và navigation đúng vai trò.
3. Thử truy cập trực tiếp route không có quyền; xác nhận 403/redirect.
4. Thêm/sửa nhân viên, reload và xác nhận persistence.
5. Tạo/duyệt điều chỉnh chấm công; dashboard và bảng liên quan cập nhật.
6. Lọc báo cáo và tải CSV; xác nhận nội dung tiếng Việt.
7. Mở mobile employee, tạo QR, quét bằng kiosk simulator.
8. Xác nhận các ca hợp lệ, hết hạn, khóa, sai site và duplicate; kiểm tra access log và attendance.
9. Thử camera nếu môi trường cấp quyền; từ chối quyền để kiểm tra fallback.
10. Reset dữ liệu demo; xác nhận seed khôi phục và theme không bị xóa.
11. Kiểm tra light/dark, desktop/tablet/mobile, keyboard focus và độ tương phản trạng thái.

## 14. Tiêu chí nghiệm thu

- `/` là điểm vào mặc định và thể hiện rõ sản phẩm TMC Access bằng tiếng Việt.
- Bốn trải nghiệm public/auth, dashboard, mobile và kiosk đều có route, layout và interaction hoàn chỉnh.
- Sáu vai trò có navigation, dữ liệu và action đúng phạm vi; URL trực tiếp không vượt guard.
- Mutation chính thực sự cập nhật UI và tồn tại sau reload.
- QR mobile có thể được kiosk simulator xử lý và tạo chuỗi access/attendance nhất quán.
- Các trạng thái lỗi QR và camera có fallback rõ, không làm prototype kẹt.
- Astra là nguồn component/token chính; MUI chỉ xuất hiện trong table/date picker/drawer adapter.
- UI polished, responsive, hỗ trợ light/dark và không có text tiếng Anh dành cho người dùng cuối.
- `pnpm exec tsc --noEmit` và `pnpm build` hoàn tất thành công.

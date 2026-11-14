---
name: frontend-design
description: Thiết kế, triển khai hoặc review React web TMC Access trong client/ cho portal theo vai trò, web nhân viên và kiosk QR, dùng Astra/MUI và Tailwind CSS 4.
---

# TMC Access web design

Đọc `AGENTS.md`, `client/AGENTS.md` và hướng dẫn có thật trên nhánh hiện tại:
`client/guidelines/Guidelines.md` hoặc `guidelines/Guidelines.md`. Nếu có `.codex/project-context.md`, đối chiếu với source trước khi dùng. Bắt đầu từ `client/src/App.tsx`, router và feature liên quan.

## Ngữ cảnh sản phẩm

- Giữ tiếng Việt, vai trò EMP/SUP/HR/SEC/ADM/EXE và phạm vi tổ/nhà máy.
- Portal ưu tiên bảng, filter và thao tác có quyền; employee web ưu tiên hiển thị QR/lịch sử cá nhân;
  kiosk ưu tiên scanner và phản hồi dễ đọc. Chỉ triển khai luồng thuộc task.
- Phân biệt access decision, command state, attendance state. UNKNOWN/timeout không hiển thị thành công;
  retry tra cứu không được tự gửi lại OPEN. Trình duyệt không gọi TCS trực tiếp.
- Giữ ranh giới prototype và API thật: chỉ báo đã lưu khi API xác nhận; không dựng số liệu công giả như thật.

## Triển khai

Tái sử dụng `client/src/components/`, feature ở `client/src/features/`, theme bridge ở
`client/src/styles/mui-theme.tsx`. Giữ Astra tokens/styles, MUI tables/pickers/drawers và
Instrument Sans trong public. Tailwind v4 và global theme ở `client/src/index.css`;
giữ thứ tự CSS imports theo guidelines. Không thêm UI kit/router/native runtime không cần thiết.

Sử dụng React DOM, TypeScript, Router và lớp API/session hiện có; contracts chung ở `contracts/src/`.
VITE_API_URL là cấu hình public, không mang secret. UI guards không thay backend authorization.
Giữ metadata và preview hooks trong `client/.figma/`; không tạo lại scaffold ở root.

Thiết kế loading/empty/error, validation và feedback; giữ nội dung form khi lỗi. Responsive cho
desktop/điện thoại/kiosk, focus keyboard, labels, contrast và kích thước thao tác phù hợp.
Thay đổi giao diện cần nhất quán với design/reference được giao, không tự đổi thương hiệu.

## Kiểm tra

Từ root: `pnpm.cmd --dir client typecheck`, `pnpm.cmd --dir client build`;
chạy `pnpm.cmd --dir client test` khi đổi logic/quyền liên quan.
Kiểm tra viewport/keyboard/luồng thực tế bằng công cụ có sẵn; nêu rõ phần chưa xem được.
Không start dev server trùng; dùng PORT của preview hiện tại. Build đạt không chứng minh UI hay API nghiệp vụ đã hoạt động.

## Ticket delivery

For issue-driven work, follow root AGENTS.md: create/reuse a real ticket with unique ID,
labels, scope and AC; branch from origin/main; implement and commit scoped changes;
validate the committed result before push; open a PR targeting main for user review.
Record per-AC evidence and deviations. Do not merge, approve or mark Done before user approval.
Inspect the checked-out branch's manifests; do not assume scripts from another branch exist.

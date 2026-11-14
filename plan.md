# Kế hoạch hoàn thiện TMC Access theo Assignment 1 và Assignment 2

> Bản này nằm **ngoài repository root** `TMCQRAttendanceSystem_KTPM/` để có thể mở trực tiếp trong Explorer. Chưa có code nào được implement theo kế hoạch.

## 1. Phạm vi đã chốt

Mục tiêu là đạt mức tối thiểu để hoàn thành Assignment 1/2, không triển khai toàn bộ sản phẩm HR/payroll.

Lát cắt chính được chọn:

`GATE → ATT`: nhân viên lấy QR có thời hạn → kiosk gửi scan → backend xác thực QR/quyền → lưu attempt → gọi mock TCS → xử lý ALLOW/DENIED/PENDING/UNKNOWN → ghi attendance theo evidence policy → tra cứu trạng thái/lịch sử.

Assignment 2 bắt buộc phải có:

- Giải pháp cho mất kết nối/mất ACK.
- Giải pháp giảm rủi ro QR tĩnh bị lộ/replay.
- Module view, component-and-connector view và allocation view.
- Giải thích SOLID và reflection dựa trên code thật.
- Ít nhất một module chính chạy được theo thiết kế và tuân thủ SOLID.

Phần document/report chỉ được audit lại sau khi code có bằng chứng; không tự tạo thêm workstream tài liệu nếu report hiện tại đã đủ.

## 2. Hiện trạng

### Đã có

- Workspace `client/`, `api/`, `contracts/`.
- Frontend React/Vite có dashboard, nhân sự, chấm công, kiểm soát cổng, ca, báo cáo, mobile employee, kiosk và settings.
- Frontend RBAC/scope navigation và test RBAC.
- Backend NestJS/TypeORM/PostgreSQL foundation.
- Migration/seed và ORM entities cho IAM, EQR, GATE, ATT, RPT, CFG.
- Login thật bằng session cookie HttpOnly, `/api/me`, login/logout.
- `GET /api/demo/bootstrap`.
- Shared contracts cho auth, gate, attendance, employee và reports.
- UI prototype cho QR scan, nhân sự, ca, điều chỉnh công và gate.

### Chưa đạt yêu cầu M2

- Mutation nghiệp vụ frontend còn ghi `localStorage`.
- `AttModule`/`GateModule` chưa có use case/controller/provider nghiệp vụ.
- Chưa có QR động ký/xác minh/redeem/replay protection.
- Chưa có scan API với `eventId`, station authentication và idempotency.
- Chưa có transaction `attempt → command → result → attendance`.
- Chưa có mock TCS adapter hoàn chỉnh.
- Chưa có recovery timeout/mất ACK/UNKNOWN.
- Chưa có backend authorization guard/scope cho business API.
- Chưa có test vertical slice, failure/recovery, E2E/performance.
- Cần audit report về ba views, SOLID/reflection và test evidence.

## 3. Epic → Feature → task nhỏ

### Epic A — Foundation và contracts

#### A1. State model và contract

- Chốt state access attempt, gate command và attendance.
- Chốt `eventId`, `correlationId`, reason code và HTTP error mapping.
- Bổ sung request/response cho scan/status/recovery.
- Acceptance: không diễn giải trạng thái lạ thành “đã mở” hoặc “đã chấm công”; FE/BE dùng cùng semantics.

#### A2. Migration/seed

- Kiểm tra migration cho QR, station credential, attempt, command/history, device event, reconciliation, attendance revision và audit.
- Bổ sung unique/index/constraint cho `eventId`, redemption và command transition.
- Seed employee, grant, station, credential và role/permission tối thiểu.
- Acceptance: DB mới migrate/seed được; seed lặp lại an toàn; replay bị chặn ở DB.

#### A3. Test harness

- Tạo controlled clock/fixture.
- Tạo mock TCS với success/reject/timeout/ACK-only/late callback.
- Viết runbook chạy vertical slice.
- Acceptance: mỗi kết quả TCS chính có test deterministic.

### Epic B — Dynamic QR và replay protection

#### B1. QR issuance/signing

- Tạo `QrSigner`/`QrVerifier` port và implementation.
- Token gồm `jti`, employee, credential, issued/expiry, key ID.
- API chỉ cấp QR cho employee đúng session/scope.
- Không để secret trong frontend bundle/log.
- Acceptance: token hết hạn, sai chữ ký, revoked hoặc sai employee bị từ chối.

#### B2. Redemption/idempotency

- Redemption atomically với attempt.
- Một `jti` không được dùng cho nhiều attempt trái policy.
- Retry cùng `eventId` trả kết quả cũ nếu payload khớp.
- Payload khác với cùng ID trả conflict.
- Acceptance: replay không gọi TCS và không tạo attendance mới.

#### B3. Frontend QR

- Mobile QR lấy token từ API thật.
- Hiển thị countdown/expired/locked.
- Không hiển thị QR cũ như còn hợp lệ khi mất mạng.
- Acceptance: reload lấy token hợp lệ mới; EMP chỉ thấy QR của mình.

### Epic C — Gate access processing (module chính M2)

#### C1. Station auth và scan API

- Xác thực station credential.
- Nhận `eventId` + token và lấy chiều IN/OUT từ station config.
- Kiểm tra station active, factory, access grant, QR.
- Lưu denied attempt; không gọi TCS nếu validation fail.
- Acceptance: request hợp lệ/không hợp lệ có reason code; station secret không ở public client.

#### C2. Durable attempt/command state machine

- Lưu attempt + `OPEN PREPARED` trong transaction.
- CAS/optimistic concurrency cho `DISPATCHING`.
- Append-only command history.
- Không giữ DB transaction khi gọi TCS.
- Xử lý reject, ACK-only, confirmed và unknown.
- Acceptance: crash/timeout không mất attempt; không có hai OPEN cơ sở.

#### C3. Mock TCS adapter

- Implement port `TurnstileGateway` qua DI.
- Có success/reject/timeout/ACK-only/duplicate callback.
- Chuẩn hóa timeout/correlation ID.
- Acceptance: đổi fake adapter không sửa use case; behavior contract có test.

#### C4. Status/recovery/reconciliation

- `GET` status theo event/correlation ID.
- Recovery job cho pending/unknown.
- Reconciliation case cho SEC.
- Không retry OPEN mù.
- Manual resolution có permission/audit.
- Acceptance: mất ACK tra đúng request; not-found không tự kết luận “chưa mở”.

### Epic D — Attendance ledger và history

#### D1. Evidence-based attendance

- ATT use case nhận gate evidence.
- Ghi revision append-only.
- Tách gate state khỏi attendance state.
- Pair IN/OUT theo policy demo.
- Không ghi công khi chỉ ACK/UNKNOWN.
- Acceptance: mỗi lượt hợp lệ tối đa một event; source attempt truy vết được.

#### D2. Scoped history API

- EMP chỉ xem chính mình.
- HR/SUP/SEC/EXE xem theo scope/permission.
- Pagination/filter theo kỳ.
- Không trả raw token/secret.
- Acceptance: negative authorization test chặn dữ liệu ngoài scope.

#### D3. Frontend vertical slice

- Kiosk gọi scan API thật.
- Giữ event ID khi retry/status lookup.
- Attendance/mobile history đọc API thật.
- Hiển thị riêng PENDING/UNKNOWN/CONFIRMED.
- Acceptance: happy path, denied, timeout và retry không tạo dữ liệu trùng.

### Epic E — Authorization và audit

#### E1. Server-side auth/scope

- Authenticated request context từ session cookie.
- Permission guard/policy.
- Scope helper SELF/TEAM/DEPARTMENT/FACTORY/GLOBAL.
- Áp dụng cho QR, scan status, attendance và reconciliation.
- Acceptance: bypass frontend vẫn bị API từ chối khi trái quyền.

#### E2. Structured audit

- Audit login/logout, QR issue/revoke, denied scan, command result, reconciliation và attendance write.
- Ghi actor/action/object/result/correlation/timestamp.
- Redact password, station secret và raw token.
- Ghi cùng transaction với nghiệp vụ quan trọng.
- Acceptance: thao tác nhạy cảm truy vết được và không lộ secret.

### Epic F — Frontend server mode

#### F1. HTTP adapters/query

- Tách local `api.ts` thành adapter theo feature.
- Dùng shared contracts + runtime validation.
- Chuẩn hóa error/problem, timeout, query keys.
- Không để page tự fetch hoặc sửa localStorage server-owned data.
- Acceptance: lát cắt M2 không phụ thuộc localStorage.

#### F2. Session/permission UX

- Giữ route guard cho UX, nhưng quyền thực tế ở server.
- Đồng bộ role/scope từ `/api/me`.
- Xử lý 401/session expiry/403 và cache invalidation khi đổi user.
- Acceptance: đổi user không giữ cache user trước.

### Epic G — Verification và report audit

#### G1. Tests

- QR expiry/signature/revocation/replay/race.
- Station scope/access grant/denied scan.
- Attempt/command transitions.
- Timeout/ACK-only/UNKNOWN/recovery/idempotent retry.
- Attendance evidence và authorization matrix.
- Acceptance: test fail nếu bỏ logic bảo vệ.

#### G2. NFR evidence

- Load scenario đại diện 800 giao dịch/30 phút/nhà máy.
- Đo boundary kiosk API và ghi percentile/môi trường.
- Kiểm tra không mất event khi vận hành bình thường.
- Ghi rõ giới hạn mock TCS.

#### G3. Audit report

- Đối chiếu report với M1: context, scope, FR/NFR, characteristics, styles/trade-offs, logical/physical, decisions, principles.
- Đối chiếu M2: mất kết nối, QR tĩnh, module/C&C/allocation views.
- Kiểm tra SOLID/reflection bám code thật.
- Kiểm tra module code, cách chạy, test evidence và GitHub URL.
- Chỉ tạo task sửa tài liệu nếu audit phát hiện thiếu.

#### G4. Clean run/handoff

- Chạy install/build/typecheck/test từ trạng thái sạch.
- Chạy migration/seed trên DB demo mới.
- Demo happy path và failure paths.
- Kiểm tra secrets/log redaction.
- Cập nhật README/runbook nếu cần.

## 4. Dependency và đường găng

1. A1 → A2 → A3.
2. B1 → B2 → B3.
3. C1 → C2 → C3 → C4.
4. D1 → D2 → D3.
5. E1/E2 tích hợp trước business API hoàn chỉnh.
6. G1 → G2 → G3 → G4.

Đường găng:

`A1/A2 → B1/B2 → C1/C2/C3 → D1 → E1 → D3 → G1 → G3/G4`.

## 5. Ngoài scope tối thiểu M2

- Full HR CRUD, leave/overtime/payroll calculation.
- HRS export production và monthly reconciliation production.
- TCS hardware thật; dùng mock adapter có contract rõ cho assignment.
- Offline edge tự động mở cổng.
- Full dashboard/report cho mọi role.
- Visitor, biometrics, GPS, MFA/SSO nếu không được yêu cầu thêm.

## 6. Điều kiện hoàn thành

- Có một module chính chạy end-to-end qua backend, không dựa localStorage.
- QR có expiry/signature/replay protection.
- Scan có station auth, durable attempt, idempotency và mock TCS.
- Timeout/UNKNOWN có status lookup/recovery/reconciliation.
- Attendance chỉ ghi khi đủ evidence.
- Server-side RBAC/scope/audit có test.
- Frontend hiển thị đúng trạng thái và dùng API thật.
- Build/typecheck/test/clean-run có bằng chứng.
- Report được audit và chỉ bổ sung phần thiếu.


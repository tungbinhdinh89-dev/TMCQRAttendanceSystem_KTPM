# Project Backlog & Delivery Plan — TMC Access

**Ngày đối chiếu:** 2026-11-07 · **Timezone:** Asia/Ho_Chi_Minh (UTC+07:00). **Trạng thái:** Proposed, chưa là cam kết triển khai. Tài liệu này áp dụng [make-doc-skill-plan §23](../plans/make-doc-skill-plan.md#backlog-document-contract) cho repository hiện tại.

Backlog gồm **10 Epic / 36 Feature / 87 ticket**, giữ nguyên `TMC-001…043` và đăng ký mới `TMC-044…087`. Có **82 ticket thực thi và 5 work package** chỉ tổng hợp con. Kịch bản lát cắt M2 + preparation là **133 giờ người**; toàn bộ phần không gồm edge là **224 giờ**, edge tùy chọn **14 giờ**. Đây là estimate cần refine, không phải giờ còn lại đã được owner xác nhận.

| Đi tới | Nội dung |
| --- | --- |
| [1. Baseline](#baseline) | Scope, nguồn, hiện trạng và vai trò |
| [2. Registry](#registry) | ID, nguồn tiến độ, mapping và kế thừa |
| [3. Milestones](#milestones) | Lịch tương đối, effort/capacity và đường găng |
| [4. Epic/Feature](#features) | Danh mục outcome và ticket |
| [5. Requirement coverage](#coverage) | FR/NFR/BR/UC và gaps |
| [6. Master backlog](#master) | Một row chuẩn mỗi ticket; delivery metadata liên kết |
| [7. Ticket details](#details) | Scope, AC, inputs và verification từng ticket |
| [8. Kanban](#kanban) | Pull candidates, WIP, blockers và review |
| [9. GitHub readiness](#github) | Preparation, fields/views/automation và import mapping |
| [10. Evidence/risk](#evidence) | Bằng chứng, deferred work và change log |

<a id="baseline"></a>

## 1. Baseline, scope, roles and planning assumptions

### 1.1. Nguồn và phạm vi được lập kế hoạch

| Nguồn | Vai trò / mức đối chiếu |
| --- | --- |
| [Yêu cầu task](../plans/make-doc-skill-plan.md#backlog-document-contract) | Hợp đồng cấu trúc backlog, ownership, planning và GitHub preparation. Lần này chỉ tạo `doc/backlog.md`. |
| [summary-assigment §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | FR-01…05, INT-01/02, NFR-01…04 và BR-01…06 từ assignment; không sửa requirement cho vừa lịch. |
| [M2](SA_CC_hk261_Assignment_M2.pdf), [spec §2](spec.pdf#page=11) | Đề M2 và mã chi tiết FR-x.y/NFR-x của thiết kế M1. Coverage kế thừa phân tích hiện có; đây không phải lần phân tích lại toàn bộ PDF. |
| [user-flow](user-flow.md), [domain](domain-know-how.md) | UC-01…08, UF-00…09, actor/scope và ngoại lệ. |
| [architecture](structure-architecture.md), [stack](tech-stack.md), [schema](schema-database.md) | Biên module, ORM/migration, transactions, TCS/HRS và các quyết định đích. |
| [workflow §4](work-flow.md#s4), [§15](work-flow.md#s15), [API catalog §19](work-flow.md#s19) | Git, review, DoR/DoD, API IDs; inventory và lịch cũ là snapshot cần đối chiếu source. Naming/type/Project/human-review mới áp theo [plan §16–21](../plans/make-doc-skill-plan.md#tickets-and-backlog). |
| [README](../README.md), [layout](repository-layout.md), [root scripts](../package.json), [API](../api/package.json), [client](../client/package.json) | Kiểm tra bằng đọc file hiện có; không chạy app, DB hoặc suite sản phẩm khi viết tài liệu này. |

**Outcome M2 được đề xuất:** Gate Access & Attendance Event Recording: session → QR ký/ngắn hạn → kiosk xác thực trạm → policy → attempt/lệnh bền vững → mock TCS → evidence → attendance → history; thêm recovery/idempotency/replay và bằng chứng SOLID/ba architectural views. Đề yêu cầu ít nhất một module chính; không tự đổi lựa chọn đó thành triển khai toàn hệ thống.

**Scope toàn hệ thống để thiết kế và lập backlog:** quản trị HR/IAM/CFG/trạm, report/correction/HRS, vận hành/retention. M-06/M-07 là extension chưa cam kết code M2; M-08 là tùy chọn có go/no-go. Visitor management và payroll calculation ngoài phạm vi. TCS/HRS thật, tự động mở offline, MFA, lịch ca/phép/tăng ca chưa được cam kết chỉ vì có màn prototype.

### 1.2. Hiện trạng source và bằng chứng nghiệm thu

| Capability | Quan sát từ file hiện tại | Phần còn thiếu / ticket kiểm tra |
| --- | --- | --- |
| Workspace/UI foundation | `client/`, `api/`, `contracts/`, scripts và `client/.figma/` đã có; Astra có trong manifest | Không tạo scaffold lần nữa; [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-044](#tmc-044). |
| Persistence | Có 37 file business ORM entity, registry, migration/seed; entities thuộc bounded context | DB đã áp migration hay chưa chưa được kiểm tra; [TMC-004](#tmc-004), [TMC-006](#tmc-006). |
| Auth | [AuthService](../api/src/modules/iam/application/auth.service.ts), [controller](../api/src/modules/iam/presentation/auth.controller.ts), contracts/auth và client session/guards đã có | Kiểm tra behavior, audit, quyền server cho business APIs; [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-087](#tmc-087). |
| Demo data | [DemoBootstrapController](../api/src/modules/cfg/presentation/demo-bootstrap.controller.ts) query employees/users/grants/stations không nhận session; [test](../api/test/bootstrap.test.mjs) kỳ vọng anonymous 200 | Source xác nhận đường truy cập rộng; chưa kiểm tra deployment hoặc dữ liệu thật; [TMC-050](#tmc-050). |
| Gate/QR/attendance | Entities, wire types và TurnstileGateway port có; controller hiện quan sát được là auth/me/demo | Chưa thấy use case scan, signer/redeem, writer/worker hay gate simulator chạy được; [TMC-009](#tmc-009), [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-017](#tmc-017), [TMC-018](#tmc-018), [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026). |
| Tests | Node unit/bootstrap/env và client RBAC; integration seed cần DB đã chuẩn bị | Chưa thấy browser E2E/load suite hoặc `.github/workflows`; [TMC-005](#tmc-005), [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-085](#tmc-085). |
| Docs/report | Tài liệu và `report/` có trong working tree | Giữ phần người dùng đang sửa. Chưa xác nhận report được nghiệm thu/nộp; [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-037](#tmc-037). |

`Source-inspected` mô tả artifact đã đọc; `Not run` mô tả verification chưa chạy. Cả hai không thay `Status`. Không có acceptance/merge evidence được cung cấp cho 43 ticket gốc; giữ trạng thái Backlog của nguồn, kèm phần source đã có. Không kết luận tiến độ thực tế bằng 0 và không hạ trạng thái remote chưa khảo sát.

### 1.3. Vai trò, giới hạn và các giả định

| Vai trò | Trách nhiệm / capacity |
| --- | --- |
| User / Solo Developer | Product owner, quyết định scope/priority/capacity, review/accept và merge owner. GitHub identity chưa xác minh. |
| Executor | Người dùng hoặc một AI agent khi được giao ticket. Chưa assign các ticket trong tài liệu; không mở thêm agent tự động. |
| Reviewer | User; nếu required GitHub approval cần danh tính khác author thì chốt reviewer có quyền ở TMC-048. |
| Vendor/policy owner | TMC/đầu mối TCS/HRS và người phê duyệt privacy; chưa được chỉ định, là input trước ticket phụ thuộc. |

- Deadline **2026-12-01** là mục tiêu nội bộ trong workflow cũ, chưa xác nhận deadline LMS. Không tự dời deadline đó hoặc đặt completion date.
- Kịch bản để kiểm tra sức chứa: một người, **6h/ngày × 6 ngày/tuần**, Chủ nhật nghỉ, **20% buffer** cho planning/gián đoạn/rework chưa biết. Net **4.8h/ngày = 28.8h/tuần**; đây là giả định Proposed kế thừa kịch bản cao của lịch cũ, không phải availability đã chốt.
- Mỗi estimate gồm implementation, review, integration, kiểm tra AC và docs liên quan; không cộng thêm giờ AI. Chưa có actual/remaining logs; foundation đã có có thể giảm effort sau [TMC-044](#tmc-044). Các ticket mới thường 1.5–4h, confidence Low; ticket cũ kế thừa estimate, confidence Low–Medium và cần re-estimate.
- Thời gian chờ quyền, vendor hoặc user review chưa có số liệu; lịch tương đối là kịch bản không có external wait, phải thêm độ trễ khi có nguồn. Không suy velocity từ số ticket.
- Múi giờ nghiệp vụ và cách chốt tháng theo thiết kế M1 là Asia/Ho_Chi_Minh; tháng trước, rounding/pairing, evidence policy và ACK vendor phải được owner chốt tại ticket liên quan.

<a id="registry"></a>

## 2. Source of truth, ID registry and remote mapping

`TMC-001…043` là ID kế thừa [workflow §7–8](work-flow.md#s7); anchors `tmc-xxx` ở file cũ vẫn giữ nguyên. `TMC-044…087` được đăng ký **local trong file này**, chưa phải issue GitHub. ID kế tiếp: **TMC-088**. TYPE/Feature/rank thay đổi không đổi ticket ID. Title chuẩn: `[TMC-NNN] [TYPE] [FEATURE-ID] <English imperative title>`.

| Dữ liệu | Nguồn chuẩn tạm thời | Mirror / thời điểm | Cách xử lý lệch |
| --- | --- | --- | --- |
| FR/NFR/BR | summary-assigment và spec có nguồn | Coverage §5, đối chiếu 2026-11-07 | Owner giải quyết mâu thuẫn; không giảm requirement để hợp estimate. |
| Ticket IDs, scope/AC, proposal rank/effort/windows | File này cho bản kế hoạch mới | Phiếu gốc giữ để truy lịch sử | Giữ ID/anchor; ghi rationale khi re-scope hoặc split. |
| Rules/Git/DoR/DoD/API | Workflow và các cập nhật của make-doc-skill-plan | Chỉ dẫn link, không tạo API catalog thứ hai | Plan mới giữ user review/merge gate; khác biệt lifecycle nêu ở §8. |
| Lịch cũ 04/11–01/12, 43 ticket/151h, baseline 38/106h | Workflow như **historical snapshot** | Không dùng làm một lịch execution song song | Chưa sửa workflow vì task chỉ giao backlog; bước chuyển ownership/forward links nằm trong [TMC-044](#tmc-044) khi được giao. |
| Actual Status/Priority/assignee, issue/PR/check/review/merge | Remote nếu đã tồn tại; chưa khảo sát | Local Status là trạng thái kế hoạch, không là remote snapshot | Đọc remote trước import, giữ trạng thái/evidence mới hơn; chưa biết không ghi Not created như kết quả tra cứu. |
| Sau khi chọn GitHub làm execution source | Issue body cho AC; Project cho Status/Priority/Rank/dates; PR cho checks/review/merge | Markdown chỉ snapshot có last-verified và URL thật | TMC-049 đối chiếu từng batch; không hứa sync tự động. |

**Chuyển tiếp ownership:** chỉ bản lịch tương đối ở file này là proposal mới; các bảng cũ chưa được chuyển/xóa hay đồng bộ. Trước khi triển khai, TMC-044 chốt baseline được owner dùng và phần actual đã nghiệm thu; nếu task sau cho sửa workflow, giữ anchors cũ và thêm forward links về file này thay vì duy trì hai lịch active.

**Work package / child mapping:** [TMC-031](#tmc-031) → [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053); [TMC-040](#tmc-040) → [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064); [TMC-041](#tmc-041) → [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068); [TMC-042](#tmc-042) → [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071); [TMC-043](#tmc-043) → [TMC-060](#tmc-060), [TMC-061](#tmc-061). Parent giữ outcome/AC gốc để kiểm tra, không nhận effort riêng và không tạo implementation trùng con. Các phần vượt slice con ghi gap trước Ready.

<a id="milestones"></a>

## 3. Milestones, delivery timeline and capacity

### 3.1. Lịch tương đối và cách tính

`W01/D1` là ngày làm việc đầu tiên **sau khi owner chốt baseline/start**, hiện Pending; mỗi tuần có 6 ngày làm việc. Start/Target trong §6 là **planning windows**, không phải ISO dates hay actual. TMC-044 chuyển sang ngày ISO khi start/calendar/capacity/reviewer sẵn sàng; không import `Wxx/Dx` vào GitHub Date field.

Lịch dùng một pool 4.8h/ngày cho toàn bộ công việc, kể cả preparation/review/test/docs. Xếp dependency trước, rồi milestone/priority/rank; có thể nhiều ticket nối tiếp trong một ngày, không phải capacity chạy đồng thời. Parent chỉ rollup từ con. Nếu ticket đã có code, không trừ giờ bằng phỏng đoán: audit AC/evidence trước.

| Milestone | Goal / requirement–Feature | Planning window | Ticket set / dependencies | Effort người | Net capacity / buffer | Review/test window và exit | Owner / status / risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-00 — Baseline & delivery readiness | A05/A06, I01, J01; NFR-3/4/5; M2-DESIGN | W01/D1 → W01/D4 | [TMC-001](#tmc-001), [TMC-044](#tmc-044), [TMC-045](#tmc-045), [TMC-046](#tmc-046), [TMC-047](#tmc-047), [TMC-048](#tmc-048), [TMC-049](#tmc-049), [TMC-078](#tmc-078); chờ inputs baseline | 16h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Scope/remaining effort, notice tối thiểu và work-management proposal rõ; remote chỉ provision khi được giao. | User; Proposed; chưa nghiệm thu |
| M-01 — Verified foundation & scoped identity | A01…04, B01/B02, C01; NFR-2/3/4/5 | W01/D4 → W02/D4 | [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-004](#tmc-004), [TMC-005](#tmc-005), [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-009](#tmc-009), [TMC-050](#tmc-050), [TMC-087](#tmc-087); chờ M-00 | 29h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Build/test foundation, migration/fixtures và auth kiểm chứng; public bootstrap có ranh giới dữ liệu an toàn. | User; Proposed; chưa nghiệm thu |
| M-02 — QR → kiosk → controlled gate attempt | C01…03, D01…03, E01; FR-2.2…2.7, FR-3.1/3.2; M2-QR | W02/D4 → W03/D3 | [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-017](#tmc-017), [TMC-018](#tmc-018); chờ M-01 | 27h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; QR ký/ngắn hạn, redemption nguyên tử, attempt/CAS và simulator cho phép demo ALLOW/DENY/UNKNOWN. | User; Proposed; chưa nghiệm thu |
| M-03 — Evidence-based attendance & personal history | C03, E01/E02; FR-1.5, FR-3.3/3.6; NFR-2/4 | W03/D4 → W03/D6 | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-086](#tmc-086); chờ M-00, M-01, M-02 | 10h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Passage evidence ghi một nguồn công; EMP xem đúng hồ sơ/công/notice, status có scope. | User; Proposed; chưa nghiệm thu |
| M-04 — Failure recovery & independent verification | F01/F02, G01, H01…03; NFR-1…5; M2-NETWORK | W03/D6 → W04/D6 | [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-027](#tmc-027), [TMC-028](#tmc-028), [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-085](#tmc-085); chờ M-01, M-02, M-03 | 33h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Journal/worker/SEC đối soát, race/crash/load/quyền/redaction/boundary có evidence. | User; Proposed; chưa nghiệm thu |
| M-05 — M2 candidate, review & submission handoff | H04, I01…03; M2-DESIGN/SOLID/CODE/SUBMIT | W04/D6 → W05/D4 | [TMC-032](#tmc-032), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-037](#tmc-037), [TMC-038](#tmc-038); chờ M-00, M-01, M-03, M-04 | 18h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; E2E, views/ADR, SOLID/reflection, clean-run và candidate đúng SHA; user nghiệm thu và tự nộp hoặc giao rõ bước nộp. | User; Proposed; chưa nghiệm thu |
| M-06 — Full administration, corrections & HRS | B03/B04, C04, D04, E03, G02/G03; FR-1/3/4/5 mở rộng | W05/D4 → W07/D6 | [TMC-040](#tmc-040), [TMC-041](#tmc-041), [TMC-043](#tmc-043), [TMC-055](#tmc-055), [TMC-056](#tmc-056), [TMC-057](#tmc-057), [TMC-058](#tmc-058), [TMC-059](#tmc-059), [TMC-060](#tmc-060), [TMC-061](#tmc-061), [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064), [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068), [TMC-072](#tmc-072), [TMC-073](#tmc-073), [TMC-074](#tmc-074), [TMC-075](#tmc-075), [TMC-076](#tmc-076), [TMC-077](#tmc-077), [TMC-083](#tmc-083); chờ M-01, M-02, M-03, M-04 | 67h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; API/UI quản trị, correction, report và immutable export/ACK có test; vendor capability được chốt. | User; Proposed; chưa nghiệm thu |
| M-07 — Operations & approved privacy lifecycle | A07, G01, J01; FR-5.3/5.4, NFR-4/6 | W07/D6 → W08/D5 | [TMC-039](#tmc-039), [TMC-054](#tmc-054), [TMC-079](#tmc-079), [TMC-080](#tmc-080), [TMC-081](#tmc-081), [TMC-082](#tmc-082), [TMC-084](#tmc-084); chờ M-00, M-01, M-04 | 24h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Heartbeat/alerts, restore drill và privacy/hold/retention có policy, quyền và evidence synthetic. | User; Proposed; chưa nghiệm thu |
| M-08 — Optional offline edge investigation | F03; M2-NETWORK/QR mở rộng, NFR-2 | Unscheduled | [TMC-042](#tmc-042), [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071); chờ M-04 | 14h | Dùng chung 28.8h/tuần; buffer 20% ngoài estimate | Review/check trong mỗi ticket; Go/no-go trước prototype; giới hạn partition/replay/revocation và kết quả được owner review. | User; Proposed; chưa nghiệm thu |

M-00 gồm quyết định privacy notice tối thiểu ở TMC-078 để portal M-03 không phụ thuộc một policy chưa có. Retention/hold đầy đủ vẫn là M-07 và cần owner phê duyệt; hoàn tất notice không đồng nghĩa đã chốt retention. TMC-048 chỉ thiết kế review/check policy ở M-00; áp required checks phải đợi CI thật của TMC-005.

### 3.2. Planning windows và kiểm tra capacity

| Nhóm | Effort trực tiếp gồm review/test | Sức chứa giả định | Kết luận |
| --- | --- | --- | --- |
| Lát cắt M2 + preparation M-00…05 | 133h | 28.8h/tuần; tối thiểu 28 ngày làm việc | Proposed, chưa có actual/remaining; chưa kể external wait. |
| Toàn phần non-edge M-00…07 | 224h | Tối thiểu 47 ngày làm việc | Không cam kết trong 4 tuần; extensions cần budget/start riêng. |
| Edge tùy chọn M-08 | 14h | Chưa cấp capacity hoặc start | Chỉ schedule sau go/no-go; không cộng vào cam kết M2. |
| Kiểm tra mục tiêu nội bộ 2026-12-01 | Nếu bắt đầu 2026-11-09, có 20 ngày làm việc tới hết 2026-12-01 | Gross 120h, net **96h** sau buffer | Thiếu **37h** so với scenario lát cắt; không thể báo lịch đạt nếu chưa audit/cắt scope/thêm capacity. |

**Quyết định cần tại TMC-044/TMC-001:** xác nhận deadline thật và giờ còn lại; loại phần foundation đã nghiệm thu khỏi remaining; ưu tiên giữ QR/replay, bằng chứng công, recovery, quyền và test/SOLID bắt buộc. Camera/dashboard P1 và remote setup không cần cho deliverable có thể hoãn nếu owner đồng ý; không tự cắt requirement hoặc giả đã giảm đủ giờ. Ngay cả bỏ hai UI P1 gốc cũng không tự bù toàn bộ gap.

| Planning cadence | Goal / selection | Capacity/reviewer | Milestone | Spillover decision |
| --- | --- | --- | --- | --- |
| Trước W01 | User chốt start/calendar, actual AC và remaining; candidate [TMC-044](#tmc-044) | Giờ review nằm trong pool; chưa có availability riêng | M-00 | Chưa chốt thì windows chỉ là Proposed. |
| Mỗi tuần 6 ngày từ W01 | Pull từ master theo rank/dependency, một outcome chính; không clone issue theo tuần | Net 28.8h tổng, không cộng thêm AI hours | Theo windows §6 | Chưa xong giữ ID; update remaining/target có lý do, không tick Done để giữ lịch. |
| Cuối mỗi outcome hoặc tuần | Demo AC/evidence, rà blocker/rework và quyết định tập pull tiếp | User review trong capacity đã tính; chờ ngoài giờ tạo trễ lịch | M-01…07 | Replan khi review/vendor/policy wait; lưu baseline cũ và impact. |

### 3.3. Dependencies và critical path

Chuỗi chặn lát cắt: `044 → 001 → 002 → 003 → 004/005/006 → 007/009 → 010 → 011/012/013 → 014 → 015 → 016 → 019/020 → 022/023/026 → 024/025 → 029/030 → 051/052/053 + 085 → 031 → 032/033/034/035/036 → 038 → 037`. Đây là đường găng logic; lịch một người còn bị chặn bởi hàng đợi review và các ticket nguồn lực chung không ở chuỗi này.

`078 → 086` chặn notice portal; `050 → 052/053` chặn kiểm chứng scope. HRS extension: `040 → 065 → 066 → 067 → 068 → 041`; offline: `069 → 070 → 071 → 042`, sau quyết định go/no-go. `UNKNOWN` recovery dùng tra cứu/evidence trước, không tự gửi OPEN mới.

<a id="features"></a>

## 4. Epic and Feature inventory

Giữ 28 Feature IDs gốc A01… I03. Bổ sung có nguồn: A05 quản lý delivery, A06 audit hiện trạng, A07 vận hành/restore; B04 IAM backend tách UI B03; C04 HR profile/grants; D04 org/station/config; G03 report/CSV; J01 privacy/retention. English names dưới đây chuẩn hóa để tạo ticket; outcome và linkage gốc vẫn được truy qua ID.

| Epic ID/name | Feature ID/name | Outcome/acceptance | FR/NFR/UC | Owner | Milestones | Ticket IDs | Source/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A — Project Setup & Foundation | A01 — Workspace and client foundation | Packages/entrypoints đúng ownership, preview/build tái lập | NFR-5 | User | M-01 | [TMC-002](#tmc-002) | Kế thừa workflow; chưa nghiệm thu |
| A — Project Setup & Foundation | A02 — Backend architecture and wire contracts | Nest wiring/ports/contracts giữ biên module | NFR-5 | User | M-01 | [TMC-003](#tmc-003) | Kế thừa workflow; chưa nghiệm thu |
| A — Project Setup & Foundation | A03 — Schema and migration foundation | Schema/migration/constraints kiểm tra được trên DB test | FR-3.1, FR-3.3, NFR-2 | User | M-01 | [TMC-004](#tmc-004) | Kế thừa workflow; chưa nghiệm thu |
| A — Project Setup & Foundation | A04 — Test and CI foundation | Node tests/CI/OpenAPI đúng script thực tế | NFR-5 | User | M-01 | [TMC-005](#tmc-005) | Kế thừa workflow; chưa nghiệm thu |
| A — Project Setup & Foundation | A05 — GitHub delivery governance | Registry/labels/Project/views/review gate và import mapping có căn cứ | NFR-3, NFR-5 | User | M-00 | [TMC-045](#tmc-045), [TMC-046](#tmc-046), [TMC-047](#tmc-047), [TMC-048](#tmc-048), [TMC-049](#tmc-049) | Proposed từ gap/requirement; chưa nghiệm thu |
| A — Project Setup & Foundation | A06 — Current-state acceptance audit | Source/AC/evidence/capacity được đối chiếu trước khi pull | M2-DESIGN, NFR-5 | User | M-00 | [TMC-044](#tmc-044) | Proposed từ gap/requirement; chưa nghiệm thu |
| A — Project Setup & Foundation | A07 — Operations and disaster recovery | Health/backup/restore có đo kiểm và người xử lý | FR-5.3, NFR-3, NFR-6 | User | M-07 | [TMC-054](#tmc-054), [TMC-084](#tmc-084) | Proposed từ gap/requirement; chưa nghiệm thu |
| B — Authentication & Employee Foundation | B01 — Identity, scoped sessions and seed | Danh tính/session/scope được kiểm tra ở server | FR-1.1, FR-1.5, FR-1.6, FR-2.1, FR-4.6, FR-5.1, M2-SOLID, NFR-3, NFR-4, NFR-5 | User | M-01 | [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-050](#tmc-050), [TMC-087](#tmc-087) | Kế thừa workflow; chưa nghiệm thu |
| B — Authentication & Employee Foundation | B02 — Authenticated client navigation | UI dùng session thật, không tự nâng quyền | FR-1.5, FR-5.1, NFR-3 | User | M-01 | [TMC-008](#tmc-008) | Kế thừa workflow; chưa nghiệm thu |
| B — Authentication & Employee Foundation | B03 — IAM administration interface | ADM thao tác UI trong quyền, backend riêng B04 | FR-5.1 | User | M-06 | [TMC-043](#tmc-043), [TMC-060](#tmc-060), [TMC-061](#tmc-061) | Kế thừa workflow; chưa nghiệm thu |
| B — Authentication & Employee Foundation | B04 — IAM administration APIs | Quản trị user/role/scope không self-escalation | FR-4.6, FR-5.1, NFR-3 | User | M-06 | [TMC-058](#tmc-058), [TMC-059](#tmc-059) | Proposed từ gap/requirement; chưa nghiệm thu |
| C — QR Credential Management | C01 — Credential and signed QR lifecycle | Cấp/thu hồi QR ngắn hạn có key metadata | FR-1.2, FR-1.3, FR-1.4, FR-5.2, M2-QR | User | M-01, M-02 | [TMC-009](#tmc-009), [TMC-010](#tmc-010) | Kế thừa workflow; chưa nghiệm thu |
| C — QR Credential Management | C02 — QR validation and replay prevention | Chữ ký/expiry/revocation và redemption nguyên tử | FR-2.2, FR-3.2, M2-QR, NFR-3 | User | M-02 | [TMC-011](#tmc-011), [TMC-015](#tmc-015) | Kế thừa workflow; chưa nghiệm thu |
| C — QR Credential Management | C03 — Employee QR and personal portal | EMP chỉ xem QR/hồ sơ/công của mình | FR-1.3, FR-1.5, M2-QR, NFR-4 | User | M-02, M-03 | [TMC-017](#tmc-017), [TMC-086](#tmc-086) | Kế thừa workflow; chưa nghiệm thu |
| C — QR Credential Management | C04 — Employee records and factory grants | HR quản lý hồ sơ/phân công/quyền có lịch sử/audit | FR-1.1, FR-1.4, FR-1.6, FR-4.6 | User | M-06 | [TMC-055](#tmc-055), [TMC-056](#tmc-056), [TMC-057](#tmc-057) | Proposed từ gap/requirement; chưa nghiệm thu |
| D — Gate Kiosk & Access Control | D01 — Server-side access policy | Quyết định dựa trên trạm/quyền/state server | FR-1.6, FR-2.2 | User | M-02 | [TMC-012](#tmc-012) | Kế thừa workflow; chưa nghiệm thu |
| D — Gate Kiosk & Access Control | D02 — Turnstile commands and simulator | CAS trước I/O; ACK/OPEN/PASSAGE/UNKNOWN riêng | FR-2.3, FR-2.7, FR-3.2, INT-02, NFR-5 | User | M-02 | [TMC-013](#tmc-013), [TMC-016](#tmc-016) | Kế thừa workflow; chưa nghiệm thu |
| D — Gate Kiosk & Access Control | D03 — Virtual and camera kiosk | UI quét/status/recovery phản ánh kết quả thật | FR-2.4, NFR-1, UC-01 | User | M-02, M-04 | [TMC-018](#tmc-018), [TMC-027](#tmc-027) | Kế thừa workflow; chưa nghiệm thu |
| D — Gate Kiosk & Access Control | D04 — Organization and station administration | CFG/GATE sở hữu dữ liệu và lifecycle cấu hình/trạm | FR-1.1, FR-2.1, FR-2.7, FR-5.2, NFR-3 | User | M-06 | [TMC-072](#tmc-072), [TMC-073](#tmc-073), [TMC-074](#tmc-074), [TMC-083](#tmc-083) | Proposed từ gap/requirement; chưa nghiệm thu |
| E — Attendance Event Recording | E01 — Idempotent attempts and attendance ledger | Attempt/command và nguồn công không bị ghi trùng | FR-2.3, FR-3.1, FR-3.2, FR-3.3, NFR-2 | User | M-02, M-03 | [TMC-014](#tmc-014), [TMC-019](#tmc-019) | Kế thừa workflow; chưa nghiệm thu |
| E — Attendance Event Recording | E02 — Scoped attendance history and status | Lookup/history API/UI không vượt scope | FR-1.5, FR-3.6, FR-4.2, NFR-3, UC-02 | User | M-03 | [TMC-020](#tmc-020), [TMC-021](#tmc-021) | Kế thừa workflow; chưa nghiệm thu |
| E — Attendance Event Recording | E03 — Attendance pairing and corrections | Ghép khoảng/revision/CAS giữ event gốc | FR-1.5, FR-3.4, FR-3.5, NFR-2, NFR-3, UC-05 | User | M-06 | [TMC-040](#tmc-040), [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064) | Kế thừa workflow; chưa nghiệm thu |
| F — Failure Handling & Recovery | F01 — Network failure design and kiosk journal | Phục hồi request cùng eventId, không OPEN mù | FR-3.2, FR-3.6, M2-NETWORK, NFR-6 | User | M-04 | [TMC-022](#tmc-022), [TMC-023](#tmc-023) | Kế thừa workflow; chưa nghiệm thu |
| F — Failure Handling & Recovery | F02 — Durable reconciliation and exceptions | Jobs/fencing/SEC/MANUAL giữ nguồn chứng cứ | FR-2.5, FR-2.7, FR-3.6, FR-4.2, M2-NETWORK, NFR-2 | User | M-04 | [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026) | Kế thừa workflow; chưa nghiệm thu |
| F — Failure Handling & Recovery | F03 — Optional autonomous offline edge | Chỉ prototype khi policy/quyền và partition limits được chốt | M2-NETWORK, M2-QR, NFR-2 | User | M-08 | [TMC-042](#tmc-042), [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071) | Kế thừa workflow; chưa nghiệm thu |
| G — Dashboard & Monitoring | G01 — Operational dashboard and heartbeat | Metrics có scope/timestamp, không suy physical health | FR-2.6, FR-4.1, FR-5.3, UC-07 | User | M-04, M-07 | [TMC-028](#tmc-028), [TMC-039](#tmc-039) | Kế thừa workflow; chưa nghiệm thu |
| G — Dashboard & Monitoring | G02 — Monthly snapshot and HRS delivery | Snapshot/version/ACK/retry đúng kỳ và hạn HRS | FR-4.3, FR-4.4, FR-4.5, INT-01, NFR-2 | User | M-06 | [TMC-041](#tmc-041), [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068) | Kế thừa workflow; chưa nghiệm thu |
| G — Dashboard & Monitoring | G03 — Scoped reports and CSV | SUP/EXE/SEC/HR thấy đúng projection và export được audit | FR-4.1, FR-4.2, FR-4.6, FR-4.7, NFR-3, NFR-4 | User | M-06 | [TMC-075](#tmc-075), [TMC-076](#tmc-076), [TMC-077](#tmc-077) | Proposed từ gap/requirement; chưa nghiệm thu |
| H — Testing & Quality Assurance | H01 — Core and architecture verification | Test PostgreSQL/ports/boundaries có evidence | FR-3.1, FR-3.2, FR-3.3, M2-SOLID, NFR-2, NFR-5 | User | M-04 | [TMC-029](#tmc-029), [TMC-085](#tmc-085) | Kế thừa workflow; chưa nghiệm thu |
| H — Testing & Quality Assurance | H02 — Concurrency and failure verification | Race/crash/recovery không lặp tác động vật lý | M2-NETWORK, M2-QR, NFR-2 | User | M-04 | [TMC-030](#tmc-030) | Kế thừa workflow; chưa nghiệm thu |
| H — Testing & Quality Assurance | H03 — Performance, authorization and privacy verification | NFR-1/3/4 được đo/kiểm tra riêng | FR-1.5, FR-2.4, FR-4.6, FR-5.1, NFR-1, NFR-3, NFR-4 | User | M-04 | [TMC-031](#tmc-031), [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053) | Kế thừa workflow; chưa nghiệm thu |
| H — Testing & Quality Assurance | H04 — End-to-end and release verification | Demo/visual/acceptance trên revision cuối | M2-CODE, M2-SUBMIT, NFR-1, UC-01, UC-02, UC-04 | User | M-05 | [TMC-032](#tmc-032), [TMC-038](#tmc-038) | Kế thừa workflow; chưa nghiệm thu |
| I — Documentation & Submission | I01 — Scope and architecture views | Baseline/ADR/module/C&C/allocation view khớp source | M2-CODE, M2-DESIGN, M2-NETWORK, M2-QR, M2-SOLID, NFR-6 | User | M-00, M-05 | [TMC-001](#tmc-001), [TMC-035](#tmc-035) | Kế thừa workflow; chưa nghiệm thu |
| I — Documentation & Submission | I02 — SOLID evidence and reflection | Giải thích từ source/tests thật | M2-SOLID, NFR-5 | User | M-05 | [TMC-033](#tmc-033), [TMC-034](#tmc-034) | Kế thừa workflow; chưa nghiệm thu |
| I — Documentation & Submission | I03 — Runbook, report and submission | README/report/URL và handoff có nguồn | M2-CODE, M2-SUBMIT, NFR-5 | User | M-05 | [TMC-036](#tmc-036), [TMC-037](#tmc-037) | Kế thừa workflow; chưa nghiệm thu |
| J — Privacy & Retention (proposed extension) | J01 — Privacy policy and retention workflow | Policy/hold/anonymization có decision/audit, không tự tuyên bố compliance | FR-1.5, FR-5.4, NFR-4 | User | M-00, M-07 | [TMC-078](#tmc-078), [TMC-079](#tmc-079), [TMC-080](#tmc-080), [TMC-081](#tmc-081), [TMC-082](#tmc-082) | Proposed từ gap/requirement; chưa nghiệm thu |

Các Feature nền A04/A05/A06 có capability/outcome riêng nên dùng Feature ID; H01…H04 là các gói verification có đầu ra độc lập. Không gán CROSS-CUTTING chỉ vì code đi qua nhiều module. Work type TEST/UI/BUG/DOCS độc lập với Feature, không thay parent linkage.

<a id="coverage"></a>

## 5. Functional and non-functional requirement coverage

### 5.1. Hệ mã và coverage cấp assignment

`FR-01…05` / `NFR-01…04` ở summary là nhóm từ assignment. `FR-1.1…5.4` / `NFR-1…6` ở spec là mã chi tiết do nhóm cụ thể hóa. Bốn NFR đầu ánh xạ theo nội dung; **NFR-5/6 không được coi là hai NFR mới bắt buộc từ đề**. Các mã `M2-DESIGN/SOLID/CODE/SUBMIT/QR/NETWORK` dưới đây là nhãn trace local cho task/outcome, không phải mã do giảng viên cấp.

| FR/NFR ID + source | Slice/metric/condition | Feature | Implementation/control | Verification/test | Milestone | Gap/deferred | Evidence/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-01 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | User/QR, HR profile, self-only và grant lifecycle | B01/B02, C01…04 | [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-009](#tmc-009), [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-015](#tmc-015), [TMC-017](#tmc-017), [TMC-055](#tmc-055), [TMC-056](#tmc-056), [TMC-057](#tmc-057), [TMC-086](#tmc-086) | [TMC-029](#tmc-029), [TMC-052](#tmc-052), [TMC-053](#tmc-053); xem AC/verification phiếu | M-01…04, M-06 | HR CRUD đầy đủ extension; email ảnh QR tĩnh cần quyết định chuyển sang link portal. | Not run / chưa nghiệm thu |
| FR-02 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Station/policy/kiosk/open-close/exception | D01…04, F02 | [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-016](#tmc-016), [TMC-018](#tmc-018), [TMC-025](#tmc-025), [TMC-027](#tmc-027), [TMC-039](#tmc-039), [TMC-073](#tmc-073), [TMC-074](#tmc-074) | [TMC-026](#tmc-026), [TMC-030](#tmc-030), [TMC-051](#tmc-051), [TMC-052](#tmc-052); xem AC/verification phiếu | M-02/04/06/07 | Vendor close/status/passage và hoạt động thiết bị thật chưa chốt; heartbeat mở rộng. | Not run / chưa nghiệm thu |
| FR-03 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Durable attempts, no duplicates, evidence, revisions | E01…03, F01/F02 | [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064) | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-052](#tmc-052); xem AC/verification phiếu | M-02…04, M-06 | Pairing/correction đầy đủ extension; MANUAL tổng quát và request-check workflow cần refine. | Not run / chưa nghiệm thu |
| FR-04 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Scoped reports/audit, monthly HRS và CSV | G01…03, H03 | [TMC-007](#tmc-007), [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-028](#tmc-028), [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-075](#tmc-075), [TMC-076](#tmc-076), [TMC-077](#tmc-077) | [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-068](#tmc-068); xem AC/verification phiếu | M-01/04/06 | HRS/report tháng đầy đủ chưa cam kết code M2; audit là AC xuyên ticket, không một endpoint chứng minh tất cả. | Not run / chưa nghiệm thu |
| FR-05 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | IAM/org/config/ops/privacy | B04, D04, A07, J01 | [TMC-058](#tmc-058), [TMC-059](#tmc-059), [TMC-072](#tmc-072), [TMC-073](#tmc-073), [TMC-078](#tmc-078), [TMC-079](#tmc-079), [TMC-080](#tmc-080), [TMC-081](#tmc-081), [TMC-083](#tmc-083), [TMC-084](#tmc-084) | [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-054](#tmc-054), [TMC-082](#tmc-082); xem AC/verification phiếu | M-00/06/07 | MFA/provider, retention/hold và owner policy chưa chốt; không tự tạo threshold. | Not run / chưa nghiệm thu |
| INT-01 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Attendance API đến HRS, sẵn sàng trước 12:00 ngày 1 | G02 | [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067) | [TMC-068](#tmc-068); xem AC/verification phiếu | M-06 | Snapshot/ACK/status contract giả lập trước; HRS thật phụ thuộc vendor. | Not run / chưa nghiệm thu |
| INT-02 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Turnstile API open/close từng access event | D02 | [TMC-013](#tmc-013), [TMC-016](#tmc-016) | [TMC-026](#tmc-026), [TMC-030](#tmc-030); xem AC/verification phiếu | M-02/04 | Mock TCS; ACK nhận lệnh khác với passage, close/status tùy capability. | Not run / chưa nghiệm thu |
| NFR-01 ↔ NFR-1 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Kiosk ≤2s tại 800 giao dịch/30 phút/nhà máy; đo đủ QR → hiển thị, tách passage | D03, H03 | [TMC-014](#tmc-014), [TMC-016](#tmc-016), [TMC-018](#tmc-018), [TMC-019](#tmc-019) | [TMC-051](#tmc-051); xem AC/verification phiếu | M-02/04 | Workload burst/môi trường cần chốt; không thay threshold bằng p95 tự đặt. | Not run / chưa nghiệm thu |
| NFR-02 ↔ NFR-2 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Không mất công trong vận hành bình thường; duplicate/retry không tạo thêm nguồn | E01, F02, H01/H02 | [TMC-004](#tmc-004), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-019](#tmc-019), [TMC-024](#tmc-024) | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-068](#tmc-068); xem AC/verification phiếu | M-01…04/06 | Test crash là M2 bổ sung; không suy bảo đảm mọi thảm họa từ test bình thường. | Not run / chưa nghiệm thu |
| NFR-03 ↔ NFR-3 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | RBAC + scope + đầy đủ audit; actor từ session/station server | B01, D01, H03 | [TMC-007](#tmc-007), [TMC-012](#tmc-012), [TMC-025](#tmc-025), [TMC-050](#tmc-050), [TMC-058](#tmc-058), [TMC-059](#tmc-059), [TMC-073](#tmc-073), [TMC-083](#tmc-083) | [TMC-052](#tmc-052); xem AC/verification phiếu | M-01…04/06 | TLS/rate-limit/deployment policy và MFA cần input theo môi trường; kiểm tra API thật, không chỉ hide UI. | Not run / chưa nghiệm thu |
| NFR-04 ↔ NFR-4 — [summary §3](summary-assigment.md#3-requirements-và-các-ràng-buộc-nghiệp-vụ-chung) | Minimize personal data; scope/cache/log/QR; policy/hold cho extension | B01, C03, H03, J01 | [TMC-050](#tmc-050), [TMC-078](#tmc-078), [TMC-079](#tmc-079), [TMC-080](#tmc-080), [TMC-081](#tmc-081), [TMC-086](#tmc-086) | [TMC-053](#tmc-053), [TMC-082](#tmc-082); xem AC/verification phiếu | M-00/01/03/04/07 | Không tự đặt thời hạn retention hay chứng nhận tuân thủ pháp lý từ test. | Not run / chưa nghiệm thu |
| NFR-5 (spec) — [spec/M2](spec.pdf#page=11) | SOLID, replaceable TCS/HRS ports và module dependency checks | A02/A04, H01, I02 | [TMC-003](#tmc-003), [TMC-005](#tmc-005), [TMC-013](#tmc-013), [TMC-087](#tmc-087) | [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-085](#tmc-085); xem AC/verification phiếu | M-01/04/05 | Design/implementation evidence theo SHA; HRS port khi extension được giao. | Not run / chưa nghiệm thu |
| NFR-6 (spec bổ sung) — [spec/M2](spec.pdf#page=11) | Mục tiêu nhóm đề xuất RPO≤15 phút, RTO≤4h; drill để kiểm chứng | A07, F01 | [TMC-022](#tmc-022), [TMC-054](#tmc-054) | [TMC-054](#tmc-054); xem AC/verification phiếu | M-04/07 | Chưa được owner chốt ngân sách/môi trường; không đổi thành guarantee của đề. | Not run / chưa nghiệm thu |
| M2-DESIGN / M2-SOLID — [spec/M2](spec.pdf#page=11) | Context/characteristics/styles/decisions + module/C&C/allocation + SOLID reflection | I01/I02 | [TMC-001](#tmc-001), [TMC-022](#tmc-022), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035) | [TMC-038](#tmc-038), [TMC-085](#tmc-085); xem AC/verification phiếu | M-00/04/05 | Report phải khớp implementation; reflection từ kết quả thật. | Not run / chưa nghiệm thu |
| M2-CODE / M2-SUBMIT — [spec/M2](spec.pdf#page=11) | Ít nhất một main module; báo cáo có GitHub URL và LMS handoff | H04, I03 | [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-036](#tmc-036), [TMC-037](#tmc-037) | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-038](#tmc-038); xem AC/verification phiếu | M-01…05 | Chưa xác minh truy cập remote hoặc bản nộp; user nghiệm thu/nộp. | Not run / chưa nghiệm thu |
| M2-QR / M2-NETWORK — [spec/M2](spec.pdf#page=11) | Giảm QR exposure/replay và mất kết nối; ghi rõ incorporation/limitations | C01/C02, F01/F02/F03 | [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-015](#tmc-015), [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025) | [TMC-026](#tmc-026), [TMC-030](#tmc-030); xem AC/verification phiếu | M-02/04; M-08 optional | R1 trung tâm + recovery baseline; offline OPEN không tự thuộc baseline. | Not run / chưa nghiệm thu |

### 5.2. Coverage FR chi tiết của spec

Một requirement có thể có nhiều ticket. Ticket con mới là đơn vị estimate khi có work package; parent giữ mapping outcome. Cột verification dẫn suite/ticket riêng hoặc AC của implementation, không hàm ý đã có harness.

| Spec ID / source | Requirement slice | Feature | Control/implementation IDs | Verification | Milestone | Gap/deferred rationale | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-1.1 — [spec §2](spec.pdf#page=11) | HR profile/code/HRS mapping và thay đổi có audit | C04 | [TMC-055](#tmc-055), [TMC-056](#tmc-056) | [TMC-052](#tmc-052) / AC phiếu | M-06 | CRUD đầy đủ extension | Not run |
| FR-1.2 — [spec §2](spec.pdf#page=11) | Credential/QR cho nhân viên active, không chứa tên/lịch sử | C01 | [TMC-009](#tmc-009), [TMC-010](#tmc-010) | [TMC-011](#tmc-011), [TMC-029](#tmc-029), [TMC-053](#tmc-053) / AC phiếu | M-01, M-02 | Ký/rotation contract phải chốt | Not run |
| FR-1.3 — [spec §2](spec.pdf#page=11) | EMP hiển thị QR; QR cũ vô hiệu sau revoke | C01, C03 | [TMC-010](#tmc-010), [TMC-017](#tmc-017) | [TMC-011](#tmc-011), [TMC-032](#tmc-032) / AC phiếu | M-02 | Email QR tĩnh M1 → link portal M2 cần owner quyết định | Not run |
| FR-1.4 — [spec §2](spec.pdf#page=11) | HR revoke/reissue, deactivate và revoke cùng transaction | C01, C04 | [TMC-010](#tmc-010), [TMC-055](#tmc-055), [TMC-057](#tmc-057) | [TMC-029](#tmc-029), [TMC-052](#tmc-052) / AC phiếu | M-02, M-06 | Endpoint HR và deactivation đầy đủ M-06 | Not run |
| FR-1.5 — [spec §2](spec.pdf#page=11) | Self profile/history + notice purpose/data/recipient/contact | B01, C03, E02, J01 | [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-050](#tmc-050), [TMC-078](#tmc-078), [TMC-086](#tmc-086) | [TMC-052](#tmc-052), [TMC-053](#tmc-053) / AC phiếu | M-00, M-01, M-03 | Notice owner; yêu cầu privacy workflow mở rộng ở M-07 | Not run |
| FR-1.6 — [spec §2](spec.pdf#page=11) | Factory grants/effective history, server policy | B01, C04, D01 | [TMC-006](#tmc-006), [TMC-012](#tmc-012), [TMC-056](#tmc-056) | [TMC-029](#tmc-029), [TMC-052](#tmc-052) / AC phiếu | M-01, M-02, M-06 | CRUD grants đầy đủ M-06 | Not run |
| FR-2.1 — [spec §2](spec.pdf#page=11) | Station/factory/direction/turnstile/credential + retire | B01, D04 | [TMC-006](#tmc-006), [TMC-073](#tmc-073), [TMC-074](#tmc-074) | [TMC-052](#tmc-052) / AC phiếu | M-01, M-06 | Seed nền trước, lifecycle quản trị M-06 | Not run |
| FR-2.2 — [spec §2](spec.pdf#page=11) | Station/QR/revoke/employee/grant validation | B01, C02, D01 | [TMC-007](#tmc-007), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-015](#tmc-015) | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-052](#tmc-052) / AC phiếu | M-01, M-02 | Không tin gateId/employeeId body | Not run |
| FR-2.3 — [spec §2](spec.pdf#page=11) | Persist trước TCS, phân biệt allowed/open/unknown | D02, E01 | [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-016](#tmc-016) | [TMC-026](#tmc-026), [TMC-030](#tmc-030) / AC phiếu | M-02 | Physical provider chưa tích hợp | Not run |
| FR-2.4 — [spec §2](spec.pdf#page=11) | Hiển thị ≤2s, UNKNOWN hướng dẫn SEC | D03 | [TMC-018](#tmc-018), [TMC-027](#tmc-027) | [TMC-032](#tmc-032), [TMC-051](#tmc-051) / AC phiếu | M-02, M-04 | Virtual path baseline; camera P1 | Not run |
| FR-2.5 — [spec §2](spec.pdf#page=11) | SEC ngoại lệ có nhân viên/hướng/lý do, chống trùng | F02 | [TMC-025](#tmc-025) | [TMC-030](#tmc-030), [TMC-052](#tmc-052) / AC phiếu | M-04 | SEC xử lý case nguồn GATE; online exception/MANUAL tổng quát chưa đủ persistence/AC để Ready | Not run |
| FR-2.6 — [spec §2](spec.pdf#page=11) | Heartbeat và ngừng lane khi UNKNOWN | D02, F02, G01 | [TMC-016](#tmc-016), [TMC-024](#tmc-024), [TMC-039](#tmc-039) | [TMC-026](#tmc-026), [TMC-030](#tmc-030) / AC phiếu | M-02, M-04, M-07 | Heartbeat M-07; lane lock invariant của command không đợi heartbeat | Not run |
| FR-2.7 — [spec §2](spec.pdf#page=11) | TCS auto-close hoặc lệnh CLOSE bền vững; báo SEC | D02, D04 | [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-073](#tmc-073) | [TMC-026](#tmc-026), [TMC-030](#tmc-030) / AC phiếu | M-02, M-06 | Vendor close capability chưa chốt | Not run |
| FR-3.1 — [spec §2](spec.pdf#page=11) | Mọi scan có attempt/eventId/station/time/decision; employee null nếu không nhận diện | E01 | [TMC-014](#tmc-014), [TMC-019](#tmc-019) | [TMC-029](#tmc-029) / AC phiếu | M-02, M-03 | Không ghi token thô trong log/evidence | Not run |
| FR-3.2 — [spec §2](spec.pdf#page=11) | Cùng ID/payload trả cũ; khác payload conflict; một dispatcher | C02, D02, E01, F01 | [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-023](#tmc-023) | [TMC-029](#tmc-029), [TMC-030](#tmc-030) / AC phiếu | M-02, M-04 | Retry lookup trước validate lại token cũ | Not run |
| FR-3.3 — [spec §2](spec.pdf#page=11) | Tối đa một attendance/confirmed passage; denied/unknown giữ log | E01, F02 | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-025](#tmc-025) | [TMC-029](#tmc-029), [TMC-030](#tmc-030) / AC phiếu | M-03, M-04 | Cần evidence policy; ACK không đủ | Not run |
| FR-3.4 — [spec §2](spec.pdf#page=11) | Pairing nhiều khoảng/overnight/anomaly flags | E03 | [TMC-062](#tmc-062) | [TMC-062](#tmc-062), [TMC-068](#tmc-068) / AC phiếu | M-06 | M-06; không ngầm tính payroll/overtime | Not run |
| FR-3.5 — [spec §2](spec.pdf#page=11) | Correction revision mới + reason/actor/evidence; giữ gốc | E03 | [TMC-063](#tmc-063), [TMC-064](#tmc-064) | [TMC-063](#tmc-063), [TMC-068](#tmc-068) / AC phiếu | M-06 | M-06; EMP request-check workflow cần API/persistence riêng được refine | Not run |
| FR-3.6 — [spec §2](spec.pdf#page=11) | Pending/UNKNOWN queue, phục hồi; MANUAL có event time/import time | E02, F01, F02 | [TMC-020](#tmc-020), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025) | [TMC-026](#tmc-026), [TMC-030](#tmc-030) / AC phiếu | M-03, M-04 | MANUAL tổng quát có review/uniqueness chưa được gộp vào 3h TMC-025 | Not run |
| FR-4.1 — [spec §2](spec.pdf#page=11) | Monthly person/org/factory report; SUP team/EXE aggregate | G01, G03 | [TMC-028](#tmc-028), [TMC-075](#tmc-075), [TMC-076](#tmc-076) | [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-075](#tmc-075) / AC phiếu | M-04, M-06 | Dashboard tối thiểu baseline; report đầy đủ M-06 | Not run |
| FR-4.2 — [spec §2](spec.pdf#page=11) | SEC chỉ xem nhật ký được cấp, có denied/exception/unknown | E02, F02, G03 | [TMC-020](#tmc-020), [TMC-025](#tmc-025), [TMC-075](#tmc-075) | [TMC-052](#tmc-052) / AC phiếu | M-03, M-04, M-06 | Projection khác HR và EXE | Not run |
| FR-4.3 — [spec §2](spec.pdf#page=11) | HRS dữ liệu tháng trước ready trước noon ngày 1 | G02 | [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067) | [TMC-068](#tmc-068) / AC phiếu | M-06 | M-06; cần ACK processed có nguồn | Not run |
| FR-4.4 — [spec §2](spec.pdf#page=11) | Batch ID/period/version/checksum/count; retry không đổi bytes | G02 | [TMC-065](#tmc-065), [TMC-066](#tmc-066) | [TMC-068](#tmc-068) / AC phiếu | M-06 | M-06; correction tạo superseding batch | Not run |
| FR-4.5 — [spec §2](spec.pdf#page=11) | Bounded retry/status/alerts và HR retry khi có quyền | G02 | [TMC-066](#tmc-066), [TMC-067](#tmc-067) | [TMC-068](#tmc-068) / AC phiếu | M-06 | Policy retry/status capability chưa chốt | Not run |
| FR-4.6 — [spec §2](spec.pdf#page=11) | Audit login/roles/HR/QR/gate/correction/export/config/sensitive reads | B01, B04, C01, C04, D02, D04, E01, E03, F02, G02, G03 | [TMC-007](#tmc-007), [TMC-010](#tmc-010), [TMC-016](#tmc-016), [TMC-019](#tmc-019), [TMC-025](#tmc-025), [TMC-055](#tmc-055), [TMC-058](#tmc-058), [TMC-059](#tmc-059), [TMC-063](#tmc-063), [TMC-066](#tmc-066), [TMC-075](#tmc-075), [TMC-077](#tmc-077), [TMC-083](#tmc-083) | [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-068](#tmc-068) / AC phiếu | M-01, M-02, M-03, M-04, M-06 | Mỗi transaction/query có audit AC; không suy đầy đủ từ audit table | Not run |
| FR-4.7 — [spec §2](spec.pdf#page=11) | Scoped CSV, download actor/period/filters audit | G03 | [TMC-077](#tmc-077) | [TMC-052](#tmc-052), [TMC-053](#tmc-053), [TMC-077](#tmc-077) / AC phiếu | M-06 | Should/extension; tránh spreadsheet formula injection | Not run |
| FR-5.1 — [spec §2](spec.pdf#page=11) | ADM account/role/scope, server authorize; MFA đề xuất | B01, B02, B03, B04 | [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-058](#tmc-058), [TMC-059](#tmc-059), [TMC-060](#tmc-060), [TMC-061](#tmc-061) | [TMC-052](#tmc-052) / AC phiếu | M-01, M-06 | MFA cần provider/challenge/recovery decision; không nằm trong auth 3h | Not run |
| FR-5.2 — [spec §2](spec.pdf#page=11) | Org/export/connectors/keys versioned; secrets ngoài source | C01, D04 | [TMC-009](#tmc-009), [TMC-072](#tmc-072), [TMC-073](#tmc-073), [TMC-074](#tmc-074), [TMC-083](#tmc-083) | [TMC-053](#tmc-053), [TMC-083](#tmc-083) / AC phiếu | M-01, M-06 | M-06; pending command/batch giữ config snapshot | Not run |
| FR-5.3 — [spec §2](spec.pdf#page=11) | Service/integration/backup/UNKNOWN aging và alert owners | A07, G01 | [TMC-039](#tmc-039), [TMC-054](#tmc-054), [TMC-084](#tmc-084) | [TMC-054](#tmc-054), [TMC-084](#tmc-084) / AC phiếu | M-07 | M-07; health xanh không chứng minh physical device/RPO/RTO | Not run |
| FR-5.4 — [spec §2](spec.pdf#page=11) | Retention/erase sau approve, evidence holds và copies | J01 | [TMC-078](#tmc-078), [TMC-079](#tmc-079), [TMC-080](#tmc-080), [TMC-081](#tmc-081) | [TMC-082](#tmc-082) / AC phiếu | M-00, M-07 | Policy/schema/owner chưa đủ; M-07 proposed | Not run |

### 5.3. BR, UC và coverage còn mở

BR-01→C01/C02/D03; BR-02→E01; BR-03→D02; BR-04→G02; BR-05→scope loại visitor/payroll; BR-06→B01/H03/J01. UC-01→D01/D02/D03/E01; UC-02→C03/E02; UC-03→C01/C04; UC-04→F01/F02; UC-05→E03; UC-06→G02; UC-07→G01/G03; UC-08→B03/B04/D04/A07/J01. UC/UF chi tiết ở từng phiếu và [flow catalog](user-flow.md#23-danh-mục-mục-tiêu-và-kết-quả).

Gaps cần decision/refinement, chưa có đủ AC/estimate để tạo ticket implementation độc lập: email QR tĩnh so với link portal; MFA/provider/recovery; MANUAL tổng quát và request-check workflow; privacy processor/entity owner; vendor callback/status/close/ACK capabilities; kỳ/rounding/pairing và môi trường tải. TMC-001/TMC-044 đăng ký quyết định và ticket mới từ TMC-088 khi scope được chọn. Không gọi là coverage implementation đầy đủ chỉ vì có dòng mapping.

<a id="master"></a>

## 6. Prioritized ticket and issue table

### 6.1. Master registry / prioritized backlog

Mỗi ticket có đúng một row chuẩn. Ranks thấp được xét trước sau DoR/dependencies; parent dùng rank của child đầu tiên chỉ để hiển thị, không được pull làm việc trùng. Start/Target/effort và owner ở §6.2; issue/Project/PR mapping ở §9.4. FR/NFR metadata đầy đủ ở phiếu; dòng master là chỉ mục. Không dùng priority như severity hoặc chứng nhận CORE.

| Rank | Ticket / title chuẩn | Feature | Epic / parent | TYPE / canonical label | Area | Priority / rationale | Severity | Dependencies | Status local | Issue/PR mapping | AC / verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | [TMC-044](#tmc-044) — [TMC-044] [TASK] [A06] Audit current acceptance evidence and replan capacity<br>M2-DESIGN, NFR-5 | A06 — Current-state acceptance audit | A / Feature A06 | TASK / `type:task` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | Không có | Backlog | [mapping](#remote-tmc-044) | [AC](#tmc-044) / [verify](#verify-tmc-044) |
| 20 | [TMC-001](#tmc-001) — [TMC-001] [DOCS] [I01] Confirm M2 scope and requirement traceability<br>M2-DESIGN, M2-SOLID, M2-CODE | I01 — Scope and architecture views | I / Feature I01 | DOCS / `type:docs` | area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-044](#tmc-044) | Backlog | [mapping](#remote-tmc-001) | [AC](#tmc-001) / [verify](#verify-tmc-001) |
| 30 | [TMC-045](#tmc-045) — [TMC-045] [DOCS] [A05] Define issue templates and label taxonomy<br>NFR-5 | A05 — GitHub delivery governance | A / Feature A05 | DOCS / `type:docs` | area:docs, area:devops | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-001](#tmc-001), [TMC-044](#tmc-044) | Backlog | [mapping](#remote-tmc-045) | [AC](#tmc-045) / [verify](#verify-tmc-045) |
| 40 | [TMC-046](#tmc-046) — [TMC-046] [CHORE] [A05] Prepare the GitHub Project field schema<br>NFR-5 | A05 — GitHub delivery governance | A / Feature A05 | CHORE / `type:chore` | area:docs, area:devops | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-045](#tmc-045) | Backlog | [mapping](#remote-tmc-046) | [AC](#tmc-046) / [verify](#verify-tmc-046) |
| 50 | [TMC-047](#tmc-047) — [TMC-047] [CHORE] [A05] Configure saved views and safe project automations<br>NFR-5 | A05 — GitHub delivery governance | A / Feature A05 | CHORE / `type:chore` | area:docs, area:devops | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-046](#tmc-046) | Backlog | [mapping](#remote-tmc-047) | [AC](#tmc-047) / [verify](#verify-tmc-047) |
| 60 | [TMC-048](#tmc-048) — [TMC-048] [DOCS] [A05] Define protected-branch checks and human review ownership<br>NFR-3, NFR-5 | A05 — GitHub delivery governance | A / Feature A05 | DOCS / `type:docs` | area:docs, area:devops | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-044](#tmc-044), [TMC-045](#tmc-045) | Backlog | [mapping](#remote-tmc-048) | [AC](#tmc-048) / [verify](#verify-tmc-048) |
| 70 | [TMC-049](#tmc-049) — [TMC-049] [TASK] [A05] Import verified ticket metadata without duplicate issues<br>NFR-5 | A05 — GitHub delivery governance | A / Feature A05 | TASK / `type:task` | area:docs, area:devops | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-046](#tmc-046), [TMC-047](#tmc-047), [TMC-048](#tmc-048) | Backlog | [mapping](#remote-tmc-049) | [AC](#tmc-049) / [verify](#verify-tmc-049) |
| 80 | [TMC-078](#tmc-078) — [TMC-078] [DOCS] [J01] Decide privacy notice, retention and evidence-hold policies<br>FR-1.5, FR-5.4, NFR-4 | J01 — Privacy policy and retention workflow | J / Feature J01 | DOCS / `type:docs` | area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-001](#tmc-001) | Backlog | [mapping](#remote-tmc-078) | [AC](#tmc-078) / [verify](#verify-tmc-078) |
| 90 | [TMC-002](#tmc-002) — [TMC-002] [BUILD] [A01] Verify the client workspace and preview baseline<br>NFR-5 | A01 — Workspace and client foundation | A / Feature A01 | BUILD / `type:build` | area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-001](#tmc-001) | Backlog | [mapping](#remote-tmc-002) | [AC](#tmc-002) / [verify](#verify-tmc-002) |
| 100 | [TMC-003](#tmc-003) — [TMC-003] [BUILD] [A02] Complete backend ports and shared wire contracts<br>NFR-5 | A02 — Backend architecture and wire contracts | A / Feature A02 | BUILD / `type:build` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-002](#tmc-002) | Backlog | [mapping](#remote-tmc-003) | [AC](#tmc-003) / [verify](#verify-tmc-003) |
| 110 | [TMC-004](#tmc-004) — [TMC-004] [BUILD] [A03] Verify PostgreSQL migrations and core constraints<br>FR-3.1, FR-3.3, NFR-2 | A03 — Schema and migration foundation | A / Feature A03 | BUILD / `type:build` | area:backend, area:database | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-003](#tmc-003) | Backlog | [mapping](#remote-tmc-004) | [AC](#tmc-004) / [verify](#verify-tmc-004) |
| 120 | [TMC-005](#tmc-005) — [TMC-005] [CI] [A04] Complete Node test runners and CI contracts<br>NFR-5 | A04 — Test and CI foundation | A / Feature A04 | CI / `type:ci` | area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-003](#tmc-003), [TMC-004](#tmc-004) | Backlog | [mapping](#remote-tmc-005) | [AC](#tmc-005) / [verify](#verify-tmc-005) |
| 130 | [TMC-006](#tmc-006) — [TMC-006] [TASK] [B01] Verify identity, scope and station fixtures<br>FR-1.1, FR-1.6, FR-2.1, FR-5.1 | B01 — Identity, scoped sessions and seed | B / Feature B01 | TASK / `type:task` | area:backend, area:database | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-004](#tmc-004) | Backlog | [mapping](#remote-tmc-006) | [AC](#tmc-006) / [verify](#verify-tmc-006) |
| 140 | [TMC-007](#tmc-007) — [TMC-007] [ENHANCEMENT] [B01] Complete server session authorization and scope checks<br>FR-5.1, FR-4.6, NFR-3 | B01 — Identity, scoped sessions and seed | B / Feature B01 | ENHANCEMENT / `type:enhancement` | area:backend, area:database | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-005](#tmc-005), [TMC-006](#tmc-006) | Backlog | [mapping](#remote-tmc-007) | [AC](#tmc-007) / [verify](#verify-tmc-007) |
| 150 | [TMC-008](#tmc-008) — [TMC-008] [ENHANCEMENT] [B02] Verify session login and protected navigation<br>FR-1.5, FR-5.1, NFR-3 | B02 — Authenticated client navigation | B / Feature B02 | ENHANCEMENT / `type:enhancement` | area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-002](#tmc-002), [TMC-007](#tmc-007) | Backlog | [mapping](#remote-tmc-008) | [AC](#tmc-008) / [verify](#verify-tmc-008) |
| 160 | [TMC-009](#tmc-009) — [TMC-009] [FEATURE] [C01] Implement QR credential and signing-key metadata<br>FR-1.2, FR-1.4, FR-5.2 | C01 — Credential and signed QR lifecycle | C / Feature C01 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-004](#tmc-004), [TMC-006](#tmc-006) | Backlog | [mapping](#remote-tmc-009) | [AC](#tmc-009) / [verify](#verify-tmc-009) |
| 170 | [TMC-050](#tmc-050) — [TMC-050] [BUG] [B01] Restrict demo bootstrap data to authorized scopes<br>FR-1.5, FR-5.1, NFR-3, NFR-4 | B01 — Identity, scoped sessions and seed | B / Feature B01 | BUG / `type:bug` | area:backend, area:frontend | P0 — dữ liệu demo thiếu scope theo source | S2 proposed; source-only | [TMC-007](#tmc-007), [TMC-008](#tmc-008) | Backlog | [mapping](#remote-tmc-050) | [AC](#tmc-050) / [verify](#verify-tmc-050) |
| 180 | [TMC-087](#tmc-087) — [TMC-087] [REFACTOR] [B01] Isolate session use cases from persistence and HTTP adapters<br>NFR-5, M2-SOLID | B01 — Identity, scoped sessions and seed | B / Feature B01 | REFACTOR / `type:refactor` | area:backend | P1 — có thể scope-cut khi capacity thiếu | N/A | [TMC-007](#tmc-007) | Backlog | [mapping](#remote-tmc-087) | [AC](#tmc-087) / [verify](#verify-tmc-087) |
| 190 | [TMC-010](#tmc-010) — [TMC-010] [FEATURE] [C01] Issue short-lived QR tokens and revoke credentials<br>FR-1.2, FR-1.3, FR-1.4, M2-QR | C01 — Credential and signed QR lifecycle | C / Feature C01 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-007](#tmc-007), [TMC-009](#tmc-009) | Backlog | [mapping](#remote-tmc-010) | [AC](#tmc-010) / [verify](#verify-tmc-010) |
| 200 | [TMC-011](#tmc-011) — [TMC-011] [FEATURE] [C02] Validate QR signatures and token claims<br>FR-2.2, M2-QR | C02 — QR validation and replay prevention | C / Feature C02 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-010](#tmc-010) | Backlog | [mapping](#remote-tmc-011) | [AC](#tmc-011) / [verify](#verify-tmc-011) |
| 210 | [TMC-012](#tmc-012) — [TMC-012] [FEATURE] [D01] Evaluate access policies using server-owned data<br>FR-1.6, FR-2.2 | D01 — Server-side access policy | D / Feature D01 | FEATURE / `type:feature` | area:backend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-006](#tmc-006), [TMC-011](#tmc-011) | Backlog | [mapping](#remote-tmc-012) | [AC](#tmc-012) / [verify](#verify-tmc-012) |
| 220 | [TMC-013](#tmc-013) — [TMC-013] [FEATURE] [D02] Implement a fault-capable turnstile simulator<br>FR-2.3, FR-2.7, INT-02, NFR-5 | D02 — Turnstile commands and simulator | D / Feature D02 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-003](#tmc-003), [TMC-005](#tmc-005) | Backlog | [mapping](#remote-tmc-013) | [AC](#tmc-013) / [verify](#verify-tmc-013) |
| 230 | [TMC-014](#tmc-014) — [TMC-014] [FEATURE] [E01] Persist idempotent attempts before gate dispatch<br>FR-2.3, FR-3.1, FR-3.2, NFR-2 | E01 — Idempotent attempts and attendance ledger | E / Feature E01 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-004](#tmc-004), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013) | Backlog | [mapping](#remote-tmc-014) | [AC](#tmc-014) / [verify](#verify-tmc-014) |
| 240 | [TMC-015](#tmc-015) — [TMC-015] [FEATURE] [C02] Prevent QR replay with atomic redemption<br>FR-3.2, NFR-3, M2-QR | C02 — QR validation and replay prevention | C / Feature C02 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-010](#tmc-010), [TMC-014](#tmc-014) | Backlog | [mapping](#remote-tmc-015) | [AC](#tmc-015) / [verify](#verify-tmc-015) |
| 250 | [TMC-016](#tmc-016) — [TMC-016] [FEATURE] [D02] Claim and reconcile gate commands with CAS<br>FR-2.3, FR-2.7, FR-3.2, INT-02 | D02 — Turnstile commands and simulator | D / Feature D02 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015) | Backlog | [mapping](#remote-tmc-016) | [AC](#tmc-016) / [verify](#verify-tmc-016) |
| 260 | [TMC-017](#tmc-017) — [TMC-017] [UI] [C03] Display server-issued QR codes in the employee portal<br>FR-1.3, M2-QR | C03 — Employee QR and personal portal | C / Feature C03 | UI / `type:ui` | area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-008](#tmc-008), [TMC-010](#tmc-010) | Backlog | [mapping](#remote-tmc-017) | [AC](#tmc-017) / [verify](#verify-tmc-017) |
| 270 | [TMC-018](#tmc-018) — [TMC-018] [UI] [D03] Connect the virtual kiosk to real attempt states<br>FR-2.4, UC-01, NFR-1 | D03 — Virtual and camera kiosk | D / Feature D03 | UI / `type:ui` | area:frontend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-016](#tmc-016), [TMC-017](#tmc-017) | Backlog | [mapping](#remote-tmc-018) | [AC](#tmc-018) / [verify](#verify-tmc-018) |
| 280 | [TMC-019](#tmc-019) — [TMC-019] [FEATURE] [E01] Write attendance revisions from verified passage evidence<br>FR-3.3, NFR-2 | E01 — Idempotent attempts and attendance ledger | E / Feature E01 | FEATURE / `type:feature` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-016](#tmc-016) | Backlog | [mapping](#remote-tmc-019) | [AC](#tmc-019) / [verify](#verify-tmc-019) |
| 290 | [TMC-020](#tmc-020) — [TMC-020] [FEATURE] [E02] Expose scoped attempt status and attendance history<br>FR-1.5, FR-3.6, FR-4.2, NFR-3 | E02 — Scoped attendance history and status | E / Feature E02 | FEATURE / `type:feature` | area:backend, area:frontend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-007](#tmc-007), [TMC-019](#tmc-019) | Backlog | [mapping](#remote-tmc-020) | [AC](#tmc-020) / [verify](#verify-tmc-020) |
| 300 | [TMC-021](#tmc-021) — [TMC-021] [UI] [E02] Connect personal history and attempt details<br>FR-1.5, UC-02 | E02 — Scoped attendance history and status | E / Feature E02 | UI / `type:ui` | area:backend, area:frontend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-008](#tmc-008), [TMC-020](#tmc-020) | Backlog | [mapping](#remote-tmc-021) | [AC](#tmc-021) / [verify](#verify-tmc-021) |
| 310 | [TMC-086](#tmc-086) — [TMC-086] [UI] [C03] Show privacy purpose and scoped personal-profile states<br>FR-1.5, NFR-4 | C03 — Employee QR and personal portal | C / Feature C03 | UI / `type:ui` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-001](#tmc-001), [TMC-008](#tmc-008), [TMC-020](#tmc-020), [TMC-078](#tmc-078) | Backlog | [mapping](#remote-tmc-086) | [AC](#tmc-086) / [verify](#verify-tmc-086) |
| 320 | [TMC-022](#tmc-022) — [TMC-022] [DOCS] [F01] Finalize network failure architecture decisions<br>M2-NETWORK, NFR-6 | F01 — Network failure design and kiosk journal | F / Feature F01 | DOCS / `type:docs` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-016](#tmc-016) | Backlog | [mapping](#remote-tmc-022) | [AC](#tmc-022) / [verify](#verify-tmc-022) |
| 330 | [TMC-023](#tmc-023) — [TMC-023] [ENHANCEMENT] [F01] Recover kiosk requests with a metadata journal<br>FR-3.2, FR-3.6, M2-NETWORK | F01 — Network failure design and kiosk journal | F / Feature F01 | ENHANCEMENT / `type:enhancement` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-018](#tmc-018), [TMC-020](#tmc-020), [TMC-022](#tmc-022) | Backlog | [mapping](#remote-tmc-023) | [AC](#tmc-023) / [verify](#verify-tmc-023) |
| 340 | [TMC-026](#tmc-026) — [TMC-026] [TEST] [F02] Exercise lost responses and process crash scenarios<br>M2-NETWORK, FR-2.7 | F02 — Durable reconciliation and exceptions | F / Feature F02 | TEST / `type:test` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-022](#tmc-022) | Backlog | [mapping](#remote-tmc-026) | [AC](#tmc-026) / [verify](#verify-tmc-026) |
| 350 | [TMC-024](#tmc-024) — [TMC-024] [FEATURE] [F02] Reconcile unknown commands using durable fenced jobs<br>FR-3.6, NFR-2, M2-NETWORK | F02 — Durable reconciliation and exceptions | F / Feature F02 | FEATURE / `type:feature` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-019](#tmc-019), [TMC-022](#tmc-022), [TMC-026](#tmc-026) | Backlog | [mapping](#remote-tmc-024) | [AC](#tmc-024) / [verify](#verify-tmc-024) |
| 360 | [TMC-025](#tmc-025) — [TMC-025] [FEATURE] [F02] Implement scoped security reconciliation cases<br>FR-2.5, FR-3.6, FR-4.2 | F02 — Durable reconciliation and exceptions | F / Feature F02 | FEATURE / `type:feature` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-024](#tmc-024) | Backlog | [mapping](#remote-tmc-025) | [AC](#tmc-025) / [verify](#verify-tmc-025) |
| 370 | [TMC-029](#tmc-029) — [TMC-029] [TEST] [H01] Verify the main module against PostgreSQL<br>FR-3.1, FR-3.2, FR-3.3, NFR-2 | H01 — Core and architecture verification | H / Feature H01 | TEST / `type:test` | area:backend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-015](#tmc-015), [TMC-019](#tmc-019), [TMC-020](#tmc-020) | Backlog | [mapping](#remote-tmc-029) | [AC](#tmc-029) / [verify](#verify-tmc-029) |
| 380 | [TMC-030](#tmc-030) — [TMC-030] [TEST] [H02] Verify concurrent replay and crash recovery<br>NFR-2, M2-QR, M2-NETWORK | H02 — Concurrency and failure verification | H / Feature H02 | TEST / `type:test` | area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-029](#tmc-029) | Backlog | [mapping](#remote-tmc-030) | [AC](#tmc-030) / [verify](#verify-tmc-030) |
| 390 | [TMC-051](#tmc-051) — [TMC-051] [TEST] [H03] Measure kiosk response latency under shift-change load<br>FR-2.4, NFR-1 | H03 — Performance, authorization and privacy verification | H / [TMC-031](#tmc-031) | TEST / `type:test` | area:frontend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-018](#tmc-018), [TMC-019](#tmc-019), [TMC-030](#tmc-030) | Backlog | [mapping](#remote-tmc-051) | [AC](#tmc-051) / [verify](#verify-tmc-051) |
| 390 | [TMC-031](#tmc-031) — [TMC-031] [TEST] [H03] Coordinate kiosk performance and data-access verification<br>NFR-1, NFR-3, NFR-4 | H03 — Performance, authorization and privacy verification | H / Feature H03 | TEST / `type:test` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-007](#tmc-007), [TMC-030](#tmc-030), [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053) | Backlog | [mapping](#remote-tmc-031) | [AC](#tmc-031) / [verify](#verify-tmc-031) |
| 400 | [TMC-052](#tmc-052) — [TMC-052] [TEST] [H03] Verify role, object and factory authorization boundaries<br>FR-1.5, FR-4.6, FR-5.1, NFR-3 | H03 — Performance, authorization and privacy verification | H / [TMC-031](#tmc-031) | TEST / `type:test` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-007](#tmc-007), [TMC-030](#tmc-030), [TMC-050](#tmc-050) | Backlog | [mapping](#remote-tmc-052) | [AC](#tmc-052) / [verify](#verify-tmc-052) |
| 410 | [TMC-053](#tmc-053) — [TMC-053] [TEST] [H03] Verify payload redaction and session data isolation<br>FR-1.5, NFR-4 | H03 — Performance, authorization and privacy verification | H / [TMC-031](#tmc-031) | TEST / `type:test` | area:backend, area:frontend | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-021](#tmc-021), [TMC-030](#tmc-030), [TMC-050](#tmc-050) | Backlog | [mapping](#remote-tmc-053) | [AC](#tmc-053) / [verify](#verify-tmc-053) |
| 420 | [TMC-085](#tmc-085) — [TMC-085] [TEST] [H01] Verify module boundaries and replaceable integration ports<br>NFR-5, M2-SOLID | H01 — Core and architecture verification | H / Feature H01 | TEST / `type:test` | area:backend, area:contracts | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-013](#tmc-013), [TMC-029](#tmc-029), [TMC-087](#tmc-087) | Backlog | [mapping](#remote-tmc-085) | [AC](#tmc-085) / [verify](#verify-tmc-085) |
| 430 | [TMC-027](#tmc-027) — [TMC-027] [UI] [D03] Connect camera scans to the server contract<br>FR-2.4, UC-01 | D03 — Virtual and camera kiosk | D / Feature D03 | UI / `type:ui` | area:frontend, area:contracts | P1 — có thể scope-cut khi capacity thiếu | N/A | [TMC-018](#tmc-018) | Backlog | [mapping](#remote-tmc-027) | [AC](#tmc-027) / [verify](#verify-tmc-027) |
| 440 | [TMC-028](#tmc-028) — [TMC-028] [UI] [G01] Connect scoped dashboard data and factory filters<br>FR-4.1, UC-07 | G01 — Operational dashboard and heartbeat | G / Feature G01 | UI / `type:ui` | area:backend, area:frontend | P1 — có thể scope-cut khi capacity thiếu | N/A | [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-025](#tmc-025) | Backlog | [mapping](#remote-tmc-028) | [AC](#tmc-028) / [verify](#verify-tmc-028) |
| 450 | [TMC-032](#tmc-032) — [TMC-032] [TEST] [H04] Verify the complete user journey and UI states<br>UC-01, UC-02, UC-04, NFR-1 | H04 — End-to-end and release verification | H / Feature H04 | TEST / `type:test` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-021](#tmc-021), [TMC-023](#tmc-023), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-085](#tmc-085) | Backlog | [mapping](#remote-tmc-032) | [AC](#tmc-032) / [verify](#verify-tmc-032) |
| 460 | [TMC-033](#tmc-033) — [TMC-033] [DOCS] [I02] Document SOLID evidence from implementation<br>NFR-5, M2-SOLID | I02 — SOLID evidence and reflection | I / Feature I02 | DOCS / `type:docs` | area:backend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-085](#tmc-085) | Backlog | [mapping](#remote-tmc-033) | [AC](#tmc-033) / [verify](#verify-tmc-033) |
| 470 | [TMC-034](#tmc-034) — [TMC-034] [DOCS] [I02] Write the implementation-based SOLID reflection<br>M2-SOLID | I02 — SOLID evidence and reflection | I / Feature I02 | DOCS / `type:docs` | area:backend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-030](#tmc-030), [TMC-033](#tmc-033) | Backlog | [mapping](#remote-tmc-034) | [AC](#tmc-034) / [verify](#verify-tmc-034) |
| 480 | [TMC-035](#tmc-035) — [TMC-035] [DOCS] [I01] Align architecture decisions and three required views<br>M2-DESIGN, M2-QR, M2-NETWORK, NFR-6 | I01 — Scope and architecture views | I / Feature I01 | DOCS / `type:docs` | area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-001](#tmc-001), [TMC-022](#tmc-022), [TMC-031](#tmc-031), [TMC-033](#tmc-033), [TMC-034](#tmc-034) | Backlog | [mapping](#remote-tmc-035) | [AC](#tmc-035) / [verify](#verify-tmc-035) |
| 490 | [TMC-036](#tmc-036) — [TMC-036] [DOCS] [I03] Verify setup instructions and the reproducible demo<br>NFR-5, M2-CODE | I03 — Runbook, report and submission | I / Feature I03 | DOCS / `type:docs` | area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-005](#tmc-005), [TMC-032](#tmc-032) | Backlog | [mapping](#remote-tmc-036) | [AC](#tmc-036) / [verify](#verify-tmc-036) |
| 500 | [TMC-038](#tmc-038) — [TMC-038] [TEST] [H04] Verify the release candidate and triage blockers<br>M2-CODE, M2-SUBMIT | H04 — End-to-end and release verification | H / Feature H04 | TEST / `type:test` | area:frontend, area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-035](#tmc-035), [TMC-036](#tmc-036) | Backlog | [mapping](#remote-tmc-038) | [AC](#tmc-038) / [verify](#verify-tmc-038) |
| 510 | [TMC-037](#tmc-037) — [TMC-037] [DOCS] [I03] Package the M2 report and submission evidence<br>M2-SUBMIT | I03 — Runbook, report and submission | I / Feature I03 | DOCS / `type:docs` | area:docs | P0 — chặn outcome/kiểm chứng lát cắt được chọn | N/A | [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-038](#tmc-038) | Backlog | [mapping](#remote-tmc-037) | [AC](#tmc-037) / [verify](#verify-tmc-037) |
| 520 | [TMC-055](#tmc-055) — [TMC-055] [FEATURE] [C04] Manage employee profiles with audited updates<br>FR-1.1, FR-4.6 | C04 — Employee records and factory grants | C / Feature C04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-004](#tmc-004), [TMC-007](#tmc-007) | Backlog | [mapping](#remote-tmc-055) | [AC](#tmc-055) / [verify](#verify-tmc-055) |
| 530 | [TMC-058](#tmc-058) — [TMC-058] [FEATURE] [B04] Administer accounts and session revocation APIs<br>FR-5.1, FR-4.6 | B04 — IAM administration APIs | B / Feature B04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-087](#tmc-087) | Backlog | [mapping](#remote-tmc-058) | [AC](#tmc-058) / [verify](#verify-tmc-058) |
| 540 | [TMC-060](#tmc-060) — [TMC-060] [UI] [B03] Build account administration screens<br>FR-5.1 | B03 — IAM administration interface | B / [TMC-043](#tmc-043) | UI / `type:ui` | area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-008](#tmc-008), [TMC-058](#tmc-058) | Backlog | [mapping](#remote-tmc-060) | [AC](#tmc-060) / [verify](#verify-tmc-060) |
| 540 | [TMC-043](#tmc-043) — [TMC-043] [UI] [B03] Deliver the IAM administration interface<br>FR-5.1 | B03 — IAM administration interface | B / Feature B03 | UI / `type:ui` | area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-060](#tmc-060), [TMC-061](#tmc-061) | Backlog | [mapping](#remote-tmc-043) | [AC](#tmc-043) / [verify](#verify-tmc-043) |
| 550 | [TMC-062](#tmc-062) — [TMC-062] [FEATURE] [E03] Pair attendance intervals and classify anomalies<br>FR-3.4 | E03 — Attendance pairing and corrections | E / [TMC-040](#tmc-040) | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-019](#tmc-019), [TMC-020](#tmc-020) | Backlog | [mapping](#remote-tmc-062) | [AC](#tmc-062) / [verify](#verify-tmc-062) |
| 550 | [TMC-040](#tmc-040) — [TMC-040] [FEATURE] [E03] Deliver versioned HR attendance corrections<br>FR-3.4, FR-3.5 | E03 — Attendance pairing and corrections | E / Feature E03 | FEATURE / `type:feature` | area:backend, area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064) | Backlog | [mapping](#remote-tmc-040) | [AC](#tmc-040) / [verify](#verify-tmc-040) |
| 560 | [TMC-063](#tmc-063) — [TMC-063] [FEATURE] [E03] Apply audited attendance corrections with version checks<br>FR-3.5, NFR-2, NFR-3 | E03 — Attendance pairing and corrections | E / [TMC-040](#tmc-040) | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-062](#tmc-062) | Backlog | [mapping](#remote-tmc-063) | [AC](#tmc-063) / [verify](#verify-tmc-063) |
| 570 | [TMC-064](#tmc-064) — [TMC-064] [UI] [E03] Connect attendance review and correction workflows<br>FR-3.5, FR-1.5, UC-05 | E03 — Attendance pairing and corrections | E / [TMC-040](#tmc-040) | UI / `type:ui` | area:backend, area:frontend | P2 — extension; chưa cam kết M2 | N/A | [TMC-021](#tmc-021), [TMC-063](#tmc-063) | Backlog | [mapping](#remote-tmc-064) | [AC](#tmc-064) / [verify](#verify-tmc-064) |
| 580 | [TMC-065](#tmc-065) — [TMC-065] [FEATURE] [G02] Create immutable monthly export snapshots<br>FR-4.3, FR-4.4, INT-01 | G02 — Monthly snapshot and HRS delivery | G / [TMC-041](#tmc-041) | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-024](#tmc-024), [TMC-040](#tmc-040) | Backlog | [mapping](#remote-tmc-065) | [AC](#tmc-065) / [verify](#verify-tmc-065) |
| 580 | [TMC-041](#tmc-041) — [TMC-041] [FEATURE] [G02] Deliver versioned monthly HRS exports<br>FR-4.3, FR-4.4, FR-4.5, INT-01 | G02 — Monthly snapshot and HRS delivery | G / Feature G02 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-040](#tmc-040), [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068) | Backlog | [mapping](#remote-tmc-041) | [AC](#tmc-041) / [verify](#verify-tmc-041) |
| 590 | [TMC-066](#tmc-066) — [TMC-066] [FEATURE] [G02] Implement HRS delivery and acknowledgment reconciliation<br>FR-4.3, FR-4.4, FR-4.5, INT-01 | G02 — Monthly snapshot and HRS delivery | G / [TMC-041](#tmc-041) | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-065](#tmc-065) | Backlog | [mapping](#remote-tmc-066) | [AC](#tmc-066) / [verify](#verify-tmc-066) |
| 600 | [TMC-067](#tmc-067) — [TMC-067] [FEATURE] [G02] Schedule durable exports and deadline alerts<br>FR-4.5, FR-4.3, INT-01 | G02 — Monthly snapshot and HRS delivery | G / [TMC-041](#tmc-041) | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-024](#tmc-024), [TMC-066](#tmc-066) | Backlog | [mapping](#remote-tmc-067) | [AC](#tmc-067) / [verify](#verify-tmc-067) |
| 610 | [TMC-068](#tmc-068) — [TMC-068] [TEST] [G02] Verify monthly HRS version and deadline behavior<br>FR-4.3, FR-4.4, FR-4.5, NFR-2 | G02 — Monthly snapshot and HRS delivery | G / [TMC-041](#tmc-041) | TEST / `type:test` | area:backend | P2 — extension; chưa cam kết M2 | N/A | [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067) | Backlog | [mapping](#remote-tmc-068) | [AC](#tmc-068) / [verify](#verify-tmc-068) |
| 620 | [TMC-072](#tmc-072) — [TMC-072] [FEATURE] [D04] Administer effective factory organization data<br>FR-5.2, FR-1.1 | D04 — Organization and station administration | D / Feature D04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-004](#tmc-004), [TMC-007](#tmc-007) | Backlog | [mapping](#remote-tmc-072) | [AC](#tmc-072) / [verify](#verify-tmc-072) |
| 630 | [TMC-056](#tmc-056) — [TMC-056] [FEATURE] [C04] Manage effective employee assignments and factory grants<br>FR-1.6, FR-1.1 | C04 — Employee records and factory grants | C / Feature C04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-055](#tmc-055), [TMC-072](#tmc-072) | Backlog | [mapping](#remote-tmc-056) | [AC](#tmc-056) / [verify](#verify-tmc-056) |
| 640 | [TMC-057](#tmc-057) — [TMC-057] [UI] [C04] Connect HR employee and access-grant screens<br>FR-1.1, FR-1.4, FR-1.6 | C04 — Employee records and factory grants | C / Feature C04 | UI / `type:ui` | area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-008](#tmc-008), [TMC-055](#tmc-055), [TMC-056](#tmc-056) | Backlog | [mapping](#remote-tmc-057) | [AC](#tmc-057) / [verify](#verify-tmc-057) |
| 650 | [TMC-059](#tmc-059) — [TMC-059] [FEATURE] [B04] Manage scoped role assignments without privilege escalation<br>FR-5.1, NFR-3 | B04 — IAM administration APIs | B / Feature B04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-058](#tmc-058), [TMC-072](#tmc-072) | Backlog | [mapping](#remote-tmc-059) | [AC](#tmc-059) / [verify](#verify-tmc-059) |
| 660 | [TMC-061](#tmc-061) — [TMC-061] [UI] [B03] Build scoped role-assignment administration screens<br>FR-5.1 | B03 — IAM administration interface | B / [TMC-043](#tmc-043) | UI / `type:ui` | area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-059](#tmc-059), [TMC-060](#tmc-060) | Backlog | [mapping](#remote-tmc-061) | [AC](#tmc-061) / [verify](#verify-tmc-061) |
| 670 | [TMC-073](#tmc-073) — [TMC-073] [FEATURE] [D04] Provision and retire authenticated gate stations<br>FR-2.1, FR-2.7, NFR-3 | D04 — Organization and station administration | D / Feature D04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-012](#tmc-012), [TMC-072](#tmc-072) | Backlog | [mapping](#remote-tmc-073) | [AC](#tmc-073) / [verify](#verify-tmc-073) |
| 680 | [TMC-074](#tmc-074) — [TMC-074] [UI] [D04] Connect station and organization administration screens<br>FR-2.1, FR-5.2 | D04 — Organization and station administration | D / Feature D04 | UI / `type:ui` | area:frontend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-008](#tmc-008), [TMC-072](#tmc-072), [TMC-073](#tmc-073) | Backlog | [mapping](#remote-tmc-074) | [AC](#tmc-074) / [verify](#verify-tmc-074) |
| 690 | [TMC-075](#tmc-075) — [TMC-075] [FEATURE] [G03] Query monthly reports with role-specific projections<br>FR-4.1, FR-4.2, NFR-3, NFR-4 | G03 — Scoped reports and CSV | G / Feature G03 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-062](#tmc-062) | Backlog | [mapping](#remote-tmc-075) | [AC](#tmc-075) / [verify](#verify-tmc-075) |
| 700 | [TMC-076](#tmc-076) — [TMC-076] [UI] [G03] Connect scoped monthly reports and anomaly views<br>FR-4.1, FR-4.2 | G03 — Scoped reports and CSV | G / Feature G03 | UI / `type:ui` | area:frontend | P2 — extension; chưa cam kết M2 | N/A | [TMC-008](#tmc-008), [TMC-075](#tmc-075) | Backlog | [mapping](#remote-tmc-076) | [AC](#tmc-076) / [verify](#verify-tmc-076) |
| 710 | [TMC-077](#tmc-077) — [TMC-077] [ENHANCEMENT] [G03] Export scoped CSV reports with download auditing<br>FR-4.7, FR-4.6, NFR-4 | G03 — Scoped reports and CSV | G / Feature G03 | ENHANCEMENT / `type:enhancement` | area:backend, area:frontend | P1 — có thể scope-cut khi capacity thiếu | N/A | [TMC-075](#tmc-075), [TMC-076](#tmc-076) | Backlog | [mapping](#remote-tmc-077) | [AC](#tmc-077) / [verify](#verify-tmc-077) |
| 720 | [TMC-083](#tmc-083) — [TMC-083] [FEATURE] [D04] Version integration settings and secret references<br>FR-5.2, NFR-3 | D04 — Organization and station administration | D / Feature D04 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-009](#tmc-009), [TMC-072](#tmc-072) | Backlog | [mapping](#remote-tmc-083) | [AC](#tmc-083) / [verify](#verify-tmc-083) |
| 730 | [TMC-039](#tmc-039) — [TMC-039] [ENHANCEMENT] [G01] Monitor station heartbeat and pending work<br>FR-2.6, FR-5.3 | G01 — Operational dashboard and heartbeat | G / Feature G01 | ENHANCEMENT / `type:enhancement` | area:backend, area:frontend | P1 — có thể scope-cut khi capacity thiếu | N/A | [TMC-024](#tmc-024), [TMC-028](#tmc-028) | Backlog | [mapping](#remote-tmc-039) | [AC](#tmc-039) / [verify](#verify-tmc-039) |
| 740 | [TMC-054](#tmc-054) — [TMC-054] [TEST] [A07] Exercise PostgreSQL backup and point-in-time recovery<br>FR-5.3, NFR-6 | A07 — Operations and disaster recovery | A / Feature A07 | TEST / `type:test` | area:backend, area:database, area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-004](#tmc-004), [TMC-078](#tmc-078) | Backlog | [mapping](#remote-tmc-054) | [AC](#tmc-054) / [verify](#verify-tmc-054) |
| 750 | [TMC-080](#tmc-080) — [TMC-080] [BUILD] [J01] Add privacy workflow and retention-hold persistence<br>FR-5.4, NFR-4 | J01 — Privacy policy and retention workflow | J / Feature J01 | BUILD / `type:build` | area:backend, area:database | P2 — extension; chưa cam kết M2 | N/A | [TMC-004](#tmc-004), [TMC-078](#tmc-078) | Backlog | [mapping](#remote-tmc-080) | [AC](#tmc-080) / [verify](#verify-tmc-080) |
| 760 | [TMC-079](#tmc-079) — [TMC-079] [FEATURE] [J01] Implement authorized privacy request lifecycle APIs<br>FR-1.5, FR-5.4, NFR-4 | J01 — Privacy policy and retention workflow | J / Feature J01 | FEATURE / `type:feature` | area:backend, area:contracts | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-078](#tmc-078), [TMC-080](#tmc-080) | Backlog | [mapping](#remote-tmc-079) | [AC](#tmc-079) / [verify](#verify-tmc-079) |
| 770 | [TMC-081](#tmc-081) — [TMC-081] [FEATURE] [J01] Execute policy-based retention without erasing held evidence<br>FR-5.4, NFR-4 | J01 — Privacy policy and retention workflow | J / Feature J01 | FEATURE / `type:feature` | area:backend | P2 — extension; chưa cam kết M2 | N/A | [TMC-024](#tmc-024), [TMC-079](#tmc-079), [TMC-080](#tmc-080) | Backlog | [mapping](#remote-tmc-081) | [AC](#tmc-081) / [verify](#verify-tmc-081) |
| 780 | [TMC-082](#tmc-082) — [TMC-082] [TEST] [J01] Verify privacy requests, retention and evidence holds<br>FR-5.4, FR-1.5, NFR-4 | J01 — Privacy policy and retention workflow | J / Feature J01 | TEST / `type:test` | area:backend, area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-054](#tmc-054), [TMC-079](#tmc-079), [TMC-081](#tmc-081) | Backlog | [mapping](#remote-tmc-082) | [AC](#tmc-082) / [verify](#verify-tmc-082) |
| 790 | [TMC-084](#tmc-084) — [TMC-084] [ENHANCEMENT] [A07] Expose scoped service readiness and integration alerts<br>FR-5.3, NFR-3 | A07 — Operations and disaster recovery | A / Feature A07 | ENHANCEMENT / `type:enhancement` | area:backend | P2 — extension; chưa cam kết M2 | N/A | [TMC-007](#tmc-007), [TMC-024](#tmc-024), [TMC-039](#tmc-039) | Backlog | [mapping](#remote-tmc-084) | [AC](#tmc-084) / [verify](#verify-tmc-084) |
| 800 | [TMC-069](#tmc-069) — [TMC-069] [SPIKE] [F03] Decide the offline edge authorization threat model<br>M2-NETWORK, M2-QR | F03 — Optional autonomous offline edge | F / [TMC-042](#tmc-042) | SPIKE / `type:spike` | area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030) | Backlog | [mapping](#remote-tmc-069) | [AC](#tmc-069) / [verify](#verify-tmc-069) |
| 800 | [TMC-042](#tmc-042) — [TMC-042] [SPIKE] [F03] Evaluate and prototype autonomous offline edge operation<br>M2-NETWORK | F03 — Optional autonomous offline edge | F / Feature F03 | SPIKE / `type:spike` | area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030), [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071) | Backlog | [mapping](#remote-tmc-042) | [AC](#tmc-042) / [verify](#verify-tmc-042) |
| 810 | [TMC-070](#tmc-070) — [TMC-070] [FEATURE] [F03] Prototype durable offline journals and synchronization<br>M2-NETWORK | F03 — Optional autonomous offline edge | F / [TMC-042](#tmc-042) | FEATURE / `type:feature` | area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-069](#tmc-069) | Backlog | [mapping](#remote-tmc-070) | [AC](#tmc-070) / [verify](#verify-tmc-070) |
| 820 | [TMC-071](#tmc-071) — [TMC-071] [TEST] [F03] Verify edge partition and replay limitations<br>M2-NETWORK, M2-QR, NFR-2 | F03 — Optional autonomous offline edge | F / [TMC-042](#tmc-042) | TEST / `type:test` | area:docs | P2 — extension; chưa cam kết M2 | N/A | [TMC-070](#tmc-070) | Backlog | [mapping](#remote-tmc-071) | [AC](#tmc-071) / [verify](#verify-tmc-071) |

### 6.2. Delivery metadata — canonical estimates and planning windows

Owner/reviewer/merge owner cho mọi dòng là **User**; executor/assignee **Unassigned** cho tới khi được giao. Actual effort và actual dates **Not recorded**. Giờ dưới đây là tổng human effort, đã gồm review/integration/test/docs; parent ghi rollup, không cộng lần hai. Không chia giả các giờ H/R/I/T/D mới khi chưa có dữ kiện. Với ticket cũ, [phiếu gốc](work-flow.md#s8) còn breakdown estimate lịch sử để audit.

| Ticket | Estimate / confidence | Start → Target relative | Milestone / planning window | Baseline selection | Owner / assignee / reviewer | Actual / remaining |
| --- | --- | --- | --- | --- | --- | --- |
| [TMC-001](#tmc-001) | 2h / Low–Medium, kế thừa | W01/D1 → W01/D2 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-002](#tmc-002) | 3h / Low–Medium, kế thừa | W01/D4 → W01/D4 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-003](#tmc-003) | 3h / Low–Medium, kế thừa | W01/D4 → W01/D5 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-004](#tmc-004) | 6h / Low–Medium, kế thừa | W01/D5 → W01/D6 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-005](#tmc-005) | 2h / Low–Medium, kế thừa | W01/D6 → W02/D1 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-006](#tmc-006) | 2h / Low–Medium, kế thừa | W02/D1 → W02/D1 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-007](#tmc-007) | 3h / Low–Medium, kế thừa | W02/D1 → W02/D2 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-008](#tmc-008) | 2h / Low–Medium, kế thừa | W02/D2 → W02/D2 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-009](#tmc-009) | 2h / Low–Medium, kế thừa | W02/D2 → W02/D3 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-010](#tmc-010) | 3h / Low–Medium, kế thừa | W02/D4 → W02/D4 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-011](#tmc-011) | 3h / Low–Medium, kế thừa | W02/D5 → W02/D5 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-012](#tmc-012) | 2h / Low–Medium, kế thừa | W02/D5 → W02/D6 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-013](#tmc-013) | 3h / Low–Medium, kế thừa | W02/D6 → W02/D6 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-014](#tmc-014) | 4h / Low–Medium, kế thừa | W02/D6 → W03/D1 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-015](#tmc-015) | 3h / Low–Medium, kế thừa | W03/D1 → W03/D2 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-016](#tmc-016) | 4h / Low–Medium, kế thừa | W03/D2 → W03/D2 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-017](#tmc-017) | 2h / Low–Medium, kế thừa | W03/D2 → W03/D3 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-018](#tmc-018) | 3h / Low–Medium, kế thừa | W03/D3 → W03/D3 | M-02; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-019](#tmc-019) | 4h / Low–Medium, kế thừa | W03/D4 → W03/D4 | M-03; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-020](#tmc-020) | 2h / Low–Medium, kế thừa | W03/D4 → W03/D5 | M-03; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-021](#tmc-021) | 2h / Low–Medium, kế thừa | W03/D5 → W03/D5 | M-03; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-022](#tmc-022) | 2h / Low–Medium, kế thừa | W03/D6 → W03/D6 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-023](#tmc-023) | 3h / Low–Medium, kế thừa | W03/D6 → W04/D1 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-024](#tmc-024) | 4h / Low–Medium, kế thừa | W04/D1 → W04/D2 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-025](#tmc-025) | 3h / Low–Medium, kế thừa | W04/D2 → W04/D2 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-026](#tmc-026) | 2h / Low–Medium, kế thừa | W04/D1 → W04/D1 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-027](#tmc-027) | 2h / Low–Medium, kế thừa | W04/D6 → W04/D6 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-028](#tmc-028) | 2h / Low–Medium, kế thừa | W04/D6 → W04/D6 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-029](#tmc-029) | 3h / Low–Medium, kế thừa | W04/D3 → W04/D3 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-030](#tmc-030) | 4h / Low–Medium, kế thừa | W04/D3 → W04/D4 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-031](#tmc-031) | Không cộng; rollup 6h từ con | W04/D4 → W04/D5 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-032](#tmc-032) | 2h / Low–Medium, kế thừa | W04/D6 → W05/D1 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-033](#tmc-033) | 2h / Low–Medium, kế thừa | W05/D1 → W05/D1 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-034](#tmc-034) | 2h / Low–Medium, kế thừa | W05/D1 → W05/D2 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-035](#tmc-035) | 4h / Low–Medium, kế thừa | W05/D2 → W05/D3 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-036](#tmc-036) | 2h / Low–Medium, kế thừa | W05/D3 → W05/D3 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-037](#tmc-037) | 3h / Low–Medium, kế thừa | W05/D4 → W05/D4 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-038](#tmc-038) | 3h / Low–Medium, kế thừa | W05/D3 → W05/D4 | M-05; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-039](#tmc-039) | 3h / Low–Medium, kế thừa | W07/D6 → W08/D1 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-040](#tmc-040) | Không cộng; rollup 10h từ con | W05/D6 → W06/D2 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-041](#tmc-041) | Không cộng; rollup 13h từ con | W06/D2 → W06/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-042](#tmc-042) | Không cộng; rollup 14h từ con | Unscheduled; sau go/no-go | M-08; tuần tương đối | Optional edge | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-043](#tmc-043) | Không cộng; rollup 6h từ con | W05/D5 → W07/D2 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-044](#tmc-044) | 3h / Low, proposed | W01/D1 → W01/D1 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-045](#tmc-045) | 2h / Low, proposed | W01/D2 → W01/D2 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-046](#tmc-046) | 2h / Low, proposed | W01/D2 → W01/D2 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-047](#tmc-047) | 2h / Low, proposed | W01/D2 → W01/D3 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-048](#tmc-048) | 1.5h / Low, proposed | W01/D3 → W01/D3 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-049](#tmc-049) | 1.5h / Low, proposed | W01/D3 → W01/D3 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-050](#tmc-050) | 3h / Low, proposed | W02/D3 → W02/D3 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-051](#tmc-051) | 2h / Low, proposed | W04/D4 → W04/D4 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-052](#tmc-052) | 2h / Low, proposed | W04/D4 → W04/D5 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-053](#tmc-053) | 2h / Low, proposed | W04/D5 → W04/D5 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-054](#tmc-054) | 4h / Low, proposed | W08/D1 → W08/D2 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-055](#tmc-055) | 3h / Low, proposed | W05/D4 → W05/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-056](#tmc-056) | 3h / Low, proposed | W06/D6 → W06/D6 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-057](#tmc-057) | 3h / Low, proposed | W06/D6 → W07/D1 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-058](#tmc-058) | 3h / Low, proposed | W05/D5 → W05/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-059](#tmc-059) | 3h / Low, proposed | W07/D1 → W07/D1 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-060](#tmc-060) | 3h / Low, proposed | W05/D5 → W05/D6 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-061](#tmc-061) | 3h / Low, proposed | W07/D1 → W07/D2 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-062](#tmc-062) | 3h / Low, proposed | W05/D6 → W06/D1 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-063](#tmc-063) | 4h / Low, proposed | W06/D1 → W06/D2 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-064](#tmc-064) | 3h / Low, proposed | W06/D2 → W06/D2 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-065](#tmc-065) | 3h / Low, proposed | W06/D2 → W06/D3 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-066](#tmc-066) | 4h / Low, proposed | W06/D3 → W06/D4 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-067](#tmc-067) | 3h / Low, proposed | W06/D4 → W06/D4 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-068](#tmc-068) | 3h / Low, proposed | W06/D4 → W06/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-069](#tmc-069) | 4h / Low, proposed | Unscheduled; sau go/no-go | M-08; tuần tương đối | Optional edge | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-070](#tmc-070) | 6h / Low, proposed | Unscheduled; sau go/no-go | M-08; tuần tương đối | Optional edge | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-071](#tmc-071) | 4h / Low, proposed | Unscheduled; sau go/no-go | M-08; tuần tương đối | Optional edge | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-072](#tmc-072) | 3h / Low, proposed | W06/D5 → W06/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-073](#tmc-073) | 4h / Low, proposed | W07/D2 → W07/D3 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-074](#tmc-074) | 3h / Low, proposed | W07/D3 → W07/D3 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-075](#tmc-075) | 4h / Low, proposed | W07/D3 → W07/D4 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-076](#tmc-076) | 3h / Low, proposed | W07/D4 → W07/D5 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-077](#tmc-077) | 3h / Low, proposed | W07/D5 → W07/D6 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-078](#tmc-078) | 2h / Low, proposed | W01/D3 → W01/D4 | M-00; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-079](#tmc-079) | 3h / Low, proposed | W08/D2 → W08/D3 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-080](#tmc-080) | 3h / Low, proposed | W08/D2 → W08/D2 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-081](#tmc-081) | 4h / Low, proposed | W08/D3 → W08/D4 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-082](#tmc-082) | 4h / Low, proposed | W08/D4 → W08/D5 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-083](#tmc-083) | 3h / Low, proposed | W07/D6 → W07/D6 | M-06; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-084](#tmc-084) | 3h / Low, proposed | W08/D5 → W08/D5 | M-07; tuần tương đối | Extension/deferred | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-085](#tmc-085) | 2h / Low, proposed | W04/D5 → W04/D6 | M-04; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-086](#tmc-086) | 2h / Low, proposed | W03/D5 → W03/D6 | M-03; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |
| [TMC-087](#tmc-087) | 3h / Low, proposed | W02/D3 → W02/D4 | M-01; tuần tương đối | M2 proposal | User / Unassigned / User | Not recorded / cần TMC-044 refine |

<a id="details"></a>

## 7. Ticket details and verification plans

### 7.1. Môi trường và verification profiles

Các lệnh dưới có trong manifest; **chưa chạy trong lần viết backlog**. Lệnh hiện có chỉ kiểm tra các suite đã được đăng ký, không tự bao phủ future gate/HRS tests. Ticket thêm test phải bổ sung runner ở package sở hữu; case chưa có harness ghi planned design, không bịa `test:e2e`, `test:load`, Jest hoặc PowerShell script chưa tồn tại.

| Profile | Lệnh/scenario | Điều kiện / kết quả cần chứng minh |
| --- | --- | --- |
| V-DOC | Rà Markdown, links/anchors, requirement IDs, count/effort/dependency và nội dung với owner | Đọc tài liệu/source có liên quan; không cần build ứng dụng nếu chỉ sửa docs. |
| V-API | `pnpm.cmd --dir api typecheck`; `pnpm.cmd --dir api test` | Dependencies/toolchain từ root; Node tests hiện mock, không cần PostgreSQL. New behavior phải có assertions/suite được runner gọi thật. |
| V-CLIENT | `pnpm.cmd --dir client typecheck`; `pnpm.cmd --dir client test`; `pnpm.cmd --dir client build` + manual smoke trên preview hiện có | Node RBAC suite không thay browser/visual/E2E. UI theo client/AGENTS và Guidelines khi triển khai. |
| V-DB | `pnpm.cmd --dir api test:integration` cho **seed suite hiện có**; DB scenarios riêng là planned test design | PostgreSQL **test** đã migrate/seed đúng fixtures. Không tự seed/reset DB thật. Scan/race/correction tests chưa được runner hiện tại thực hiện. |
| V-LOAD | Planned harness: timestamps nhận đủ QR→UI render; baseline 800/30 phút/nhà máy + burst được owner chốt | Dữ liệu synthetic, số lỗi/correctness/raw timings và môi trường; so ≤2s, không tự đổi mục tiêu thành percentile. |
| V-GH | Dry configuration/import review; khi được giao remote mới kiểm tra quyền, response IDs, fields/views/checks/review | Proposal là Not provisioned; xác minh thực với quyền owner, không tạo remote ở task này. |
| V-RESTORE | Planned isolated backup/WAL/restore drill | Instance test được chỉ định, timeline/count/invariants; không phục hồi đè DB đang sử dụng. |
| V-EDGE | Planned simulator partition/restart/clock/replay/sync matrix | Chỉ sau go/no-go và capacity; giới hạn của prototype được ghi rõ. |

**Delivery checklist áp cho từng ticket:** DoR và assignment có nguồn → branch từ `main` theo [workflow §4.6](work-flow.md#46-quy-ước-đặt-tên-nhánh) → scope/AC/verification → commit/check/push đúng quyền → PR link ticket, chờ user review → chỉ Done khi user approve/merge/accept. Chưa thực hiện ô nào trong checklist cho các ticket chỉ được lập kế hoạch. PR/check SHA, commands, environment, actual result và limitations phải được ghi trong handoff của ticket.

**Out of scope chung:** feature/module ngoài outcome phiếu; sửa cấu hình/credentials local; triển khai toàn bộ API catalog; deploy/merge/nộp LMS hoặc thao tác GitHub remote khi chưa được giao. Mỗi ticket kế thừa giới hạn này cùng scope riêng bên dưới. Các file proposed là deliverable dự kiến, không là hiện trạng.

<a id="tmc-001"></a>

### [TMC-001] [DOCS] [I01] Confirm M2 scope and requirement traceability

**Metadata:** Feature I01 — Scope and architecture views; Epic I — Documentation & Submission; parent Feature I01; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs. Requirements: M2-DESIGN, M2-SOLID, M2-CODE. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D1 → W01/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-001). Source: [Phiếu gốc](work-flow.md#tmc-001).

**Problem → expected outcome:** Đối chiếu M1 đã hoàn thành với đề M2; giữ NestJS, modular monolith và scope Gate Access & Attendance. Xác định ranh giới đo NFR, mock và các phần chỉ thiết kế.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** Lập mapping FR/NFR → use case → ticket → evidence cho hai vấn đề mới của M2. Ghi ADR baseline: online R1, token ngắn hạn, sensor mock, station direction cố định và scope dữ liệu. Chốt 37 bảng migration nhưng chỉ triển khai API/UI của vertical slice; đánh dấu HRS/HR correction mở rộng. Ghi giả định deadline LMS, Figma nguồn, hợp đồng TCS và cách đo phản hồi ≤2 giây.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/summary-assigment.md](../doc/summary-assigment.md); [doc/structure-architecture.md](../doc/structure-architecture.md); [doc/schema-database.md](../doc/schema-database.md); [doc/user-flow.md](../doc/user-flow.md); [doc/work-flow.md](../doc/work-flow.md). Dependencies: [TMC-044](#tmc-044). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-001-AC1: Không bỏ thiếu Task 1, SOLID reflection, Task 2 và GitHub URL trong ma trận.
- [ ] TMC-001-AC2: Phân biệt yêu cầu PDF với lựa chọn nội bộ, mock và chức năng chưa hiện thực.
- [ ] TMC-001-AC3: Mỗi quyết định có nguồn M1/M2 hoặc giả định rõ ràng.

<a id="verify-tmc-001"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Đối chiếu từng dòng Task 1/2 với PDF M2 trang 2–3.<br>2. Kiểm tra liên kết, mã requirement và scope không mâu thuẫn schema/user-flow.<br>3. Solo Developer đọc và chốt baseline trước khi mở ticket phụ thuộc. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Không bỏ thiếu Task 1, SOLID reflection, Task 2 và GitHub URL trong ma trận.<br>AC2: Phân biệt yêu cầu PDF với lựa chọn nội bộ, mock và chức năng chưa hiện thực.<br>AC3: Mỗi quyết định có nguồn M1/M2 hoặc giả định rõ ràng. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-002"></a>

### [TMC-002] [BUILD] [A01] Verify the client workspace and preview baseline

**Metadata:** Feature A01 — Workspace and client foundation; Epic A — Project Setup & Foundation; parent Feature A01; `type:build`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend. Requirements: NFR-5. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W01/D4 → W01/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-002). Source: [Phiếu gốc](work-flow.md#tmc-002).

**Problem → expected outcome:** Workspace client/api/contracts và dependency Astra đã có trong source/manifest. Cần chứng minh build, preview và ownership còn đúng; chỉ sửa gap được tái hiện.

**Hiện trạng:** Workspace/client/.figma đã có; chưa nghiệm thu toàn AC.

**Scope/deliverables:** Đối chiếu root/package scripts, Vite root, aliases, assets và client/.figma với repository-layout. Chạy kiểm chứng hiện có và kiểm tra deep link/light-dark trên preview đang dùng; không di chuyển source lần nữa.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/vite.config.ts](../client/vite.config.ts); [client/.figma](../client/.figma); [pnpm-workspace.yaml](../pnpm-workspace.yaml); [package.json](../package.json). Dependencies: [TMC-001](#tmc-001). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Build/CI details:** target là workspace/package/DB test trong Inputs; dùng Node/pnpm version hiện có, root lockfile và scripts thật. Ghi compatibility/migration impact và check names có chạy thực, giữ secrets ngoài repo; không báo suite pass chỉ từ YAML.

**Acceptance criteria**

- [ ] TMC-002-AC1: client build/typecheck được với đường dẫn assets đúng.
- [ ] TMC-002-AC2: Preview hiện hữu và entry dev không bị mất sau chuyển thư mục.
- [ ] TMC-002-AC3: Có nguồn dependency Astra tái lập được; nếu chưa có thì ticket Blocked với lý do, không ghi build đã pass.

<a id="verify-tmc-002"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Chạy typecheck/build client từ workspace mới.<br>2. Smoke test landing, login, mobile QR và kiosk trên preview.<br>3. So light/dark, font và ảnh với baseline; thử refresh deep link.<br>4. Cài dependency từ lockfile trong môi trường sạch có quyền/package source phù hợp; xác nhận Astra resolve/build được, giữ nguyên cấu hình local đang dùng. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: client build/typecheck được với đường dẫn assets đúng.<br>AC2: Preview hiện hữu và entry dev không bị mất sau chuyển thư mục.<br>AC3: Có nguồn dependency Astra tái lập được; nếu chưa có thì ticket Blocked với lý do, không ghi build đã pass. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-003"></a>

### [TMC-003] [BUILD] [A02] Complete backend ports and shared wire contracts

**Metadata:** Feature A02 — Backend architecture and wire contracts; Epic A — Project Setup & Foundation; parent Feature A02; `type:build`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: NFR-5. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W01/D4 → W01/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-003). Source: [Phiếu gốc](work-flow.md#tmc-003).

**Problem → expected outcome:** NestJS bootstrap, bounded-context modules, transaction ports và contracts đã có. Hoàn thiện phần wiring/wire contracts còn thiếu cho lát cắt, giữ biên ORM/domain/HTTP.

**Hiện trạng:** Nest module/ports/contracts đã có; application boundary và HTTP contracts chưa đầy đủ.

**Scope/deliverables:** Kiểm tra module registration và inject được ports qua bootstrap. Bổ sung request/response/error DTO còn thiếu theo API catalog; giữ contracts không phụ thuộc framework.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/bootstrap/modules](../api/src/bootstrap/modules); [api/src/platform/application](../api/src/platform/application); [contracts/src](../contracts/src). Dependencies: [TMC-002](#tmc-002). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Build/CI details:** target là workspace/package/DB test trong Inputs; dùng Node/pnpm version hiện có, root lockfile và scripts thật. Ghi compatibility/migration impact và check names có chạy thực, giữ secrets ngoài repo; không báo suite pass chỉ từ YAML.

**Acceptance criteria**

- [ ] TMC-003-AC1: Health endpoint chạy, core không import Nest/TypeORM/HTTP types.
- [ ] TMC-003-AC2: Use case nhận port qua constructor; không có singleton mutable transaction manager.
- [ ] TMC-003-AC3: Scan/lookup contract giữ eventId và mô tả 409 payload conflict.

<a id="verify-tmc-003"></a>

**Verification plan — V-API**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Build/typecheck api.<br>2. Unit smoke test khởi tạo use case với fake ports.<br>3. Kiểm tra dependency/import của domain và application. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Health endpoint chạy, core không import Nest/TypeORM/HTTP types.<br>AC2: Use case nhận port qua constructor; không có singleton mutable transaction manager.<br>AC3: Scan/lookup contract giữ eventId và mô tả 409 payload conflict. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-004"></a>

### [TMC-004] [BUILD] [A03] Verify PostgreSQL migrations and core constraints

**Metadata:** Feature A03 — Schema and migration foundation; Epic A — Project Setup & Foundation; parent Feature A03; `type:build`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:database. Requirements: FR-3.1, FR-3.3, NFR-2. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W01/D5 → W01/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-004). Source: [Phiếu gốc](work-flow.md#tmc-004).

**Problem → expected outcome:** Đã có ORM entities theo bounded context, registry và migrations. Kiểm chứng schema/constraints trên PostgreSQL test, bổ sung đúng gap; không tạo lại schema hoặc dùng synchronize.

**Hiện trạng:** 37 ORM entities/migration registry đã có; chưa kiểm tra DB đang áp migration.

**Scope/deliverables:** Đối chiếu metadata, registry và migrations với schema-database. Kiểm tra uniqueness, FK, source revisions và rollback trên database test được chọn; ghi migration plan cho phần sửa.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/platform/infrastructure/database/migrations](../api/src/platform/infrastructure/database/migrations); [api/src/platform/infrastructure/database/entities.ts](../api/src/platform/infrastructure/database/entities.ts); [api/src/modules](../api/src/modules). Dependencies: [TMC-003](#tmc-003). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Build/CI details:** target là workspace/package/DB test trong Inputs; dùng Node/pnpm version hiện có, root lockfile và scripts thật. Ghi compatibility/migration impact và check names có chạy thực, giữ secrets ngoài repo; không báo suite pass chỉ từ YAML.

**Acceptance criteria**

- [ ] TMC-004-AC1: Migration chạy từ DB rỗng; mọi FK có bảng/khóa đích đúng kiểu.
- [ ] TMC-004-AC2: Insert Event+revision 1 commit được; thiếu revision và vi phạm unique bị chặn.
- [ ] TMC-004-AC3: Rollback UnitOfWork không để audit/command/attendance lưu một phần.

<a id="verify-tmc-004"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Chạy migration trên PostgreSQL test rỗng; so catalog với 37 bảng schema.<br>2. Thử vi phạm PK/FK/UK/partial unique và deferred head.<br>3. Thử hai transaction song song và lỗi giữa transaction; không dùng SQLite thay tính năng PG. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Migration chạy từ DB rỗng; mọi FK có bảng/khóa đích đúng kiểu.<br>AC2: Insert Event+revision 1 commit được; thiếu revision và vi phạm unique bị chặn.<br>AC3: Rollback UnitOfWork không để audit/command/attendance lưu một phần. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-005"></a>

### [TMC-005] [CI] [A04] Complete Node test runners and CI contracts

**Metadata:** Feature A04 — Test and CI foundation; Epic A — Project Setup & Foundation; parent Feature A04; `type:ci`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend. Requirements: NFR-5. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W01/D6 → W02/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-005). Source: [Phiếu gốc](work-flow.md#tmc-005).

**Problem → expected outcome:** Đã có Node test scripts cho auth/bootstrap/env và RBAC client; chưa thấy .github/workflows hoặc OpenAPI runtime. Bổ sung CI và contract verification theo các script thực có.

**Hiện trạng:** Node tests có; chưa thấy .github/workflows; không có Jest/E2E/load script.

**Scope/deliverables:** Tái sử dụng node:test; phân biệt unit/bootstrap không cần DB với integration cần DB test. Tạo CI và tài liệu/đầu ra OpenAPI cho routes đã đăng ký; không công bố route thiết kế là implemented.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/package.json](../api/package.json); [api/test](../api/test); [client/test](../client/test); `.github/workflows` (proposed; chưa có). Dependencies: [TMC-003](#tmc-003), [TMC-004](#tmc-004). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Build/CI details:** target là workspace/package/DB test trong Inputs; dùng Node/pnpm version hiện có, root lockfile và scripts thật. Ghi compatibility/migration impact và check names có chạy thực, giữ secrets ngoài repo; không báo suite pass chỉ từ YAML.

**Acceptance criteria**

- [ ] TMC-005-AC1: Một integration test thực sự kết nối PG và rollback fixture.
- [ ] TMC-005-AC2: CI/script fail khi assertion fail, không bỏ qua lỗi bằng catch hoặc continue-on-error.
- [ ] TMC-005-AC3: Không commit secrets và không chạy reset vào DB vận hành.

<a id="verify-tmc-005"></a>

**Verification plan — V-API+V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Chạy pipeline local tương ứng; tạo test fail tạm rồi khôi phục để kiểm tra exit code.<br>2. Xác minh env test độc lập và migrations dùng đúng DB.<br>3. Validate OpenAPI và health response. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Một integration test thực sự kết nối PG và rollback fixture.<br>AC2: CI/script fail khi assertion fail, không bỏ qua lỗi bằng catch hoặc continue-on-error.<br>AC3: Không commit secrets và không chạy reset vào DB vận hành. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-006"></a>

### [TMC-006] [TASK] [B01] Verify identity, scope and station fixtures

**Metadata:** Feature B01 — Identity, scoped sessions and seed; Epic B — Authentication & Employee Foundation; parent Feature B01; `type:task`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:database. Requirements: FR-1.1, FR-1.6, FR-2.1, FR-5.1. UC/UF: UC-08 / UF-00, UF-09. API: API-IAM-01…03; quyền server cho các API nghiệp vụ ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D1 → W02/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-006). Source: [Phiếu gốc](work-flow.md#tmc-006).

**Problem → expected outcome:** Seed/demo identity và seed:ui đã có. Kiểm tra fixtures role/scope và trạm IN/OUT trên DB test; giữ case inactive/revoked và cấu hình local.

**Hiện trạng:** Seed/fixtures và seed:ui có; chưa đọc DB hoặc chạy seed trong lần này.

**Scope/deliverables:** Đối chiếu seeds và fixtures hai nhà máy với policy quyền. Chỉ chuẩn bị DB test có chủ đích khi nhận ticket, không chạy seed/reset password trên DB đang dùng để viết backlog.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam](../api/src/modules/iam); [api/src/platform/infrastructure/database/seeds](../api/src/platform/infrastructure/database/seeds); [api/test/auth.service.test.mjs](../api/test/auth.service.test.mjs). Dependencies: [TMC-004](#tmc-004). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** task có đầu ra quyết định/cấu hình/audit cụ thể; điều kiện quyền/owner/metadata phải có nguồn trước khi thực hiện, không tạo remote khi chỉ chuẩn bị proposal.

**Acceptance criteria**

- [ ] TMC-006-AC1: Trạm quyết định direction tại server, client không được sửa nhà máy/hướng.

<a id="verify-tmc-006"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1 | 1. Đọc seed/fixtures và chạy integration seed suite trên DB test đã migrate/seed; positive roles vào đúng scope, inactive/revoked bị từ chối.<br>2. Đối chiếu IN/OUT direction, credential references và mapping HRS; không ghi secret vào evidence. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Trạm quyết định direction tại server, client không được sửa nhà máy/hướng. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-007"></a>

### [TMC-007] [ENHANCEMENT] [B01] Complete server session authorization and scope checks

**Metadata:** Feature B01 — Identity, scoped sessions and seed; Epic B — Authentication & Employee Foundation; parent Feature B01; `type:enhancement`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:database. Requirements: FR-5.1, FR-4.6, NFR-3. UC/UF: UC-08 / UF-00, UF-09. API: API-IAM-01…03; quyền server cho các API nghiệp vụ ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D1 → W02/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-007). Source: [Phiếu gốc](work-flow.md#tmc-007).

**Problem → expected outcome:** Login/logout/me và cookie session đã có source. Bổ sung quyền/scope phía server cho API nghiệp vụ cùng audit/hardening theo AC gốc; giữ behavior đăng nhập hiện tại.

**Hiện trạng:** Login/logout/me và session có; chưa thấy guard nghiệp vụ dùng chung, còn hardening theo AC.

**Scope/deliverables:** Tạo login/me/logout, kiểm tra password hash, session expiry/revocation và employee inactive. Thực thi permission+scope cho EMP self, HR, SUP team, SEC factory, ADM cấu hình, EXE aggregate. Tách station authentication khỏi user authentication; không nhận actorId/client role làm căn cứ. Cấu hình cookie/CORS/CSRF theo deployment, rate limit login và redaction lỗi.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam](../api/src/modules/iam); [api/src/platform/infrastructure/database/seeds](../api/src/platform/infrastructure/database/seeds); [api/test/auth.service.test.mjs](../api/test/auth.service.test.mjs). Dependencies: [TMC-005](#tmc-005), [TMC-006](#tmc-006). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Login/logout/me và session có; chưa thấy guard nghiệp vụ dùng chung, còn hardening theo AC. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-007-AC1: Sửa localStorage/role/filter không nâng quyền gọi API.
- [ ] TMC-007-AC2: ADM không tự có quyền HR correction; SUP không truy cập nhân viên ngoài tổ.
- [ ] TMC-007-AC3: Session hết hạn/thu hồi trả 401; thiếu quyền trả 403 theo contract.

<a id="verify-tmc-007"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Thử login sai, hết hạn, logout rồi dùng lại token.<br>2. API tests IDOR hai nhân viên/hai nhà máy; station gọi API portal và ngược lại.<br>3. Xác minh cookie/CSRF và log không chứa session secret/password. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Sửa localStorage/role/filter không nâng quyền gọi API.<br>AC2: ADM không tự có quyền HR correction; SUP không truy cập nhân viên ngoài tổ.<br>AC3: Session hết hạn/thu hồi trả 401; thiếu quyền trả 403 theo contract. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-008"></a>

### [TMC-008] [ENHANCEMENT] [B02] Verify session login and protected navigation

**Metadata:** Feature B02 — Authenticated client navigation; Epic B — Authentication & Employee Foundation; parent Feature B02; `type:enhancement`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend. Requirements: FR-1.5, FR-5.1, NFR-3. UC/UF: UC-02 / UF-00. API: API-IAM-01…03 ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D2 → W02/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-008). Source: [Phiếu gốc](work-flow.md#tmc-008).

**Problem → expected outcome:** HTTP auth adapter và protected navigation đã có. Kiểm chứng cookie session/role/scope và identity cache, chỉ sửa các gap thật.

**Hiện trạng:** Client auth adapter/session/router guard đã có; chưa smoke runtime.

**Scope/deliverables:** Thêm HTTP adapter có credentials, DTO mapping và thống nhất 401/403. Thay login(id) bằng form gọi login/me/logout, bỏ tin cậy session localStorage cũ. Thêm protected route và permission UI theo server; map role prototype về actor chuẩn. Clear TanStack cache khi logout/đổi user; tách query keys theo identity và demo/server mode.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/data/auth.ts](../client/src/data/auth.ts); [client/src/lib/session.ts](../client/src/lib/session.ts); [client/src/app/context.tsx](../client/src/app/context.tsx); [client/src/app/router.tsx](../client/src/app/router.tsx). Dependencies: [TMC-002](#tmc-002), [TMC-007](#tmc-007). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Client auth adapter/session/router guard đã có; chưa smoke runtime. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-008-AC1: EMP không thể mở route người khác bằng URL hoặc data cache cũ.
- [ ] TMC-008-AC2: Reload giữ phiên hợp lệ; hết phiên hiển thị đăng nhập rõ ràng.
- [ ] TMC-008-AC3: Không dùng getDatabase toàn bộ dữ liệu nhân sự cho mọi account server.

<a id="verify-tmc-008"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Manual login/logout/reload và đổi EMP-A sang EMP-B.<br>2. Test redirect returnTo và trang 403.<br>3. Kiểm tra cache và Network panel không trả dữ liệu ngoài scope. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: EMP không thể mở route người khác bằng URL hoặc data cache cũ.<br>AC2: Reload giữ phiên hợp lệ; hết phiên hiển thị đăng nhập rõ ràng.<br>AC3: Không dùng getDatabase toàn bộ dữ liệu nhân sự cho mọi account server. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-009"></a>

### [TMC-009] [FEATURE] [C01] Implement QR credential and signing-key metadata

**Metadata:** Feature C01 — Credential and signed QR lifecycle; Epic C — QR Credential Management; parent Feature C01; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-1.2, FR-1.4, FR-5.2. UC/UF: UC-03 / UF-01, UF-04. API: API-EQR-01/14; catalog §19.6 ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D2 → W02/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-009). Source: [Phiếu gốc](work-flow.md#tmc-009).

**Problem → expected outcome:** Hiện thực model credential và key metadata theo schema; key material chỉ ở env/secret provider. Chưa tạo màn quản lý khóa đầy đủ.

**Hiện trạng:** ORM QR credential/key/token có, chưa thấy service phát hành/xác minh.

**Scope/deliverables:** Tạo QrCredential aggregate, repository, signing-key registry và mapper. Cấu hình kid, algorithm allowlist, public JWK và private secret reference. Seed một key hoạt động, một verify-only/revoked để test rotation. Thêm command cấp credential có actor HR/scope và audit trong UnitOfWork.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [contracts/src/employee.ts](../contracts/src/employee.ts); [api/src/modules/iam](../api/src/modules/iam). Dependencies: [TMC-004](#tmc-004), [TMC-006](#tmc-006). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-009-AC1: Chỉ một credential ACTIVE cho mỗi employee theo policy/schema.
- [ ] TMC-009-AC2: Private key không nằm trong DB payload, client bundle hay logs.
- [ ] TMC-009-AC3: Key không biết hoặc REVOKED không được dùng xác minh token mới.

<a id="verify-tmc-009"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Unit test vòng đời credential và key status.<br>2. Integration test partial unique active credential.<br>3. Quét secret trong fixture/log và kiểm tra metadata không chứa private JWK parameters. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Chỉ một credential ACTIVE cho mỗi employee theo policy/schema.<br>AC2: Private key không nằm trong DB payload, client bundle hay logs.<br>AC3: Key không biết hoặc REVOKED không được dùng xác minh token mới. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-010"></a>

### [TMC-010] [FEATURE] [C01] Issue short-lived QR tokens and revoke credentials

**Metadata:** Feature C01 — Credential and signed QR lifecycle; Epic C — QR Credential Management; parent Feature C01; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-1.2, FR-1.3, FR-1.4, M2-QR. UC/UF: UC-03 / UF-01, UF-04. API: API-EQR-01/14; catalog §19.6 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W02/D4 → W02/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-010). Source: [Phiếu gốc](work-flow.md#tmc-010).

**Problem → expected outcome:** Cấp token ký bất đối xứng với jti gắn qr_tokens.id. TTL 60 giây là cấu hình demo, không phải mức bắt buộc của đề.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** Tạo GET/POST self QR endpoint theo OpenAPI, lấy employee từ session và quyền hiện hành. Ký token có kid/iss/aud/sub/jti/iat/exp theo contract, lưu token hash/expiry; không lưu raw payload. Tạo HR revoke credential endpoint có reason/audit; refresh tạo jti mới, không kéo dài mã cũ. Giới hạn tần suất cấp token và trả serverTime/expiresAt cho UI countdown.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [contracts/src/employee.ts](../contracts/src/employee.ts); [api/src/modules/iam](../api/src/modules/iam). Dependencies: [TMC-007](#tmc-007), [TMC-009](#tmc-009). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-010-AC1: Client không phát hành token cho employeeId tùy ý.
- [ ] TMC-010-AC2: Token sinh từ credential revoked/inactive bị từ chối; thu hồi tác dụng ở lần check server sau.
- [ ] TMC-010-AC3: Refresh cho token mới có expiry hợp lệ và traceable, không ghi token vào log.

<a id="verify-tmc-010"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. API self-only và HR scope/reason.<br>2. Test expiry/refresh bằng clock giả, không chờ sleep.<br>3. Test revoke rồi dùng token còn hạn và giới hạn request cấp mã. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Client không phát hành token cho employeeId tùy ý.<br>AC2: Token sinh từ credential revoked/inactive bị từ chối; thu hồi tác dụng ở lần check server sau.<br>AC3: Refresh cho token mới có expiry hợp lệ và traceable, không ghi token vào log. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-011"></a>

### [TMC-011] [FEATURE] [C02] Validate QR signatures and token claims

**Metadata:** Feature C02 — QR validation and replay prevention; Epic C — QR Credential Management; parent Feature C02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-2.2, M2-QR. UC/UF: UC-01 / UF-02. API: API-GATE-02; kiểm tra QR nội bộ, không expose redeem riêng ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W02/D5 → W02/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-011). Source: [Phiếu gốc](work-flow.md#tmc-011).

**Problem → expected outcome:** Tạo QrValidator port với adapter ký/xác minh và validation đồng nhất; phân biệt chữ ký hợp lệ với quyền truy cập nhà máy.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** Validate format/kích thước, kid, algorithm allowlist và chữ ký trước tin claims. Kiểm tra issuer/audience/expiry/iat/nbf nếu sử dụng và clock skew đã công bố. Đọc token/credential/key/employee hiện hành; đối chiếu jti/token fingerprint. Trả typed result/reasonCode, audit có redaction; không kết luận ALLOW ở validator.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/gate](../api/src/modules/gate); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-010](#tmc-010). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-011-AC1: Token hợp lệ xác thực được; sửa sub/exp, sai chữ ký, unknown kid và wrong audience đều bị từ chối.
- [ ] TMC-011-AC2: Expiry đúng biên và revoked credential/key được kiểm tra bằng server clock.
- [ ] TMC-011-AC3: Lỗi không gây OPEN hay attendance và không làm lộ QR đầy đủ.

<a id="verify-tmc-011"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Unit tests valid, malformed, oversized, expired, future và tampered claims.<br>2. Key rotation và token hash/jti mismatch.<br>3. Contract test validator không phụ thuộc React/Nest request hoặc gọi TCS. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Token hợp lệ xác thực được; sửa sub/exp, sai chữ ký, unknown kid và wrong audience đều bị từ chối.<br>AC2: Expiry đúng biên và revoked credential/key được kiểm tra bằng server clock.<br>AC3: Lỗi không gây OPEN hay attendance và không làm lộ QR đầy đủ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-012"></a>

### [TMC-012] [FEATURE] [D01] Evaluate access policies using server-owned data

**Metadata:** Feature D01 — Server-side access policy; Epic D — Gate Kiosk & Access Control; parent Feature D01; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend. Requirements: FR-1.6, FR-2.2. UC/UF: UC-01 / UF-02. API: API-GATE-02 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W02/D5 → W02/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-012). Source: [Phiếu gốc](work-flow.md#tmc-012).

**Problem → expected outcome:** AccessPolicy thuần kiểm tra grant tách khỏi phân công tổ chức. Quyền EXIT theo chính sách baseline; phần mềm không thay cơ chế thoát hiểm.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** Lấy station/factory/direction từ station credential và cấu hình server. Kiểm tra station active, employee active, credential hợp lệ và access grant [from,to). Ghi typed ALLOW/DENIED reason; kiểm tra lại điều kiện quan trọng lúc claim trước gửi. Chặn client giả factory/direction; ghi snapshot config/time và quy tắc EXIT/SEC exception.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/cfg](../api/src/modules/cfg). Dependencies: [TMC-006](#tmc-006), [TMC-011](#tmc-011). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-012-AC1: Grant LA cho employee tổ chức BD được xử lý theo grant, không theo employee.site.
- [ ] TMC-012-AC2: Denied attempt không gửi OPEN hoặc tạo attendance.
- [ ] TMC-012-AC3: Client payload không ghi đè station/factory/direction phía server.

<a id="verify-tmc-012"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Unit tests grant đúng/sai factory, revoked, boundary validTo, station maintenance.<br>2. API test station spoof và inactive employee.<br>3. Test policy EXIT đã ghi trong ADR, không dùng demo auto-toggle direction. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Grant LA cho employee tổ chức BD được xử lý theo grant, không theo employee.site.<br>AC2: Denied attempt không gửi OPEN hoặc tạo attendance.<br>AC3: Client payload không ghi đè station/factory/direction phía server. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-013"></a>

### [TMC-013] [FEATURE] [D02] Implement a fault-capable turnstile simulator

**Metadata:** Feature D02 — Turnstile commands and simulator; Epic D — Gate Kiosk & Access Control; parent Feature D02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-2.3, FR-2.7, INT-02, NFR-5. UC/UF: UC-01, UC-04 / UF-02, UF-05. API: API-GATE-02/21 và EXT-01/02 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W02/D6 → W02/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-013). Source: [Phiếu gốc](work-flow.md#tmc-013).

**Problem → expected outcome:** Mock gateway là tiến trình/adapter có state độc lập với database app. Nó minh họa hợp đồng, không chứng minh turnstile thật hoạt động.

**Hiện trạng:** Có TurnstileGateway port và simulators README; chưa xác nhận mock runtime.

**Scope/deliverables:** Định nghĩa open/close/status theo commandId/turnstileId/deadline và kết quả typed. Mock các mode rejected, accepted-only, opened, passage, delay và lost-response-after-open. Lưu ledger vật lý mock riêng, đếm thực thi OPEN; hỗ trợ callback duplicate/out-of-order và không hỗ trợ status ở mode giới hạn. Đặt fault-control chỉ cho test/demo có xác thực, không public production.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate/application/ports/turnstile.gateway.ts](../api/src/modules/gate/application/ports/turnstile.gateway.ts); [api/simulators](../api/simulators); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-003](#tmc-003), [TMC-005](#tmc-005). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-013-AC1: ACK nhận lệnh không bị map thành passage/attendance.
- [ ] TMC-013-AC2: Lost response có thể đi cùng physicalOpenCount=1, để test không dựa mỗi DB.
- [ ] TMC-013-AC3: Lệnh quá deadline không được mock mở muộn; CLOSE không tạo lượt công.

<a id="verify-tmc-013"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Contract tests cho fake và adapter mock cùng interface.<br>2. Kiểm tra commandId idempotency được bật/tắt theo từng mode contract.<br>3. Gửi callback trùng/sai thứ tự, xác minh raw payload redaction. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: ACK nhận lệnh không bị map thành passage/attendance.<br>AC2: Lost response có thể đi cùng physicalOpenCount=1, để test không dựa mỗi DB.<br>AC3: Lệnh quá deadline không được mock mở muộn; CLOSE không tạo lượt công. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-014"></a>

### [TMC-014] [FEATURE] [E01] Persist idempotent attempts before gate dispatch

**Metadata:** Feature E01 — Idempotent attempts and attendance ledger; Epic E — Attendance Event Recording; parent Feature E01; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-2.3, FR-3.1, FR-3.2, NFR-2. UC/UF: UC-01 / UF-02. API: API-GATE-02/21, API-ATT-01…04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W02/D6 → W03/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-014). Source: [Phiếu gốc](work-flow.md#tmc-014).

**Problem → expected outcome:** Tạo transaction chuẩn bị bền vững trước HTTP tới TCS. Duplicate lookup xảy ra trước replay redemption; requestHash bỏ trường thay đổi theo lần retry.

**Hiện trạng:** ORM attempt/command và wire type có; chưa có controller/use case submit scan.

**Scope/deliverables:** Chuẩn hóa request và hash; tìm UNIQUE(stationId,eventId) trước xác thực token lại của request cũ đã tiếp nhận. Cùng ID/hash trả trạng thái cũ, cùng ID khác hash trả 409; station khác không đọc được request. Trong một UnitOfWork lưu AccessAttempt, PREPARED OPEN, audit và hook redemption cho ticket 015. Đảm bảo lỗi persistence dừng trước gateway; lưu denied attempts có reason và không command OPEN.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/att](../api/src/modules/att); [api/src/platform/application](../api/src/platform/application); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-004](#tmc-004), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-014-AC1: Hai POST đồng thời cùng station/event tạo đúng một attempt và một OPEN cơ sở.
- [ ] TMC-014-AC2: Payload khác cùng ID trả 409, không đổi dữ liệu đã lưu.
- [ ] TMC-014-AC3: DB unavailable/rollback không có physical OPEN.

<a id="verify-tmc-014"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Integration race cùng key và collision khác payload.<br>2. Test duplicate sau token hết hạn trả trạng thái đã có, không tạo request mới.<br>3. Inject DB fault trước commit, so mock gateway execution counter=0. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hai POST đồng thời cùng station/event tạo đúng một attempt và một OPEN cơ sở.<br>AC2: Payload khác cùng ID trả 409, không đổi dữ liệu đã lưu.<br>AC3: DB unavailable/rollback không có physical OPEN. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-015"></a>

### [TMC-015] [FEATURE] [C02] Prevent QR replay with atomic redemption

**Metadata:** Feature C02 — QR validation and replay prevention; Epic C — QR Credential Management; parent Feature C02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-3.2, NFR-3, M2-QR. UC/UF: UC-01 / UF-02. API: API-GATE-02; kiểm tra QR nội bộ, không expose redeem riêng ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W03/D1 → W03/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-015). Source: [Phiếu gốc](work-flow.md#tmc-015).

**Problem → expected outcome:** Ticket riêng cho cải tiến QR exposure/replay M2: kết hợp token ngắn hạn, chữ ký, quyền online và atomic redemption. Không tuyên bố chống chia sẻ thời gian thực tuyệt đối.

**Hiện trạng:** ORM redemption có; chưa có atomic redemption use case/test.

**Scope/deliverables:** Ghi qr_redemptions với PK tokenId/UK attemptId trong cùng transaction PREPARED. Tách replay khác event khỏi duplicate cùng event đã nhận; không dùng cooldown 30 giây thay DB uniqueness. Kiểm tra online revocation/grant lúc chuẩn bị và claim; thu hồi token không đảo ngược tác động vật lý đã xảy ra. Ghi ADR trade-off: token bị chặn sau redeem nhưng OPEN fail thì EMP lấy token mới; residual live-sharing risk.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/gate](../api/src/modules/gate); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-010](#tmc-010), [TMC-014](#tmc-014). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-015-AC1: Hai trạm quét cùng jti đồng thời: tối đa một redemption và một OPEN cơ sở được phép.
- [ ] TMC-015-AC2: Retry cùng eventId không bị báo replay và không tiêu thụ lần hai.
- [ ] TMC-015-AC3: Không tự mở offline khi không kiểm tra được quyền/revocation.

<a id="verify-tmc-015"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. PG race jti khác event và khác station.<br>2. Rollback attempt thì redemption cũng rollback.<br>3. Revoke giữa issue/scan và giữa PREPARED/claim; test giới hạn chia sẻ được ghi rõ. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hai trạm quét cùng jti đồng thời: tối đa một redemption và một OPEN cơ sở được phép.<br>AC2: Retry cùng eventId không bị báo replay và không tiêu thụ lần hai.<br>AC3: Không tự mở offline khi không kiểm tra được quyền/revocation. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-016"></a>

### [TMC-016] [FEATURE] [D02] Claim and reconcile gate commands with CAS

**Metadata:** Feature D02 — Turnstile commands and simulator; Epic D — Gate Kiosk & Access Control; parent Feature D02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-2.3, FR-2.7, FR-3.2, INT-02. UC/UF: UC-01, UC-04 / UF-02, UF-05. API: API-GATE-02/21 và EXT-01/02 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W03/D2 → W03/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-016). Source: [Phiếu gốc](work-flow.md#tmc-016).

**Problem → expected outcome:** Triển khai state machine command; commit quyền gửi trước external HTTP. Kết quả gateway và ghi công là hai bước riêng; đến ticket 019 mới nối AttendanceWriter.

**Hiện trạng:** ORM state/history và port có; chưa có dispatch/reconciliation runtime.

**Scope/deliverables:** CAS PREPARED→DISPATCHING cùng history/audit, deadline và điều kiện hiện hành; commit rồi mới gọi gateway. Map ACKNOWLEDGED/CONFIRMED/REJECTED/UNKNOWN; không bắt HTTP transaction DB chờ cả lượt người đi qua. Nhận kết quả/callback có dedupe, kiểm tra transition; CLOSE liên kết OPEN và lỗi đóng tạo cảnh báo. Trả response decision/commandState/attendanceState rõ ràng; crash DISPATCHING đi đối soát, không phát OPEN lại.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate/application/ports/turnstile.gateway.ts](../api/src/modules/gate/application/ports/turnstile.gateway.ts); [api/simulators](../api/simulators); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-016-AC1: Hai dispatcher cạnh tranh chỉ một thắng claim; không gọi HTTP khi claim rollback.
- [ ] TMC-016-AC2: ACK-only không hiện đã ghi công; UNKNOWN không đổi thành DENIED hoặc retry OPEN mù.
- [ ] TMC-016-AC3: Kiểm soát OPEN lẫn CLOSE, lệnh quá deadline không gửi mở muộn.

<a id="verify-tmc-016"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Unit table mọi transition hợp lệ/bị cấm.<br>2. PG CAS race, crash sau claim/trước gửi và sau gửi/mất response.<br>3. Callback trùng/sai thứ tự và lỗi CLOSE không xóa kết quả đã xác nhận. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hai dispatcher cạnh tranh chỉ một thắng claim; không gọi HTTP khi claim rollback.<br>AC2: ACK-only không hiện đã ghi công; UNKNOWN không đổi thành DENIED hoặc retry OPEN mù.<br>AC3: Kiểm soát OPEN lẫn CLOSE, lệnh quá deadline không gửi mở muộn. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-017"></a>

### [TMC-017] [UI] [C03] Display server-issued QR codes in the employee portal

**Metadata:** Feature C03 — Employee QR and personal portal; Epic C — QR Credential Management; parent Feature C03; `type:ui`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend. Requirements: FR-1.3, M2-QR. UC/UF: UC-02 / UF-01. API: API-EQR-14; API-ATT-01…04 khi dùng công cá nhân ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W03/D2 → W03/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-017). Source: [Phiếu gốc](work-flow.md#tmc-017).

**Problem → expected outcome:** Tái sử dụng trang mobile hiện có, thay makeQr phía client bằng endpoint self. UI chỉ trình bày QR, không giữ signing key hay quyết định quyền.

**Hiện trạng:** Mobile UI và QR tự sinh tại client còn tồn tại.

**Scope/deliverables:** Hiển thị token server bằng QR component hiện hữu, countdown từ expiresAt/serverTime. Refresh có loading/error, hạn chế request; hết hạn/thu hồi không hiển thị như mã còn dùng. Xóa payload khi logout/đổi user; không đưa QR vào localStorage journal hoặc telemetry. Giữ layout/tokens Figma và kiểm tra mobile 360px, light/dark.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [client/src/lib/qr.ts](../client/src/lib/qr.ts); [client/src/data/auth.ts](../client/src/data/auth.ts). Dependencies: [TMC-008](#tmc-008), [TMC-010](#tmc-010). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-017-AC1: Token UI được server validator chấp nhận, không còn tự sinh tmc-access:v1 cho server mode.
- [ ] TMC-017-AC2: Mất mạng cấp mã báo lỗi, không gia hạn QR cũ ở client.
- [ ] TMC-017-AC3: EMP không chọn employeeId khác để phát QR.

<a id="verify-tmc-017"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Manual QR countdown/refresh bằng API clock fixture.<br>2. Test logout/đổi tài khoản không giữ mã cũ.<br>3. Responsive/contrast và lỗi 401/expired/revoked. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Token UI được server validator chấp nhận, không còn tự sinh tmc-access:v1 cho server mode.<br>AC2: Mất mạng cấp mã báo lỗi, không gia hạn QR cũ ở client.<br>AC3: EMP không chọn employeeId khác để phát QR. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-018"></a>

### [TMC-018] [UI] [D03] Connect the virtual kiosk to real attempt states

**Metadata:** Feature D03 — Virtual and camera kiosk; Epic D — Gate Kiosk & Access Control; parent Feature D03; `type:ui`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:contracts. Requirements: FR-2.4, UC-01, NFR-1. UC/UF: UC-01 / UF-02, UF-03. API: API-GATE-02/03 ([catalog](work-flow.md#s19)).

**Planning/status:** M-02, W03/D3 → W03/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-018). Source: [Phiếu gốc](work-flow.md#tmc-018).

**Problem → expected outcome:** Giữ Virtual Scanner làm đường demo P0 độc lập camera. Public kiosk trải nghiệm hiện tại không được mặc định gọi API trạm có đặc quyền.

**Hiện trạng:** Kiosk/prototype có; chưa nối gate API thực.

**Scope/deliverables:** Sinh eventId trước gửi đầu; giữ cùng ID/payload khi lookup/retry, tách debounce UI khỏi idempotency server. Kết nối station đã provision; mode demo public cô lập dữ liệu và không nhúng long-lived station secret trong source. Hiển thị DENIED/PENDING/UNKNOWN/OPEN_CONFIRMED và attendanceState riêng, reason ngắn gọn. Bỏ auto-toggle IN/OUT và employee.site access check ở client; lấy cấu hình/decision server.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [client/src/data/api.ts](../client/src/data/api.ts); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-016](#tmc-016), [TMC-017](#tmc-017). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-018-AC1: Virtual scan đi qua API thật, mock TCS và PG; không gọi local api.scan ở server mode.
- [ ] TMC-018-AC2: Không hiển thị đã ghi công khi chỉ ALLOW/ACK.
- [ ] TMC-018-AC3: Đổi dropdown không nâng quyền station; chưa provision thì không gọi scan đặc quyền.

<a id="verify-tmc-018"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Happy path, expired QR, wrong grant, inactive và payload malformed.<br>2. Mở kiosk công khai và xác minh không có server credential hoặc dữ liệu HR.<br>3. Kiểm tra UI retry không sinh eventId mới ngoài ý muốn. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Virtual scan đi qua API thật, mock TCS và PG; không gọi local api.scan ở server mode.<br>AC2: Không hiển thị đã ghi công khi chỉ ALLOW/ACK.<br>AC3: Đổi dropdown không nâng quyền station; chưa provision thì không gọi scan đặc quyền. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-019"></a>

### [TMC-019] [FEATURE] [E01] Write attendance revisions from verified passage evidence

**Metadata:** Feature E01 — Idempotent attempts and attendance ledger; Epic E — Attendance Event Recording; parent Feature E01; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: FR-3.3, NFR-2. UC/UF: UC-01 / UF-02. API: API-GATE-02/21, API-ATT-01…04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-03, W03/D4 → W03/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-019). Source: [Phiếu gốc](work-flow.md#tmc-019).

**Problem → expected outcome:** Nối GATE với ATT qua public AttendanceWriter. Dùng PASSAGE_SENSOR từ mock; OPEN_PROXY chỉ khi baseline phê duyệt, luôn ghi evidenceType.

**Hiện trạng:** ORM attendance/revision có; chưa thấy evidence writer.

**Scope/deliverables:** Dedupe gate_device_events theo endpoint/vendor event và xác thực event source. Ghi command result/history, AttendanceEvent, revision 1 và audit cùng transactional context. Dùng sourceId ổn định ACCESS:attempt UUID; deferred head FK và UNIQUE attempt/source chống ghi lặp. Giữ dữ liệu gốc bất biến, tách event history khỏi báo cáo tính ca/tính lương; không lấy first-in/last-out làm giờ công.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/att](../api/src/modules/att); [api/src/platform/application](../api/src/platform/application); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-016](#tmc-016). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-019-AC1: PASSAGE_CONFIRMED tạo một event+revision 1; denied/ACK-only/UNKNOWN không tạo công chính thức.
- [ ] TMC-019-AC2: Callback/result lặp không thêm event, DB rollback không để attendance/audit lệch.
- [ ] TMC-019-AC3: Restart app vẫn truy vấn được nguồn và evidence, không dựa localStorage.

<a id="verify-tmc-019"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. PG atomic rollback giữa command/event/audit.<br>2. Duplicate/out-of-order passage, sensor không khớp command và CLOSE event.<br>3. Check head deferred, unique source, timestamp UTC và direction server. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: PASSAGE_CONFIRMED tạo một event+revision 1; denied/ACK-only/UNKNOWN không tạo công chính thức.<br>AC2: Callback/result lặp không thêm event, DB rollback không để attendance/audit lệch.<br>AC3: Restart app vẫn truy vấn được nguồn và evidence, không dựa localStorage. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-020"></a>

### [TMC-020] [FEATURE] [E02] Expose scoped attempt status and attendance history

**Metadata:** Feature E02 — Scoped attendance history and status; Epic E — Attendance Event Recording; parent Feature E02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend, area:contracts. Requirements: FR-1.5, FR-3.6, FR-4.2, NFR-3. UC/UF: UC-02, UC-07 / UF-01, UF-08. API: API-GATE-03/12/13; API-ATT-01…04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-03, W03/D4 → W03/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-020). Source: [Phiếu gốc](work-flow.md#tmc-020).

**Problem → expected outcome:** Tạo read models/DTO nhỏ cho status, access history và attendance history. Không cung cấp getDatabase tổng hợp toàn bộ dữ liệu như prototype.

**Hiện trạng:** Chưa thấy controller lịch sử/status nghiệp vụ.

**Scope/deliverables:** Tạo lookup theo eventId cho chính trạm hoặc user đủ quyền. Tạo history/detail có pagination, filter thời gian, station/factory và predicate scope ở query. Trả command/evidence/current revision và correlationId; redaction thông tin cá nhân theo actor. Đặt giới hạn page size/range và index query cần dùng; bỏ voided khỏi report hiệu lực theo policy.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/att](../api/src/modules/att); [api/src/modules/gate](../api/src/modules/gate); [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-007](#tmc-007), [TMC-019](#tmc-019). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-020-AC1: EMP chỉ đọc self, SEC đúng factory, SUP đúng team, EXE chỉ aggregate.
- [ ] TMC-020-AC2: Không truy cập chéo bằng đoán UUID hoặc sửa query filter.
- [ ] TMC-020-AC3: Retry lookup sau QR hết hạn vẫn đọc kết quả request đã nhận.

<a id="verify-tmc-020"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. API tests 401/403/404 policy và IDOR đa factory.<br>2. Pagination/filter ổn định khi nhiều event cùng timestamp.<br>3. Query plan cơ bản và contract response không chứa QR/session/secret. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: EMP chỉ đọc self, SEC đúng factory, SUP đúng team, EXE chỉ aggregate.<br>AC2: Không truy cập chéo bằng đoán UUID hoặc sửa query filter.<br>AC3: Retry lookup sau QR hết hạn vẫn đọc kết quả request đã nhận. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-021"></a>

### [TMC-021] [UI] [E02] Connect personal history and attempt details

**Metadata:** Feature E02 — Scoped attendance history and status; Epic E — Attendance Event Recording; parent Feature E02; `type:ui`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend, area:contracts. Requirements: FR-1.5, UC-02. UC/UF: UC-02, UC-07 / UF-01, UF-08. API: API-GATE-03/12/13; API-ATT-01…04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-03, W03/D5 → W03/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-021). Source: [Phiếu gốc](work-flow.md#tmc-021).

**Problem → expected outcome:** Tái sử dụng UI lịch sử mobile và bảng access để đọc API theo role. Giữ các màn HR/ca làm ngoài scope ở mode mock có nhãn.

**Hiện trạng:** UI lịch sử hiện dựa prototype, chưa xác nhận backend nghiệp vụ.

**Scope/deliverables:** Thay query getDatabase bằng history/detail APIs và query keys scoped theo identity/filter. Hiển thị thời điểm giờ VN, station direction, evidence và trạng thái dữ liệu. Thêm pagination/loading/empty/error và 403; phân biệt nhật ký denied với attendance ledger. Link detail từ eventId/correlationId; bỏ action sửa công chưa có API ở server mode.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/att](../api/src/modules/att); [api/src/modules/gate](../api/src/modules/gate); [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-008](#tmc-008), [TMC-020](#tmc-020). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-021-AC1: Cùng dữ liệu PG được nhìn thấy từ hai trình duyệt theo quyền, không dựa storage event.
- [ ] TMC-021-AC2: Denied/UNKNOWN không hiển thị như công đã xác nhận.
- [ ] TMC-021-AC3: Đăng xuất/đổi user xóa cache nhạy cảm, filter không vượt scope.

<a id="verify-tmc-021"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Manual EMP-A/EMP-B và SEC-BD/SEC-LA.<br>2. Mất mạng query và reload deep link detail.<br>3. Kiểm tra mobile, bảng và timestamp quanh 00:00 VN. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Cùng dữ liệu PG được nhìn thấy từ hai trình duyệt theo quyền, không dựa storage event.<br>AC2: Denied/UNKNOWN không hiển thị như công đã xác nhận.<br>AC3: Đăng xuất/đổi user xóa cache nhạy cảm, filter không vượt scope. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-022"></a>

### [TMC-022] [DOCS] [F01] Finalize network failure architecture decisions

**Metadata:** Feature F01 — Network failure design and kiosk journal; Epic F — Failure Handling & Recovery; parent Feature F01; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: M2-NETWORK, NFR-6. UC/UF: UC-01, UC-04 / UF-03. API: API-GATE-02/03 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W03/D6 → W03/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-022). Source: [Phiếu gốc](work-flow.md#tmc-022).

**Problem → expected outcome:** Ticket riêng cho Network Failure Architecture M2. Cụ thể hóa R1 online/recover thay vì hứa mở offline; phương án edge chỉ so sánh và để P2.

**Hiện trạng:** Thiết kế R1/recovery có trong doc, chưa có evidence runtime.

**Scope/deliverables:** Vẽ sequence mất kết nối trước gửi, sau DB commit, sau claim, sau TCS thực thi và mất response. Quy định journal eventId/request fingerprint không raw token; lookup trước, không tự replay stale OPEN. Định nghĩa status lookup, durable jobs, backoff/jitter/budget và SEC reconciliation không có status API. So sánh R1 với edge local DB/quyền offline, nêu residual risk và điểm tích hợp module/physical deployment.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [doc/tech-stack.md](../doc/tech-stack.md); [doc/user-flow.md](../doc/user-flow.md); [doc/structure-architecture.md](../doc/structure-architecture.md). Dependencies: [TMC-016](#tmc-016). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-022-AC1: Mỗi failure window có state lưu bền vững, cách recovery và hạn chế rõ.
- [ ] TMC-022-AC2: Không đồng nhất PENDING/UNKNOWN với công thành công hoặc gate chưa mở.
- [ ] TMC-022-AC3: Giải thích được cơ chế giảm mất/trùng dữ liệu và vì sao DB transaction không đảm bảo exactly-once vật lý.

<a id="verify-tmc-022"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Walk-through sơ đồ bằng fault modes từ 013/026.<br>2. So ADR với schema GateCommand/Job và kiosk eventId.<br>3. Review từng câu tuyên bố độ tin cậy với bằng chứng dự kiến, không ghi test đã pass. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Mỗi failure window có state lưu bền vững, cách recovery và hạn chế rõ.<br>AC2: Không đồng nhất PENDING/UNKNOWN với công thành công hoặc gate chưa mở.<br>AC3: Giải thích được cơ chế giảm mất/trùng dữ liệu và vì sao DB transaction không đảm bảo exactly-once vật lý. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-023"></a>

### [TMC-023] [ENHANCEMENT] [F01] Recover kiosk requests with a metadata journal

**Metadata:** Feature F01 — Network failure design and kiosk journal; Epic F — Failure Handling & Recovery; parent Feature F01; `type:enhancement`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: FR-3.2, FR-3.6, M2-NETWORK. UC/UF: UC-01, UC-04 / UF-03. API: API-GATE-02/03 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W03/D6 → W04/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-023). Source: [Phiếu gốc](work-flow.md#tmc-023).

**Problem → expected outcome:** Journal client chỉ lưu metadata cần phục hồi, không phải offline attendance database. Không lưu token/PII hoặc tự mở offline.

**Hiện trạng:** Chưa xác nhận journal phục hồi eventId theo contract thật.

**Scope/deliverables:** Persist journal eventId/station reference/request fingerprint/time/status trước gửi; payload QR chỉ ở memory. Khi timeout/reload, lookup cùng eventId; NOT_FOUND chưa chứng minh request cũ không tới. Chỉ quét lại sau deadline cũ và kiểm tra không còn khả năng dispatch; UNKNOWN chuyển SEC. Áp backoff cho lookup đọc an toàn, giới hạn backlog/TTL và retry budget; không retry OPEN đã DISPATCHING. Hiển thị pending/synced/failed của journal như trạng thái đồng bộ request, không thay command/attendance state.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [doc/tech-stack.md](../doc/tech-stack.md); [doc/user-flow.md](../doc/user-flow.md); [doc/structure-architecture.md](../doc/structure-architecture.md). Dependencies: [TMC-018](#tmc-018), [TMC-020](#tmc-020), [TMC-022](#tmc-022). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Chưa xác nhận journal phục hồi eventId theo contract thật. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-023-AC1: Mất response sau commit vẫn lookup đúng attempt, không tạo eventId mới tự động.
- [ ] TMC-023-AC2: Reload không gửi QR cũ đã hết hạn để mở muộn.
- [ ] TMC-023-AC3: Journal không chứa raw token, employee name hoặc secret; quota lỗi có thông báo và không báo đã lưu.

<a id="verify-tmc-023"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Browser offline trước gửi, sau commit và reload khi pending.<br>2. Test quota/storage failure và backlog đạt giới hạn.<br>3. Kiểm tra request log không lặp OPEN, clock expiry và lookup hết budget. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Mất response sau commit vẫn lookup đúng attempt, không tạo eventId mới tự động.<br>AC2: Reload không gửi QR cũ đã hết hạn để mở muộn.<br>AC3: Journal không chứa raw token, employee name hoặc secret; quota lỗi có thông báo và không báo đã lưu. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-024"></a>

### [TMC-024] [FEATURE] [F02] Reconcile unknown commands using durable fenced jobs

**Metadata:** Feature F02 — Durable reconciliation and exceptions; Epic F — Failure Handling & Recovery; parent Feature F02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: FR-3.6, NFR-2, M2-NETWORK. UC/UF: UC-04 / UF-05. API: API-GATE-12/13/16…19 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D1 → W04/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-024). Source: [Phiếu gốc](work-flow.md#tmc-024).

**Problem → expected outcome:** DB worker xử lý GATE_RECONCILIATION; chỉ status lookup/cập nhật kết quả có bằng chứng. Chưa triển khai HRS outbox consumer.

**Hiện trạng:** ORM job/outbox/case có; chưa thấy worker/fencing runtime.

**Scope/deliverables:** Tạo job cùng transaction ghi UNKNOWN; claim có lease/version/fencing và nextRunAt. Đối soát theo commandId qua gateway status; status thiếu thì tạo case SEC, không auto-reopen. Backoff tăng dần có jitter/maxAttempts, lỗi permanent→FAILED, hết budget giữ case và audit. Chỉ update khi còn claim version; nhận callback/worker đồng thời qua idempotent ledger writer.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt); [client/src/features/access-control/Access.tsx](../client/src/features/access-control/Access.tsx). Dependencies: [TMC-019](#tmc-019), [TMC-022](#tmc-022), [TMC-026](#tmc-026). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-024-AC1: Restart worker không làm mất backlog; hai worker không ghi đè claim nhau.
- [ ] TMC-024-AC2: Lease hết hạn không được coi là TCS chưa thực thi; không retry OPEN mù.
- [ ] TMC-024-AC3: Một passage được báo lại từ status/callback vẫn chỉ có một attendance.

<a id="verify-tmc-024"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Claim race, lease expiry và stale worker completion.<br>2. Status UNKNOWN/unsupported, transient/permanent và max attempts.<br>3. Callback đồng thời với status kết quả; so physicalOpenCount không tăng do recovery. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Restart worker không làm mất backlog; hai worker không ghi đè claim nhau.<br>AC2: Lease hết hạn không được coi là TCS chưa thực thi; không retry OPEN mù.<br>AC3: Một passage được báo lại từ status/callback vẫn chỉ có một attendance. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-025"></a>

### [TMC-025] [FEATURE] [F02] Implement scoped security reconciliation cases

**Metadata:** Feature F02 — Durable reconciliation and exceptions; Epic F — Failure Handling & Recovery; parent Feature F02; `type:feature`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: FR-2.5, FR-3.6, FR-4.2. UC/UF: UC-04 / UF-05. API: API-GATE-12/13/16…19 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D2 → W04/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-025). Source: [Phiếu gốc](work-flow.md#tmc-025).

**Problem → expected outcome:** Phạm vi P0 là màn list/detail/form resolution nhỏ và API tương ứng, không phải console vận hành hoàn chỉnh. Không dùng overrideReason như bypass mọi policy.

**Hiện trạng:** Access UI prototype có, chưa xác nhận API case có scope.

**Scope/deliverables:** Tạo list/detail case theo factory; nhận resolved outcome PASSED/NOT_PASSED/INSUFFICIENT_EVIDENCE, reason và evidence refs. Kiểm tra permission hiện hành và optimistic version; không nhận actor tự khai. PASSED có đủ bằng chứng thì xác nhận nguồn attempt cũ; MANUAL chỉ khi không có nguồn đã nhận, kiểm tra chống trùng vật lý. Ghi case/result/attendance/audit nguyên tử, giữ dấu vết người xử lý và không tự phát OPEN.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt); [client/src/features/access-control/Access.tsx](../client/src/features/access-control/Access.tsx). Dependencies: [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-024](#tmc-024). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-025-AC1: SEC-LA không giải quyết case BD; ADM thiếu quyền SEC không được bypass.
- [ ] TMC-025-AC2: Hai người xử lý cùng version chỉ một thắng; nguồn đã có không tạo công lần hai.
- [ ] TMC-025-AC3: INSUFFICIENT_EVIDENCE không thành attendance CONFIRMED.

<a id="verify-tmc-025"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. API cross-factory/forged actor/reason rỗng và concurrent resolve.<br>2. Case đã có event rồi resolve lại; manual trùng attempt.<br>3. Manual UI list/detail và evidence redaction. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: SEC-LA không giải quyết case BD; ADM thiếu quyền SEC không được bypass.<br>AC2: Hai người xử lý cùng version chỉ một thắng; nguồn đã có không tạo công lần hai.<br>AC3: INSUFFICIENT_EVIDENCE không thành attendance CONFIRMED. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-026"></a>

### [TMC-026] [TEST] [F02] Exercise lost responses and process crash scenarios

**Metadata:** Feature F02 — Durable reconciliation and exceptions; Epic F — Failure Handling & Recovery; parent Feature F02; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: M2-NETWORK, FR-2.7. UC/UF: UC-04 / UF-05. API: API-GATE-12/13/16…19 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D1 → W04/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-026). Source: [Phiếu gốc](work-flow.md#tmc-026).

**Problem → expected outcome:** Tạo harness điều khiển lỗi có thể lặp lại và quan sát cả app DB lẫn mock TCS. Không gọi test demo mode là bằng chứng môi trường sản xuất.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** Thêm test hooks trước DB commit, sau claim commit, sau TCS execute và trước gửi response. Cho phép mô phỏng API↔DB, kiosk↔API và API↔TCS độc lập. Thu execution ledger mock, DB counts và correlationId để so sánh trước/sau restart. Khóa fault-control dưới env test/demo, không public hoặc luôn bật.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt); [client/src/features/access-control/Access.tsx](../client/src/features/access-control/Access.tsx). Dependencies: [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-022](#tmc-022). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-026-AC1: Mỗi fault mode có trigger/expected state/cleanup tái lập được.
- [ ] TMC-026-AC2: Mất ACK sau OPEN có physical execution dù client timeout.
- [ ] TMC-026-AC3: Restart app không xóa ledger mock trong bài test nhằm che duplicate.

<a id="verify-tmc-026"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Smoke từng fault switch và reset môi trường test riêng.<br>2. Kiểm tra disable fault hooks ở config ngoài demo/test.<br>3. So log và DB snapshot không chứa secret/raw QR. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Mỗi fault mode có trigger/expected state/cleanup tái lập được.<br>AC2: Mất ACK sau OPEN có physical execution dù client timeout.<br>AC3: Restart app không xóa ledger mock trong bài test nhằm che duplicate. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-027"></a>

### [TMC-027] [UI] [D03] Connect camera scans to the server contract

**Metadata:** Feature D03 — Virtual and camera kiosk; Epic D — Gate Kiosk & Access Control; parent Feature D03; `type:ui`; P1 — có thể scope-cut khi capacity thiếu; area:frontend, area:contracts. Requirements: FR-2.4, UC-01. UC/UF: UC-01 / UF-02, UF-03. API: API-GATE-02/03 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D6 → W04/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-027). Source: [Phiếu gốc](work-flow.md#tmc-027).

**Problem → expected outcome:** P1: reuse html5-qrcode/ScanCamera hiện có, nối cùng application scan adapter của Virtual Scanner; không xây scanner riêng.

**Hiện trạng:** Webcam/UI scan có source; chưa test camera/runtime.

**Scope/deliverables:** Đưa callback camera vào cùng eventId/scan flow với ticket 018. Giữ debounce/in-flight, dừng stream khi unmount/đổi station/mode. Xử lý permission denied, camera busy và iframe/HTTPS constraints. Đặt Virtual Scanner luôn dùng được khi camera unavailable; UI theo token có sẵn.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [client/src/data/api.ts](../client/src/data/api.ts); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-018](#tmc-018). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-027-AC1: Camera đọc QR server đi qua cùng validation/replay/idempotency pipeline.
- [ ] TMC-027-AC2: Không gửi nhiều request mới khi callback đọc lặp một ảnh.
- [ ] TMC-027-AC3: Từ chối quyền không làm kiosk lỗi hoặc mất đường demo virtual.

<a id="verify-tmc-027"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Manual camera thật trên HTTPS/localhost nếu có thiết bị.<br>2. Permission denied/busy/unmount và fallback virtual.<br>3. Kiểm tra không còn camera indicator sau rời màn. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Camera đọc QR server đi qua cùng validation/replay/idempotency pipeline.<br>AC2: Không gửi nhiều request mới khi callback đọc lặp một ảnh.<br>AC3: Từ chối quyền không làm kiosk lỗi hoặc mất đường demo virtual. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-028"></a>

### [TMC-028] [UI] [G01] Connect scoped dashboard data and factory filters

**Metadata:** Feature G01 — Operational dashboard and heartbeat; Epic G — Dashboard & Monitoring; parent Feature G01; `type:ui`; P1 — có thể scope-cut khi capacity thiếu; area:backend, area:frontend. Requirements: FR-4.1, UC-07. UC/UF: UC-07 / UF-08. API: API-RPT-01, API-CFG-01, API-GATE-04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D6 → W04/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-028). Source: [Phiếu gốc](work-flow.md#tmc-028).

**Problem → expected outcome:** P1: chỉ thay nguồn số liệu chính của dashboard hiện có, không xây analytics. Nếu cắt ticket, list/history/case P0 vẫn đủ quan sát.

**Hiện trạng:** Dashboard UI có nhưng nghiệp vụ còn dữ liệu prototype.

**Scope/deliverables:** Tổng hợp counts allowed/denied/unknown/case từ server query scoped, không từ KPI seed 1.400. Hiển thị recent events và thời điểm dữ liệu cập nhật; trạng thái gate dựa evidence/lastSeen, chưa biết phải ghi rõ. Áp factory filter trong quyền, không cho SEC đổi sang factory khác. Giữ biểu đồ/khối ngoài module ở mock mode có nhãn, không trộn totals.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/dashboard/Dashboard.tsx](../client/src/features/dashboard/Dashboard.tsx); [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt). Dependencies: [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-025](#tmc-025). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-028-AC1: Số liệu dashboard khớp query/fixture, không tuyên bố heartbeat thật nếu chưa có.
- [ ] TMC-028-AC2: Filter không làm rò scope; không trả danh sách HR toàn hệ thống.
- [ ] TMC-028-AC3: Trạng thái loading/error/stale có thông báo.

<a id="verify-tmc-028"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Compare API count với fixture PG theo factory.<br>2. Manual 403 và không dữ liệu/mạng lỗi.<br>3. UI light/dark/responsive với nguồn real/mock phân biệt. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Số liệu dashboard khớp query/fixture, không tuyên bố heartbeat thật nếu chưa có.<br>AC2: Filter không làm rò scope; không trả danh sách HR toàn hệ thống.<br>AC3: Trạng thái loading/error/stale có thông báo. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-029"></a>

### [TMC-029] [TEST] [H01] Verify the main module against PostgreSQL

**Metadata:** Feature H01 — Core and architecture verification; Epic H — Testing & Quality Assurance; parent Feature H01; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend. Requirements: FR-3.1, FR-3.2, FR-3.3, NFR-2. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D3 → W04/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-029). Source: [Phiếu gốc](work-flow.md#tmc-029).

**Problem → expected outcome:** Củng cố unit/integration/API tests đã viết trong từng ticket; không đợi tới tuần 4 mới bắt đầu test. Đây là ticket chất lượng độc lập cho module chính.

**Hiện trạng:** Test hiện có chủ yếu auth/bootstrap/env/seed, chưa có gate integration suite.

**Scope/deliverables:** Tạo matrix valid/invalid/expired/revoked QR, access grant và station policy. Chạy PG transaction/unique/deferred head tests và kiểm tra nguồn attendance. Chạy API tests auth/station/status/history theo contract. Lưu command, commit hash, môi trường, số test và kết quả thực tế; ghi failure còn lại.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [api/package.json](../api/package.json); [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/att](../api/src/modules/att). Dependencies: [TMC-015](#tmc-015), [TMC-019](#tmc-019), [TMC-020](#tmc-020). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-029-AC1: Happy path EMP QR→kiosk→mock passage→PG history tái lập được.
- [ ] TMC-029-AC2: Denied/ACK-only/UNKNOWN không tạo công; dữ liệu tồn tại sau restart.
- [ ] TMC-029-AC3: Test không dùng SQLite hoặc mock repository để tuyên bố PG constraints đúng.

<a id="verify-tmc-029"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Unit suite và PG integration suite trên DB sạch.<br>2. API regression với các role đại diện.<br>3. Review assertions về state, DB count, audit và mock execution counter. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Happy path EMP QR→kiosk→mock passage→PG history tái lập được.<br>AC2: Denied/ACK-only/UNKNOWN không tạo công; dữ liệu tồn tại sau restart.<br>AC3: Test không dùng SQLite hoặc mock repository để tuyên bố PG constraints đúng. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-030"></a>

### [TMC-030] [TEST] [H02] Verify concurrent replay and crash recovery

**Metadata:** Feature H02 — Concurrency and failure verification; Epic H — Testing & Quality Assurance; parent Feature H02; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend. Requirements: NFR-2, M2-QR, M2-NETWORK. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D3 → W04/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-030). Source: [Phiếu gốc](work-flow.md#tmc-030).

**Problem → expected outcome:** Ticket riêng xác minh hai cải tiến M2 bằng fault harness và concurrent PG transactions. Không coi một demo tuần tự là chứng minh race an toàn.

**Hiện trạng:** Chưa xác nhận race/crash/recovery suite.

**Scope/deliverables:** Chạy race cùng eventId, khác payload, cùng jti khác trạm và hai dispatcher. Kill/restart tại các fault windows, thử lost-response-after-open và status unavailable. Chạy callback lặp/sai thứ tự, worker stale lease, SEC resolve lặp. Đối chiếu attempt/redemption/command/attendance/audit và physicalOpenCount của mock.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [api/simulators](../api/simulators); [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx). Dependencies: [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-029](#tmc-029). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-030-AC1: Duplicate request và redemption không tạo thêm OPEN/attendance.
- [ ] TMC-030-AC2: DISPATCHING/UNKNOWN recovery không gửi OPEN lại khi contract không cho phép.
- [ ] TMC-030-AC3: Mỗi failure window có expected/actual/evidence; giới hạn bảo đảm vật lý được công bố.

<a id="verify-tmc-030"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Lặp race có điều phối barrier thay vì chỉ Promise tuần tự.<br>2. Kiểm tra crash/restart giữ DB và mock ledger riêng.<br>3. Regression QR expired khi lookup request cũ và out-of-scope case. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Duplicate request và redemption không tạo thêm OPEN/attendance.<br>AC2: DISPATCHING/UNKNOWN recovery không gửi OPEN lại khi contract không cho phép.<br>AC3: Mỗi failure window có expected/actual/evidence; giới hạn bảo đảm vật lý được công bố. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-031"></a>

### [TMC-031] [TEST] [H03] Coordinate kiosk performance and data-access verification

**Metadata:** Feature H03 — Performance, authorization and privacy verification; Epic H — Testing & Quality Assurance; parent Feature H03; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: NFR-1, NFR-3, NFR-4. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D4 → W04/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-031). Source: [Phiếu gốc](work-flow.md#tmc-031).

**Problem → expected outcome:** Đo hiệu năng kiosk với tải 800 giao dịch/30 phút/nhà máy và đợt burst có giả định rõ. Chỉ kết luận trong môi trường mock/PG đã thử, không tự chứng nhận compliance pháp lý.

**Hiện trạng:** Thiết kế/ORM/prototype liên quan có; implementation và acceptance chưa xác minh.

**Scope/deliverables:** work package tổng hợp [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053). Giữ outcome/AC gốc để user kiểm tra toàn bộ; implementation/verification nằm ở con. **Out of scope:** không tạo implementation/estimate lần hai; outcome vượt scope con phải refine và cấp ID mới, không tự coi đã bao phủ.

**Inputs/files:** [api/test](../api/test); [client/test](../client/test); [api/src/modules/iam](../api/src/modules/iam); [api/src/modules/gate](../api/src/modules/gate). Dependencies: [TMC-007](#tmc-007), [TMC-030](#tmc-030), [TMC-051](#tmc-051), [TMC-052](#tmc-052), [TMC-053](#tmc-053). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-031-AC1: Báo cáo có boundary đo, concurrency/arrival rate, cấu hình máy/DB/TCS mock, duration và kết quả thô.
- [ ] TMC-031-AC2: Không dùng p95≤2 giây để tự thay yêu cầu ≤2 giây; ghi mọi mẫu vượt ngưỡng và điều kiện.
- [ ] TMC-031-AC3: Không mất nguồn đã xác nhận trong tập dữ liệu test; chưa đo hoặc fail phải ghi rõ.

<a id="verify-tmc-031"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1 | Đối chiếu báo cáo TMC-051 với workload 800/30 phút/nhà máy, burst đã chốt, UI measurement boundary và raw timestamps/config. | Evidence của tất cả ticket con + owner acceptance | Báo cáo có boundary đo, concurrency/arrival rate, cấu hình máy/DB/TCS mock, duration và kết quả thô. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |
| AC2 | Rà mọi mẫu latency/error/timeout của TMC-051, liệt kê mẫu >2s; đối chiếu kết luận với yêu cầu tối đa thay vì chỉ percentile. | Evidence của tất cả ticket con + owner acceptance | Không dùng p95≤2 giây để tự thay yêu cầu ≤2 giây; ghi mọi mẫu vượt ngưỡng và điều kiện. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |
| AC3 | Đối chiếu confirmed sources, attendance events/revisions và duplicate counts trong tập tải; kiểm tra evidence TMC-052/053 cho scope/redaction. | Evidence của tất cả ticket con + owner acceptance | Không mất nguồn đã xác nhận trong tập dữ liệu test; chưa đo hoặc fail phải ghi rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-032"></a>

### [TMC-032] [TEST] [H04] Verify the complete user journey and UI states

**Metadata:** Feature H04 — End-to-end and release verification; Epic H — Testing & Quality Assurance; parent Feature H04; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: UC-01, UC-02, UC-04, NFR-1. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W04/D6 → W05/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-032). Source: [Phiếu gốc](work-flow.md#tmc-032).

**Problem → expected outcome:** Chạy E2E P0 từ portal→virtual kiosk→history→recovery. Webcam/dashboard chỉ kiểm tra bổ sung nếu P1 được chọn; không để P0 phụ thuộc chúng.

**Hiện trạng:** Chưa có script E2E browser trong client/package.json.

**Scope/deliverables:** Tự động hóa login EMP, lấy QR, scan virtual, mock passage và kiểm tra history API/UI. Chạy denied/expired/replay/UNKNOWN và journal reload bằng backend fixtures. Đối chiếu mobile 360/tablet/desktop, keyboard, focus, chữ/icon trạng thái, light/dark với baseline. Ghi ảnh/video, URL/môi trường và Figma source nếu được cung cấp; chưa có Figma URL phải ghi giới hạn.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [api/test](../api/test); [report](../report). Dependencies: [TMC-021](#tmc-021), [TMC-023](#tmc-023), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-085](#tmc-085). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-032-AC1: E2E P0 pass không cần camera vật lý hoặc dashboard P1.
- [ ] TMC-032-AC2: Không có dữ liệu real/mock trộn mà không nhãn, không xuất hiện đã ghi công ở ACK-only.
- [ ] TMC-032-AC3: Browser refresh và session switch không làm rò cache.

<a id="verify-tmc-032"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Chạy E2E trên ít nhất browser demo được chọn.<br>2. Manual negative camera nếu đã làm 027; dashboard count nếu đã làm 028.<br>3. Kiểm tra console errors, assets và responsive baseline. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: E2E P0 pass không cần camera vật lý hoặc dashboard P1.<br>AC2: Không có dữ liệu real/mock trộn mà không nhãn, không xuất hiện đã ghi công ở ACK-only.<br>AC3: Browser refresh và session switch không làm rò cache. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-033"></a>

### [TMC-033] [DOCS] [I02] Document SOLID evidence from implementation

**Metadata:** Feature I02 — SOLID evidence and reflection; Epic I — Documentation & Submission; parent Feature I02; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:docs. Requirements: NFR-5, M2-SOLID. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D1 → W05/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-033). Source: [Phiếu gốc](work-flow.md#tmc-033).

**Problem → expected outcome:** Ticket riêng cho SOLID Implementation Examples. Đánh giá code module đã có, chỉ refactor nhỏ khi có vi phạm cụ thể và bảo toàn behavior.

**Hiện trạng:** Có kiến trúc/source; cần evidence cụ thể theo revision.

**Scope/deliverables:** Map SRP cho validator/policy/dispatcher/writer; DIP cho use case/ports và bootstrap providers. Map OCP cho mock/HTTP adapter và ISP cho interface tách open/status/query. Chứng minh LSP qua contract tests, giữ UNKNOWN semantics giống nhau giữa adapter. Ghi file/symbol/commit, lợi ích và trade-off; sửa import/framework leakage nếu tìm thấy.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules](../api/src/modules); [api/test](../api/test); [report/sections/content.tex](../report/sections/content.tex). Dependencies: [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-085](#tmc-085). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-033-AC1: Có ví dụ cụ thể cho S/O/L/I/D, link source và assertion/contract test.
- [ ] TMC-033-AC2: Không thêm interface/lớp trống chỉ để đủ danh sách SOLID.
- [ ] TMC-033-AC3: Refactor nếu có không làm thay đổi policy hoặc bỏ concurrency constraints.

<a id="verify-tmc-033"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Review import boundary và dùng cùng contract test cho adapters.<br>2. Chạy suite bị ảnh hưởng bởi refactor.<br>3. Kiểm tra link source theo commit và so code thật với mô tả. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Có ví dụ cụ thể cho S/O/L/I/D, link source và assertion/contract test.<br>AC2: Không thêm interface/lớp trống chỉ để đủ danh sách SOLID.<br>AC3: Refactor nếu có không làm thay đổi policy hoặc bỏ concurrency constraints. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-034"></a>

### [TMC-034] [DOCS] [I02] Write the implementation-based SOLID reflection

**Metadata:** Feature I02 — SOLID evidence and reflection; Epic I — Documentation & Submission; parent Feature I02; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:docs. Requirements: M2-SOLID. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D1 → W05/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-034). Source: [Phiếu gốc](work-flow.md#tmc-034).

**Problem → expected outcome:** Viết reflection ngắn theo M2 về lợi ích, khó khăn, modularity, maintainability và extensibility, dựa trên code/review/rework đã xảy ra.

**Hiện trạng:** Report artifacts đang có local; chưa rà nội dung reflection/acceptance.

**Scope/deliverables:** Chọn ít nhất hai tình huống thực tế như thay gateway hoặc lỗi transaction context. Mô tả trước/sau và nguyên tắc giúp giải quyết; nêu chi phí abstraction/DI. Liên kết ví dụ033 và kết quả030, ghi rõ giới hạn/chưa làm. Viết bằng giọng phản ánh của nhóm, Solo Developer kiểm tra tính xác thực trước nộp.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules](../api/src/modules); [api/test](../api/test); [report/sections/content.tex](../report/sections/content.tex). Dependencies: [TMC-030](#tmc-030), [TMC-033](#tmc-033). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-034-AC1: Trả lời đầy đủ lợi ích, khó khăn và ảnh hưởng SOLID theo đề.
- [ ] TMC-034-AC2: Không bịa kinh nghiệm, số liệu hoặc test chưa chạy.
- [ ] TMC-034-AC3: Nội dung nhất quán với code và architecture cuối cùng.

<a id="verify-tmc-034"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Cross-review reflection với issue/review log và evidence thực tế.<br>2. Kiểm tra trích dẫn code/diagram còn đúng.<br>3. So yêu cầu reflection ở PDF M2 trang3. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Trả lời đầy đủ lợi ích, khó khăn và ảnh hưởng SOLID theo đề.<br>AC2: Không bịa kinh nghiệm, số liệu hoặc test chưa chạy.<br>AC3: Nội dung nhất quán với code và architecture cuối cùng. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-035"></a>

### [TMC-035] [DOCS] [I01] Align architecture decisions and three required views

**Metadata:** Feature I01 — Scope and architecture views; Epic I — Documentation & Submission; parent Feature I01; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs. Requirements: M2-DESIGN, M2-QR, M2-NETWORK, NFR-6. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D2 → W05/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-035). Source: [Phiếu gốc](work-flow.md#tmc-035).

**Problem → expected outcome:** Hợp nhất M1 và thay đổi M2 thành Software Architecture Design cuối cùng. Không chỉ thêm diagram vào báo cáo cũ mà bỏ các phần characteristic/style/trade-off.

**Hiện trạng:** Doc/report có, nhiều inventory lịch sử đã lệch source hiện tại.

**Scope/deliverables:** Cập nhật FR/NFR, measurable scenarios và architecture characteristics; so modular monolith/layered/microservices theo tiêu chí cụ thể. Trình bày từng bước logical→physical, module/dependency view, C&C runtime/sequence và allocation/deployment. Ghi ADR thay đổi QR static→short-lived, R1 recovery, evidence/UNKNOWN, transaction context và dependency Figma. Gắn triển khai thực tế, mock, chưa triển khai, số đo và trade-offs; đối chiếu schema 37 với module code subset.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/summary-assigment.md](../doc/summary-assigment.md); [doc/structure-architecture.md](../doc/structure-architecture.md); [doc/schema-database.md](../doc/schema-database.md); [doc/user-flow.md](../doc/user-flow.md); [doc/work-flow.md](../doc/work-flow.md). Dependencies: [TMC-001](#tmc-001), [TMC-022](#tmc-022), [TMC-031](#tmc-031), [TMC-033](#tmc-033), [TMC-034](#tmc-034). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-035-AC1: Đủ mọi mục Task1 cùng cả ba architectural views, không nhầm sơ đồ thư mục với runtime view.
- [ ] TMC-035-AC2: Hai vấn đề M2 có mitigation, vị trí tích hợp và residual risks rõ.
- [ ] TMC-035-AC3: HRS trước noon ngày 1 được giữ ở thiết kế; không tuyên bố đã tích hợp khi 041 chưa làm.

<a id="verify-tmc-035"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Cross-check diagram node/connector với source/config cuối.<br>2. Review mapping requirement→design→ticket→test/evidence.<br>3. Kiểm tra link, caption, readable export và thuật ngữ giữa các tài liệu. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Đủ mọi mục Task1 cùng cả ba architectural views, không nhầm sơ đồ thư mục với runtime view.<br>AC2: Hai vấn đề M2 có mitigation, vị trí tích hợp và residual risks rõ.<br>AC3: HRS trước noon ngày 1 được giữ ở thiết kế; không tuyên bố đã tích hợp khi 041 chưa làm. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-036"></a>

### [TMC-036] [DOCS] [I03] Verify setup instructions and the reproducible demo

**Metadata:** Feature I03 — Runbook, report and submission; Epic I — Documentation & Submission; parent Feature I03; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs. Requirements: NFR-5, M2-CODE. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D3 → W05/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-036). Source: [Phiếu gốc](work-flow.md#tmc-036).

**Problem → expected outcome:** Viết setup/runbook chính xác cho client/api/PG/mock. Phân biệt preview Figma đang chạy với standalone build; không giả định package private có sẵn.

**Hiện trạng:** README/runbook hiện đã chi tiết; cần clean-run và đối chiếu không ghi đè cấu hình.

**Scope/deliverables:** Ghi toolchain đã pin, dependency Astra hợp lệ, env, DB migration/seed, start API/worker/client. Liệt kê accounts/station provision và cách tách public demo với server mode. Viết kịch bản happy/denied/replay/timeout/recovery và reset chỉ DB demo. Ghi verification commands, môi trường đã chạy, giới hạn simulator và xử lý lỗi cài đặt.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [README.md](../README.md); [doc/demo-accounts.md](../doc/demo-accounts.md); [scripts](../scripts); [report](../report). Dependencies: [TMC-005](#tmc-005), [TMC-032](#tmc-032). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-036-AC1: Clean checkout đi theo README có thể chạy slice đã chọn.
- [ ] TMC-036-AC2: Không cần secret cá nhân hardcode; step nào cần quyền/package phải ghi nguồn cấp.
- [ ] TMC-036-AC3: GitHub URL đúng và mọi giới hạn mock/camera/HRS hiện rõ.

<a id="verify-tmc-036"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Clean setup smoke test trong thư mục/môi trường tạm được phép.<br>2. Chạy theo demo steps và đối chiếu expected state.<br>3. Kiểm tra assets/fonts và dependency install tái lập từ lockfile. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Clean checkout đi theo README có thể chạy slice đã chọn.<br>AC2: Không cần secret cá nhân hardcode; step nào cần quyền/package phải ghi nguồn cấp.<br>AC3: GitHub URL đúng và mọi giới hạn mock/camera/HRS hiện rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-037"></a>

### [TMC-037] [DOCS] [I03] Package the M2 report and submission evidence

**Metadata:** Feature I03 — Runbook, report and submission; Epic I — Documentation & Submission; parent Feature I03; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs. Requirements: M2-SUBMIT. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D4 → W05/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-037). Source: [Phiếu gốc](work-flow.md#tmc-037).

**Problem → expected outcome:** Đóng gói report PDF và release candidate với URL GitHub thực. Nộp LMS là thao tác của Solo Developer trong kế hoạch; ticket không tự đăng/push/nộp từ nhiệm vụ lập kế hoạch này.

**Hiện trạng:** Có report/main.tex và PDF local; không xác minh bản nộp/LMS.

**Scope/deliverables:** Ghép Architecture Design, hai cải tiến M2, SOLID/reflection và module implementation/testing evidence. Ghi URL https://github.com/tungbinhdinh89/TMCQRAttendanceSystem_KTPM và commit/release candidate đã kiểm tra quyền đọc. So checklist đề, format PDF, link, hình và hạn LMS chính thức; không coi 01/12 là deadline giảng viên đã xác nhận. Solo Developer chuẩn bị/nộp trên LMS, lưu receipt khi có; cập nhật trạng thái chỉ sau bằng chứng.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [README.md](../README.md); [doc/demo-accounts.md](../doc/demo-accounts.md); [scripts](../scripts); [report](../report). Dependencies: [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-038](#tmc-038). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-037-AC1: Báo cáo có URL GitHub chứa source đúng commit và truy cập được theo quyền môn học.
- [ ] TMC-037-AC2: Không thiếu Task1/2, reflection hoặc hai vấn đề M2.
- [ ] TMC-037-AC3: File/receipt thực tế mới được đánh dấu Submitted; không lấy tạo PDF làm bằng chứng nộp LMS.

<a id="verify-tmc-037"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Mở PDF và tất cả link quan trọng từ tài khoản kiểm tra phù hợp.<br>2. Re-run demo release candidate đã khóa.<br>3. Đối chiếu tên file/dung lượng/deadline LMS và lưu xác nhận sau khi nộp. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Báo cáo có URL GitHub chứa source đúng commit và truy cập được theo quyền môn học.<br>AC2: Không thiếu Task1/2, reflection hoặc hai vấn đề M2.<br>AC3: File/receipt thực tế mới được đánh dấu Submitted; không lấy tạo PDF làm bằng chứng nộp LMS. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-038"></a>

### [TMC-038] [TEST] [H04] Verify the release candidate and triage blockers

**Metadata:** Feature H04 — End-to-end and release verification; Epic H — Testing & Quality Assurance; parent Feature H04; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: M2-CODE, M2-SUBMIT. UC/UF: Hỗ trợ xuyên UC; xem FR/NFR và milestone. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-05, W05/D3 → W05/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-038). Source: [Phiếu gốc](work-flow.md#tmc-038).

**Problem → expected outcome:** Timebox ổn định 3 giờ đã tính vào plan, khác buffer38 giờ chưa phân công. Nếu phát hiện lỗi lớn thì dùng buffer và cập nhật estimate, không ẩn failure.

**Hiện trạng:** Chưa có failure report mới; đây là verification/triage timebox, không bịa bug.

**Scope/deliverables:** Triage lỗi029–032 theo severity, ghi repro/expected/actual và fix nhỏ. Giữ policy/constraints/secret handling; nếu thay contract thì cập nhật source/docs/test cùng nhau. Re-run regression bị ảnh hưởng và build hai app. Khóa candidate commit, ghi known limitations và bàn giao037.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [api/test](../api/test); [report](../report). Dependencies: [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-035](#tmc-035), [TMC-036](#tmc-036). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-038-AC1: Không còn blocker/critical về mở lặp, mất nguồn, rò scope hoặc không chạy demo.
- [ ] TMC-038-AC2: Mọi bug fix có repro và regression assertion phù hợp.
- [ ] TMC-038-AC3: Known P1/P2 chưa làm được ghi rõ, không gọi chúng là completed.

<a id="verify-tmc-038"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Chạy core/reliability/E2E suites liên quan thay đổi.<br>2. Build/typecheck hai app.<br>3. Smoke restart/recovery và chạy demo từ đầu theo runbook. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Không còn blocker/critical về mở lặp, mất nguồn, rò scope hoặc không chạy demo.<br>AC2: Mọi bug fix có repro và regression assertion phù hợp.<br>AC3: Known P1/P2 chưa làm được ghi rõ, không gọi chúng là completed. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-039"></a>

### [TMC-039] [ENHANCEMENT] [G01] Monitor station heartbeat and pending work

**Metadata:** Feature G01 — Operational dashboard and heartbeat; Epic G — Dashboard & Monitoring; parent Feature G01; `type:enhancement`; P1 — có thể scope-cut khi capacity thiếu; area:backend, area:frontend. Requirements: FR-2.6, FR-5.3. UC/UF: UC-07 / UF-08. API: API-RPT-01, API-CFG-01, API-GATE-04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W07/D6 → W08/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-039). Source: [Phiếu gốc](work-flow.md#tmc-039).

**Problem → expected outcome:** P1 hoãn sau M2 baseline. Mở rộng dashboard bằng heartbeat/authenticated station health và số liệu worker; không triển khai observability platform.

**Hiện trạng:** Chưa thấy heartbeat controller/runtime.

**Scope/deliverables:** Thêm heartbeat endpoint từ trạm đã xác thực và lưu lastSeen. Định nghĩa stale threshold cấu hình, phân biệt station connectivity với TCS/device physical health. Tổng hợp pending/failed jobs, case age, UNKNOWN và latency từ dữ liệu thật. Hiển thị timestamp/chất lượng dữ liệu và factory-scoped metrics.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/dashboard/Dashboard.tsx](../client/src/features/dashboard/Dashboard.tsx); [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt). Dependencies: [TMC-024](#tmc-024), [TMC-028](#tmc-028). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Chưa thấy heartbeat controller/runtime. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-039-AC1: Không đồng nhất heartbeat app với cổng vật lý hoạt động.
- [ ] TMC-039-AC2: Scope của metrics giống API nghiệp vụ.
- [ ] TMC-039-AC3: Backlog tăng có thể quan sát và stale heartbeat hiển thị UNKNOWN/OFFLINE rõ.

<a id="verify-tmc-039"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Fake clock cho stale threshold và trạm revoked.<br>2. Cross-factory metrics và API rate limit.<br>3. So counts với jobs/cases fixture. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Không đồng nhất heartbeat app với cổng vật lý hoạt động.<br>AC2: Scope của metrics giống API nghiệp vụ.<br>AC3: Backlog tăng có thể quan sát và stale heartbeat hiển thị UNKNOWN/OFFLINE rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-040"></a>

### [TMC-040] [FEATURE] [E03] Deliver versioned HR attendance corrections

**Metadata:** Feature E03 — Attendance pairing and corrections; Epic E — Attendance Event Recording; parent Feature E03; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:frontend, area:contracts. Requirements: FR-3.4, FR-3.5. UC/UF: UC-05 / UF-06. API: catalog ATT §19.8 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D6 → W06/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-040). Source: [Phiếu gốc](work-flow.md#tmc-040).

**Problem → expected outcome:** P2 ngoài module nộp baseline. Schema đã dự trù correction/revision; hiện thực full workflow cần thêm giờ, không dùng prototype decideAdjustment ghi đè làm sản phẩm thật.

**Hiện trạng:** Work package, chuyển implementation vào ticket con.

**Scope/deliverables:** work package tổng hợp [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064). Giữ outcome/AC gốc để user kiểm tra toàn bộ; implementation/verification nằm ở con. **Out of scope:** không tạo implementation/estimate lần hai; outcome vượt scope con phải refine và cấp ID mới, không tự coi đã bao phủ.

**Inputs/files:** [api/src/modules/att](../api/src/modules/att); [client/src/features/attendance/Attendance.tsx](../client/src/features/attendance/Attendance.tsx); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-007](#tmc-007), [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-062](#tmc-062), [TMC-063](#tmc-063), [TMC-064](#tmc-064). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-040-AC1: Hai HR sửa cùng version: một thành công, một conflict không lưu một phần.
- [ ] TMC-040-AC2: Revision 1 không đổi; nguồn correction liên kết đúng before/after versions.
- [ ] TMC-040-AC3: Nhiều khoảng trong ngày không tính cả thời gian vắng như first-in/last-out.

<a id="verify-tmc-040"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Deferred FK/CAS race và rollback correction/revision/audit.<br>2. API permissions, reason rỗng, void và nhầm employee.<br>3. Pairing overnight/missing/duplicate IN và boundary month. | Evidence của tất cả ticket con + owner acceptance | AC1: Hai HR sửa cùng version: một thành công, một conflict không lưu một phần.<br>AC2: Revision 1 không đổi; nguồn correction liên kết đúng before/after versions.<br>AC3: Nhiều khoảng trong ngày không tính cả thời gian vắng như first-in/last-out. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-041"></a>

### [TMC-041] [FEATURE] [G02] Deliver versioned monthly HRS exports

**Metadata:** Feature G02 — Monthly snapshot and HRS delivery; Epic G — Dashboard & Monitoring; parent Feature G02; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-4.3, FR-4.4, FR-4.5, INT-01. UC/UF: UC-06 / UF-07. API: catalog RPT §19.9 + EXT-03/04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D2 → W06/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-041). Source: [Phiếu gốc](work-flow.md#tmc-041).

**Problem → expected outcome:** P2 implementation ngoài module baseline; yêu cầu/tích hợp HRS vẫn phải có trong kiến trúc P0. Chỉ triển khai khi đã có contract mock/real được chốt.

**Hiện trạng:** Work package, chuyển implementation vào ticket con.

**Scope/deliverables:** work package tổng hợp [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068). Giữ outcome/AC gốc để user kiểm tra toàn bộ; implementation/verification nằm ở con. **Out of scope:** không tạo implementation/estimate lần hai; outcome vượt scope con phải refine và cấp ID mới, không tự coi đã bao phủ.

**Inputs/files:** [api/src/modules/rpt](../api/src/modules/rpt); [contracts/src/reports.ts](../contracts/src/reports.ts); [api/src/modules/att](../api/src/modules/att). Dependencies: [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-040](#tmc-040), [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067), [TMC-068](#tmc-068). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-041-AC1: Mất response rồi retry không tạo dữ liệu lô khác; partial/mismatch không thành ACCEPTED.
- [ ] TMC-041-AC2: Snapshot cũ không đổi khi công live được hiệu chỉnh.
- [ ] TMC-041-AC3: Không tính lương; chưa có HRS thật thì chỉ kết luận contract mock.

<a id="verify-tmc-041"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Snapshot consistency và FK source revisions.<br>2. Lost ACK/idempotency/status không hỗ trợ/permanent errors.<br>3. Boundary month/overnight, dueAt và đúng12:00 không là trước hạn. | Evidence của tất cả ticket con + owner acceptance | AC1: Mất response rồi retry không tạo dữ liệu lô khác; partial/mismatch không thành ACCEPTED.<br>AC2: Snapshot cũ không đổi khi công live được hiệu chỉnh.<br>AC3: Không tính lương; chưa có HRS thật thì chỉ kết luận contract mock. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-042"></a>

### [TMC-042] [SPIKE] [F03] Evaluate and prototype autonomous offline edge operation

**Metadata:** Feature F03 — Optional autonomous offline edge; Epic F — Failure Handling & Recovery; parent Feature F03; `type:spike`; P2 — extension; chưa cam kết M2; area:docs. Requirements: M2-NETWORK. UC/UF: UC-04 / UF-03. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-08, Unscheduled; sau go/no-go; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-042). Source: [Phiếu gốc](work-flow.md#tmc-042).

**Problem → expected outcome:** P2 nghiên cứu/prototype edge, không phải bật offline OPEN cho kiosk hiện tại. Cần chốt threat model, grant cache, khóa và giới hạn consistency trước làm.

**Hiện trạng:** Work package tùy chọn, không đồng nghĩa baseline phải mở cổng offline.

**Scope/deliverables:** work package tổng hợp [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071). Giữ outcome/AC gốc để user kiểm tra toàn bộ; implementation/verification nằm ở con. **Out of scope:** không tạo implementation/estimate lần hai; outcome vượt scope con phải refine và cấp ID mới, không tự coi đã bao phủ.

**Inputs/files:** [doc/tech-stack.md](../doc/tech-stack.md); [doc/structure-architecture.md](../doc/structure-architecture.md); [api/simulators](../api/simulators). Dependencies: [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030), [TMC-069](#tmc-069), [TMC-070](#tmc-070), [TMC-071](#tmc-071). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Spike details:** timebox 0h, câu hỏi/decision trong scope và AC. Bàn giao ADR/prototype có giới hạn, go/no-go và unresolved questions; không coi kết quả nghiên cứu là feature production.

**Acceptance criteria**

- [ ] TMC-042-AC1: Nêu rõ quyền có thể stale và không hứa one-time token toàn hệ thống khi partition.
- [ ] TMC-042-AC2: Offline OPEN chỉ khi policy được chốt; trạng thái chưa xác minh không thành công giả.
- [ ] TMC-042-AC3: Có trade-off deploy/ops/key protection và bằng chứng sync.

<a id="verify-tmc-042"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Partition hai edge dùng cùng QR và revoke khi offline.<br>2. Crash local persistence, clock drift và reconnect duplicate.<br>3. Thử conflict/reconciliation và giới hạn lưu trữ. | Evidence của tất cả ticket con + owner acceptance | AC1: Nêu rõ quyền có thể stale và không hứa one-time token toàn hệ thống khi partition.<br>AC2: Offline OPEN chỉ khi policy được chốt; trạng thái chưa xác minh không thành công giả.<br>AC3: Có trade-off deploy/ops/key protection và bằng chứng sync. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-043"></a>

### [TMC-043] [UI] [B03] Deliver the IAM administration interface

**Metadata:** Feature B03 — IAM administration interface; Epic B — Authentication & Employee Foundation; parent Feature B03; `type:ui`; P2 — extension; chưa cam kết M2; area:frontend, area:contracts. Requirements: FR-5.1. UC/UF: UC-08 / UF-09. API: Không thêm endpoint riêng; trace theo ticket/requirements ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D5 → W07/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-043). Source: [Phiếu gốc](work-flow.md#tmc-043).

**Problem → expected outcome:** P2: mở rộng IAM management screens. Auth/RBAC tối thiểu P0 dùng seed và APIs đã kiểm tra, không chờ full console.

**Hiện trạng:** Work package UI; backend quản trị là tickets riêng B04.

**Scope/deliverables:** work package tổng hợp [TMC-060](#tmc-060), [TMC-061](#tmc-061). Giữ outcome/AC gốc để user kiểm tra toàn bộ; implementation/verification nằm ở con. **Out of scope:** không tạo implementation/estimate lần hai; outcome vượt scope con phải refine và cấp ID mới, không tự coi đã bao phủ.

**Inputs/files:** [client/src/features/settings/Settings.tsx](../client/src/features/settings/Settings.tsx); [client/src/lib/rbac.ts](../client/src/lib/rbac.ts); [contracts/src/auth.ts](../contracts/src/auth.ts). Dependencies: [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-060](#tmc-060), [TMC-061](#tmc-061). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-043-AC1: Role/scope persistence đúng unique/shape constraints.
- [ ] TMC-043-AC2: ADM quản trị được IAM theo quyền nhưng không tự sửa công HR.
- [ ] TMC-043-AC3: Mọi thay đổi có actor/reason/audit và cross-scope negative tests.

<a id="verify-tmc-043"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Scope NULL uniqueness, revoke và stale sessions.<br>2. Self escalation/IDOR/invalid scope references.<br>3. UI conflict/error/empty và permission guards. | Evidence của tất cả ticket con + owner acceptance | AC1: Role/scope persistence đúng unique/shape constraints.<br>AC2: ADM quản trị được IAM theo quyền nhưng không tự sửa công HR.<br>AC3: Mọi thay đổi có actor/reason/audit và cross-scope negative tests. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-044"></a>

### [TMC-044] [TASK] [A06] Audit current acceptance evidence and replan capacity

**Metadata:** Feature A06 — Current-state acceptance audit; Epic A — Project Setup & Foundation; parent Feature A06; `type:task`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: M2-DESIGN, NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D1 → W01/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-044). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Đối chiếu 001…043 với source/tests/PR/acceptance hiện có; không làm lại scaffold đã có; chốt remaining effort, giờ/ngày, deadline LMS và tập Ready cùng user.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Đối chiếu 001…043 với source/tests/PR/acceptance hiện có không làm lại scaffold đã có chốt remaining effort, giờ/ngày, deadline LMS và tập Ready cùng user.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md); [doc/work-flow.md](../doc/work-flow.md); [README.md](../README.md); [api/test](../api/test); [client/test](../client/test). Dependencies: Không có. Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** task có đầu ra quyết định/cấu hình/audit cụ thể; điều kiện quyền/owner/metadata phải có nguồn trước khi thực hiện, không tạo remote khi chỉ chuẩn bị proposal.

**Acceptance criteria**

- [ ] TMC-044-AC1: Mỗi ticket có source-inspected/verified/gap rõ, không nâng Done chỉ từ tên commit.
- [ ] TMC-044-AC2: Lập remaining estimate và lịch/capacity được user chốt; ghi khác biệt với baseline lịch sử.
- [ ] TMC-044-AC3: Tạo tập pull candidates có input/AC/dependency, không tự assign/implement.

<a id="verify-tmc-044"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Rà workspace/migrations/auth/tests so với inventory §1; đọc evidence do owner cung cấp.<br>2. Tổng effort cha/con và lịch đúng; không reset progress hoặc tạo issue trùng. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Mỗi ticket có source-inspected/verified/gap rõ, không nâng Done chỉ từ tên commit.<br>AC2: Lập remaining estimate và lịch/capacity được user chốt; ghi khác biệt với baseline lịch sử.<br>AC3: Tạo tập pull candidates có input/AC/dependency, không tự assign/implement. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-045"></a>

### [TMC-045] [DOCS] [A05] Define issue templates and label taxonomy

**Metadata:** Feature A05 — GitHub delivery governance; Epic A — Project Setup & Foundation; parent Feature A05; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs, area:devops. Requirements: NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D2 → W01/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-045). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Chuẩn hóa template ticket/bug/PR, title ID/type/Feature và label dictionary; mapping type:documentation cũ sang type:docs có kế hoạch, không đổi ID; chuẩn bị files tooling nếu được giao.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Chuẩn hóa template ticket/bug/PR, title ID/type/Feature và label dictionary mapping type:documentation cũ sang type:docs có kế hoạch, không đổi ID chuẩn bị files tooling nếu được giao.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md); `.github/ISSUE_TEMPLATE` (proposed; chưa có); `.github/pull_request_template.md` (proposed; chưa có). Dependencies: [TMC-001](#tmc-001), [TMC-044](#tmc-044). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-045-AC1: Mỗi label có description/color/rule/exclusivity; đúng một work type và mapping Feature.
- [ ] TMC-045-AC2: Template đủ AC/verification/parent và human-review gate, không placeholder trong issue sẵn import.

<a id="verify-tmc-045"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Walkthrough một FEATURE, BUG, UI, ENHANCEMENT và cross-cutting; title/body/labels khớp.<br>2. Kiểm tra Markdown/YAML khi file template được tạo; chưa tạo remote thì Not created. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Mỗi label có description/color/rule/exclusivity; đúng một work type và mapping Feature.<br>AC2: Template đủ AC/verification/parent và human-review gate, không placeholder trong issue sẵn import. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-046"></a>

### [TMC-046] [CHORE] [A05] Prepare the GitHub Project field schema

**Metadata:** Feature A05 — GitHub delivery governance; Epic A — Project Setup & Foundation; parent Feature A05; `type:chore`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs, area:devops. Requirements: NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D2 → W01/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-046). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Khảo sát owner/repo/Project hiện có và quyền; tạo hoặc tái sử dụng Project khi được giao thực thi; cấu hình Status/Priority/Rank/Estimate/Start/Target/Iteration và Feature mapping.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Khảo sát owner/repo/Project hiện có và quyền tạo hoặc tái sử dụng Project khi được giao thực thi cấu hình Status/Priority/Rank/Estimate/Start/Target/Iteration và Feature mapping.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md). Dependencies: [TMC-045](#tmc-045). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** task có đầu ra quyết định/cấu hình/audit cụ thể; điều kiện quyền/owner/metadata phải có nguồn trước khi thực hiện, không tạo remote khi chỉ chuẩn bị proposal.

**Acceptance criteria**

- [ ] TMC-046-AC1: Owner/audience/Project URL/ID lấy từ phản hồi thật, không tự thay quyền hoặc tạo Project trùng.
- [ ] TMC-046-AC2: Fields/options/types đúng schema §8, một nguồn Status/Priority; dates/estimate map ticket đúng.

<a id="verify-tmc-046"></a>

**Verification plan — V-GH**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Walkthrough field của issue thật hoặc dry configuration review; ghi mức xác minh.<br>2. Không tự giả custom people-picker/organization issue type hoặc mirror tự động. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Owner/audience/Project URL/ID lấy từ phản hồi thật, không tự thay quyền hoặc tạo Project trùng.<br>AC2: Fields/options/types đúng schema §8, một nguồn Status/Priority; dates/estimate map ticket đúng. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-047"></a>

### [TMC-047] [CHORE] [A05] Configure saved views and safe project automations

**Metadata:** Feature A05 — GitHub delivery governance; Epic A — Project Setup & Foundation; parent Feature A05; `type:chore`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs, area:devops. Requirements: NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D2 → W01/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-047). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo năm saved views theo schema; kiểm tra auto-add/closed/merged workflows; giữ user approval gate và không Done cho closed-unmerged.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo năm saved views theo schema kiểm tra auto-add/closed/merged workflows giữ user approval gate và không Done cho closed-unmerged.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md). Dependencies: [TMC-046](#tmc-046). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** task có đầu ra quyết định/cấu hình/audit cụ thể; điều kiện quyền/owner/metadata phải có nguồn trước khi thực hiện, không tạo remote khi chỉ chuẩn bị proposal.

**Acceptance criteria**

- [ ] TMC-047-AC1: Prioritized Backlog, Status Board, Roadmap, Bugs, In Review có filter/layout/sort/group/date đúng và được save.
- [ ] TMC-047-AC2: Workflow closed-unmerged/not-planned không tự Done; issue/PR không cộng estimate hai lần.

<a id="verify-tmc-047"></a>

**Verification plan — V-GH**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Dùng issue có/không date, BUG/FIX, In Review và PR closed-unmerged để đối chiếu filter/automation.<br>2. Thiếu quyền hoặc chưa thao tác thì record Proposed/Not verified, không báo pass. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Prioritized Backlog, Status Board, Roadmap, Bugs, In Review có filter/layout/sort/group/date đúng và được save.<br>AC2: Workflow closed-unmerged/not-planned không tự Done; issue/PR không cộng estimate hai lần. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-048"></a>

### [TMC-048] [DOCS] [A05] Define protected-branch checks and human review ownership

**Metadata:** Feature A05 — GitHub delivery governance; Epic A — Project Setup & Foundation; parent Feature A05; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs, area:devops. Requirements: NFR-3, NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D3 → W01/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-048). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Xác định check names thực, author/reviewer identities và main ruleset mục tiêu; ghi proposal hoặc cấu hình khi được giao, không tự bật auto-merge.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Xác định check names thực, author/reviewer identities và main ruleset mục tiêu ghi proposal hoặc cấu hình khi được giao, không tự bật auto-merge.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md); [doc/work-flow.md](../doc/work-flow.md); `.github/workflows` (proposed; chưa có). Dependencies: [TMC-044](#tmc-044), [TMC-045](#tmc-045). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-048-AC1: Quy trình main → branch → checks → PR → user approve/merge rõ; rule khả dụng theo quyền/account.
- [ ] TMC-048-AC2: Nếu author/reviewer cùng account, ghi không thể native self-approve và phương án reviewer được owner chọn.
- [ ] TMC-048-AC3: Tên required check chỉ chốt/cấu hình sau khi TMC-005 có CI thật; đầu ra trước đó là proposal, không báo protection đã bật.

<a id="verify-tmc-048"></a>

**Verification plan — V-GH**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2, AC3 | 1. Đối chiếu required checks với CI thực; không đăng ký check không bao giờ chạy.<br>2. Review latest-push/stale approvals và PR-only CI draft flow; không bypass protection. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Quy trình main → branch → checks → PR → user approve/merge rõ; rule khả dụng theo quyền/account.<br>AC2: Nếu author/reviewer cùng account, ghi không thể native self-approve và phương án reviewer được owner chọn.<br>AC3: Tên required check chỉ chốt/cấu hình sau khi TMC-005 có CI thật; đầu ra trước đó là proposal, không báo protection đã bật. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-049"></a>

### [TMC-049] [TASK] [A05] Import verified ticket metadata without duplicate issues

**Metadata:** Feature A05 — GitHub delivery governance; Epic A — Project Setup & Foundation; parent Feature A05; `type:task`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs, area:devops. Requirements: NFR-5. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D3 → W01/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-049). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Chuẩn bị import batches theo dependency/milestone; tra issue/ID trước khi create/update/reuse; lưu mapping internal ID → issue → Project item sau từng batch được giao.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Chuẩn bị import batches theo dependency/milestone tra issue/ID trước khi create/update/reuse lưu mapping internal ID → issue → Project item sau từng batch được giao.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/backlog.md](../doc/backlog.md). Dependencies: [TMC-046](#tmc-046), [TMC-047](#tmc-047), [TMC-048](#tmc-048). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** task có đầu ra quyết định/cấu hình/audit cụ thể; điều kiện quyền/owner/metadata phải có nguồn trước khi thực hiện, không tạo remote khi chỉ chuẩn bị proposal.

**Acceptance criteria**

- [ ] TMC-049-AC1: Giữ toàn bộ ID/parent/type/Feature, milestone/dates đúng; legacy remote mapping chưa biết ghi Unverified.
- [ ] TMC-049-AC2: Retry phần chưa tạo, không nhân đôi; Ready chỉ khi DoR và user chọn, không từ việc import.

<a id="verify-tmc-049"></a>

**Verification plan — V-GH**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Dry-run bảng import trước mutation; so count/duplicates/parent và titles.<br>2. Đối chiếu remote response/URL sau batch khi được phép, không fabricate issue numbers. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: Giữ toàn bộ ID/parent/type/Feature, milestone/dates đúng; legacy remote mapping chưa biết ghi Unverified.<br>AC2: Retry phần chưa tạo, không nhân đôi; Ready chỉ khi DoR và user chọn, không từ việc import. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-050"></a>

### [TMC-050] [BUG] [B01] Restrict demo bootstrap data to authorized scopes

**Metadata:** Feature B01 — Identity, scoped sessions and seed; Epic B — Authentication & Employee Foundation; parent Feature B01; `type:bug`; P0 — dữ liệu demo thiếu scope theo source; area:backend, area:frontend. Requirements: FR-1.5, FR-5.1, NFR-3, NFR-4. UC/UF: UC-08 / UF-00, UF-09. API: API-IAM-01…03; quyền server cho các API nghiệp vụ ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D3 → W02/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-050). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Controller demo/bootstrap hiện không đọc session và query toàn bộ employee/account/grants/stations; bootstrap test mock kỳ vọng 200 công khai; giới hạn projection/role/scope và vẫn cho login UI khởi động an toàn.

**Hiện trạng:** Source-confirmed exposure path; chưa gửi request tới DB thật, chưa khẳng định lộ dữ liệu nhân sự thật.

**Scope/deliverables:** Controller demo/bootstrap hiện không đọc session và query toàn bộ employee/account/grants/stations bootstrap test mock kỳ vọng 200 công khai giới hạn projection/role/scope và vẫn cho login UI khởi động an toàn.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/cfg/presentation/demo-bootstrap.controller.ts](../api/src/modules/cfg/presentation/demo-bootstrap.controller.ts); [api/test/bootstrap.test.mjs](../api/test/bootstrap.test.mjs); [client/src/data/api.ts](../client/src/data/api.ts); [client/src/app/context.tsx](../client/src/app/context.tsx). Dependencies: [TMC-007](#tmc-007), [TMC-008](#tmc-008). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**BUG details:** source-inspected tại revision làm việc 2026-11-07; environment runtime/affected release chưa xác minh. Repro: đọc DemoBootstrapController không có session/guard và query toàn bộ tables; bootstrap.test kỳ vọng anonymous 200. Expected: dữ liệu chỉ trong role/scope hoặc demo isolation được owner chốt. Actual source: response gồm employees/accounts/grants/stations; lỗi còn phản chiếu error.message. Frequency: deterministic code path với query thành công; chưa gửi request tới DB/deployment thật. Impact: truy cập PII/account metadata ngoài scope; severity **S2 proposed**, owner triage trước Ready. Workaround hiện có chưa xác minh. Evidence: controller/test links ở Inputs; regression anonymous/self/cross-factory/EXE và client login. Đây là BUG ticket được sửa trực tiếp, không tạo FIX trùng.

**Acceptance criteria**

- [ ] TMC-050-AC1: Anonymous không lấy employee/account dataset; 401 hoặc route chỉ bật trong demo có ranh giới dữ liệu được chốt.
- [ ] TMC-050-AC2: EMP/self, SUP/team, SEC/factory, EXE aggregate theo policy; không expose accounts hoặc raw SQL errors.
- [ ] TMC-050-AC3: Client login không phụ thuộc endpoint public trả toàn DB; vẫn có loading/error/empty rõ.

<a id="verify-tmc-050"></a>

**Verification plan — V-API+V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1 | Gọi bootstrap anonymous trên synthetic DB có employee/user fixture; kiểm tra không trả dataset hoặc route bị tắt/cách ly theo policy đã chọn. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | Anonymous không lấy employee/account dataset; 401 hoặc route chỉ bật trong demo có ranh giới dữ liệu được chốt. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |
| AC2 | Gọi bằng EMP/SUP/SEC/EXE, thử ID/cross-factory filter; gây DB error mock và so response/log với field allowlist. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | EMP/self, SUP/team, SEC/factory, EXE aggregate theo policy; không expose accounts hoặc raw SQL errors. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |
| AC3 | Mở login anonymous rồi login/reload/logout/đổi identity khi dataset endpoint bị từ chối; kiểm tra loading/error và cache. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | Client login không phụ thuộc endpoint public trả toàn DB; vẫn có loading/error/empty rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-051"></a>

### [TMC-051] [TEST] [H03] Measure kiosk response latency under shift-change load

**Metadata:** Feature H03 — Performance, authorization and privacy verification; Epic H — Testing & Quality Assurance; parent [TMC-031](#tmc-031); `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:contracts. Requirements: FR-2.4, NFR-1. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D4 → W04/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-051). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thiết kế workload 800 giao dịch/30 phút/mỗi nhà máy với burst assumption tách rõ; đo từ nhận đủ QR tới hiển thị, phân biệt API latency và passage time.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thiết kế workload 800 giao dịch/30 phút/mỗi nhà máy với burst assumption tách rõ đo từ nhận đủ QR tới hiển thị, phân biệt API latency và passage time.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [client/src/features/kiosk/Kiosk.tsx](../client/src/features/kiosk/Kiosk.tsx); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-018](#tmc-018), [TMC-019](#tmc-019), [TMC-030](#tmc-030). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-051-AC1: Harness/config dữ liệu và timestamp/UI boundary tái lập, không dùng trung bình để chứng minh peak.
- [ ] TMC-051-AC2: Báo distribution/max/error/timeout/correctness tại tải và so ≤2s; môi trường/giới hạn có nguồn.

<a id="verify-tmc-051"></a>

**Verification plan — V-LOAD**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Baseline và burst do owner chốt; fail khi thiếu UI measurement hoặc mất dữ liệu dù API nhanh.<br>2. Ghi raw timing không chứa token; chưa chạy ghi Not run, không tự đặt percentile SLA. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Harness/config dữ liệu và timestamp/UI boundary tái lập, không dùng trung bình để chứng minh peak.<br>AC2: Báo distribution/max/error/timeout/correctness tại tải và so ≤2s; môi trường/giới hạn có nguồn. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-052"></a>

### [TMC-052] [TEST] [H03] Verify role, object and factory authorization boundaries

**Metadata:** Feature H03 — Performance, authorization and privacy verification; Epic H — Testing & Quality Assurance; parent [TMC-031](#tmc-031); `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: FR-1.5, FR-4.6, FR-5.1, NFR-3. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D4 → W04/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-052). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo ma trận role × operation × factory/team/self cho HTTP thật; sửa localStorage/body/filter không thay quyền server; kiểm tra audit trong transaction.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo ma trận role × operation × factory/team/self cho HTTP thật sửa localStorage/body/filter không thay quyền server kiểm tra audit trong transaction.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [api/src/modules/iam](../api/src/modules/iam); [client/test/rbac.test.mjs](../client/test/rbac.test.mjs). Dependencies: [TMC-007](#tmc-007), [TMC-030](#tmc-030), [TMC-050](#tmc-050). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-052-AC1: EMP/SUP/SEC/EXE/ADM/HR có positive và negative cases, expired/revoked/inactive bị từ chối.
- [ ] TMC-052-AC2: IDOR/cross-factory/body actor spoof bị chặn, audit failure rollback đúng invariant.

<a id="verify-tmc-052"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Dùng fixture hai nhà máy và identity riêng; trả 401/403/404 theo policy công bố.<br>2. Không chỉ test hasAccess ở client; so audit actor/action/result và redaction. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: EMP/SUP/SEC/EXE/ADM/HR có positive và negative cases, expired/revoked/inactive bị từ chối.<br>AC2: IDOR/cross-factory/body actor spoof bị chặn, audit failure rollback đúng invariant. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-053"></a>

### [TMC-053] [TEST] [H03] Verify payload redaction and session data isolation

**Metadata:** Feature H03 — Performance, authorization and privacy verification; Epic H — Testing & Quality Assurance; parent [TMC-031](#tmc-031); `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:frontend. Requirements: FR-1.5, NFR-4. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D5 → W04/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-053). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Kiểm tra JSON/log/cache/QR payload không lộ secrets hoặc dữ liệu ngoài scope; logout/đổi user không giữ dữ liệu identity trước.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Kiểm tra JSON/log/cache/QR payload không lộ secrets hoặc dữ liệu ngoài scope logout/đổi user không giữ dữ liệu identity trước.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam](../api/src/modules/iam); [api/src/modules/cfg/presentation/demo-bootstrap.controller.ts](../api/src/modules/cfg/presentation/demo-bootstrap.controller.ts); [client/src/app/context.tsx](../client/src/app/context.tsx); [client/src/data/api.ts](../client/src/data/api.ts). Dependencies: [TMC-021](#tmc-021), [TMC-030](#tmc-030), [TMC-050](#tmc-050). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-053-AC1: QR/token/session/hash/secret không đi vào log hoặc response không được phép.
- [ ] TMC-053-AC2: Bootstrap/history/report projection và client cache theo identity, EXE chỉ aggregate.

<a id="verify-tmc-053"></a>

**Verification plan — V-API+V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Thu safe response/log mẫu của anonymous/EMP/EXE và so field allowlist.<br>2. Logout rồi đăng nhập tài khoản khác, kiểm tra cache/URL/reload; lưu screenshot đã loại PII. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: QR/token/session/hash/secret không đi vào log hoặc response không được phép.<br>AC2: Bootstrap/history/report projection và client cache theo identity, EXE chỉ aggregate. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-054"></a>

### [TMC-054] [TEST] [A07] Exercise PostgreSQL backup and point-in-time recovery

**Metadata:** Feature A07 — Operations and disaster recovery; Epic A — Project Setup & Foundation; parent Feature A07; `type:test`; P2 — extension; chưa cam kết M2; area:backend, area:database, area:docs. Requirements: FR-5.3, NFR-6. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: catalog OPS §19.11 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D1 → W08/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-054). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Viết và diễn tập backup/restore/PITR trên database test được chỉ định; đo RPO/RTO và backlog reconciliation, không restore DB live từ HTTP.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Viết và diễn tập backup/restore/PITR trên database test được chỉ định đo RPO/RTO và backlog reconciliation, không restore DB live từ HTTP.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/schema-database.md](../doc/schema-database.md); [scripts/db.ps1](../scripts/db.ps1); [api/src/platform/infrastructure/database](../api/src/platform/infrastructure/database). Dependencies: [TMC-004](#tmc-004), [TMC-078](#tmc-078). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-054-AC1: Đối chiếu target đề xuất RPO≤15 phút/RTO≤4 giờ của spec, không biến thành yêu cầu đề gốc.
- [ ] TMC-054-AC2: Restore isolation, key/config/backup ownership và integrity/replay constraints được kiểm tra.

<a id="verify-tmc-054"></a>

**Verification plan — V-RESTORE**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Injected failure trên test instance, ghi backup/WAL/restore timeline và record counts.<br>2. Không có env/quyền thì Blocked; không chạy reset/restore trên DB người dùng. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Đối chiếu target đề xuất RPO≤15 phút/RTO≤4 giờ của spec, không biến thành yêu cầu đề gốc.<br>AC2: Restore isolation, key/config/backup ownership và integrity/replay constraints được kiểm tra. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-055"></a>

### [TMC-055] [FEATURE] [C04] Manage employee profiles with audited updates

**Metadata:** Feature C04 — Employee records and factory grants; Epic C — QR Credential Management; parent Feature C04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-1.1, FR-4.6. UC/UF: UC-03 / UF-04. API: catalog EQR §19.6 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D4 → W05/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-055). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thêm HR employee query/create/update/status use cases và DTO validation; giữ employeeCode/HRS mapping, không làm payroll.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thêm HR employee query/create/update/status use cases và DTO validation giữ employeeCode/HRS mapping, không làm payroll.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [contracts/src/employee.ts](../contracts/src/employee.ts). Dependencies: [TMC-004](#tmc-004), [TMC-007](#tmc-007). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-055-AC1: HR đúng factory được thao tác, duplicate code/conflict không ghi một phần.
- [ ] TMC-055-AC2: Deactivate nhân viên phối hợp credential revocation nguyên tử qua public application API.

<a id="verify-tmc-055"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Create/update/deactivate và cross-factory/duplicate/invalid HRS code; audit cùng transaction.<br>2. EMP/SUP/ADM không tự có quyền HR ghi hồ sơ. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: HR đúng factory được thao tác, duplicate code/conflict không ghi một phần.<br>AC2: Deactivate nhân viên phối hợp credential revocation nguyên tử qua public application API. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-056"></a>

### [TMC-056] [FEATURE] [C04] Manage effective employee assignments and factory grants

**Metadata:** Feature C04 — Employee records and factory grants; Epic C — QR Credential Management; parent Feature C04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-1.6, FR-1.1. UC/UF: UC-03 / UF-04. API: catalog EQR §19.6 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D6 → W06/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-056). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Quản lý lịch sử assignment và quyền vào nhà máy với effective intervals; phân biệt tổ công tác và access grant; không hồi tố đổi dữ liệu công cũ.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Quản lý lịch sử assignment và quyền vào nhà máy với effective intervals phân biệt tổ công tác và access grant không hồi tố đổi dữ liệu công cũ.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/cfg](../api/src/modules/cfg); [contracts/src/employee.ts](../contracts/src/employee.ts). Dependencies: [TMC-055](#tmc-055), [TMC-072](#tmc-072). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-056-AC1: Valid interval/overlap/org hierarchy checks và audit có nguồn, revoked grant bị access policy từ chối.
- [ ] TMC-056-AC2: History query dùng assignment/grant đúng thời điểm, không chỉ current department.

<a id="verify-tmc-056"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Transfer BD→LA, future assignment, revoke và boundary validFrom/validTo.<br>2. Sai team/factory/overlap rollback, không dùng client factoryId làm authority. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Valid interval/overlap/org hierarchy checks và audit có nguồn, revoked grant bị access policy từ chối.<br>AC2: History query dùng assignment/grant đúng thời điểm, không chỉ current department. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-057"></a>

### [TMC-057] [UI] [C04] Connect HR employee and access-grant screens

**Metadata:** Feature C04 — Employee records and factory grants; Epic C — QR Credential Management; parent Feature C04; `type:ui`; P2 — extension; chưa cam kết M2; area:frontend, area:contracts. Requirements: FR-1.1, FR-1.4, FR-1.6. UC/UF: UC-03 / UF-04. API: catalog EQR §19.6 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D6 → W07/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-057). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nối Employees UI tới API scoped profiles/grants/revoke; giữ Astra/MUI/tokens và trạng thái loading/error/conflict.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Nối Employees UI tới API scoped profiles/grants/revoke giữ Astra/MUI/tokens và trạng thái loading/error/conflict.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/employees/Employees.tsx](../client/src/features/employees/Employees.tsx); [client/src/data/api.ts](../client/src/data/api.ts); [contracts/src/employee.ts](../contracts/src/employee.ts). Dependencies: [TMC-008](#tmc-008), [TMC-055](#tmc-055), [TMC-056](#tmc-056). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-057-AC1: Bộ lọc/query/pagination chỉ lấy scope cho phép, ghi server và reload phản ánh dữ liệu thật.
- [ ] TMC-057-AC2: HR revoke/deactivate có lý do/audit; role không được phép không có action và server vẫn từ chối.

<a id="verify-tmc-057"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Thử hai factory, validation/409/403/empty/network failure và reload sau ghi.<br>2. Visual/responsive đối chiếu UI guidelines, không localStorage fallback báo thành công giả. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Bộ lọc/query/pagination chỉ lấy scope cho phép, ghi server và reload phản ánh dữ liệu thật.<br>AC2: HR revoke/deactivate có lý do/audit; role không được phép không có action và server vẫn từ chối. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-058"></a>

### [TMC-058] [FEATURE] [B04] Administer accounts and session revocation APIs

**Metadata:** Feature B04 — IAM administration APIs; Epic B — Authentication & Employee Foundation; parent Feature B04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-5.1, FR-4.6. UC/UF: UC-08 / UF-09. API: catalog IAM §19.5 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D5 → W05/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-058). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thêm ADM user/account queries, lifecycle và revoke sessions; phân quyền riêng, không trả password/session hashes.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thêm ADM user/account queries, lifecycle và revoke sessions phân quyền riêng, không trả password/session hashes.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam](../api/src/modules/iam); [contracts/src/auth.ts](../contracts/src/auth.ts). Dependencies: [TMC-007](#tmc-007), [TMC-087](#tmc-087). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-058-AC1: Unique username/employee binding/status có validation và audit.
- [ ] TMC-058-AC2: Disable/revoke session có hiệu lực server; không cấp implicit HR correction cho ADM.

<a id="verify-tmc-058"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. ADM allowed, EMP/HR denied khi không có permission; self/last-admin policy phải được chốt.<br>2. Replay revoked cookie và invalid accountId không bypass scope. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Unique username/employee binding/status có validation và audit.<br>AC2: Disable/revoke session có hiệu lực server; không cấp implicit HR correction cho ADM. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-059"></a>

### [TMC-059] [FEATURE] [B04] Manage scoped role assignments without privilege escalation

**Metadata:** Feature B04 — IAM administration APIs; Epic B — Authentication & Employee Foundation; parent Feature B04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-5.1, NFR-3. UC/UF: UC-08 / UF-09. API: catalog IAM §19.5 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D1 → W07/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-059). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thêm role/permission/scope assignment use cases; policy cho phép cấp quyền phải được chốt, valid interval và revocation giữ lịch sử.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thêm role/permission/scope assignment use cases policy cho phép cấp quyền phải được chốt, valid interval và revocation giữ lịch sử.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam](../api/src/modules/iam); [api/src/modules/cfg](../api/src/modules/cfg); [contracts/src/auth.ts](../contracts/src/auth.ts). Dependencies: [TMC-058](#tmc-058), [TMC-072](#tmc-072). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-059-AC1: Không nhận arbitrary role/permission body làm quyền actor; scope hierarchy hợp lệ.
- [ ] TMC-059-AC2: Duplicate/global-null uniqueness và concurrent assignment không làm self-escalation.

<a id="verify-tmc-059"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. ADM theo policy, tự nâng quyền/invalid scope/expired role/cross-factory bị từ chối.<br>2. Audit và assignment cập nhật nguyên tử, rollback lỗi. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Không nhận arbitrary role/permission body làm quyền actor; scope hierarchy hợp lệ.<br>AC2: Duplicate/global-null uniqueness và concurrent assignment không làm self-escalation. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-060"></a>

### [TMC-060] [UI] [B03] Build account administration screens

**Metadata:** Feature B03 — IAM administration interface; Epic B — Authentication & Employee Foundation; parent [TMC-043](#tmc-043); `type:ui`; P2 — extension; chưa cam kết M2; area:frontend, area:contracts. Requirements: FR-5.1. UC/UF: UC-08 / UF-09. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D5 → W05/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-060). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nối Settings user list/status/session revoke với API, không viết backend quản trị trong ticket UI.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Nối Settings user list/status/session revoke với API, không viết backend quản trị trong ticket UI.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/settings/Settings.tsx](../client/src/features/settings/Settings.tsx); [client/src/lib/rbac.ts](../client/src/lib/rbac.ts); [contracts/src/auth.ts](../contracts/src/auth.ts). Dependencies: [TMC-008](#tmc-008), [TMC-058](#tmc-058). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-060-AC1: UI list/detail/filter/action hoạt động theo permission, không expose secret.
- [ ] TMC-060-AC2: Loading/empty/403/409/reload và xác nhận thao tác có tác động rõ.

<a id="verify-tmc-060"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. ADM flow và user không đủ quyền qua URL trực tiếp; stale session sau revoke.<br>2. Visual/responsive theo client guidelines. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: UI list/detail/filter/action hoạt động theo permission, không expose secret.<br>AC2: Loading/empty/403/409/reload và xác nhận thao tác có tác động rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-061"></a>

### [TMC-061] [UI] [B03] Build scoped role-assignment administration screens

**Metadata:** Feature B03 — IAM administration interface; Epic B — Authentication & Employee Foundation; parent [TMC-043](#tmc-043); `type:ui`; P2 — extension; chưa cam kết M2; area:frontend, area:contracts. Requirements: FR-5.1. UC/UF: UC-08 / UF-09. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D1 → W07/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-061). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thêm UI chọn role và scope từ dữ liệu server cho phép; hiển thị hiệu lực/thu hồi và lỗi conflict, không hardcode quyền rộng.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thêm UI chọn role và scope từ dữ liệu server cho phép hiển thị hiệu lực/thu hồi và lỗi conflict, không hardcode quyền rộng.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/settings/Settings.tsx](../client/src/features/settings/Settings.tsx); [contracts/src/auth.ts](../contracts/src/auth.ts). Dependencies: [TMC-059](#tmc-059), [TMC-060](#tmc-060). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-061-AC1: Dropdown org hierarchy hợp lệ, assignment/revoke reload đúng, quyền sửa do server quyết định.
- [ ] TMC-061-AC2: Lỗi self-escalation/stale version có thông điệp an toàn; không âm thầm lưu local.

<a id="verify-tmc-061"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. GLOBAL/FACTORY/TEAM và invalid combinations; actor không được cấp quyền tương ứng bị server chặn.<br>2. Keyboard/responsive/error/empty states được kiểm tra. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Dropdown org hierarchy hợp lệ, assignment/revoke reload đúng, quyền sửa do server quyết định.<br>AC2: Lỗi self-escalation/stale version có thông điệp an toàn; không âm thầm lưu local. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-062"></a>

### [TMC-062] [FEATURE] [E03] Pair attendance intervals and classify anomalies

**Metadata:** Feature E03 — Attendance pairing and corrections; Epic E — Attendance Event Recording; parent [TMC-040](#tmc-040); `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-3.4. UC/UF: UC-05 / UF-06. API: catalog ATT §19.8 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W05/D6 → W06/D1; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-062). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo pairing/projection nhiều cặp IN/OUT, overnight và anomaly flags; không lấy first-in/last-out làm toàn bộ hiện diện.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo pairing/projection nhiều cặp IN/OUT, overnight và anomaly flags không lấy first-in/last-out làm toàn bộ hiện diện.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/att](../api/src/modules/att); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-019](#tmc-019), [TMC-020](#tmc-020). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-062-AC1: Nhiều khoảng và boundary ngày/tháng đúng timezone business; thiếu/duplicate direction không tự thành ca đủ.
- [ ] TMC-062-AC2: Kết quả dẫn tới event revisions nguồn, không sửa raw event.

<a id="verify-tmc-062"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. IN08/OUT12/IN13/OUT17 = 8h theo đơn vị/làm tròn công bố; missing OUT phải flagged.<br>2. Overnight/month boundary/revision update rebuild idempotent. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Nhiều khoảng và boundary ngày/tháng đúng timezone business; thiếu/duplicate direction không tự thành ca đủ.<br>AC2: Kết quả dẫn tới event revisions nguồn, không sửa raw event. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-063"></a>

### [TMC-063] [FEATURE] [E03] Apply audited attendance corrections with version checks

**Metadata:** Feature E03 — Attendance pairing and corrections; Epic E — Attendance Event Recording; parent [TMC-040](#tmc-040); `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-3.5, NFR-2, NFR-3. UC/UF: UC-05 / UF-06. API: catalog ATT §19.8 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D1 → W06/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-063). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Hiệu chỉnh bằng revision mới và expectedVersion CAS, reason/evidence/audit cùng transaction; giữ revision 1/snapshot cũ.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Hiệu chỉnh bằng revision mới và expectedVersion CAS, reason/evidence/audit cùng transaction giữ revision 1/snapshot cũ.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/att](../api/src/modules/att); [contracts/src/attendance.ts](../contracts/src/attendance.ts). Dependencies: [TMC-007](#tmc-007), [TMC-062](#tmc-062). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-063-AC1: Hai HR sửa cùng version chỉ một thành công, một conflict; không partial save.
- [ ] TMC-063-AC2: Chỉ HR trong scope được correction; void/revision/source linkage và actor rõ.

<a id="verify-tmc-063"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Concurrent CAS, FK deferred và rollback khi audit lỗi.<br>2. ADM/SUP/EMP/cross-factory không sửa công; original event/snapshot không thay đổi. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hai HR sửa cùng version chỉ một thành công, một conflict; không partial save.<br>AC2: Chỉ HR trong scope được correction; void/revision/source linkage và actor rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-064"></a>

### [TMC-064] [UI] [E03] Connect attendance review and correction workflows

**Metadata:** Feature E03 — Attendance pairing and corrections; Epic E — Attendance Event Recording; parent [TMC-040](#tmc-040); `type:ui`; P2 — extension; chưa cam kết M2; area:backend, area:frontend. Requirements: FR-3.5, FR-1.5, UC-05. UC/UF: UC-05 / UF-06. API: catalog ATT §19.8 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D2 → W06/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-064). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nối màn HR correction/review tới API correction đã có từ TMC-063. EMP chỉ xem lịch sử và trạng thái hiện có; workflow gửi yêu cầu kiểm tra có persistence/API riêng phải được refine trước.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** EMP gửi request kiểm tra sai lệch theo self scope và HR correction UI đây là yêu cầu nghiệp vụ, không phải issue GitHub.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/attendance/Attendance.tsx](../client/src/features/attendance/Attendance.tsx); [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [api/src/modules/att](../api/src/modules/att). Dependencies: [TMC-021](#tmc-021), [TMC-063](#tmc-063). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-064-AC1: HR trong scope nhập reason/evidence/expectedVersion và thấy revision mới sau reload; EMP/SUP/ADM không tự có quyền sửa.
- [ ] TMC-064-AC2: 409 stale editor, 403, lỗi mạng và lịch sử hiệu lực được hiển thị rõ; không sửa event gốc hoặc snapshot.

<a id="verify-tmc-064"></a>

**Verification plan — V-CLIENT+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. HR sửa bản ghi synthetic và đối chiếu revision/pairing backend; stale version nhận 409, cross-factory nhận từ chối.<br>2. EMP chỉ đọc công của mình; ghi gap riêng cho request/check workflow chưa có contract, không hiển thị thành công giả. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: HR trong scope nhập reason/evidence/expectedVersion và thấy revision mới sau reload; EMP/SUP/ADM không tự có quyền sửa.<br>AC2: 409 stale editor, 403, lỗi mạng và lịch sử hiệu lực được hiển thị rõ; không sửa event gốc hoặc snapshot. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-065"></a>

### [TMC-065] [FEATURE] [G02] Create immutable monthly export snapshots

**Metadata:** Feature G02 — Monthly snapshot and HRS delivery; Epic G — Dashboard & Monitoring; parent [TMC-041](#tmc-041); `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-4.3, FR-4.4, INT-01. UC/UF: UC-06 / UF-07. API: catalog RPT §19.9 + EXT-03/04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D2 → W06/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-065). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo ExportBatch/Item/ItemSource snapshot kỳ/version/checksum/count và source revisions; chốt contract HRS mock trước serialize.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo ExportBatch/Item/ItemSource snapshot kỳ/version/checksum/count và source revisions chốt contract HRS mock trước serialize.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/rpt](../api/src/modules/rpt); [contracts/src/reports.ts](../contracts/src/reports.ts); [api/src/modules/att](../api/src/modules/att). Dependencies: [TMC-024](#tmc-024), [TMC-040](#tmc-040). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-065-AC1: Snapshot nhất quán, bất biến dù live attendance sửa, source lineage đầy đủ.
- [ ] TMC-065-AC2: Cùng nội dung dùng batchId/checksum cũ; correction tạo version/supersedes mới.

<a id="verify-tmc-065"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Concurrent month-close/correction, transaction rollback/FK source revisions.<br>2. Kỳ trước/noon/timezone/overnight được định nghĩa, không bao gồm payroll. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Snapshot nhất quán, bất biến dù live attendance sửa, source lineage đầy đủ.<br>AC2: Cùng nội dung dùng batchId/checksum cũ; correction tạo version/supersedes mới. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-066"></a>

### [TMC-066] [FEATURE] [G02] Implement HRS delivery and acknowledgment reconciliation

**Metadata:** Feature G02 — Monthly snapshot and HRS delivery; Epic G — Dashboard & Monitoring; parent [TMC-041](#tmc-041); `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-4.3, FR-4.4, FR-4.5, INT-01. UC/UF: UC-06 / UF-07. API: catalog RPT §19.9 + EXT-03/04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D3 → W06/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-066). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo HrExporter port/adapter và fake HRS submit/status; HTTP accepted khác remoteReady, ACK phải match kỳ/version/checksum/count.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo HrExporter port/adapter và fake HRS submit/status HTTP accepted khác remoteReady, ACK phải match kỳ/version/checksum/count.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/rpt](../api/src/modules/rpt); [api/simulators](../api/simulators); [contracts/src/reports.ts](../contracts/src/reports.ts). Dependencies: [TMC-065](#tmc-065). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-066-AC1: Lost response tra cứu/retry cùng batch payload, không tạo version mới chỉ do timeout.
- [ ] TMC-066-AC2: Partial/mismatch/permanent error không ACCEPTED; mỗi attempt có trạng thái có audit.

<a id="verify-tmc-066"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. ACK hợp lệ, lost ACK, partial/mismatch/status unsupported; ghi giới hạn vendor capability.<br>2. Không gửi dataset thật tới HRS; fake contract không được coi là HRS đã tích hợp thật. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Lost response tra cứu/retry cùng batch payload, không tạo version mới chỉ do timeout.<br>AC2: Partial/mismatch/permanent error không ACCEPTED; mỗi attempt có trạng thái có audit. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-067"></a>

### [TMC-067] [FEATURE] [G02] Schedule durable exports and deadline alerts

**Metadata:** Feature G02 — Monthly snapshot and HRS delivery; Epic G — Dashboard & Monitoring; parent [TMC-041](#tmc-041); `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-4.5, FR-4.3, INT-01. UC/UF: UC-06 / UF-07. API: catalog RPT §19.9 + EXT-03/04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D4 → W06/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-067). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Outbox/jobs + bounded retry/status lookup + alert HR/ADM, lịch theo kỳ/múi giờ và hạn trước 12:00 ngày 1.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Outbox/jobs + bounded retry/status lookup + alert HR/ADM, lịch theo kỳ/múi giờ và hạn trước 12:00 ngày 1.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/rpt](../api/src/modules/rpt); [api/src/modules/cfg](../api/src/modules/cfg); [contracts/src/reports.ts](../contracts/src/reports.ts). Dependencies: [TMC-024](#tmc-024), [TMC-066](#tmc-066). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-067-AC1: Retry policy/backoff/budget có nguồn và không sửa snapshot; manual retry có quyền.
- [ ] TMC-067-AC2: acceptedAt/remoteReadyAt/dueAt riêng, đúng 12:00 không thỏa trước hạn.

<a id="verify-tmc-067"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Fake clock qua tháng, deadline alert, worker lease/race và duplicate scheduler.<br>2. Restart worker không mất jobs hoặc gửi batch content khác. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Retry policy/backoff/budget có nguồn và không sửa snapshot; manual retry có quyền.<br>AC2: acceptedAt/remoteReadyAt/dueAt riêng, đúng 12:00 không thỏa trước hạn. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-068"></a>

### [TMC-068] [TEST] [G02] Verify monthly HRS version and deadline behavior

**Metadata:** Feature G02 — Monthly snapshot and HRS delivery; Epic G — Dashboard & Monitoring; parent [TMC-041](#tmc-041); `type:test`; P2 — extension; chưa cam kết M2; area:backend. Requirements: FR-4.3, FR-4.4, FR-4.5, NFR-2. UC/UF: UC-06 / UF-07. API: catalog RPT §19.9 + EXT-03/04 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D4 → W06/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-068). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Test độc lập snapshot/version/lineage, submit/status/ACK và deadline/retry evidence với fake HRS và DB test.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Test độc lập snapshot/version/lineage, submit/status/ACK và deadline/retry evidence với fake HRS và DB test.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [api/simulators](../api/simulators); [api/src/modules/rpt](../api/src/modules/rpt). Dependencies: [TMC-065](#tmc-065), [TMC-066](#tmc-066), [TMC-067](#tmc-067). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-068-AC1: Replay cùng batch idempotent, correction tạo phiên bản mới, partial ACK bị chặn.
- [ ] TMC-068-AC2: Kịch bản failure và mốc trước noon có kết quả thực, không suy SLA hằng tháng từ một demo.

<a id="verify-tmc-068"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Lost ACK sau commit, restart, two exporters, month/year/overnight boundary.<br>2. So input/output checksum/count/source revisions và delivery attempts. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Replay cùng batch idempotent, correction tạo phiên bản mới, partial ACK bị chặn.<br>AC2: Kịch bản failure và mốc trước noon có kết quả thực, không suy SLA hằng tháng từ một demo. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-069"></a>

### [TMC-069] [SPIKE] [F03] Decide the offline edge authorization threat model

**Metadata:** Feature F03 — Optional autonomous offline edge; Epic F — Failure Handling & Recovery; parent [TMC-042](#tmc-042); `type:spike`; P2 — extension; chưa cam kết M2; area:docs. Requirements: M2-NETWORK, M2-QR. UC/UF: UC-04 / UF-03. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-08, Unscheduled; sau go/no-go; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-069). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Timebox nghiên cứu freshness/revocation/replay khi partition, key provisioning/clock và safety boundary; owner chọn có prototype autonomous OPEN hay không.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Timebox nghiên cứu freshness/revocation/replay khi partition, key provisioning/clock và safety boundary owner chọn có prototype autonomous OPEN hay không.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/tech-stack.md](../doc/tech-stack.md); [doc/user-flow.md](../doc/user-flow.md); [doc/structure-architecture.md](../doc/structure-architecture.md). Dependencies: [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Spike details:** timebox 4h, câu hỏi/decision trong scope và AC. Bàn giao ADR/prototype có giới hạn, go/no-go và unresolved questions; không coi kết quả nghiên cứu là feature production.

**Acceptance criteria**

- [ ] TMC-069-AC1: ADR nêu stale permissions/cross-edge replay và điều kiện deny/allow, không hứa one-time toàn hệ thống khi WAN partition.
- [ ] TMC-069-AC2: Có go/no-go và budget/env cho prototype; R1 trung tâm vẫn baseline.

<a id="verify-tmc-069"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Review threat/failure matrix hai edge và offline revoke/clock drift.<br>2. Không bật offline OPEN thật từ spike hoặc viết lại safety controller. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | AC1: ADR nêu stale permissions/cross-edge replay và điều kiện deny/allow, không hứa one-time toàn hệ thống khi WAN partition.<br>AC2: Có go/no-go và budget/env cho prototype; R1 trung tâm vẫn baseline. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-070"></a>

### [TMC-070] [FEATURE] [F03] Prototype durable offline journals and synchronization

**Metadata:** Feature F03 — Optional autonomous offline edge; Epic F — Failure Handling & Recovery; parent [TMC-042](#tmc-042); `type:feature`; P2 — extension; chưa cam kết M2; area:docs. Requirements: M2-NETWORK. UC/UF: UC-04 / UF-03. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-08, Unscheduled; sau go/no-go; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-070). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Chỉ sau go decision, prototype local persistence/outbox/sync với conflict policy và identity/version rõ; không thay production gate behavior.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Chỉ sau go decision, prototype local persistence/outbox/sync với conflict policy và identity/version rõ không thay production gate behavior.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/simulators](../api/simulators); [doc/structure-architecture.md](../doc/structure-architecture.md). Dependencies: [TMC-069](#tmc-069). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-070-AC1: Crash/restart journal bền vững và reconnect idempotent trong ranh giới prototype.
- [ ] TMC-070-AC2: Offline outcomes và stale authorization được hiển thị đúng, không merge công không evidence.

<a id="verify-tmc-070"></a>

**Verification plan — V-EDGE**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Partition hai edge, duplicate sync, local storage full/corrupt và clock drift.<br>2. Đo count/checksum/lineage trước sau sync; no-go thì không code và ghi decision. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Crash/restart journal bền vững và reconnect idempotent trong ranh giới prototype.<br>AC2: Offline outcomes và stale authorization được hiển thị đúng, không merge công không evidence. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-071"></a>

### [TMC-071] [TEST] [F03] Verify edge partition and replay limitations

**Metadata:** Feature F03 — Optional autonomous offline edge; Epic F — Failure Handling & Recovery; parent [TMC-042](#tmc-042); `type:test`; P2 — extension; chưa cam kết M2; area:docs. Requirements: M2-NETWORK, M2-QR, NFR-2. UC/UF: UC-04 / UF-03. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-08, Unscheduled; sau go/no-go; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-071). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Tạo failure matrix/evidence cho prototype edge, bao gồm giới hạn chống replay/revoke và reconciliation khi reconnect.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Tạo failure matrix/evidence cho prototype edge, bao gồm giới hạn chống replay/revoke và reconciliation khi reconnect.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/simulators](../api/simulators); [api/test](../api/test); [doc/structure-architecture.md](../doc/structure-architecture.md). Dependencies: [TMC-070](#tmc-070). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-071-AC1: Kết luận chỉ trong môi trường/assumptions đã thử, không gọi là production hoặc SLA.
- [ ] TMC-071-AC2: Case cùng QR hai edge và revoke khi WAN down có outcome/policy/evidence rõ.

<a id="verify-tmc-071"></a>

**Verification plan — V-EDGE**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Fault injection clock/restart/duplicate journal/sync order.<br>2. Không làm hỏng ledger trung tâm, conflict có owner/next action. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Kết luận chỉ trong môi trường/assumptions đã thử, không gọi là production hoặc SLA.<br>AC2: Case cùng QR hai edge và revoke khi WAN down có outcome/policy/evidence rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-072"></a>

### [TMC-072] [FEATURE] [D04] Administer effective factory organization data

**Metadata:** Feature D04 — Organization and station administration; Epic D — Gate Kiosk & Access Control; parent Feature D04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-5.2, FR-1.1. UC/UF: UC-08 / UF-09. API: catalog CFG §19.10 và GATE §19.7 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W06/D5 → W06/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-072). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** CFG API factory/department/team với hierarchy/scopes và effective lifecycle theo schema; không xóa entity có history.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** CFG API factory/department/team với hierarchy/scopes và effective lifecycle theo schema không xóa entity có history.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/cfg](../api/src/modules/cfg); [contracts/src/common.ts](../contracts/src/common.ts); [contracts/src/employee.ts](../contracts/src/employee.ts). Dependencies: [TMC-004](#tmc-004), [TMC-007](#tmc-007). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-072-AC1: Hierarchy/uniqueness/status validation và audit, role/scope đúng.
- [ ] TMC-072-AC2: Lookup dùng trong HR/admin cấp scope, không để client chọn org trái quyền.

<a id="verify-tmc-072"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Invalid parent/cross-factory/duplicate code/history reference; rollback audit failure.<br>2. Factory BD/LA và team fixture được query đúng scope. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hierarchy/uniqueness/status validation và audit, role/scope đúng.<br>AC2: Lookup dùng trong HR/admin cấp scope, không để client chọn org trái quyền. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-073"></a>

### [TMC-073] [FEATURE] [D04] Provision and retire authenticated gate stations

**Metadata:** Feature D04 — Organization and station administration; Epic D — Gate Kiosk & Access Control; parent Feature D04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-2.1, FR-2.7, NFR-3. UC/UF: UC-08 / UF-09. API: catalog CFG §19.10 và GATE §19.7 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D2 → W07/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-073). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** ADM cấu hình station/factory/direction/turnstile và provision/rotate/revoke credential server-side; retire thay delete lịch sử.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** ADM cấu hình station/factory/direction/turnstile và provision/rotate/revoke credential server-side retire thay delete lịch sử.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/cfg](../api/src/modules/cfg); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-012](#tmc-012), [TMC-072](#tmc-072). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-073-AC1: Credential hash/reference không về public bundle, station identity lấy từ credential chứ body.
- [ ] TMC-073-AC2: Retire/revoke từ chối request mới nhưng giữ attempt/command history; không tự xác nhận physical state.

<a id="verify-tmc-073"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Rotation/revocation/auth mismatch/direction spoof và wrong factory.<br>2. Existing references/history được giữ khi retire; audit policy đúng. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Credential hash/reference không về public bundle, station identity lấy từ credential chứ body.<br>AC2: Retire/revoke từ chối request mới nhưng giữ attempt/command history; không tự xác nhận physical state. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-074"></a>

### [TMC-074] [UI] [D04] Connect station and organization administration screens

**Metadata:** Feature D04 — Organization and station administration; Epic D — Gate Kiosk & Access Control; parent Feature D04; `type:ui`; P2 — extension; chưa cam kết M2; area:frontend, area:contracts. Requirements: FR-2.1, FR-5.2. UC/UF: UC-08 / UF-09. API: catalog CFG §19.10 và GATE §19.7 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D3 → W07/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-074). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nối Settings/Access cấu hình trạm/organization tới API, tránh show long-lived credential; controls quyền tách SEC và ADM.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Nối Settings/Access cấu hình trạm/organization tới API, tránh show long-lived credential controls quyền tách SEC và ADM.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/settings/Settings.tsx](../client/src/features/settings/Settings.tsx); [client/src/features/access-control/Access.tsx](../client/src/features/access-control/Access.tsx); [contracts/src/gate.ts](../contracts/src/gate.ts). Dependencies: [TMC-008](#tmc-008), [TMC-072](#tmc-072), [TMC-073](#tmc-073). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-074-AC1: ADM thao tác đúng scope, SEC không tự cấu hình/rotate key.
- [ ] TMC-074-AC2: UI validation/conflict/loading/offline/retired states bám server, không ghi local giả.

<a id="verify-tmc-074"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Direct URL và action denied; reload sau cấu hình, invalid hierarchy/turnstile.<br>2. Responsive/table/keyboard theo tokens và Guidelines. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: ADM thao tác đúng scope, SEC không tự cấu hình/rotate key.<br>AC2: UI validation/conflict/loading/offline/retired states bám server, không ghi local giả. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-075"></a>

### [TMC-075] [FEATURE] [G03] Query monthly reports with role-specific projections

**Metadata:** Feature G03 — Scoped reports and CSV; Epic G — Dashboard & Monitoring; parent Feature G03; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-4.1, FR-4.2, NFR-3, NFR-4. UC/UF: UC-07 / UF-08. API: catalog RPT §19.9 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D3 → W07/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-075). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** RPT query tháng/person/org/factory và GATE nhật ký có pagination/projection; SUP team và EXE aggregate theo spec.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** RPT query tháng/person/org/factory và GATE nhật ký có pagination/projection SUP team và EXE aggregate theo spec.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/rpt](../api/src/modules/rpt); [api/src/modules/gate](../api/src/modules/gate); [contracts/src/reports.ts](../contracts/src/reports.ts). Dependencies: [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-062](#tmc-062). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-075-AC1: Scope lấy từ actor; EXE không drill-down cá nhân, SEC không hồ sơ HR.
- [ ] TMC-075-AC2: Report dùng effective revisions/intervals, anomalies và timezone/period rõ.

<a id="verify-tmc-075"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Cross-factory/team/body filter spoof, empty and month boundary.<br>2. So aggregate vs fixture, nhật ký giữ DENIED/UNKNOWN và không lộ token. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Scope lấy từ actor; EXE không drill-down cá nhân, SEC không hồ sơ HR.<br>AC2: Report dùng effective revisions/intervals, anomalies và timezone/period rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-076"></a>

### [TMC-076] [UI] [G03] Connect scoped monthly reports and anomaly views

**Metadata:** Feature G03 — Scoped reports and CSV; Epic G — Dashboard & Monitoring; parent Feature G03; `type:ui`; P2 — extension; chưa cam kết M2; area:frontend. Requirements: FR-4.1, FR-4.2. UC/UF: UC-07 / UF-08. API: catalog RPT §19.9 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D4 → W07/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-076). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nối Reports/ExecutiveOverview/Attendance tới query/projection thật, bộ lọc quyền theo responsecontract.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Nối Reports/ExecutiveOverview/Attendance tới query/projection thật, bộ lọc quyền theo responsecontract.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/reports/Reports.tsx](../client/src/features/reports/Reports.tsx); [client/src/features/reports/ExecutiveOverview.tsx](../client/src/features/reports/ExecutiveOverview.tsx); [client/src/features/attendance/Attendance.tsx](../client/src/features/attendance/Attendance.tsx). Dependencies: [TMC-008](#tmc-008), [TMC-075](#tmc-075). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-076-AC1: Không đổi filter để thấy data ngoài scope, EXE chỉ summary, SUP đúng team.
- [ ] TMC-076-AC2: Loading/error/empty/pagination/data freshness và anomaly semantics rõ.

<a id="verify-tmc-076"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Đối chiếu từng role với fixture, directURL, cache đổi identity và month rollover.<br>2. Visual/responsive đồng nhất design system hiện có. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Không đổi filter để thấy data ngoài scope, EXE chỉ summary, SUP đúng team.<br>AC2: Loading/error/empty/pagination/data freshness và anomaly semantics rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-077"></a>

### [TMC-077] [ENHANCEMENT] [G03] Export scoped CSV reports with download auditing

**Metadata:** Feature G03 — Scoped reports and CSV; Epic G — Dashboard & Monitoring; parent Feature G03; `type:enhancement`; P1 — có thể scope-cut khi capacity thiếu; area:backend, area:frontend. Requirements: FR-4.7, FR-4.6, NFR-4. UC/UF: UC-07 / UF-08. API: catalog RPT §19.9 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D5 → W07/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-077). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Nâng CSV prototype thành export dữ liệu server-scoped, audit actor/kỳ/filter và hạn chế lưu snapshot/PII ngoài quyền.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Nâng CSV prototype thành export dữ liệu server-scoped, audit actor/kỳ/filter và hạn chế lưu snapshot/PII ngoài quyền.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/lib/csv.ts](../client/src/lib/csv.ts); [client/src/features/reports/Reports.tsx](../client/src/features/reports/Reports.tsx); [api/src/modules/rpt](../api/src/modules/rpt). Dependencies: [TMC-075](#tmc-075), [TMC-076](#tmc-076). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-077-AC1: CSV chỉ có trường/record theo permission/projection, download được audit.
- [ ] TMC-077-AC2: CSV injection/encoding/timezone/large dataset và error behavior được xử lý theo contract.

<a id="verify-tmc-077"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. EMP/SUP/SEC/EXE queries/export negative scope, giá trị bắt đầu formula được kiểm tra.<br>2. So CSV với report fixture và audit, không bỏ qua filters/permissions ở backend. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: CSV chỉ có trường/record theo permission/projection, download được audit.<br>AC2: CSV injection/encoding/timezone/large dataset và error behavior được xử lý theo contract. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-078"></a>

### [TMC-078] [DOCS] [J01] Decide privacy notice, retention and evidence-hold policies

**Metadata:** Feature J01 — Privacy policy and retention workflow; Epic J — Privacy & Retention (proposed extension); parent Feature J01; `type:docs`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:docs. Requirements: FR-1.5, FR-5.4, NFR-4. UC/UF: UC-02, UC-08 / UF-01, UF-09. API: catalog PRV §19.12 ([catalog](work-flow.md#s19)).

**Planning/status:** M-00, W01/D3 → W01/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-078). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Owner chốt mục đích/dữ liệu/người nhận/contact, retention từng nhóm, evidence hold và xử lý backup/HRS; không tự đặt thời hạn hay kết luận legal compliance. Tách quyết định notice tối thiểu cho portal M2 khỏi policy retention/hold của extension; phần chưa được owner duyệt vẫn là open question.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Lập decision register mục đích/dữ liệu/người nhận/contact với owner và version; chốt notice tối thiểu cho portal. Lập mapping storage/retention/hold/copies và đánh dấu từng policy đã duyệt hoặc pending; chưa có quyết định thì extension phụ thuộc chưa Ready.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [doc/domain-know-how.md](../doc/domain-know-how.md); [doc/schema-database.md](../doc/schema-database.md); [doc/user-flow.md](../doc/user-flow.md). Dependencies: [TMC-001](#tmc-001). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Docs details:** người đọc là owner/reviewer/executor kế tiếp; bàn giao tài liệu/decision links trong phạm vi Inputs, kiểm tra nguồn, Markdown/anchors và consistency. Các policy/capacity/review decisions cần owner xác nhận bằng evidence, không tick tự động.

**Acceptance criteria**

- [ ] TMC-078-AC1: Decision register/policy version có owner và unresolved items; privacy notice theo policy đã duyệt.
- [ ] TMC-078-AC2: Mapping data categories/storage/retention/hold/erasure có nguồn, còn thiếu thì ticket phụ thuộc chưa Ready.

<a id="verify-tmc-078"></a>

**Verification plan — V-DOC**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1 | Review bản notice và decision register với owner: kiểm từng purpose/data/recipient/contact, version, decision owner và unresolved items. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | Decision register/policy version có owner và unresolved items; privacy notice theo policy đã duyệt. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |
| AC2 | Đối chiếu từng data category/storage/copy với retention/hold/erasure decision; policy pending có blocker/owner và không cho extension phụ thuộc Ready. | Input documents/source + owner; document/configuration review, runtime từ Inputs nếu AC yêu cầu | Mapping data categories/storage/retention/hold/erasure có nguồn, còn thiếu thì ticket phụ thuộc chưa Ready. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-079"></a>

### [TMC-079] [FEATURE] [J01] Implement authorized privacy request lifecycle APIs

**Metadata:** Feature J01 — Privacy policy and retention workflow; Epic J — Privacy & Retention (proposed extension); parent Feature J01; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-1.5, FR-5.4, NFR-4. UC/UF: UC-02, UC-08 / UF-01, UF-09. API: catalog PRV §19.12 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D2 → W08/D3; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-079). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Workflow nhận/duyệt/theo dõi privacy request theo policy, permission và minimal projection; không dùng issue GitHub chứa PII.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Workflow nhận/duyệt/theo dõi privacy request theo policy, permission và minimal projection không dùng issue GitHub chứa PII.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/iam](../api/src/modules/iam); `contracts/src (privacy types proposed)` (proposed; chưa có). Dependencies: [TMC-007](#tmc-007), [TMC-078](#tmc-078), [TMC-080](#tmc-080). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-079-AC1: EMP self và authorized processors đúng scope, trạng thái/decision/audit có lý do.
- [ ] TMC-079-AC2: Request chưa duyệt không tự xóa; duplicate/invalid transition và disclosure được chặn.

<a id="verify-tmc-079"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Self/other employee IDOR, policyversion/hold state, audit rollback.<br>2. Thông báo/log không chứa raw personal dataset. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: EMP self và authorized processors đúng scope, trạng thái/decision/audit có lý do.<br>AC2: Request chưa duyệt không tự xóa; duplicate/invalid transition và disclosure được chặn. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-080"></a>

### [TMC-080] [BUILD] [J01] Add privacy workflow and retention-hold persistence

**Metadata:** Feature J01 — Privacy policy and retention workflow; Epic J — Privacy & Retention (proposed extension); parent Feature J01; `type:build`; P2 — extension; chưa cam kết M2; area:backend, area:database. Requirements: FR-5.4, NFR-4. UC/UF: UC-02, UC-08 / UF-01, UF-09. API: catalog PRV §19.12 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D2 → W08/D2; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-080). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Chốt entity ownership và thêm schema/migration/registry cho request/hold/execution khi schema hiện có chưa đủ; contracts thuần, không synchronize.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Chốt entity ownership và thêm schema/migration/registry cho request/hold/execution khi schema hiện có chưa đủ contracts thuần, không synchronize.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr/infrastructure/persistence/entities](../api/src/modules/eqr/infrastructure/persistence/entities); [api/src/platform/infrastructure/database/entities.ts](../api/src/platform/infrastructure/database/entities.ts); [api/src/platform/infrastructure/database/migrations](../api/src/platform/infrastructure/database/migrations). Dependencies: [TMC-004](#tmc-004), [TMC-078](#tmc-078). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Build/CI details:** target là workspace/package/DB test trong Inputs; dùng Node/pnpm version hiện có, root lockfile và scripts thật. Ghi compatibility/migration impact và check names có chạy thực, giữ secrets ngoài repo; không báo suite pass chỉ từ YAML.

**Acceptance criteria**

- [ ] TMC-080-AC1: Một ORM entity/file thuộc context, FK/state/policyversion constraints và migration/backfill plan rõ.
- [ ] TMC-080-AC2: Hold/reference/audit không bị cascade xóa do worker, schema phù hợp truy xuất/execute.

<a id="verify-tmc-080"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Apply/rollback trên DB test, duplicate transitions/hold references và migration metadata.<br>2. Registry thuần import+array, không đưa entity vào domain/HTTP DTO. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Một ORM entity/file thuộc context, FK/state/policyversion constraints và migration/backfill plan rõ.<br>AC2: Hold/reference/audit không bị cascade xóa do worker, schema phù hợp truy xuất/execute. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-081"></a>

### [TMC-081] [FEATURE] [J01] Execute policy-based retention without erasing held evidence

**Metadata:** Feature J01 — Privacy policy and retention workflow; Epic J — Privacy & Retention (proposed extension); parent Feature J01; `type:feature`; P2 — extension; chưa cam kết M2; area:backend. Requirements: FR-5.4, NFR-4. UC/UF: UC-02, UC-08 / UF-01, UF-09. API: catalog PRV §19.12 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D3 → W08/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-081). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Worker được quyền áp retention/anonymization theo policy/hold và kiểm tra copies/backups/HRS; batch idempotent có audit/decision evidence.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Worker được quyền áp retention/anonymization theo policy/hold và kiểm tra copies/backups/HRS batch idempotent có audit/decision evidence.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/rpt](../api/src/modules/rpt); [api/src/modules/iam](../api/src/modules/iam). Dependencies: [TMC-024](#tmc-024), [TMC-079](#tmc-079), [TMC-080](#tmc-080). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-081-AC1: Hold hoặc unresolved external copies chặn execution khi policy yêu cầu, không xóa mù ledger/audit.
- [ ] TMC-081-AC2: Retry/crash/fencing giữ idempotency và trạng thái đã xử lý/partial rõ.

<a id="verify-tmc-081"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Dry-run thực nếu implementation hỗ trợ, test holds/backup lifecycle/worker crash.<br>2. Không chạy trên dữ liệu live trong test; rollback/failure không mất evidence. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Hold hoặc unresolved external copies chặn execution khi policy yêu cầu, không xóa mù ledger/audit.<br>AC2: Retry/crash/fencing giữ idempotency và trạng thái đã xử lý/partial rõ. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-082"></a>

### [TMC-082] [TEST] [J01] Verify privacy requests, retention and evidence holds

**Metadata:** Feature J01 — Privacy policy and retention workflow; Epic J — Privacy & Retention (proposed extension); parent Feature J01; `type:test`; P2 — extension; chưa cam kết M2; area:backend, area:docs. Requirements: FR-5.4, FR-1.5, NFR-4. UC/UF: UC-02, UC-08 / UF-01, UF-09. API: catalog PRV §19.12 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D4 → W08/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-082). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Test matrix privacy request/access/projection/hold/retention và backup restoration không làm sống lại dữ liệu trái policy.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Test matrix privacy request/access/projection/hold/retention và backup restoration không làm sống lại dữ liệu trái policy.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [doc/schema-database.md](../doc/schema-database.md); [api/src/modules/eqr](../api/src/modules/eqr). Dependencies: [TMC-054](#tmc-054), [TMC-079](#tmc-079), [TMC-081](#tmc-081). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-082-AC1: Các allowed/denied/hold/retry/copy cases có evidence trong môi trường synthetic.
- [ ] TMC-082-AC2: Báo giới hạn với HRS/backup external, không tuyên bố compliance chỉ từ test pass.

<a id="verify-tmc-082"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Clock policy boundary, held evidence, restored backup reapply policy, concurrent worker.<br>2. Audit actor/reason/version và dữ liệu projection không tiết lộ ngoài scope. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Các allowed/denied/hold/retry/copy cases có evidence trong môi trường synthetic.<br>AC2: Báo giới hạn với HRS/backup external, không tuyên bố compliance chỉ từ test pass. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-083"></a>

### [TMC-083] [FEATURE] [D04] Version integration settings and secret references

**Metadata:** Feature D04 — Organization and station administration; Epic D — Gate Kiosk & Access Control; parent Feature D04; `type:feature`; P2 — extension; chưa cam kết M2; area:backend, area:contracts. Requirements: FR-5.2, NFR-3. UC/UF: UC-08 / UF-09. API: catalog CFG §19.10 và GATE §19.7 ([catalog](work-flow.md#s19)).

**Planning/status:** M-06, W07/D6 → W07/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-083). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** CFG versions/connectors giữ config snapshot cho command/batch; credential chỉ reference, key rotation không làm pending work đổi đích âm thầm.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** CFG versions/connectors giữ config snapshot cho command/batch credential chỉ reference, key rotation không làm pending work đổi đích âm thầm.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/cfg](../api/src/modules/cfg); [api/src/modules/eqr](../api/src/modules/eqr); [api/src/modules/rpt](../api/src/modules/rpt); [contracts/src](../contracts/src). Dependencies: [TMC-009](#tmc-009), [TMC-072](#tmc-072). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Type-specific outcome:** actor/trigger và kết quả nghiệp vụ nằm trong problem/AC; có đường chính, denied/conflict/failure khi áp dụng. TCS/HRS dùng mock/port theo capability đã chốt.

**Acceptance criteria**

- [ ] TMC-083-AC1: ADM được phép đổi settings có version/audit; active/pending work theo policy snapshot đã chọn.
- [ ] TMC-083-AC2: API/log không trả secret, invalid version/connection validation không ghi một phần.

<a id="verify-tmc-083"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Đổi endpoint/key khi command/batch pending, concurrent config version update.<br>2. Read metadata positive/negative scope, secret/redaction response allowlist. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: ADM được phép đổi settings có version/audit; active/pending work theo policy snapshot đã chọn.<br>AC2: API/log không trả secret, invalid version/connection validation không ghi một phần. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-084"></a>

### [TMC-084] [ENHANCEMENT] [A07] Expose scoped service readiness and integration alerts

**Metadata:** Feature A07 — Operations and disaster recovery; Epic A — Project Setup & Foundation; parent Feature A07; `type:enhancement`; P2 — extension; chưa cam kết M2; area:backend. Requirements: FR-5.3, NFR-3. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: catalog OPS §19.11 ([catalog](work-flow.md#s19)).

**Planning/status:** M-07, W08/D5 → W08/D5; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-084). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Thêm ops health/readiness và alerts owner routing cho DB/job/integration failures; station heartbeat khác device physical health.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Thêm ops health/readiness và alerts owner routing cho DB/job/integration failures station heartbeat khác device physical health.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/cfg](../api/src/modules/cfg); [api/src/modules/gate](../api/src/modules/gate); [api/src/modules/rpt](../api/src/modules/rpt). Dependencies: [TMC-007](#tmc-007), [TMC-024](#tmc-024), [TMC-039](#tmc-039). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Enhancement details:** before — Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này. After — outcome/AC dưới đây, giữ các contracts/hành vi không thuộc scope. Lợi ích là dữ liệu/quyền/trạng thái phản ánh server và trace được; không đặt số cải thiện hiệu năng khi chưa có metric nguồn.

**Acceptance criteria**

- [ ] TMC-084-AC1: Health payload public/protected tách minimal data; backlog age/errors có timestamp và scope.
- [ ] TMC-084-AC2: Alerts có recipient/ack/escalation decision, không include raw tokens/data hoặc reset DB HTTP.

<a id="verify-tmc-084"></a>

**Verification plan — V-API+V-DB**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. DB unavailable, queue stalled, upstream timeout và unauthorized metrics requests.<br>2. So metrics với fixture jobs/cases, không giả active station là cổng hoạt động. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Health payload public/protected tách minimal data; backlog age/errors có timestamp và scope.<br>AC2: Alerts có recipient/ack/escalation decision, không include raw tokens/data hoặc reset DB HTTP. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-085"></a>

### [TMC-085] [TEST] [H01] Verify module boundaries and replaceable integration ports

**Metadata:** Feature H01 — Core and architecture verification; Epic H — Testing & Quality Assurance; parent Feature H01; `type:test`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:backend, area:contracts. Requirements: NFR-5, M2-SOLID. UC/UF: Hỗ trợ toàn dự án / quy trình thực thi. API: Không có endpoint mới theo mặc định ([catalog](work-flow.md#s19)).

**Planning/status:** M-04, W04/D5 → W04/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-085). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** Kiểm tra imports và contract tests cho domain/application/ORM/HTTP boundaries, TurnstileGateway và future HrExporter; không tạo test chỉ match tên file.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** Kiểm tra imports và contract tests cho domain/application/ORM/HTTP boundaries, TurnstileGateway và future HrExporter không tạo test chỉ match tên file.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/test](../api/test); [api/src/platform/application](../api/src/platform/application); [api/src/modules](../api/src/modules); [contracts/src](../contracts/src). Dependencies: [TMC-013](#tmc-013), [TMC-029](#tmc-029), [TMC-087](#tmc-087). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Test details:** AC/requirements được bảo vệ nằm trong metadata; level và expected outcomes ở bảng verification. Dùng fixtures synthetic và runner thật hoặc bổ sung harness có owner. Báo Not run nếu chưa có môi trường; không tạo assertion chỉ lặp lại implementation.

**Acceptance criteria**

- [ ] TMC-085-AC1: Test phát hiện forbidden dependency thật và adapter thay thế vẫn thỏa hành vi port.
- [ ] TMC-085-AC2: DTO/wire contracts thuần, entities thuộc context và registry không chứa business definition.

<a id="verify-tmc-085"></a>

**Verification plan — V-API**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Inject fake gateway/usecase stores và seed known-invalid import fixture nếu cần.<br>2. So SOLID evidence với assertions hành vi, không tuyên bố tên interface là bằng chứng SOLID. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Test phát hiện forbidden dependency thật và adapter thay thế vẫn thỏa hành vi port.<br>AC2: DTO/wire contracts thuần, entities thuộc context và registry không chứa business definition. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-086"></a>

### [TMC-086] [UI] [C03] Show privacy purpose and scoped personal-profile states

**Metadata:** Feature C03 — Employee QR and personal portal; Epic C — QR Credential Management; parent Feature C03; `type:ui`; P0 — chặn outcome/kiểm chứng lát cắt được chọn; area:frontend, area:docs. Requirements: FR-1.5, NFR-4. UC/UF: UC-02 / UF-01. API: API-EQR-14; API-ATT-01…04 khi dùng công cá nhân ([catalog](work-flow.md#s19)).

**Planning/status:** M-03, W03/D5 → W03/D6; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-086). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** EMP portal hiển thị purpose/data/recipient/contact từ notice baseline được owner chốt; hồ sơ/công self-only, không dùng danh sách account demo công khai.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này.

**Scope/deliverables:** EMP portal hiển thị purpose/data/recipient/contact từ notice baseline được owner chốt hồ sơ/công self-only, không dùng danh sách account demo công khai.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [client/src/features/employee-mobile/Mobile.tsx](../client/src/features/employee-mobile/Mobile.tsx); [client/src/app/context.tsx](../client/src/app/context.tsx); [doc/user-flow.md](../doc/user-flow.md). Dependencies: [TMC-001](#tmc-001), [TMC-008](#tmc-008), [TMC-020](#tmc-020), [TMC-078](#tmc-078). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**UI details:** screen/component là các client paths ở Inputs; tái sử dụng design/tokens hiện có, đọc client guidelines khi triển khai. Kiểm tra responsive mobile/desktop, bàn phím/focus/labels và loading/empty/error/403/409 nếu flow áp dụng. Reference là UI hiện có; chưa có Figma design mới được giao. Visual check/manual browser là planned, không suy từ Node test.

**Acceptance criteria**

- [ ] TMC-086-AC1: Notice không bịa retention/legal claim; policy còn thiếu được công bố/chốt trước acceptance.
- [ ] TMC-086-AC2: Self profile/history và logout/cache/error states đúng API, user không chọn employeeId khác để xem.

<a id="verify-tmc-086"></a>

**Verification plan — V-CLIENT**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. EMP self vs forged employeeId, identity switch, empty state và notice content review.<br>2. Responsive/keyboard/contrast theo guidelines hiện có, không expose QR/token trong logs. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Notice không bịa retention/legal claim; policy còn thiếu được công bố/chốt trước acceptance.<br>AC2: Self profile/history và logout/cache/error states đúng API, user không chọn employeeId khác để xem. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="tmc-087"></a>

### [TMC-087] [REFACTOR] [B01] Isolate session use cases from persistence and HTTP adapters

**Metadata:** Feature B01 — Identity, scoped sessions and seed; Epic B — Authentication & Employee Foundation; parent Feature B01; `type:refactor`; P1 — có thể scope-cut khi capacity thiếu; area:backend. Requirements: NFR-5, M2-SOLID. UC/UF: UC-08 / UF-00, UF-09. API: API-IAM-01…03; quyền server cho các API nghiệp vụ ([catalog](work-flow.md#s19)).

**Planning/status:** M-01, W02/D3 → W02/D4; estimate/owner/assignee/remaining tại §6.2; Status **Backlog** (local plan), actual evidence **Not run**. Issue/PR: [mapping](#remote-tmc-087). Source: [Quy tắc tạo backlog](../plans/make-doc-skill-plan.md#backlog-document-contract) và nguồn requirement/source nêu trong phiếu.

**Problem → expected outcome:** AuthService hiện ở application nhưng import Nest exceptions, TypeORM và ORM entities; tách ports/mapping/wiring tối thiểu theo architecture đã chọn, giữ auth behavior.

**Hiện trạng:** Đầu ra dự kiến; chưa triển khai hoặc nghiệm thu trong lần này. Proposed để đáp ứng kiến trúc/SOLID đã chọn; owner xác nhận mức refactor tại TMC-001 trước khi nhận việc.

**Scope/deliverables:** AuthService hiện ở application nhưng import Nest exceptions, TypeORM và ORM entities tách ports/mapping/wiring tối thiểu theo architecture đã chọn, giữ auth behavior.

**Out of scope:** ngoài giới hạn chung §7.1; không kéo toàn bộ capability cùng Feature vào phiếu. Chỉ sửa gap được AC xác nhận nếu source đã có.

**Inputs/files:** [api/src/modules/iam/application/auth.service.ts](../api/src/modules/iam/application/auth.service.ts); [api/src/modules/iam/presentation/auth.controller.ts](../api/src/modules/iam/presentation/auth.controller.ts); [api/src/bootstrap/modules/iam.module.ts](../api/src/bootstrap/modules/iam.module.ts); [api/test/auth.service.test.mjs](../api/test/auth.service.test.mjs). Dependencies: [TMC-007](#tmc-007). Trước Ready, xác nhận các dependency có evidence Done hoặc quyết định re-scope hợp lệ; input/env/quyền còn thiếu thì giữ Backlog hoặc Blocked khi thực sự đang làm bị chặn.

**Refactor details:** giữ login/me/logout response/cookie/authorization behavior; tách dependencies theo biên kiến trúc đã chọn. Test trước/sau phải bảo vệ behavior và DI bootstrap; không đổi schema/role policy hoặc thêm auth feature vô cớ.

**Acceptance criteria**

- [ ] TMC-087-AC1: Pure application/domain không phụ thuộc Nest/TypeORM/ORM; wiring ở bootstrap, HTTP errors map ở presentation.
- [ ] TMC-087-AC2: Session/hash/RBAC behavior và API contract giữ nguyên, không thêm feature auth ngoài scope.

<a id="verify-tmc-087"></a>

**Verification plan — V-API**

| AC IDs | Scenario/command hoặc planned design | Preconditions/fixtures / level | Expected result | Actual evidence |
| --- | --- | --- | --- | --- |
| AC1, AC2 | 1. Auth/bootstrap tests trước/sau và positive/negative session scenarios không đổi.<br>2. Boundary tests 085 và DI bootstrap xác nhận adapter replacement, không đổi registry/schema vô cớ. | Synthetic fixtures; profiles §7.1; harness mới là planned cho tới khi có runner | AC1: Pure application/domain không phụ thuộc Nest/TypeORM/ORM; wiring ở bootstrap, HTTP errors map ở presentation.<br>AC2: Session/hash/RBAC behavior và API contract giữ nguyên, không thêm feature auth ngoài scope. | Not run; ghi kết quả riêng cho từng AC, env/SHA/link thật |

**Risks / handoff:** estimate và capacity cần refine; policy/vendor/fixtures/permission chưa có phải nêu rõ trước Ready. Báo AC đạt/chưa đạt, actual commands/results trên head cuối, PR/check links và next action. User giữ quyền review/merge/accept; không chuyển Done từ bản kế hoạch này.

<a id="kanban"></a>

## 8. Agile/Kanban execution, Ready queue and blockers

### 8.1. Pull policy và review gate

Lifecycle theo plan mới: **Backlog → Ready → In Progress → Testing → In Review → Done**, kèm Blocked/Cancelled. Workflow cũ đặt In Review trước Testing; khi chuẩn bị Project, TMC-045/TMC-048 thống nhất Testing trước PR ready-for-review để checks có evidence. Giữ cùng ID và bản ghi quyết định; chưa sửa workflow hoặc remote trong task này.

| Chuyển trạng thái | Điều kiện và trách nhiệm |
| --- | --- |
| Backlog → Ready | User chọn scope/priority; Feature/type/AC/input/env/estimate rõ; dependencies đã nghiệm thu; executor/reviewer có capacity. |
| Ready → In Progress | Giao đúng một executor, branch/base và file scope rõ. WIP đề xuất **1 implementation chính/người**, tối đa 2 active khi user phân công rõ; không chạy agent song song tự động. |
| In Progress → Testing | Deliverables/diff sẵn; chạy AC/checks phù hợp trên revision xác định. Fail quay lại sửa cùng ID. |
| Testing → In Review | Checks liên quan đạt trên head cuối; PR liên kết ticket, request user review, remaining/limitations rõ. **Review WIP 1** đề xuất để tránh hàng chờ một reviewer. |
| In Review → In Progress | Changes requested; giữ ticket/PR, sửa và kiểm tra lại. Không clone issue để giấu rework. |
| In Review → Done | AC/DoD đạt, user approve và merge/accept; check SHA khớp latest push. Agent không tự merge/auto-merge. |
| Active → Blocked → Ready | Ghi previous status, blocker, owner, next action và recheck; có bằng chứng gỡ mới xét lại DoR/capacity. |
| Backlog → Cancelled | Owner quyết định hủy, có rationale; closed-unmerged/not-planned không là Done. |

### 8.2. Ready candidates và replenishment

**Ready hiện đã được user giao: chưa có ticket implementation nào.** Đây là backlog được viết theo task tài liệu. Candidate đầu là **TMC-044**, vì có inputs local và AC audit; user/executor xác nhận start/capacity/evidence trước khi chuyển Ready. Sau đó TMC-001; tiếp theo foundation 002…008 theo dependency, kèm 045/078 khi có owner input. Việc rank cao không tự giao thực thi.

| Candidate / dependency | Unblock input | Owner / next action | Trạng thái |
| --- | --- | --- | --- |
| TMC-044 | Actual PR/check/acceptance đã có, deadline thật, giờ/ngày và reviewer availability | User cung cấp hoặc giao audit; rà ở lần planning kế tiếp | Backlog, DoR candidate |
| TMC-001 / TMC-045 / TMC-078 | Kết quả 044 và scope/policy owner | User chốt trace/baseline/notice; 045 sau 001 | Backlog; dependencies chưa nghiệm thu |
| TMC-002…008 và TMC-050 | Foundation audit và DB test khi cần; giữ cấu hình local | Executor được giao kiểm tra từng ticket, không scaffold lại | Backlog; source có một phần |
| TMC-046…049 | Repo/Project owner/quyền/reviewer identity + task remote cụ thể | User hoặc maintainer; tra dữ liệu thật trước import | Backlog; remote unverified |
| TCS/HRS, policy/restore/edge | Capability, synthetic env, policy/go-no-go và budget | Owner/vendor contact chưa chỉ định | Backlog; không gọi tất cả là Blocked khi chưa bắt đầu |

Daily 5–10 phút rà blocker/aging và chọn một việc theo Ready/dependencies; weekly 20–30 phút replenish/refine/rà capacity. Demo/review khi có outcome; retrospective dựa actual/rework/failure data. Thời gian điều phối chung dùng buffer, review/test ticket nằm trong estimate. Chưa có timestamps nên lead time/cycle time/throughput **Not measured**; khi có dữ liệu, lead time = Ready→Done và cycle time = In Progress→Done, ghi thời gian Blocked/review riêng.

<a id="github"></a>

## 9. GitHub Projects preparation and import readiness

### 9.1. Inventory và action tickets

Remote URL được đọc từ local git config: [tungbinhdinh89/TMCQRAttendanceSystem_KTPM](https://github.com/tungbinhdinh89/TMCQRAttendanceSystem_KTPM). Owner/quyền/public visibility/Project/issues/PRs **Not verified**. Task này không gọi GitHub, tạo issue/Project, provision protection hay push. Target schema và views sau là proposal theo plan, cần kiểm tra capability/cú pháp thực khi được giao TMC-046/047.

| Preparation area | Action ticket / dependency | Deliverable/acceptance | Owner / verification status |
| --- | --- | --- | --- |
| Repo/Project inventory, access và duplicate check | TMC-044 → TMC-046 | Existing repo/Project URL/ID và quyền được đọc thật trước tạo; không Project trùng | User; Not verified |
| ID registry/templates/type/labels | TMC-045 sau 044/001 | Issue/bug/PR templates + label descriptions/colors/rules + Feature/parent/import readiness | User; local plan only |
| Milestone/calendar/capacity | TMC-044/001 → TMC-046 | Baseline được owner chọn; ISO dates chỉ sau start/calendar thật; không import relative windows làm Date | User; Proposed |
| Project fields | TMC-046 sau 045 | Mapping/options/units và nguồn canonical được kiểm tra trên Project thật | User; Not provisioned |
| Five saved views | TMC-047 sau 046 | Saved layout/filter/sort/group/date và sample walkthrough, không nhân đôi items | User; Not provisioned |
| Automation/review/check protection | TMC-048 (proposal sau 044/045), thực áp checks sau TMC-005; TMC-047 | Human approval/merge gate; không Done từ close-unmerged hoặc status label | User; Not provisioned |
| Import/reuse & handoff | TMC-049 sau 046/047/048, prerequisite CI khi áp protection | Dry-run IDs/counts/metadata, create/update/reuse có response mapping/evidence; chưa đủ input giữ pending | User; Not created by this task |

### 9.2. Target fields và labels

| Field / source | Proposed type/options | Mapping / rule |
| --- | --- | --- |
| Title / Labels / Assignees / Milestone | Native issue metadata | Title từ master; assignee chỉ sau giao việc; milestone bằng ID/outcome M-xx. |
| Status | Single select: Backlog, Ready, In Progress, Testing, In Review, Blocked, Done, Cancelled | Project là canonical sau khi chọn làm execution source; local trước import chỉ plan. |
| Priority / Rank | Single select P0/P1/P2/P3; Number | Master; rank thấp trước sau dependency; priority label chỉ mirror nếu policy đã chốt. |
| Estimate | Number, human hours | Chỉ leaf ticket có số; parent không cộng, PR không mang estimate lần hai. |
| Feature / Parent | Text/reference hoặc native parent/sub-issue sau khi kiểm tra capability | Feature ID/name và work-package parent của master; không tự bịa Feature issue number. |
| Start / Target | Date ISO | Chưa có committed start/calendar thì để trống; relative windows ở body, không điền ngày giả. |
| Iteration | Iteration khi owner chọn timebox | Kanban hiện chỉ planning windows; không ép 4 sprint hoặc tạo 2 nguồn schedule. |
| Severity | S1/S2/S3/S4, label **hoặc** Single select được chọn | Chỉ BUG/FIX có nguồn; TMC-050 S2 proposed cần triage. |
| Reviewer / Linked PR | Native PR metadata khi có; blocker/review owner ở body/Text khi cần | Không coi Project Status = approval; không tạo custom people-picker giả. |

TMC-045 chốt label dictionary trước import: đúng một `type:<lowercase TYPE>`; area theo master; `feature:<id>` nếu mirror Feature được chọn; `priority:P0…P3` chỉ mirror Project Priority; `severity:S1…S4` khi có bug evidence; `blocked`/`needs-review` chỉ hỗ trợ lọc. Mỗi label cần description/color/rule; catalog/color hiện chưa provision. Type alias cũ `type:documentation` → `type:docs` có mapping, không đổi ID hoặc mass-overwrite labels remote chưa đọc.

### 9.3. Năm saved views và automation target

| View | Layout / proposed filter | Sort/group/visible fields | Acceptance walkthrough |
| --- | --- | --- | --- |
| Prioritized Backlog | Table; issue items có Status Backlog hoặc Ready | Rank ↑; Priority, Feature, parent/dependencies, Estimate, Milestone, owner | Dependency chưa Done không tự pull; parent không cộng estimate. |
| Status Board | Board; canonical issue items | Columns theo Status; card có Priority/Feature/owner; group Milestone nếu phù hợp | Same issue qua các trạng thái; không clone theo sprint/view. |
| Roadmap | Roadmap; issue có Start và Target thật | Date fields Start/Target; group Milestone | TMC-044 cấp lịch trước khi view có data; rà missing dates riêng để không giấu thiếu lịch. |
| Bugs | Table/Board; open issue type:bug **hoặc** type:fix | Priority rồi Rank, severity/Feature/related bug | TMC-050 mẫu bug; chưa có FIX tách thật thì không tạo dummy issue cho view. |
| In Review | Table/Board; issue Status In Review | Owner, Linked PR, checks/evidence/head và reviewer | PR ready-for-review/latest checks khớp; Draft/closed-unmerged không thành Done. |

Đây là **filter logic**, chưa khẳng định query string đã được kiểm tra trên Project thật. TMC-047 chọn đúng syntax theo field names/capability hiện có, lưu từng view và kiểm tra item có/không dates, BUG/FIX/Feature, status và quyền xem. View rỗng phải phân biệt thiếu data với sai filter.

Automation target: auto-add theo repo/filter đã kiểm tra + de-dup ticket ID; một canonical issue cho effort/Status; linked PR nếu add để xem thì không cộng effort. Không tự chuyển Done từ issue closed hoặc PR closed-unmerged; merge chưa đủ nếu acceptance chưa ghi nhận. Nếu built-in workflow không diễn tả được gate, tắt phần chuyển Done và để owner cập nhật sau review/accept. Không bật auto-merge, tự phê duyệt hoặc tự bypass protection. Nếu author/reviewer cùng một account và không thể tạo approval native hợp lệ, TMC-048 ghi blocker và owner chọn reviewer/acceptance policy hợp lệ trước khi báo gate sẵn.

### 9.4. Import mapping — local IDs to remote objects

Mọi giá trị remote dưới đây là **Not verified**; `Not created (this task)` chỉ nói task hiện tại không tạo, không khẳng định repo chưa có issue cũ. TMC-049 tra ID/title/linked PR trước khi quyết định create/update/reuse. Proposed batch: foundation/preparation → QR/gate → attendance/recovery/quality → handoff → extensions. Work package/children giữ hierarchy; Feature link dùng body/reference nếu chưa có Feature issue thật. Không có placeholder issue number.

| Local ticket | Remote repo/issue | Project item ID | Parent / milestone / field mapping | Action create/update/reuse | PR / evidence/status |
| --- | --- | --- | --- | --- | --- |
| <a id="remote-tmc-001"></a>[TMC-001](#tmc-001) | Repo như §9.1; issue Not verified | Not verified | Feature I01; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-002"></a>[TMC-002](#tmc-002) | Repo như §9.1; issue Not verified | Not verified | Feature A01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-003"></a>[TMC-003](#tmc-003) | Repo như §9.1; issue Not verified | Not verified | Feature A02; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-004"></a>[TMC-004](#tmc-004) | Repo như §9.1; issue Not verified | Not verified | Feature A03; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-005"></a>[TMC-005](#tmc-005) | Repo như §9.1; issue Not verified | Not verified | Feature A04; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-006"></a>[TMC-006](#tmc-006) | Repo như §9.1; issue Not verified | Not verified | Feature B01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-007"></a>[TMC-007](#tmc-007) | Repo như §9.1; issue Not verified | Not verified | Feature B01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-008"></a>[TMC-008](#tmc-008) | Repo như §9.1; issue Not verified | Not verified | Feature B02; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-009"></a>[TMC-009](#tmc-009) | Repo như §9.1; issue Not verified | Not verified | Feature C01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-010"></a>[TMC-010](#tmc-010) | Repo như §9.1; issue Not verified | Not verified | Feature C01; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-011"></a>[TMC-011](#tmc-011) | Repo như §9.1; issue Not verified | Not verified | Feature C02; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-012"></a>[TMC-012](#tmc-012) | Repo như §9.1; issue Not verified | Not verified | Feature D01; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-013"></a>[TMC-013](#tmc-013) | Repo như §9.1; issue Not verified | Not verified | Feature D02; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-014"></a>[TMC-014](#tmc-014) | Repo như §9.1; issue Not verified | Not verified | Feature E01; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-015"></a>[TMC-015](#tmc-015) | Repo như §9.1; issue Not verified | Not verified | Feature C02; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-016"></a>[TMC-016](#tmc-016) | Repo như §9.1; issue Not verified | Not verified | Feature D02; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-017"></a>[TMC-017](#tmc-017) | Repo như §9.1; issue Not verified | Not verified | Feature C03; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-018"></a>[TMC-018](#tmc-018) | Repo như §9.1; issue Not verified | Not verified | Feature D03; M-02; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-019"></a>[TMC-019](#tmc-019) | Repo như §9.1; issue Not verified | Not verified | Feature E01; M-03; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-020"></a>[TMC-020](#tmc-020) | Repo như §9.1; issue Not verified | Not verified | Feature E02; M-03; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-021"></a>[TMC-021](#tmc-021) | Repo như §9.1; issue Not verified | Not verified | Feature E02; M-03; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-022"></a>[TMC-022](#tmc-022) | Repo như §9.1; issue Not verified | Not verified | Feature F01; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-023"></a>[TMC-023](#tmc-023) | Repo như §9.1; issue Not verified | Not verified | Feature F01; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-024"></a>[TMC-024](#tmc-024) | Repo như §9.1; issue Not verified | Not verified | Feature F02; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-025"></a>[TMC-025](#tmc-025) | Repo như §9.1; issue Not verified | Not verified | Feature F02; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-026"></a>[TMC-026](#tmc-026) | Repo như §9.1; issue Not verified | Not verified | Feature F02; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-027"></a>[TMC-027](#tmc-027) | Repo như §9.1; issue Not verified | Not verified | Feature D03; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-028"></a>[TMC-028](#tmc-028) | Repo như §9.1; issue Not verified | Not verified | Feature G01; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-029"></a>[TMC-029](#tmc-029) | Repo như §9.1; issue Not verified | Not verified | Feature H01; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-030"></a>[TMC-030](#tmc-030) | Repo như §9.1; issue Not verified | Not verified | Feature H02; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-031"></a>[TMC-031](#tmc-031) | Repo như §9.1; issue Not verified | Not verified | Feature H03; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-032"></a>[TMC-032](#tmc-032) | Repo như §9.1; issue Not verified | Not verified | Feature H04; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-033"></a>[TMC-033](#tmc-033) | Repo như §9.1; issue Not verified | Not verified | Feature I02; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-034"></a>[TMC-034](#tmc-034) | Repo như §9.1; issue Not verified | Not verified | Feature I02; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-035"></a>[TMC-035](#tmc-035) | Repo như §9.1; issue Not verified | Not verified | Feature I01; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-036"></a>[TMC-036](#tmc-036) | Repo như §9.1; issue Not verified | Not verified | Feature I03; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-037"></a>[TMC-037](#tmc-037) | Repo như §9.1; issue Not verified | Not verified | Feature I03; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-038"></a>[TMC-038](#tmc-038) | Repo như §9.1; issue Not verified | Not verified | Feature H04; M-05; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-039"></a>[TMC-039](#tmc-039) | Repo như §9.1; issue Not verified | Not verified | Feature G01; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-040"></a>[TMC-040](#tmc-040) | Repo như §9.1; issue Not verified | Not verified | Feature E03; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-041"></a>[TMC-041](#tmc-041) | Repo như §9.1; issue Not verified | Not verified | Feature G02; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-042"></a>[TMC-042](#tmc-042) | Repo như §9.1; issue Not verified | Not verified | Feature F03; M-08; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-043"></a>[TMC-043](#tmc-043) | Repo như §9.1; issue Not verified | Not verified | Feature B03; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-044"></a>[TMC-044](#tmc-044) | Repo như §9.1; issue Not verified | Not verified | Feature A06; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-045"></a>[TMC-045](#tmc-045) | Repo như §9.1; issue Not verified | Not verified | Feature A05; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-046"></a>[TMC-046](#tmc-046) | Repo như §9.1; issue Not verified | Not verified | Feature A05; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-047"></a>[TMC-047](#tmc-047) | Repo như §9.1; issue Not verified | Not verified | Feature A05; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-048"></a>[TMC-048](#tmc-048) | Repo như §9.1; issue Not verified | Not verified | Feature A05; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-049"></a>[TMC-049](#tmc-049) | Repo như §9.1; issue Not verified | Not verified | Feature A05; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-050"></a>[TMC-050](#tmc-050) | Repo như §9.1; issue Not verified | Not verified | Feature B01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-051"></a>[TMC-051](#tmc-051) | Repo như §9.1; issue Not verified | Not verified | [TMC-031](#tmc-031); M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-052"></a>[TMC-052](#tmc-052) | Repo như §9.1; issue Not verified | Not verified | [TMC-031](#tmc-031); M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-053"></a>[TMC-053](#tmc-053) | Repo như §9.1; issue Not verified | Not verified | [TMC-031](#tmc-031); M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-054"></a>[TMC-054](#tmc-054) | Repo như §9.1; issue Not verified | Not verified | Feature A07; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-055"></a>[TMC-055](#tmc-055) | Repo như §9.1; issue Not verified | Not verified | Feature C04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-056"></a>[TMC-056](#tmc-056) | Repo như §9.1; issue Not verified | Not verified | Feature C04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-057"></a>[TMC-057](#tmc-057) | Repo như §9.1; issue Not verified | Not verified | Feature C04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-058"></a>[TMC-058](#tmc-058) | Repo như §9.1; issue Not verified | Not verified | Feature B04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-059"></a>[TMC-059](#tmc-059) | Repo như §9.1; issue Not verified | Not verified | Feature B04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-060"></a>[TMC-060](#tmc-060) | Repo như §9.1; issue Not verified | Not verified | [TMC-043](#tmc-043); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-061"></a>[TMC-061](#tmc-061) | Repo như §9.1; issue Not verified | Not verified | [TMC-043](#tmc-043); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-062"></a>[TMC-062](#tmc-062) | Repo như §9.1; issue Not verified | Not verified | [TMC-040](#tmc-040); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-063"></a>[TMC-063](#tmc-063) | Repo như §9.1; issue Not verified | Not verified | [TMC-040](#tmc-040); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-064"></a>[TMC-064](#tmc-064) | Repo như §9.1; issue Not verified | Not verified | [TMC-040](#tmc-040); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-065"></a>[TMC-065](#tmc-065) | Repo như §9.1; issue Not verified | Not verified | [TMC-041](#tmc-041); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-066"></a>[TMC-066](#tmc-066) | Repo như §9.1; issue Not verified | Not verified | [TMC-041](#tmc-041); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-067"></a>[TMC-067](#tmc-067) | Repo như §9.1; issue Not verified | Not verified | [TMC-041](#tmc-041); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-068"></a>[TMC-068](#tmc-068) | Repo như §9.1; issue Not verified | Not verified | [TMC-041](#tmc-041); M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-069"></a>[TMC-069](#tmc-069) | Repo như §9.1; issue Not verified | Not verified | [TMC-042](#tmc-042); M-08; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-070"></a>[TMC-070](#tmc-070) | Repo như §9.1; issue Not verified | Not verified | [TMC-042](#tmc-042); M-08; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-071"></a>[TMC-071](#tmc-071) | Repo như §9.1; issue Not verified | Not verified | [TMC-042](#tmc-042); M-08; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-072"></a>[TMC-072](#tmc-072) | Repo như §9.1; issue Not verified | Not verified | Feature D04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-073"></a>[TMC-073](#tmc-073) | Repo như §9.1; issue Not verified | Not verified | Feature D04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-074"></a>[TMC-074](#tmc-074) | Repo như §9.1; issue Not verified | Not verified | Feature D04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-075"></a>[TMC-075](#tmc-075) | Repo như §9.1; issue Not verified | Not verified | Feature G03; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-076"></a>[TMC-076](#tmc-076) | Repo như §9.1; issue Not verified | Not verified | Feature G03; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-077"></a>[TMC-077](#tmc-077) | Repo như §9.1; issue Not verified | Not verified | Feature G03; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-078"></a>[TMC-078](#tmc-078) | Repo như §9.1; issue Not verified | Not verified | Feature J01; M-00; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-079"></a>[TMC-079](#tmc-079) | Repo như §9.1; issue Not verified | Not verified | Feature J01; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-080"></a>[TMC-080](#tmc-080) | Repo như §9.1; issue Not verified | Not verified | Feature J01; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-081"></a>[TMC-081](#tmc-081) | Repo như §9.1; issue Not verified | Not verified | Feature J01; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-082"></a>[TMC-082](#tmc-082) | Repo như §9.1; issue Not verified | Not verified | Feature J01; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-083"></a>[TMC-083](#tmc-083) | Repo như §9.1; issue Not verified | Not verified | Feature D04; M-06; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-084"></a>[TMC-084](#tmc-084) | Repo như §9.1; issue Not verified | Not verified | Feature A07; M-07; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-085"></a>[TMC-085](#tmc-085) | Repo như §9.1; issue Not verified | Not verified | Feature H01; M-04; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-086"></a>[TMC-086](#tmc-086) | Repo như §9.1; issue Not verified | Not verified | Feature C03; M-03; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |
| <a id="remote-tmc-087"></a>[TMC-087](#tmc-087) | Repo như §9.1; issue Not verified | Not verified | Feature B01; M-01; §6/§9.2 | Pending lookup → reuse/update nếu có; create nếu chưa có và được giao | PR Not verified; Not created (this task) |

### 9.5. Readiness checklist

- [ ] TMC-044/046: xác định owner/audience/quyền và repo/Project hiện có; lưu URL/ID thật, tránh tạo trùng.
- [ ] TMC-045: registry/title/type/Feature/parent/requirements/AC đủ, label catalog có description/color/rule và alias mapping.
- [ ] TMC-044/001/046: capacity/start/deadline được chọn, milestone/calendar/fields mapping nhất quán; relative dates chưa được import vào Date.
- [ ] TMC-047: năm views được save và walkthrough với dữ liệu đại diện; missing dates/BUG/FIX không bị giấu.
- [ ] TMC-048/005: checks/reviewer/protection có nguồn thật và quyền áp dụng; human approval/merge/accept gate được giữ.
- [ ] TMC-049: dry-run IDs/count/duplicate check, mapping response sau batch được giao; không cộng parent/child hoặc issue/PR lần hai.
- [ ] Remote provisioning/verification có URL/ID/evidence; chưa thực hiện giữ Proposed/Not verified.

<a id="evidence"></a>

## 10. Progress evidence, risks, deferred work and change log

### 10.1. Evidence policy và tình trạng hiện tại

| Evidence | Source/result | Giới hạn |
| --- | --- | --- |
| Repository status và ownership | Đọc git status, AGENTS, README/layout, manifests và source entry points ngày 2026-11-07 | Giữ nguyên các thay đổi tên summary/tech-stack và report đang có của user. |
| Auth/bootstrap boundary | Đọc AuthService, controller và bootstrap.test; metadata auth và query demo có trong source | Không chạy runtime/DB, không suy deployment đã lộ dữ liệu thật. |
| Business implementation inventory | Rà controller/ORM/port/test files; phân biệt source với design API catalog | Không công bố all endpoints implemented hoặc mọi ticket Done. |
| Backlog document verification | Kiểm tra registry/counts/AC coverage/dependency DAG/effort/relative windows/local links/anchors và đọc lại tài liệu | Chỉ kiểm tra tài liệu; product unit/integration/load/E2E/restore/edge tests **Not run**. |
| GitHub/LMS | Chỉ biết origin từ local config | Không đọc hoặc thay đổi remote; issue/Project/PR/review/merge/submission Not verified. |

Evidence khi thực thi lưu theo ticket/AC: revision SHA, ngày, môi trường synthetic/test, commands, expected/actual, log/result links, limitations và người review. Không ghi token/password/PII vào artifacts. Có code/test file không chứng minh test đã chạy; test pass cũ không chứng minh latest push đạt. Không tự tick checklist nghiệm thu hoặc invent actual dates.

### 10.2. Rủi ro, deferred work và next actions

| Risk/gap | Ảnh hưởng | Owner / next action | Ticket |
| --- | --- | --- | --- |
| Baseline cũ đã lệch source, thiếu actual/remaining | Có thể làm lại scaffold hoặc báo lịch khả thi sai | User/executor audit AC/evidence và chọn baseline trước execution | TMC-044/001 |
| 6h/ngày và reviewer availability chưa xác nhận | Scenario lát cắt vượt capacity đến mục tiêu nội bộ 01/12 | User chốt capacity/deadline/scope; giữ controls correctness/security và test bắt buộc | TMC-044 |
| Demo bootstrap public theo source | Scope/PII có thể vượt quyền trong môi trường có dữ liệu | Triage S2 proposed, kiểm chứng synthetic và sửa cùng BUG ticket | TMC-050 |
| TCS/HRS không có status/close/passage/ACK capability đã chốt | Không thể suy OPEN/pass/remoteReady từ ACK hoặc timeout | Owner/vendor chốt contract, mock và limitations | TMC-013/016/065…068 |
| No committed dates/Project rights/reviewer identity | Roadmap/import/protection chưa sẵn | Đọc remote khi được giao; không tạo remote hoặc ngày giả để xanh checklist | TMC-045…049 |
| Notice/policy/retention/holds/copies chưa chốt | Portal notice hoặc privacy execution không đủ input | Quyết định notice tối thiểu riêng; schema/retention extension chỉ Ready sau policy tương ứng | TMC-078…082/086 |
| MANUAL tổng quát / employee request-check / MFA / email migration | Coverage đầy đủ spec còn gap ngoài slice con | Owner refine outcome/API/entity/AC và cấp ID từ 088; không nhét vào ticket 2–3h | TMC-001/044 |
| Race/crash/late callback và UNKNOWN | Mở lặp hoặc ghi công thiếu nguồn | Giữ invariants CAS trước I/O, fenced jobs, uniqueness/source lineage và failure evidence | TMC-014…016/019/023…030 |

**Deferred:** M-06/M-07 là extension có ticket/estimate Proposed, không cam kết trong deadline M2; M-08 chưa schedule và phải có go/no-go. Không có BUG giả lập ngoài TMC-050 có bằng chứng source. Rework chưa biết dùng buffer; khi có defect thật, ghi repro/impact/Feature/severity rồi triage thay vì tạo bug trước cho đủ milestone.

**Bước thực thi kế tiếp:** chọn TMC-044 để audit acceptance/remaining/capacity, sau đó TMC-001 chốt baseline và tập Ready. Lần giao viết tài liệu này không tự nhận các ticket đó, không tạo GitHub issues và không triển khai backlog.

### 10.3. Change log

| Date | Change | Impact / source |
| --- | --- | --- |
| 2026-11-07 | Tạo doc/backlog.md theo make-doc-skill-plan §23, giữ TMC-001…043/Feature IDs, title English/type canonical và anchors local | Workflow cũ giữ nguyên làm nguồn historical/reference; ownership migration cần scope riêng. |
| 2026-11-07 | Đăng ký TMC-044…087 cho delivery readiness, gaps source, NFR verification và extensions; split 031/040/041/042/043 thành work package + children | Không đổi ID; parent không cộng effort; estimate/lịch là Proposed, chưa có actual evidence. |
| 2026-11-07 | Cập nhật foundation thành kiểm chứng/completion, thêm dependency notice 078→086 và tách scope HR correction UI 064 khỏi workflow request-check chưa refine | Không tạo lại workspace/auth đã có, không giả privacy notice hoặc CRUD request đã hoàn tất. |
| 2026-11-07 | Dùng lịch tương đối, capacity một người và remote mapping Not verified | Không dời deadline 01/12 hoặc claim issue/Project provisioned; cần owner quyết định remaining/start. |

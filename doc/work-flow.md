# Work Flow — Kế hoạch triển khai TMC Access M2

**Ngày lập:** 03/11/2026. **Thời gian mục tiêu:** 04/11–01/12/2026, 4 Sprint. **Owner/Reviewer duy nhất:** Solo Developer. **Trạng thái:** kế hoạch, chưa thực thi backlog.

Tài liệu làm theo nội dung lập kế hoạch bạn đính kèm và lưu tại **doc/work-flow.md** theo yêu cầu trực tiếp của bạn, thay cho vị trí root ghi trong mẫu. Lần lập kế hoạch ban đầu chỉ tạo tài liệu, không tạo source code, GitHub Issues/Projects hoặc tự giao việc cho agent. **Cập nhật ngày 05/11/2026:** bổ sung quy trình thực thi ticket cho AI agent trong vai trò Junior Full Stack Developer tại §4.4–4.9; chỉ triển khai ticket được giao, không tự chạy toàn bộ backlog.

**Kết quả capacity:** phạm vi đề xuất trong 4 tuần gồm **38 ticket / 106 giờ người**, trong đó 36 P0 / 102 giờ và 2 P1 / 4 giờ. Toàn backlog là **9 Epic, 28 Feature, 43 ticket / 151 giờ người**; 5 ticket / 45 giờ được hoãn. Khả thi có điều kiện ở **6 giờ/ngày × 6 ngày/tuần**, chưa phù hợp mức 4 giờ/ngày. Ước lượng không phải cam kết hiệu suất AI.

**Cách đọc:** §1–3 xác định hiện trạng và phạm vi; §5–7 chọn Feature/Ticket; §8 chứa phiếu giao việc đầy đủ; §9–13 kiểm tra lịch và capacity; §14–18 kiểm soát rủi ro, chất lượng và bài nộp. Liên kết TMC-xxx trong các bảng dẫn đến ticket tương ứng.

<a id="s1"></a>

## 1. Project Overview — Tổng quan và hiện trạng

TMC Access phục vụ kiểm soát ra/vào và ghi công tại Bình Dương (~800 nhân viên) và Long An (~600). Module code chọn cho M2 là **Gate Access & Attendance Event Recording**: portal → QR → kiosk → validation → policy → mock turnstile → attendance ledger → history. Đích là một lát cắt nghiệp vụ chạy được, có xử lý lỗi và bằng chứng SOLID.

**Mục lục**

| Phần 1–6 | Phần 7–12 | Phần 13–18 |
|---|---|---|
| [1. Hiện trạng](#s1) | [7. Product Backlog](#s7) | [13. Dependencies / Critical Path](#s13) |
| [2. Scope M2](#s2) | [8. Chi tiết 43 ticket](#s8) | [14. Risks](#s14) |
| [3. Giả định](#s3) | [9. Sprint / lịch theo ngày](#s9) | [15. Acceptance / DoD](#s15) |
| [4. Agile Workflow](#s4) | [10. Milestone Roadmap](#s10) | [16. Testing Strategy](#s16) |
| [5. Epic / Feature](#s5) | [11. Work Allocation](#s11) | [17. Progress Checklist](#s17) |
| [6. Priority Matrix](#s6) | [12. Effort / Capacity](#s12) | [18. Release / Submission](#s18) |

### 1.1. Nguồn và thứ tự áp dụng

| Nguồn | Sử dụng trong kế hoạch |
|---|---|
| [Đề M2](SA_CC_hk261_Assignment_M2.pdf#page=3), [đề M1](SA_CC_hk261_Assignment_M1.pdf) | Yêu cầu môn học; M2 bổ sung hai vấn đề, ba views, SOLID/reflection và code ít nhất một module |
| [spec.pdf — M1 đã hoàn thành](spec.pdf) | Baseline nghiệp vụ, ADR-01…10; không lập lại M1 từ đầu |
| [teach-stack.md](teach-stack.md), [structure-architecture.md](structure-architecture.md) | NestJS/TypeORM/PostgreSQL, modular monolith, Clean Architecture; client/ và api/ |
| [schema-database.md](schema-database.md), [user-flow.md](user-flow.md) | Schema 37 bảng và luồng chuẩn; thiết kế không đồng nghĩa đã có migrations/API |
| [README](../README.md), [package.json](../package.json), [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md) | Bằng chứng cấu trúc/source và hướng dẫn hiện tại |
| [Kế hoạch prototype cũ](../plans/tmc-access-frontend-prototype.md), [UI guidelines](../guidelines/Guidelines.md) | Tái sử dụng thiết kế; các dòng “chưa có UI” trong kế hoạch cũ đã lỗi thời so với source |
| Nội dung lập kế hoạch người dùng gửi | Một người + AI hỗ trợ, 4 Sprint, ticket đủ chi tiết, deadline nội bộ; không tạo remote issues |

Backend **đã được người dùng chốt Node.js/NestJS**, không mở lại lựa chọn ASP.NET từ phương án chung trong mẫu. Frontend giữ React/TypeScript/Vite, Astra làm nguồn token/component hiện có, MUI bổ sung; không thay toàn bộ design system bằng MUI.

### 1.2. Kiểm kê repository tại thời điểm lập kế hoạch

Đã đọc source/config và rà danh sách file; **chưa chạy build, test, camera hoặc backend trong lần lập kế hoạch này**. “Có implementation prototype” không có nghĩa đạt acceptance của M2.

| Component | Current Status | Existing Files | Missing Work | Notes |
|---|---|---|---|---|
| Frontend shell/router | Có source prototype | [App.tsx](../src/App.tsx), [router.tsx](../src/app/router.tsx), [main.tsx](../src/main.tsx) | Chuyển client/, HTTP adapters và mode dữ liệu | Chưa có client/ ở source hiện tại |
| Design system | Có Astra provider/CSS và MUI bridge | [index.css](../src/index.css), [mui-theme.tsx](../src/styles/mui-theme.tsx), [ui.tsx](../src/components/ui.tsx) | Xác minh dependency và baseline Figma có thể tái lập | Import Astra tồn tại nhưng package.json chưa khai báo @figma/astraui; không tìm thấy package/kit ở node_modules đường dẫn kiểm tra; chưa kết luận build fail |
| Auth/RBAC | Chỉ demo phía client | [context.tsx](../src/app/context.tsx), [rbac.ts](../src/lib/rbac.ts), [Login.tsx](../src/features/auth/Login.tsx) | Session/RBAC/scope ở server, xóa cache theo identity | Session hiện là account ID localStorage; ADM có quyền rộng trong prototype |
| Employee/QR | Có UI và QR tự sinh | [Mobile.tsx](../src/features/employee-mobile/Mobile.tsx), [qr.ts](../src/lib/qr.ts) | QR ký, jti, revocation, redemption | QR TTL 60s hiện không có chữ ký; cooldown 30s không phải chống replay |
| Kiosk/camera | Có source Virtual Scanner và webcam | [Kiosk.tsx](../src/features/kiosk/Kiosk.tsx) | API trạm, eventId, kết quả thật, recovery | Camera có xử lý permission/lifecycle trong source; chưa thử thiết bị ở lần này |
| Access/attendance | Có mô phỏng localStorage | [api.ts](../src/data/api.ts), [types.ts](../src/data/types.ts) | Durable PG transaction, command state, evidence và ledger | Đang tự luân phiên ENTRY/EXIT, ghi công ngay khi allowed; cần thay ở server mode |
| History/dashboard | Có UI với dữ liệu mẫu | [Dashboard.tsx](../src/features/dashboard/Dashboard.tsx), [Access.tsx](../src/features/access-control/Access.tsx), [Attendance.tsx](../src/features/attendance/Attendance.tsx) | Query scoped/pagination; phân biệt thật/mô phỏng | Không coi KPI quy mô1.400 là dataset kiểm thử 1.400 |
| Backend/TCS/HRS | Chưa có source triển khai server trong inventory | Chỉ có thiết kế trong doc/ | api/ NestJS, mock TCS, adapters | Mock HRS và export đầy đủ ngoài code baseline |
| Database | Có schema tài liệu | [schema-database.md](schema-database.md) | TypeORM mappings/migrations/seed, PG env | Chưa tìm thấy migrations/compose backend |
| Test/CI | Chưa có bộ tự động trong inventory | package scripts chỉ dev/build/preview/format | Unit/integration/API/failure/E2E/perf, CI | Có pnpm-lock.yaml; chưa thấy .github/workflows |
| M1/Architecture | Có tài liệu, M1 được người dùng xác nhận hoàn thành | spec và các doc thiết kế | Đồng bộ M2, views, ADR thay đổi và evidence code | Chưa thấy thư mục ADR source riêng; ADR-01…10 nằm trong spec |
| GitHub | Có remote trong .git/config | origin: tungbinhdinh89/TMCQRAttendanceSystem_KTPM | Kiểm tra quyền truy cập commit bài nộp | Không xác minh trạng thái remote/public hoặc LMS ở lần này |

Không có bằng chứng đủ để gắn trạng thái **In Progress/Done** cho ticket M2 mới. Mọi ticket dưới đây bắt đầu **Backlog**; UI có sẵn là đầu vào tái sử dụng.

<a id="s2"></a>

## 2. Assignment M2 Objectives & Scope — Mục tiêu và ranh giới

### 2.1. Bắt buộc theo đề, lựa chọn dự án và phần hoãn

| Nhóm | Phạm vi | Ticket/bằng chứng dự kiến |
|---|---|---|
| Bắt buộc M2: thiết kế cuối | Context, FR/NFR, characteristics, styles/trade-offs, từng bước logical/physical, decisions/principles | TMC-001, TMC-035 |
| Bắt buộc M2: ba views | Module, component-and-connector, allocation | TMC-035 |
| Bắt buộc M2: mất kết nối | Mitigation và cách tích hợp vào kiến trúc | TMC-022; hiện thực/kiểm chứng TMC-023…026, TMC-030 |
| Bắt buộc M2: QR tĩnh lộ | Mitigation, trade-offs và vị trí tích hợp | TMC-010, TMC-011, TMC-015, TMC-035 |
| Bắt buộc M2: SOLID/reflection | Giải thích áp dụng và reflection ngắn dựa trên việc đã làm | TMC-033, TMC-034 |
| Bắt buộc M2: code | Ít nhất một module chính theo thiết kế, tuân SOLID | GATE→ATT slice; TMC-010…025 cùng tests |
| Bắt buộc bài nộp | Báo cáo chi tiết chứa GitHub URL source, nộp LMS | TMC-036…038 |
| NFR kế thừa | Kiosk≤2s, 800 giao dịch/30 phút/nhà máy; không mất công trong vận hành thường; RBAC/audit; dữ liệu cá nhân | TMC-007,014,019,029…032 và evidence; không tự tuyên bố đạt |
| Lựa chọn demo P0 | Employee web, Virtual Scanner, ký QR/jti, mock passage sensor, PG, journal R1, SEC case tối thiểu | Chi tiết ở §8 |
| Lựa chọn P1 | Reuse webcam, dashboard nhỏ; heartbeat mở rộng hoãn | TMC-027,028; TMC-039 hoãn |
| Chỉ thiết kế trong baseline | HRS API/tháng trước noon ngày 1, correction/version/pairing, tổng thể sáu module | TMC-035; triển khai thêm TMC-040,041 là P2 |
| Ngoài phạm vi | Visitor management, payroll calculation, chế tạo/safety phần cứng, HRM đầy đủ | Không đưa thành P0 |

**HRS vẫn là requirement hệ thống:** phải có contract/architecture và lịch đáp ứng **trước 12:00 ngày 1** trong thiết kế. Chọn module GATE→ATT không biến triển khai HRS thành yêu cầu code bắt buộc cho M2; PDF cho chọn ít nhất một module. Tương tự, 37 bảng schema không có nghĩa phải xây 37 CRUD screens.

### 2.2. Luồng chuẩn được chọn

~~~mermaid
flowchart LR
    EMP["EMP đăng nhập"] --> QR["API cấp QR ký<br/>jti + expiry"]
    QR --> K["Virtual Kiosk<br/>trạm đã xác thực"]
    K --> V["QR validation<br/>access policy"]
    V --> TX["PG: attempt + redemption<br/>OPEN PREPARED + audit"]
    TX --> CAS["CAS claim<br/>DISPATCHING commit"]
    CAS --> TCS["Mock TCS<br/>ngoài DB transaction"]
    TCS --> EV["PASSAGE_CONFIRMED"]
    EV --> ATT["PG: result + event<br/>revision 1 + audit"]
    ATT --> HIST["History có scope"]
    TCS --> U["UNKNOWN / ACK-only"]
    U --> REC["Lookup / worker / SEC<br/>không retry OPEN mù"]
~~~

**Không đánh đồng:** ALLOW là quyền; ACK là nhận lệnh; OPEN_CONFIRMED là xác nhận mở; PASSAGE_CONFIRMED là bằng chứng qua cổng trong mock. Chỉ tạo công theo evidence policy đã chốt. Không coi ghi vào localStorage là durable attendance.

<a id="s3"></a>

## 3. Assumptions & Constraints — Giả định và giới hạn

- **Nguồn lực:** một Solo Developer làm PO/PM/Architect/Reviewer/QA/Release Owner; AI là công cụ theo vai trò, không thêm capacity người.
- **Lịch:** 04/11–01/12/2026 gồm 28 ngày lịch. Làm thứ Hai–thứ Bảy, nghỉ Chủ nhật 08/11,15/11,22/11,29/11: **24 ngày làm việc**, mỗi Sprint 6 ngày.
- **Deadline:** 01/12 là hạn nội bộ của prompt, chưa xác minh deadline LMS chính thức. Nếu khác phải cập nhật TMC-001/037 và lịch; không suy từ tên học kỳ.
- **Lựa chọn capacity:** lập lịch baseline theo 6h/ngày, không mặc định người dùng đã xác nhận số giờ đó. §12 cho cả 2h/4h/6h và điều kiện khả thi.
- **Stack:** Node 22/pnpm 10 theo .mise.toml hiện tại; giữ lockfile, kiểm tra tính tương thích Nest/TypeORM/PG ở foundation. Không tự chọn latest major như bằng chứng chạy được.
- **Thư mục đích:** client/ và api/; trong lần này chỉ ghi tài liệu, không di chuyển source.
- **Design:** giữ Astra/tokens + MUI bridge. Chưa có URL/node Figma trong đầu vào; package guideline chưa sẵn tại đường dẫn local đã kiểm tra. TMC-002 xác minh nguồn cấp, TMC-032 ghi giới hạn nếu chưa so được Figma gốc.
- **Thiết bị:** không mua hardware. Mock TCS có ledger/clock/fault modes độc lập, sensor qua cổng cũng là mock. Camera là P1 có Virtual Scanner dự phòng.
- **Bảo mật demo:** kiosk server mode phải provision riêng; không nhúng station secret dài hạn trong bundle public. QR TTL 60s là cấu hình demo; key/token/session secrets không đi vào logs.
- **Recovery R1:** trung tâm online, metadata journal + durable PG jobs + SEC; không tự động mở offline. Edge là P2 và cần threat model riêng.
- **Dữ liệu:** seed nhỏ đại diện; kịch bản tải tạo đủ requests theo NFR. Demo là dataset tổng hợp, không dùng thông tin nhân sự thật.
- **Schema:** TMC-004 tạo cấu trúc 37 bảng để bảo toàn FK; code runtime chỉ dùng nhóm cần cho slice. Các bảng chưa có API được ghi là chưa hiện thực nghiệp vụ.
- **Pháp lý:** không tự đặt retention hoặc tuyên bố compliance. Thiết kế phải giảm dữ liệu, phân quyền, audit, giữ chính sách cần xác nhận; đây không phải đánh giá pháp lý.
- **Ước lượng:** có AI hỗ trợ nhưng cần người review/rework. Sai số lớn ở dependency Astra, schema/transaction, crypto và recovery; dùng buffer chứ không giả định AI hoàn thành đúng lần đầu.

<a id="s4"></a>

## 4. Agile Workflow — Quy trình làm việc

### 4.1. Board và điều kiện chuyển trạng thái

~~~mermaid
flowchart LR
    B["Backlog"] --> R["Ready"]
    R --> I["In Progress<br/>WIP tối đa 2"]
    I --> V["In Review"]
    V --> T["Testing"]
    T --> D["Done<br/>Solo Developer nghiệm thu"]
    V -->|"Cần sửa"| I
    T -->|"Fail"| I
    I --> X["Blocked"]
    V --> X
    T --> X
    X -->|"Gỡ blocker + xét lại scope"| R
~~~

| Chuyển trạng thái | Điều kiện |
|---|---|
| Backlog→Ready | Scope/AC/files rõ, dependencies bắt buộc Done, env/input sẵn, estimate phù hợp capacity |
| Ready→In Progress | Solo chọn ticket; có executor, branch và giới hạn file; còn WIP |
| In Progress→In Review | Có diff/deliverables, self-check và kết quả lệnh; chưa gọi Done chỉ vì AI nói xong |
| In Review→Testing | Solo review code/architecture/security; không còn yêu cầu sửa chặn test |
| Testing→Done | Tests/AC/DoD đạt, evidence lưu, tích hợp vào baseline và Solo nghiệm thu |
| Review/Testing→In Progress | Có repro/feedback cụ thể, giữ ticket ID và cập nhật effort còn lại |
| Bất kỳ trạng thái đang làm→Blocked | Thiếu input/quyền/tool/dependency thật sự; ghi blocker, người xử lý, ngày kiểm tra lại |
| Blocked→Ready | Có bằng chứng gỡ blocker; re-estimate và dependency check lại |

Trên GitHub Projects có thể tạo trường Priority, Classification, Epic, Feature, Sprint/Iteration, Start/Due, Human Hours, AI Estimate, Executor, Dependencies. **Status field** là nguồn trạng thái; label blocked/needs-review chỉ hỗ trợ lọc, tránh hai trạng thái mâu thuẫn. Tài liệu này không tạo board/issue tự động.

### 4.2. Nhịp làm việc và Git

| Hoạt động | Cách thực hiện |
|---|---|
| Weekly Planning, 20–30 phút | Rà capacity thực, chọn P0, chốt goal/dependency, giảm P1 nếu buffer bị dùng |
| Daily Planning, 5–10 phút | Chọn 1 ticket chính, tối đa 2 đang làm; cập nhật actual/remaining/blocker |
| Review mỗi ticket | Xem diff, chạy kiểm chứng, so ports/import/transaction/scope; AI không tự nghiệm thu |
| Sprint Review, 20–30 phút | Demo vertical slice; đọc AC/evidence; ticket chưa đạt đưa lại backlog |
| Retrospective, 10–15 phút | So estimate/actual, thời gian AI rework, blocker/dependency; sửa kế hoạch Sprint sau |
| Git | main ổn định; nhánh theo ticket/Feature tại §4.6; mỗi phần việc hoàn chỉnh phải commit → kiểm tra đạt → push rồi mới làm tiếp theo §4.8; PR khi hữu ích; không merge suite liên quan đang fail |

Thời gian lập kế hoạch/điều phối và gián đoạn nằm trong buffer ở §12; thời gian review/test từng ticket đã ở estimate. Không mở thêm agent/branch trùng file khi chưa có phân công rõ. Dependency cùng ngày phải hoàn tất trước bước sau theo thứ tự §9.3.

### 4.3. Labels

| Trục | Labels và quy tắc |
|---|---|
| Type | type:feature, type:task, type:bug, type:test, type:documentation |
| Area | area:frontend, area:backend, area:database, area:architecture, area:devops, area:ui-ux, area:security |
| Priority | priority:P0 = giữ baseline; priority:P1 = có thể cắt/hoãn; priority:P2 = ngoài lịch baseline |
| Classification | core, supporting, documentation; mỗi ticket một phân loại chính |
| Status bổ trợ | blocked, needs-review chỉ thêm khi đúng trạng thái |
| Milestone | milestone:M2 cho backlog này; P2 chưa có sprint không tự có deadline 01/12 |

P0 không đồng nghĩa CORE: tài liệu, security tests, foundation và submission có thể P0/SUPPORTING hoặc DOCUMENTATION. CORE là nghiệp vụ module, không là chứng nhận đã hoàn thành.

### 4.4. Vai trò Junior Full Stack Developer và rules áp dụng

AI agent đóng vai **Junior Full Stack Developer**: nhận ticket, phân tích requirement, thực hiện đúng acceptance criteria (AC), tuân thủ rules đã cho và cung cấp bằng chứng kiểm tra. Agent có thể xử lý frontend, backend, contracts, database và tài liệu trong phạm vi ticket; Solo Developer vẫn là owner/reviewer và người nghiệm thu.

- Đọc [AGENTS.md](../AGENTS.md), hướng dẫn áp dụng tại thư mục sửa, ticket ở §8 và tài liệu nghiệp vụ/kiến trúc liên quan trước khi code. Yêu cầu trực tiếp mới nhất của người dùng có ưu tiên hơn hướng dẫn cũ; nếu requirement còn mâu thuẫn ảnh hưởng kết quả, làm rõ trước phần việc phụ thuộc.
- Chỉ làm scope và deliverables được giao; không tự thêm feature, đổi stack/kiến trúc, refactor ngoài phạm vi hoặc chuyển ticket khác sang In Progress. Tự quyết chi tiết triển khai thông thường khi đã đủ dữ kiện.
- Tuân thủ bounded context và Clean Architecture: ORM entity nằm ở module sở hữu, một file `*.orm-entity.ts` cho mỗi entity; registry chỉ import và liệt kê; wire contracts ở `contracts/src/` không phụ thuộc framework/TypeORM. Thay đổi schema phải có migration/constraint plan, không dùng `synchronize`.
- Giữ quy ước UI, tokens và phân quyền đã chốt; khi ticket đi qua nhiều lớp, kiểm tra tính nhất quán giữa UI, API, contracts và persistence. Phân biệt dữ liệu thật, mock và phần chỉ thiết kế.
- Giữ nguyên thay đổi có sẵn của người dùng hoặc agent khác; không stage/commit lẫn file ngoài công việc. Nếu thay đổi chồng lên đúng file cần sửa, tách phần của mình bằng diff hoặc làm rõ phần sở hữu trước khi ghi đè.
- Không tự tạo thêm agent; chỉ phân công song song khi người dùng hoặc hướng dẫn áp dụng yêu cầu rõ, có ranh giới file và trách nhiệm tích hợp.

### 4.5. Quy trình từ nhận ticket đến bàn giao

1. **Nhận ticket:** xác định ID, Feature/Epic, mục tiêu, priority, dependencies, AC, deliverables và rules. Dùng ID có thật trong backlog; yêu cầu trực tiếp chưa có ID thì ghi lại nội dung được giao, không tự gán một `TMC-xxx` bất kỳ.
2. **Phân tích requirement:** tóm tắt expected behavior, input/output, luồng chính, trường hợp lỗi/quyền truy cập, phạm vi không làm và các lớp bị ảnh hưởng. Đối chiếu source hiện tại; đánh dấu AC đã có, cần sửa và cách kiểm chứng từng AC. Chỉ hỏi khi thiếu thông tin làm thay đổi hành vi hoặc chặn triển khai.
3. **Chia phần việc:** lập các phần nhỏ có kết quả kiểm chứng được, ghi file dự kiến sửa và lệnh kiểm tra thực tế có trong repo. Không coi placeholder hoặc code chưa chạy là phần việc hoàn thành.
4. **Tạo nhánh:** kiểm tra `git status`, nhánh hiện tại, base và remote; tạo hoặc tiếp tục đúng nhánh ticket theo §4.6 trước khi sửa. Với ticket mới, dùng base tích hợp đã thống nhất và cập nhật bằng fast-forward khi phù hợp; không tạo nhánh từ công việc khác chưa tích hợp. Working tree có thay đổi ngoài scope thì giữ nguyên, tách bằng worktree khi cần; không tự reset/stash/xóa chúng.
5. **Triển khai từng phần:** thực hiện đúng requirement/rules, xử lý cả trường hợp lỗi liên quan; hoàn tất vòng **code → commit → kiểm tra → push** ở §4.8 trước phần việc tiếp theo.
6. **Kiểm tra toàn ticket:** đối chiếu toàn bộ AC và DoD, chạy kiểm tra tích hợp liên quan; cập nhật docs/contracts nếu hành vi thay đổi. Mọi sửa đổi phát sinh cũng phải qua vòng commit → kiểm tra → push.
7. **Bàn giao:** báo ticket, nhánh, commit đã push, kết quả kiểm tra và phần còn thiếu theo §4.9; chuyển In Review khi có bằng chứng. Push thành công chưa đủ điều kiện Done; chỉ Done sau review, tích hợp baseline và Solo nghiệm thu theo §15.

### 4.6. Quy ước đặt tên nhánh

Áp dụng quy ước nhánh của dự án theo dạng phổ biến `<type>/<ticket-id>-<feature-code>-<short-description>`; đây là convention của repo, không phải định dạng bắt buộc của Git.

- `type`: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci` hoặc `chore`, theo mục đích chính.
- `ticket-id` và `feature-code`: dùng ID thật trong §7–8, viết thường trên nhánh, ví dụ `tmc-014`, `e01`.
- `short-description`: tiếng Anh ngắn gọn, chữ thường, phân tách bằng dấu `-`; không có khoảng trắng, dấu tiếng Việt hoặc tên mơ hồ như `update`, `final`, `new-branch`.
- Một ticket có thể có nhiều commit trên cùng nhánh; không tạo nhánh cho từng file/commit. Tiếp tục đúng nhánh nếu ticket đã có nhánh.
- Khi yêu cầu trực tiếp chưa có ticket/Feature ID, dùng `<type>/<short-description>`, ví dụ `docs/workflow-ticket-delivery-process`; không bịa ID hoặc tạo remote issue để đủ tên.

| Công việc | Tên nhánh mẫu |
|---|---|
| TMC-014, Feature E01: lưu attempt idempotent | `feat/tmc-014-e01-persist-idempotent-attempt` |
| Sửa lỗi replay trong TMC-015, Feature C02 | `fix/tmc-015-c02-prevent-qr-replay` |
| TMC-001, Feature I01: làm rõ scope | `docs/tmc-001-i01-clarify-m2-scope` |

Không code trực tiếp hoặc push công việc ticket lên `main`; không tự merge, force-push hay viết lại lịch sử đã chia sẻ.

### 4.7. Quy ước commit — Conventional Commits

Mỗi commit chứa **một phần việc hoàn chỉnh có mục đích rõ ràng**, có thể review và kiểm chứng riêng. Không đợi hết ticket mới commit tất cả; không tạo commit cho mỗi thao tác lưu file.

```text
<type>(<scope>): <description>

<body giải thích lý do hoặc ảnh hưởng khi cần>

Refs: <ticket-id>
```

| Type | Khi sử dụng |
|---|---|
| `feat` | Thêm hành vi/tính năng |
| `fix` | Sửa lỗi |
| `docs` | Chỉ thay đổi tài liệu |
| `refactor` | Đổi cấu trúc, giữ hành vi |
| `test` | Thêm/sửa kiểm thử |
| `perf` | Cải thiện hiệu năng |
| `build`, `ci` | Thay đổi build/dependency hoặc CI |
| `style`, `chore`, `revert` | Định dạng không đổi hành vi, bảo trì hoặc hoàn tác commit |

- `scope` là module/phạm vi như `iam`, `eqr`, `att`, `client`, `api`, `contracts`, `db`, `workflow`; có thể bỏ nếu không có scope phù hợp.
- Description viết tiếng Anh, bắt đầu bằng động từ dạng mệnh lệnh, nêu kết quả cụ thể, không chấm cuối câu; ưu tiên cả dòng đầu không quá 72 ký tự. Tránh `update code`, `fix bug`, `done`, `WIP`.
- Footer `Refs: TMC-xxx` liên kết ticket có thật; bỏ footer nếu yêu cầu chưa có ID. Không dùng `Closes` khi chưa đủ điều kiện đóng ticket.
- Thay đổi phá vỡ tương thích phải nằm trong requirement được chấp thuận; dùng `!` sau type/scope và mô tả `BREAKING CHANGE:` trong footer khi có.

```text
feat(eqr): issue short-lived QR tokens

Refs: TMC-010
```

Ví dụ khác: `fix(eqr): reject redeemed QR tokens`, `test(att): cover duplicate passage events`, `docs(workflow): define ticket delivery process`.

### 4.8. Vòng bắt buộc cho mỗi phần việc: commit → kiểm tra → push

1. **Hoàn tất phần việc và xem diff:** dùng `git diff`, kiểm tra đúng scope/requirement, không có secret hoặc file sinh ngoài ý muốn. Stage bằng đường dẫn cụ thể hoặc hunk; không dùng `git add .` khi working tree còn thay đổi ngoài phạm vi. Xem `git diff --cached` trước commit để bảo đảm chỉ chứa phần mình làm.
2. **Commit ngay phần việc vừa xong** theo §4.7. Nếu hook từ chối, sửa nguyên nhân rồi commit lại, không bỏ qua hook. Ghi nhận hash commit để gắn kết quả kiểm tra.
3. **Kiểm tra commit vừa tạo:** chạy `git show --stat HEAD`, `git diff --check HEAD^ HEAD` và các lệnh phù hợp với phần thay đổi. Kiểm tra nội dung/link với docs; typecheck/build và test hành vi liên quan với code; migration/constraint với schema; kiểm tra tích hợp các lớp khi thay đổi đi qua nhiều lớp. Dùng scripts/config hiện có, không bịa lệnh test hoặc báo pass khi chưa chạy. Giữ nguyên trạng thái file đã kiểm tra; nếu sinh thêm thay đổi cần lưu, commit rồi kiểm tra lại trước push.
4. **Nếu fail:** giữ commit ở local, sửa trên cùng nhánh, tạo commit sửa lỗi và chạy lại kiểm tra bị ảnh hưởng. Không push hoặc chuyển sang phần việc kế tiếp khi kiểm tra bắt buộc còn fail. Thiếu môi trường/dependency thì báo chính xác kiểm tra chưa chạy và blocker; không ghi là đạt.
5. **Nếu đạt thì push:** lần đầu dùng `git push -u origin <branch>`, các lần sau `git push origin <branch>`. Việc nhận ticket kèm workflow này cho phép commit/push lên nhánh ticket của repo hiện tại; không cần xin xác nhận lại từng phần đã được giao. Vẫn tuân thủ quyền thực thi của môi trường; push không bao hàm quyền merge/release/deploy.
6. **Xác nhận push thành công rồi mới làm tiếp:** kiểm tra mã thoát của lệnh push và đối chiếu hash remote với local, ví dụ `git ls-remote --exit-code origin refs/heads/<branch>` so với `git rev-parse HEAD`. Nếu push lỗi, xử lý lỗi mạng/quyền theo quyền hiện có; nếu remote có commit mới thì fetch, review và tích hợp phù hợp, kiểm tra lại rồi push bình thường. Không force-push; nếu chưa giải quyết được thì dừng phần việc phụ thuộc và báo blocker. Không chạy vòng retry vô hạn.

Ví dụ các lệnh cho một phần việc của TMC-014; thay đường dẫn/lệnh kiểm tra bằng file và scripts thực tế của ticket, chạy từng bước và đọc kết quả trước bước kế tiếp:

```sh
git status --short
git diff
git add -- <file-thuoc-phan-viec>
git diff --cached
git commit -m "feat(att): persist idempotent scan attempts" -m "Refs: TMC-014"
git show --stat HEAD
git diff --check HEAD^ HEAD
# Chạy build/typecheck/test liên quan có trong repo; chỉ push khi đạt.
git push -u origin feat/tmc-014-e01-persist-idempotent-attempt
git ls-remote --exit-code origin refs/heads/feat/tmc-014-e01-persist-idempotent-attempt
git rev-parse HEAD
```

### 4.9. Mẫu báo cáo bàn giao ticket

```text
Ticket / Feature: ID thật hoặc yêu cầu trực tiếp được giao
Requirement / AC: kết quả cần đạt và trạng thái từng tiêu chí
Branch: tên nhánh theo §4.6
Changes: các phần việc đã hoàn thành, file/module và lý do
Commits: hash + message từng phần; trạng thái đã push/chưa push
Verification: lệnh đã chạy, kết quả thực tế, commit được kiểm tra
Remote: nhánh remote và hash đã xác nhận sau push
Remaining / blockers: phần chưa làm, kiểm tra chưa chạy và lý do
Status / next: In Review hoặc Blocked và bước xử lý cụ thể
```

<a id="s5"></a>

## 5. Feature Breakdown / Epic List — Cấu trúc backlog

Mỗi Feature có user story thể hiện trong ticket §8; thứ tự ticket xét **dependency trước, độ khó sau**. Độ khó Easy/Medium/Hard là rủi ro kỹ thuật, không phải số giờ. Không dùng Story Points trong kế hoạch này để tránh quy đổi giả sang giờ.

| Epic | Mục tiêu | Features | Ticket theo thứ tự nghiệp vụ | Human hours: baseline / toàn backlog |
|---|---|---|---|---|
| A — Project Setup & Foundation | Foundation tái lập | A01, A02, A03, A04 | [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-004](#tmc-004), [TMC-005](#tmc-005) | 14 / 14 |
| B — Authentication & Employee Foundation | Định danh và quyền server | B01, B02, B03 | [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-043](#tmc-043) | 7 / 13 |
| C — QR Credential Management | QR ký, thời hạn và replay | C01, C02, C03 | [TMC-009](#tmc-009), [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-015](#tmc-015), [TMC-017](#tmc-017) | 13 / 13 |
| D — Gate Kiosk & Access Control | Kiosk, policy và command | D01, D02, D03 | [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-018](#tmc-018), [TMC-027](#tmc-027) | 14 / 14 |
| E — Attendance Event Recording | Lưu nguồn công và tra cứu | E01, E02, E03 | [TMC-014](#tmc-014), [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-040](#tmc-040) | 12 / 20 |
| F — Failure Handling & Recovery | Mất mạng, UNKNOWN và đối soát | F01, F02, F03 | [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-042](#tmc-042) | 14 / 30 |
| G — Dashboard & Monitoring | Quan sát vận hành, báo cáo | G01, G02 | [TMC-028](#tmc-028), [TMC-039](#tmc-039), [TMC-041](#tmc-041) | 2 / 17 |
| H — Testing & Quality Assurance | Bằng chứng kiểm thử | H01, H02, H03, H04 | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-038](#tmc-038) | 15 / 15 |
| I — Documentation & Submission | Thiết kế/SOLID/bài nộp | I01, I02, I03 | [TMC-001](#tmc-001), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-037](#tmc-037) | 15 / 15 |

Phân rã ví dụ: **Epic C → C02 QR validation/chống replay → user story người có quyền mới được qua cổng → TMC-011 validator và TMC-015 redemption**. Crypto validation có thể test độc lập; atomic redemption phụ thuộc chuẩn bị attempt nên làm sau, không ghép thành một ticket “làm QR”.

<a id="s6"></a>

## 6. Feature Priority Matrix — Ưu tiên Feature

Effort là tổng giờ người của ticket thuộc Feature, không cộng thêm lần nữa vào ticket. “P0 + P1” nghĩa Feature có phần P0 và phần mở rộng P1; xem từng ticket trước khi cắt scope. Features chỉ P2 chưa được xếp Sprint.

| Epic | Feature | Complexity | Priority | CORE | Dependencies | Estimated Effort | Target Sprint |
|---|---|---|---|---|---|---|---|
| A | A01 — Tái cấu trúc client và workspace | Medium | P0 | SUPPORTING | [TMC-001](#tmc-001) | 3h | S1 |
| A | A02 — Backend Clean Architecture và API contract | Medium | P0 | SUPPORTING | [TMC-002](#tmc-002) | 3h | S1 |
| A | A03 — Database và migration lõi | Hard | P0 | SUPPORTING | [TMC-003](#tmc-003) | 6h | S1 |
| A | A04 — Môi trường kiểm thử, CI và OpenAPI | Medium | P0 | SUPPORTING | [TMC-003](#tmc-003), [TMC-004](#tmc-004) | 2h | S1 |
| B | B01 — Định danh, seed, session và RBAC tối thiểu | Hard | P0 | SUPPORTING | [TMC-004](#tmc-004), [TMC-005](#tmc-005) | 5h | S1 |
| B | B02 — Đăng nhập frontend và protected routes | Medium | P0 | SUPPORTING | [TMC-007](#tmc-007), [TMC-002](#tmc-002) | 2h | S1 |
| B | B03 — Giao diện quản trị IAM đầy đủ | Medium | P2 | SUPPORTING | [TMC-007](#tmc-007), [TMC-008](#tmc-008) | 6h | Sau M2, chưa cam kết |
| C | C01 — Credential, khóa ký và phát hành/thu hồi QR | Hard | P0 | CORE | [TMC-004](#tmc-004), [TMC-006](#tmc-006), [TMC-007](#tmc-007) | 5h | S1, S2 |
| C | C02 — QR validation và chống replay | Hard | P0 | CORE | [TMC-010](#tmc-010), [TMC-014](#tmc-014) | 6h | S2 |
| C | C03 — QR cá nhân trên Employee Portal | Medium | P0 | CORE | [TMC-010](#tmc-010), [TMC-008](#tmc-008) | 2h | S2 |
| D | D01 — Access policy và cấu hình trạm | Medium | P0 | CORE | [TMC-006](#tmc-006), [TMC-011](#tmc-011) | 2h | S2 |
| D | D02 — Mock TCS và state machine command | Hard | P0 | CORE | [TMC-003](#tmc-003), [TMC-005](#tmc-005), [TMC-014](#tmc-014), [TMC-015](#tmc-015) | 7h | S2 |
| D | D03 — Virtual kiosk, kết quả và webcam | Medium | P0 + P1 | CORE | [TMC-016](#tmc-016), [TMC-017](#tmc-017) | 5h | S2, S3 |
| E | E01 — Attempt idempotency và attendance ledger | Hard | P0 | CORE | [TMC-004](#tmc-004), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-016](#tmc-016) | 8h | S2, S3 |
| E | E02 — Tra cứu trạng thái, lịch sử và chi tiết | Medium | P0 | CORE | [TMC-019](#tmc-019), [TMC-007](#tmc-007), [TMC-008](#tmc-008) | 4h | S3 |
| E | E03 — Hiệu chỉnh công có version | Hard | P2 | SUPPORTING | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-007](#tmc-007) | 8h | Sau M2, chưa cam kết |
| F | F01 — Kiến trúc mất mạng và journal kiosk | Hard | P0 | CORE | [TMC-016](#tmc-016), [TMC-018](#tmc-018), [TMC-020](#tmc-020) | 5h | S3 |
| F | F02 — Worker, UNKNOWN, đối soát và failure simulation | Hard | P0 | CORE | [TMC-019](#tmc-019), [TMC-022](#tmc-022), [TMC-007](#tmc-007), [TMC-020](#tmc-020), [TMC-013](#tmc-013), [TMC-016](#tmc-016) | 9h | S3 |
| F | F03 — Edge tự động offline | Hard | P2 | SUPPORTING | [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030) | 16h | Sau M2, chưa cam kết |
| G | G01 — Dashboard cơ bản, bộ lọc và trạng thái cổng | Medium | P1 | SUPPORTING | [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-025](#tmc-025), [TMC-024](#tmc-024) | 5h | S3, Sau M2, chưa cam kết |
| G | G02 — Xuất tháng HRS hoàn chỉnh | Hard | P2 | SUPPORTING | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-040](#tmc-040) | 12h | Sau M2, chưa cam kết |
| H | H01 — Kiểm thử module chính | Hard | P0 | SUPPORTING | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-015](#tmc-015) | 3h | S4 |
| H | H02 — Kiểm thử concurrency và recovery | Hard | P0 | SUPPORTING | [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-029](#tmc-029) | 4h | S4 |
| H | H03 — Hiệu năng, RBAC và dữ liệu cá nhân | Hard | P0 | SUPPORTING | [TMC-030](#tmc-030), [TMC-007](#tmc-007) | 3h | S4 |
| H | H04 — E2E, UI verification và ổn định bản nộp | Hard | P0 | SUPPORTING | [TMC-021](#tmc-021), [TMC-023](#tmc-023), [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-035](#tmc-035), [TMC-036](#tmc-036) | 5h | S4 |
| I | I01 — Baseline FR/NFR, kiến trúc và ba views | Hard | P0 | DOCUMENTATION | [TMC-022](#tmc-022), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-031](#tmc-031) | 6h | S1, S4 |
| I | I02 — Bằng chứng SOLID và reflection | Medium | P0 | DOCUMENTATION | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-030](#tmc-030) | 4h | S4 |
| I | I03 — Runbook, báo cáo và nộp bài | Medium | P0 | DOCUMENTATION | [TMC-005](#tmc-005), [TMC-032](#tmc-032), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-038](#tmc-038) | 5h | S4 |

<a id="s7"></a>

## 7. Complete Product Backlog — Backlog đầy đủ

**Estimate = tổng giờ người đã bao gồm implementation, review, integration, test và tài liệu**, không bao gồm giờ máy/AI riêng. Trong 43 ticket: **36 P0, 3 P1, 4 P2; 18 CORE, 18 SUPPORTING, 7 DOCUMENTATION**. P0=102h; P1=7h; P2=42h. TMC-027/028 được chọn baseline; TMC-039…043 hoãn **45h**, chưa cam kết Start/Due, không giả đặt trong lịch đã đầy.

| ID | Epic | Feature/Ticket | Priority | CORE | Labels | Estimate (hours) | Dependencies | Owner | Executor | Sprint | Due Date | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [TMC-001](#tmc-001) | I | I01: Chốt scope M2 và ma trận FR/NFR | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 2 | Không có | Solo Developer | Architecture Agent | S1 | 04/11/2026 | Backlog |
| [TMC-002](#tmc-002) | A | A01: Chuyển frontend sang client và bảo toàn Figma preview | P0 | SUPPORTING | type:task, area:frontend, priority:P0, supporting, milestone:M2 | 3 | [TMC-001](#tmc-001) | Solo Developer | Frontend Agent | S1 | 05/11/2026 | Backlog |
| [TMC-003](#tmc-003) | A | A02: Dựng NestJS và hợp đồng ports/API | P0 | SUPPORTING | type:task, area:backend, priority:P0, supporting, milestone:M2 | 3 | [TMC-002](#tmc-002) | Solo Developer | Backend Agent | S1 | 05/11/2026 | Backlog |
| [TMC-004](#tmc-004) | A | A03: Tạo migration PostgreSQL cho vertical slice | P0 | SUPPORTING | type:task, area:database, priority:P0, supporting, milestone:M2 | 6 | [TMC-003](#tmc-003) | Solo Developer | Database Agent | S1 | 06/11/2026 | Backlog |
| [TMC-005](#tmc-005) | A | A04: Dựng test harness, CI và OpenAPI nền | P0 | SUPPORTING | type:task, area:devops, priority:P0, supporting, milestone:M2 | 2 | [TMC-003](#tmc-003), [TMC-004](#tmc-004) | Solo Developer | DevOps Agent | S1 | 07/11/2026 | Backlog |
| [TMC-006](#tmc-006) | B | B01: Seed định danh, scope và cấu hình trạm IN/OUT | P0 | SUPPORTING | type:task, area:database, priority:P0, supporting, milestone:M2 | 2 | [TMC-004](#tmc-004) | Solo Developer | Database Agent | S1 | 07/11/2026 | Backlog |
| [TMC-007](#tmc-007) | B | B01: Xác thực session và RBAC phía server | P0 | SUPPORTING | type:task, area:backend, area:security, priority:P0, supporting, milestone:M2 | 3 | [TMC-005](#tmc-005), [TMC-006](#tmc-006) | Solo Developer | Backend Agent | S1 | 09/11/2026 | Backlog |
| [TMC-008](#tmc-008) | B | B02: Kết nối đăng nhập thật và route guard | P0 | SUPPORTING | type:task, area:frontend, priority:P0, supporting, milestone:M2 | 2 | [TMC-007](#tmc-007), [TMC-002](#tmc-002) | Solo Developer | Frontend Agent | S1 | 10/11/2026 | Backlog |
| [TMC-009](#tmc-009) | C | C01: Tạo credential và metadata khóa ký QR | P0 | CORE | type:task, area:backend, area:security, priority:P0, core, milestone:M2 | 2 | [TMC-004](#tmc-004), [TMC-006](#tmc-006) | Solo Developer | Backend Agent | S1 | 10/11/2026 | Backlog |
| [TMC-010](#tmc-010) | C | C01: Cấp token QR ngắn hạn và thu hồi credential | P0 | CORE | type:feature, area:backend, area:security, priority:P0, core, milestone:M2 | 3 | [TMC-009](#tmc-009), [TMC-007](#tmc-007) | Solo Developer | Backend Agent | S2 | 11/11/2026 | Backlog |
| [TMC-011](#tmc-011) | C | C02: Xác minh chữ ký, claims và hạn QR | P0 | CORE | type:feature, area:backend, area:security, priority:P0, core, milestone:M2 | 3 | [TMC-010](#tmc-010) | Solo Developer | Backend Agent | S2 | 11/11/2026 | Backlog |
| [TMC-012](#tmc-012) | D | D01: Thực thi access policy từ cấu hình server | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 2 | [TMC-006](#tmc-006), [TMC-011](#tmc-011) | Solo Developer | Backend Agent | S2 | 12/11/2026 | Backlog |
| [TMC-013](#tmc-013) | D | D02: Xây Mock Turnstile Gateway có fault modes | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 3 | [TMC-003](#tmc-003), [TMC-005](#tmc-005) | Solo Developer | Backend Agent | S2 | 12/11/2026 | Backlog |
| [TMC-014](#tmc-014) | E | E01: Lưu attempt idempotent trước khi mở cổng | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 4 | [TMC-004](#tmc-004), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013) | Solo Developer | Backend Agent | S2 | 13/11/2026 | Backlog |
| [TMC-015](#tmc-015) | C | C02: Chặn QR exposure/replay bằng redemption nguyên tử | P0 | CORE | type:feature, area:backend, area:security, priority:P0, core, milestone:M2 | 3 | [TMC-014](#tmc-014), [TMC-010](#tmc-010) | Solo Developer | Backend Agent | S2 | 14/11/2026 | Backlog |
| [TMC-016](#tmc-016) | D | D02: Claim CAS và điều phối command OPEN/CLOSE | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 4 | [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015) | Solo Developer | Backend Agent | S2 | 16/11/2026 | Backlog |
| [TMC-017](#tmc-017) | C | C03: Thay QR tự sinh bằng QR server trên portal | P0 | CORE | type:feature, area:frontend, priority:P0, core, milestone:M2 | 2 | [TMC-010](#tmc-010), [TMC-008](#tmc-008) | Solo Developer | Frontend Agent | S2 | 14/11/2026 | Backlog |
| [TMC-018](#tmc-018) | D | D03: Nối Virtual Kiosk với API và trạng thái thật | P0 | CORE | type:feature, area:frontend, priority:P0, core, milestone:M2 | 3 | [TMC-016](#tmc-016), [TMC-017](#tmc-017) | Solo Developer | Frontend Agent | S2 | 17/11/2026 | Backlog |
| [TMC-019](#tmc-019) | E | E01: Ghi attendance và revision gốc theo bằng chứng | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 4 | [TMC-016](#tmc-016) | Solo Developer | Backend Agent | S3 | 18/11/2026 | Backlog |
| [TMC-020](#tmc-020) | E | E02: Cung cấp status lookup và lịch sử có scope | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 2 | [TMC-019](#tmc-019), [TMC-007](#tmc-007) | Solo Developer | Backend Agent | S3 | 19/11/2026 | Backlog |
| [TMC-021](#tmc-021) | E | E02: Kết nối lịch sử cá nhân và chi tiết lượt quét | P0 | CORE | type:feature, area:frontend, priority:P0, core, milestone:M2 | 2 | [TMC-020](#tmc-020), [TMC-008](#tmc-008) | Solo Developer | Frontend Agent | S3 | 19/11/2026 | Backlog |
| [TMC-022](#tmc-022) | F | F01: Hoàn thiện Network Failure Architecture và ADR | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 2 | [TMC-016](#tmc-016) | Solo Developer | Architecture Agent | S3 | 18/11/2026 | Backlog |
| [TMC-023](#tmc-023) | F | F01: Lưu journal metadata và phục hồi eventId ở kiosk | P0 | CORE | type:feature, area:frontend, priority:P0, core, milestone:M2 | 3 | [TMC-018](#tmc-018), [TMC-020](#tmc-020), [TMC-022](#tmc-022) | Solo Developer | Frontend Agent | S3 | 20/11/2026 | Backlog |
| [TMC-024](#tmc-024) | F | F02: Chạy durable worker đối soát UNKNOWN có fencing | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 4 | [TMC-019](#tmc-019), [TMC-022](#tmc-022), [TMC-026](#tmc-026) | Solo Developer | Backend Agent | S3 | 21/11/2026 | Backlog |
| [TMC-025](#tmc-025) | F | F02: Tạo API và màn hình SEC đối soát tối thiểu | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 3 | [TMC-024](#tmc-024), [TMC-007](#tmc-007), [TMC-020](#tmc-020) | Solo Developer | Backend Agent | S3 | 23/11/2026 | Backlog |
| [TMC-026](#tmc-026) | F | F02: Tạo kịch bản mất mạng, mất ACK và crash | P0 | CORE | type:feature, area:backend, priority:P0, core, milestone:M2 | 2 | [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-022](#tmc-022) | Solo Developer | Testing/QA Agent | S3 | 20/11/2026 | Backlog |
| [TMC-027](#tmc-027) | D | D03: Gắn webcam hiện có vào contract quét thật | P1 | CORE | type:feature, area:frontend, priority:P1, core, milestone:M2 | 2 | [TMC-018](#tmc-018) | Solo Developer | Frontend Agent | S3 | 23/11/2026 | Backlog |
| [TMC-028](#tmc-028) | G | G01: Kết nối dashboard tối thiểu và factory filter | P1 | SUPPORTING | type:feature, area:frontend, priority:P1, supporting, milestone:M2 | 2 | [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-025](#tmc-025) | Solo Developer | Frontend Agent | S3 | 24/11/2026 | Backlog |
| [TMC-029](#tmc-029) | H | H01: Kiểm thử module chính trên PostgreSQL thật | P0 | SUPPORTING | type:test, area:backend, priority:P0, supporting, milestone:M2 | 3 | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-015](#tmc-015) | Solo Developer | Testing/QA Agent | S4 | 25/11/2026 | Backlog |
| [TMC-030](#tmc-030) | H | H02: Kiểm thử race, crash và phục hồi không mở lặp | P0 | SUPPORTING | type:test, area:backend, priority:P0, supporting, milestone:M2 | 4 | [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-029](#tmc-029) | Solo Developer | Testing/QA Agent | S4 | 26/11/2026 | Backlog |
| [TMC-031](#tmc-031) | H | H03: Đo tải kiosk và kiểm thử quyền/redaction | P0 | SUPPORTING | type:test, area:backend, area:security, priority:P0, supporting, milestone:M2 | 3 | [TMC-030](#tmc-030), [TMC-007](#tmc-007) | Solo Developer | Testing/QA Agent | S4 | 27/11/2026 | Backlog |
| [TMC-032](#tmc-032) | H | H04: Chạy E2E và đối chiếu giao diện hiện có | P0 | SUPPORTING | type:test, area:backend, priority:P0, supporting, milestone:M2 | 2 | [TMC-021](#tmc-021), [TMC-023](#tmc-023) | Solo Developer | Testing/QA Agent | S4 | 28/11/2026 | Backlog |
| [TMC-033](#tmc-033) | I | I02: Gắn bằng chứng SOLID với source và tests | P0 | DOCUMENTATION | type:feature, area:architecture, priority:P0, documentation, milestone:M2 | 2 | [TMC-019](#tmc-019), [TMC-024](#tmc-024) | Solo Developer | Architecture Agent | S4 | 25/11/2026 | Backlog |
| [TMC-034](#tmc-034) | I | I02: Viết SOLID Reflection từ kết quả thực hiện | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 2 | [TMC-033](#tmc-033), [TMC-030](#tmc-030) | Solo Developer | Documentation Agent | S4 | 27/11/2026 | Backlog |
| [TMC-035](#tmc-035) | I | I01: Cập nhật kiến trúc, ADR và ba architectural views | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 4 | [TMC-001](#tmc-001), [TMC-022](#tmc-022), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-031](#tmc-031) | Solo Developer | Architecture Agent | S4 | 30/11/2026 | Backlog |
| [TMC-036](#tmc-036) | I | I03: Viết README, setup và kịch bản demo tái lập | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 2 | [TMC-005](#tmc-005), [TMC-032](#tmc-032) | Solo Developer | Documentation Agent | S4 | 30/11/2026 | Backlog |
| [TMC-037](#tmc-037) | I | I03: Đóng gói báo cáo M2 và chuẩn bị nộp LMS | P0 | DOCUMENTATION | type:documentation, area:architecture, priority:P0, documentation, milestone:M2 | 3 | [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-038](#tmc-038) | Solo Developer | Documentation Agent | S4 | 01/12/2026 | Backlog |
| [TMC-038](#tmc-038) | H | H04: Sửa blocker và xác nhận release candidate | P0 | SUPPORTING | type:test, area:backend, priority:P0, supporting, milestone:M2 | 3 | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-035](#tmc-035), [TMC-036](#tmc-036) | Solo Developer | Testing/QA Agent | S4 | 30/11/2026 | Backlog |
| [TMC-039](#tmc-039) | G | G01: Bổ sung heartbeat và metrics vận hành | P1 | SUPPORTING | type:feature, area:backend, priority:P1, supporting, milestone:M2 | 3 | [TMC-028](#tmc-028), [TMC-024](#tmc-024) | Solo Developer | Backend Agent | Deferred | Chưa xếp lịch — sau 01/12/2026 | Backlog |
| [TMC-040](#tmc-040) | E | E03: Mở rộng workflow HR correction có revision | P2 | SUPPORTING | type:feature, area:backend, priority:P2, supporting, milestone:M2 | 8 | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-007](#tmc-007) | Solo Developer | Backend Agent | Deferred | Chưa xếp lịch — sau 01/12/2026 | Backlog |
| [TMC-041](#tmc-041) | G | G02: Triển khai snapshot tháng và HRS delivery đầy đủ | P2 | SUPPORTING | type:feature, area:backend, priority:P2, supporting, milestone:M2 | 12 | [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-040](#tmc-040) | Solo Developer | Backend Agent | Deferred | Chưa xếp lịch — sau 01/12/2026 | Backlog |
| [TMC-042](#tmc-042) | F | F03: Khảo sát và prototype edge offline tự động | P2 | SUPPORTING | type:feature, area:architecture, priority:P2, supporting, milestone:M2 | 16 | [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030) | Solo Developer | Architecture Agent | Deferred | Chưa xếp lịch — sau 01/12/2026 | Backlog |
| [TMC-043](#tmc-043) | B | B03: Làm UI quản trị tài khoản/role toàn diện | P2 | SUPPORTING | type:feature, area:frontend, priority:P2, supporting, milestone:M2 | 6 | [TMC-007](#tmc-007), [TMC-008](#tmc-008) | Solo Developer | Frontend Agent | Deferred | Chưa xếp lịch — sau 01/12/2026 | Backlog |

<a id="s8"></a>

## 8. Ticket Breakdown with Checklists — Phiếu công việc chi tiết

Mọi ID ở §7 có một phiếu riêng dưới đây. Tên file/endpoint chưa tồn tại được hiểu là **đầu ra dự kiến**, không phải source đã tạo. Script kiểm chứng là **hợp đồng script cần thiết lập ở TMC-003/005**; hiện package.json gốc chưa có các script backend/test này. Không dùng lệnh được liệt kê dưới đây làm bằng chứng test đã chạy.

**Cách đọc effort mỗi phiếu:** H=người trực tiếp triển khai/điều phối kỹ thuật; R=review; I=integration; T=testing; D=documentation. Total=H+R+I+T+D. Review & Integration=R+I đã nằm trong Total. AI estimate là thời gian máy/agent dự kiến hoạt động, không cộng vào capacity và không đảm bảo rút ngắn lịch.

Ticket hoãn vẫn có scope/AC để sử dụng sau, nhưng chỉ chuyển Ready khi re-estimate, có capacity và Start/Due mới. Các ticket dựa chung file phải thực hiện tuần tự hoặc chia branch/file rõ ràng.

<a id="tmc-001"></a>

### TMC-001 — Chốt scope M2 và ma trận FR/NFR

**Overview**

- Epic: I — Documentation & Submission
- Feature: I01 — Baseline FR/NFR, kiến trúc và ba views
- User Story: Là người nộp bài, tôi muốn chốt module và bằng chứng cần có để không triển khai lệch M2.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Architecture Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0 + R 0.5 + I 0 + T 0 + D 1.5
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.5 + I 0), đã nằm trong tổng
- Start Date: 04/11/2026
- Due Date: 04/11/2026
- Dependencies: Không có
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/m2-scope.md, doc/requirements-traceability.md, doc/adr/; chỉ cập nhật tài liệu liên quan.
- Verification Commands: Đọc PDF M2, soát Markdown/link và ma trận bằng review tài liệu.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Đối chiếu M1 đã hoàn thành với đề M2; giữ NestJS, modular monolith và scope Gate Access & Attendance. Xác định ranh giới đo NFR, mock và các phần chỉ thiết kế.

**Implementation Tasks**

- [ ] Lập mapping FR/NFR → use case → ticket → evidence cho hai vấn đề mới của M2.
- [ ] Ghi ADR baseline: online R1, token ngắn hạn, sensor mock, station direction cố định và scope dữ liệu.
- [ ] Chốt 37 bảng migration nhưng chỉ triển khai API/UI của vertical slice; đánh dấu HRS/HR correction mở rộng.
- [ ] Ghi giả định deadline LMS, Figma nguồn, hợp đồng TCS và cách đo phản hồi ≤2 giây.

**Acceptance Criteria**

- [ ] Không bỏ thiếu Task 1, SOLID reflection, Task 2 và GitHub URL trong ma trận.
- [ ] Phân biệt yêu cầu PDF với lựa chọn nội bộ, mock và chức năng chưa hiện thực.
- [ ] Mỗi quyết định có nguồn M1/M2 hoặc giả định rõ ràng.

**Testing Checklist**

- [ ] Đối chiếu từng dòng Task 1/2 với PDF M2 trang 2–3.
- [ ] Kiểm tra liên kết, mã requirement và scope không mâu thuẫn schema/user-flow.
- [ ] Solo Developer đọc và chốt baseline trước khi mở ticket phụ thuộc.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Ma trận requirement và ADR baseline; không có code nghiệp vụ.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-002"></a>

### TMC-002 — Chuyển frontend sang client và bảo toàn Figma preview

**Overview**

- Epic: A — Project Setup & Foundation
- Feature: A01 — Tái cấu trúc client và workspace
- User Story: Là developer, tôi muốn client và api tách package để phát triển độc lập mà vẫn xem được prototype.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:frontend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 04/11/2026
- Due Date: 05/11/2026
- Dependencies: [TMC-001](#tmc-001)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/** từ src/, public/, index.html và config hiện tại; root package.json, pnpm-workspace.yaml, lockfile, .figma/make cấu hình entry khi cần.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client build; smoke test preview.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Di chuyển frontend hiện hữu theo cấu trúc đã chốt, giữ giao diện Astra/MUI. Chốt khả năng cung cấp Astra trong build độc lập; không viết lại mọi màn hình.

**Implementation Tasks**

- [ ] Lập mapping di chuyển và giữ root scripts tương thích preview Figma; chuyển frontend vào client/.
- [ ] Sửa Vite root, alias, static assets, Router basename và script workspace.
- [ ] Kiểm tra nguồn cấp @figma/astraui và kit đang thiếu trong manifest/môi trường; pin dependency có thể cài hợp lệ.
- [ ] Giữ token CSS, font, MUI bridge và chụp baseline các màn QR/kiosk/lịch sử.

**Acceptance Criteria**

- [ ] client build/typecheck được với đường dẫn assets đúng.
- [ ] Preview hiện hữu và entry dev không bị mất sau chuyển thư mục.
- [ ] Có nguồn dependency Astra tái lập được; nếu chưa có thì ticket Blocked với lý do, không ghi build đã pass.

**Testing Checklist**

- [ ] Chạy typecheck/build client từ workspace mới.
- [ ] Smoke test landing, login, mobile QR và kiosk trên preview.
- [ ] So light/dark, font và ảnh với baseline; thử refresh deep link.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- client/ hoạt động, workspace scripts, lockfile và bảng mapping di chuyển.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-003"></a>

### TMC-003 — Dựng NestJS và hợp đồng ports/API

**Overview**

- Epic: A — Project Setup & Foundation
- Feature: A02 — Backend Clean Architecture và API contract
- User Story: Là developer, tôi muốn lõi nghiệp vụ độc lập framework để thay adapter và test được.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:backend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 05/11/2026
- Due Date: 05/11/2026
- Dependencies: [TMC-002](#tmc-002)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/package.json, api/tsconfig*, api/src/bootstrap/**, api/src/shared/**, api/src/modules/*/{domain,application,presentation,infrastructure}/; doc/openapi.yaml.
- Verification Commands: pnpm --dir api typecheck; pnpm --dir api build; pnpm --dir api test -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo package NestJS theo Clean Architecture; API contract tối thiểu cho auth, QR, scan, lookup và history. Dùng use case thuần TS, composition root chịu wiring.

**Implementation Tasks**

- [ ] Dựng Nest bootstrap, health endpoint và config validation không lộ secret.
- [ ] Định nghĩa Clock, IdGenerator, UnitOfWork/TransactionContext, QrValidator, TurnstileGateway, AttendanceWriter và AuditWriter.
- [ ] Định nghĩa DTO/error codes/correlationId; tách decision, commandState và attendanceState.
- [ ] Đăng ký provider ở composition root; thêm script build/typecheck/test và ghi API schema.

**Acceptance Criteria**

- [ ] Health endpoint chạy, core không import Nest/TypeORM/HTTP types.
- [ ] Use case nhận port qua constructor; không có singleton mutable transaction manager.
- [ ] Scan/lookup contract giữ eventId và mô tả 409 payload conflict.

**Testing Checklist**

- [ ] Build/typecheck api.
- [ ] Unit smoke test khởi tạo use case với fake ports.
- [ ] Kiểm tra dependency/import của domain và application.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Skeleton api/; contract ports; health và OpenAPI draft.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-004"></a>

### TMC-004 — Tạo migration PostgreSQL cho vertical slice

**Overview**

- Epic: A — Project Setup & Foundation
- Feature: A03 — Database và migration lõi
- User Story: Là developer, tôi muốn database có khóa và transaction đúng để request đồng thời không gây dữ liệu trùng.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:database, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Database Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 6h tổng = H 2.5 + R 0.75 + I 0.75 + T 1.5 + D 0.5
- Estimated AI-Assisted Effort: 2h máy/agent, không cộng capacity người
- Review & Integration Effort: 1.5h (R 0.75 + I 0.75), đã nằm trong tổng
- Start Date: 06/11/2026
- Due Date: 06/11/2026
- Dependencies: [TMC-003](#tmc-003)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/shared/infrastructure/database/**, api/src/modules/*/infrastructure/persistence/**, compose.yaml, .env.example; doc/schema-database.md nếu có quyết định thay đổi.
- Verification Commands: docker compose up -d postgres; pnpm --dir api migration:run; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Chuyển schema đã duyệt thành migrations có thứ tự. Tạo cấu trúc 37 bảng để không bỏ FK vòng/dependency; chưa tạo CRUD cho các module mở rộng.

**Implementation Tasks**

- [ ] Viết manifest 37 bảng, mapping property/type, PK/UK/FK và tách vòng tham chiếu bằng ALTER TABLE.
- [ ] Thêm partial UNIQUE station/event, OPEN/attempt, redemption, sourceId và FK deferred ledger/correction.
- [ ] Triển khai TypeORM UnitOfWork, transaction context riêng và repository dùng đúng transactional manager.
- [ ] Tạo PostgreSQL dev/test riêng, synchronize:false, env mẫu và migration run/revert trên DB tạm.

**Acceptance Criteria**

- [ ] Migration chạy từ DB rỗng; mọi FK có bảng/khóa đích đúng kiểu.
- [ ] Insert Event+revision 1 commit được; thiếu revision và vi phạm unique bị chặn.
- [ ] Rollback UnitOfWork không để audit/command/attendance lưu một phần.

**Testing Checklist**

- [ ] Chạy migration trên PostgreSQL test rỗng; so catalog với 37 bảng schema.
- [ ] Thử vi phạm PK/FK/UK/partial unique và deferred head.
- [ ] Thử hai transaction song song và lỗi giữa transaction; không dùng SQLite thay tính năng PG.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Migrations, ORM mappers, UnitOfWork, compose/env và log kiểm chứng DB.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-005"></a>

### TMC-005 — Dựng test harness, CI và OpenAPI nền

**Overview**

- Epic: A — Project Setup & Foundation
- Feature: A04 — Môi trường kiểm thử, CI và OpenAPI
- User Story: Là reviewer, tôi muốn có lệnh kiểm chứng tái lập để review code do AI tạo.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:devops, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: DevOps Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 07/11/2026
- Due Date: 07/11/2026
- Dependencies: [TMC-003](#tmc-003), [TMC-004](#tmc-004)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: .github/workflows/ci.yml, api/test/**, api/package.json, client/package.json, test cấu hình, doc/openapi.yaml.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand; kiểm tra CI khi được push.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Thiết lập công cụ kiểm thử và CI từ đầu, tách DB test khỏi dữ liệu dev. Chỉ thêm công cụ phục vụ P0; không xây nền DevOps lớn.

**Implementation Tasks**

- [ ] Tạo unit runner và integration runner dùng PostgreSQL test; thêm fixture/reset có kiểm soát.
- [ ] Thêm scripts typecheck, test, test:integration cho api và test:e2e cho client.
- [ ] Tạo CI install bằng lockfile, build hai app, migration/test với PG service và artifact kết quả.
- [ ] Xuất OpenAPI/contract check và ghi danh mục script ở README kỹ thuật.

**Acceptance Criteria**

- [ ] Một integration test thực sự kết nối PG và rollback fixture.
- [ ] CI/script fail khi assertion fail, không bỏ qua lỗi bằng catch hoặc continue-on-error.
- [ ] Không commit secrets và không chạy reset vào DB vận hành.

**Testing Checklist**

- [ ] Chạy pipeline local tương ứng; tạo test fail tạm rồi khôi phục để kiểm tra exit code.
- [ ] Xác minh env test độc lập và migrations dùng đúng DB.
- [ ] Validate OpenAPI và health response.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- CI nền, test harness và hợp đồng API có lệnh kiểm tra.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-006"></a>

### TMC-006 — Seed định danh, scope và cấu hình trạm IN/OUT

**Overview**

- Epic: B — Authentication & Employee Foundation
- Feature: B01 — Định danh, seed, session và RBAC tối thiểu
- User Story: Là người demo, tôi muốn seed đủ hai nhà máy và role để thử cả cho phép lẫn từ chối.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:database, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Database Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Easy
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 07/11/2026
- Due Date: 07/11/2026
- Dependencies: [TMC-004](#tmc-004)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/shared/infrastructure/database/seeds/**, api/test/fixtures/**, doc/demo-accounts.md.
- Verification Commands: pnpm --dir api seed:demo; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo dữ liệu server có UUID ổn định; không nhập session/localStorage hiện tại làm nguồn tin cậy. Giữ sáu actor chuẩn của M1.

**Implementation Tasks**

- [ ] Seed BD/LA, department/team, employee/assignment và access grants khác nhau.
- [ ] Seed EMP/HR/SUP/SEC/ADM/EXE và permission/scope tối thiểu; map hai role security prototype về SEC theo permission.
- [ ] Seed trạm riêng IN/OUT, endpoint mock TCS, station credential và config version.
- [ ] Seed tài khoản bằng hash mật khẩu; lưu secret trạm qua env và hướng dẫn reset DB demo riêng.

**Acceptance Criteria**

- [ ] Employee tổ chức BD có thể có grant LA; access không suy từ site duy nhất.
- [ ] Trạm quyết định direction tại server, client không được sửa nhà máy/hướng.
- [ ] Có nhân viên inactive, revoked và out-of-scope phục vụ negative tests.

**Testing Checklist**

- [ ] Seed hai lần không tạo trùng dữ liệu định danh.
- [ ] Query kiểm tra FK tổ chức và mỗi role/scope.
- [ ] Kiểm tra không có mật khẩu hoặc credential thô trong git/log.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Seed tái lập; tài khoản demo; manifest station IDs và fixture scenarios.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-007"></a>

### TMC-007 — Xác thực session và RBAC phía server

**Overview**

- Epic: B — Authentication & Employee Foundation
- Feature: B01 — Định danh, seed, session và RBAC tối thiểu
- User Story: Là người dùng portal, tôi muốn server xác thực và giới hạn dữ liệu theo vai trò.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:backend, area:security, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 09/11/2026
- Due Date: 09/11/2026
- Dependencies: [TMC-005](#tmc-005), [TMC-006](#tmc-006)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/iam/**, api/src/bootstrap/security/**, api/test/auth*.ts; client chỉ sửa contract khi cần.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Đăng nhập session opaque token qua cookie HttpOnly; server chỉ lưu hash session. Kiosk dùng xác thực trạm riêng, không giả làm người dùng quản trị.

**Implementation Tasks**

- [ ] Tạo login/me/logout, kiểm tra password hash, session expiry/revocation và employee inactive.
- [ ] Thực thi permission+scope cho EMP self, HR, SUP team, SEC factory, ADM cấu hình, EXE aggregate.
- [ ] Tách station authentication khỏi user authentication; không nhận actorId/client role làm căn cứ.
- [ ] Cấu hình cookie/CORS/CSRF theo deployment, rate limit login và redaction lỗi.

**Acceptance Criteria**

- [ ] Sửa localStorage/role/filter không nâng quyền gọi API.
- [ ] ADM không tự có quyền HR correction; SUP không truy cập nhân viên ngoài tổ.
- [ ] Session hết hạn/thu hồi trả 401; thiếu quyền trả 403 theo contract.

**Testing Checklist**

- [ ] Thử login sai, hết hạn, logout rồi dùng lại token.
- [ ] API tests IDOR hai nhân viên/hai nhà máy; station gọi API portal và ngược lại.
- [ ] Xác minh cookie/CSRF và log không chứa session secret/password.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Auth endpoints, guards/policy và API security tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-008"></a>

### TMC-008 — Kết nối đăng nhập thật và route guard

**Overview**

- Epic: B — Authentication & Employee Foundation
- Feature: B02 — Đăng nhập frontend và protected routes
- User Story: Là EMP, tôi muốn đăng nhập thật và chỉ thấy dữ liệu của mình sau khi chuyển tài khoản.
- Type: type:task
- Priority: P0
- Classification: SUPPORTING
- Labels: type:task, area:frontend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 10/11/2026
- Due Date: 10/11/2026
- Dependencies: [TMC-007](#tmc-007), [TMC-002](#tmc-002)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/app/context.tsx, client/src/app/router.tsx, client/src/features/auth/**, client/src/lib/rbac.ts, client/src/shared/api/**.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client build; smoke auth/permission.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Chuyển auth provider từ account ID trong localStorage sang server session, giữ UI đăng nhập hiện có. Các màn ngoài scope còn dùng mock phải có nhãn riêng.

**Implementation Tasks**

- [ ] Thêm HTTP adapter có credentials, DTO mapping và thống nhất 401/403.
- [ ] Thay login(id) bằng form gọi login/me/logout, bỏ tin cậy session localStorage cũ.
- [ ] Thêm protected route và permission UI theo server; map role prototype về actor chuẩn.
- [ ] Clear TanStack cache khi logout/đổi user; tách query keys theo identity và demo/server mode.

**Acceptance Criteria**

- [ ] EMP không thể mở route người khác bằng URL hoặc data cache cũ.
- [ ] Reload giữ phiên hợp lệ; hết phiên hiển thị đăng nhập rõ ràng.
- [ ] Không dùng getDatabase toàn bộ dữ liệu nhân sự cho mọi account server.

**Testing Checklist**

- [ ] Manual login/logout/reload và đổi EMP-A sang EMP-B.
- [ ] Test redirect returnTo và trang 403.
- [ ] Kiểm tra cache và Network panel không trả dữ liệu ngoài scope.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Auth UI kết nối server, HTTP adapter và route guards.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-009"></a>

### TMC-009 — Tạo credential và metadata khóa ký QR

**Overview**

- Epic: C — QR Credential Management
- Feature: C01 — Credential, khóa ký và phát hành/thu hồi QR
- User Story: Là HR, tôi muốn credential thu hồi được và khóa ký luân chuyển được.
- Type: type:task
- Priority: P0
- Classification: CORE
- Labels: type:task, area:backend, area:security, priority:P0, core, milestone:M2
- Sprint: Sprint 1
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 10/11/2026
- Due Date: 10/11/2026
- Dependencies: [TMC-004](#tmc-004), [TMC-006](#tmc-006)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/eqr/{domain,application,infrastructure}/**, api/test/qr-key*.ts, .env.example.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Hiện thực model credential và key metadata theo schema; key material chỉ ở env/secret provider. Chưa tạo màn quản lý khóa đầy đủ.

**Implementation Tasks**

- [ ] Tạo QrCredential aggregate, repository, signing-key registry và mapper.
- [ ] Cấu hình kid, algorithm allowlist, public JWK và private secret reference.
- [ ] Seed một key hoạt động, một verify-only/revoked để test rotation.
- [ ] Thêm command cấp credential có actor HR/scope và audit trong UnitOfWork.

**Acceptance Criteria**

- [ ] Chỉ một credential ACTIVE cho mỗi employee theo policy/schema.
- [ ] Private key không nằm trong DB payload, client bundle hay logs.
- [ ] Key không biết hoặc REVOKED không được dùng xác minh token mới.

**Testing Checklist**

- [ ] Unit test vòng đời credential và key status.
- [ ] Integration test partial unique active credential.
- [ ] Quét secret trong fixture/log và kiểm tra metadata không chứa private JWK parameters.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Credential/key ports, implementation và seed/test metadata.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-010"></a>

### TMC-010 — Cấp token QR ngắn hạn và thu hồi credential

**Overview**

- Epic: C — QR Credential Management
- Feature: C01 — Credential, khóa ký và phát hành/thu hồi QR
- User Story: Là EMP, tôi muốn nhận QR ngắn hạn từ server và HR có thể khóa mã bị lộ.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, area:security, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 11/11/2026
- Due Date: 11/11/2026
- Dependencies: [TMC-009](#tmc-009), [TMC-007](#tmc-007)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/eqr/**, api/src/modules/iam/public-api.ts, api/test/qr-issue*.ts, doc/openapi.yaml.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Cấp token ký bất đối xứng với jti gắn qr_tokens.id. TTL 60 giây là cấu hình demo, không phải mức bắt buộc của đề.

**Implementation Tasks**

- [ ] Tạo GET/POST self QR endpoint theo OpenAPI, lấy employee từ session và quyền hiện hành.
- [ ] Ký token có kid/iss/aud/sub/jti/iat/exp theo contract, lưu token hash/expiry; không lưu raw payload.
- [ ] Tạo HR revoke credential endpoint có reason/audit; refresh tạo jti mới, không kéo dài mã cũ.
- [ ] Giới hạn tần suất cấp token và trả serverTime/expiresAt cho UI countdown.

**Acceptance Criteria**

- [ ] Client không phát hành token cho employeeId tùy ý.
- [ ] Token sinh từ credential revoked/inactive bị từ chối; thu hồi tác dụng ở lần check server sau.
- [ ] Refresh cho token mới có expiry hợp lệ và traceable, không ghi token vào log.

**Testing Checklist**

- [ ] API self-only và HR scope/reason.
- [ ] Test expiry/refresh bằng clock giả, không chờ sleep.
- [ ] Test revoke rồi dùng token còn hạn và giới hạn request cấp mã.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- QR issue/revoke APIs, signer adapter và contract/tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-011"></a>

### TMC-011 — Xác minh chữ ký, claims và hạn QR

**Overview**

- Epic: C — QR Credential Management
- Feature: C02 — QR validation và chống replay
- User Story: Là nhân viên an ninh, tôi muốn QR giả, sai hạn hoặc bị thu hồi bị chặn trước bước mở.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, area:security, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 11/11/2026
- Due Date: 11/11/2026
- Dependencies: [TMC-010](#tmc-010)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/eqr/application/ports/**, api/src/modules/eqr/infrastructure/crypto/**, api/test/qr-validator*.ts.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api typecheck.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo QrValidator port với adapter ký/xác minh và validation đồng nhất; phân biệt chữ ký hợp lệ với quyền truy cập nhà máy.

**Implementation Tasks**

- [ ] Validate format/kích thước, kid, algorithm allowlist và chữ ký trước tin claims.
- [ ] Kiểm tra issuer/audience/expiry/iat/nbf nếu sử dụng và clock skew đã công bố.
- [ ] Đọc token/credential/key/employee hiện hành; đối chiếu jti/token fingerprint.
- [ ] Trả typed result/reasonCode, audit có redaction; không kết luận ALLOW ở validator.

**Acceptance Criteria**

- [ ] Token hợp lệ xác thực được; sửa sub/exp, sai chữ ký, unknown kid và wrong audience đều bị từ chối.
- [ ] Expiry đúng biên và revoked credential/key được kiểm tra bằng server clock.
- [ ] Lỗi không gây OPEN hay attendance và không làm lộ QR đầy đủ.

**Testing Checklist**

- [ ] Unit tests valid, malformed, oversized, expired, future và tampered claims.
- [ ] Key rotation và token hash/jti mismatch.
- [ ] Contract test validator không phụ thuộc React/Nest request hoặc gọi TCS.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- QrValidator, typed validation result và test matrix.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-012"></a>

### TMC-012 — Thực thi access policy từ cấu hình server

**Overview**

- Epic: D — Gate Kiosk & Access Control
- Feature: D01 — Access policy và cấu hình trạm
- User Story: Là người vận hành cổng, tôi muốn quyền truy cập xét đúng nhà máy, thời điểm và trạm.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 12/11/2026
- Due Date: 12/11/2026
- Dependencies: [TMC-006](#tmc-006), [TMC-011](#tmc-011)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/{domain,application}/**, api/src/modules/eqr/public-api.ts, api/test/access-policy*.ts.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

AccessPolicy thuần kiểm tra grant tách khỏi phân công tổ chức. Quyền EXIT theo chính sách baseline; phần mềm không thay cơ chế thoát hiểm.

**Implementation Tasks**

- [ ] Lấy station/factory/direction từ station credential và cấu hình server.
- [ ] Kiểm tra station active, employee active, credential hợp lệ và access grant [from,to).
- [ ] Ghi typed ALLOW/DENIED reason; kiểm tra lại điều kiện quan trọng lúc claim trước gửi.
- [ ] Chặn client giả factory/direction; ghi snapshot config/time và quy tắc EXIT/SEC exception.

**Acceptance Criteria**

- [ ] Grant LA cho employee tổ chức BD được xử lý theo grant, không theo employee.site.
- [ ] Denied attempt không gửi OPEN hoặc tạo attendance.
- [ ] Client payload không ghi đè station/factory/direction phía server.

**Testing Checklist**

- [ ] Unit tests grant đúng/sai factory, revoked, boundary validTo, station maintenance.
- [ ] API test station spoof và inactive employee.
- [ ] Test policy EXIT đã ghi trong ADR, không dùng demo auto-toggle direction.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- AccessPolicy, decision model và policy tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-013"></a>

### TMC-013 — Xây Mock Turnstile Gateway có fault modes

**Overview**

- Epic: D — Gate Kiosk & Access Control
- Feature: D02 — Mock TCS và state machine command
- User Story: Là developer, tôi muốn mô phỏng TCS có kết quả vật lý riêng để kiểm thử tình huống không chắc chắn.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 12/11/2026
- Due Date: 12/11/2026
- Dependencies: [TMC-003](#tmc-003), [TMC-005](#tmc-005)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/application/ports/turnstile-gateway.ts, api/src/modules/gate/infrastructure/tcs/**, api/test/fixtures/mock-tcs/**, doc/tcs-contract.md.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Mock gateway là tiến trình/adapter có state độc lập với database app. Nó minh họa hợp đồng, không chứng minh turnstile thật hoạt động.

**Implementation Tasks**

- [ ] Định nghĩa open/close/status theo commandId/turnstileId/deadline và kết quả typed.
- [ ] Mock các mode rejected, accepted-only, opened, passage, delay và lost-response-after-open.
- [ ] Lưu ledger vật lý mock riêng, đếm thực thi OPEN; hỗ trợ callback duplicate/out-of-order và không hỗ trợ status ở mode giới hạn.
- [ ] Đặt fault-control chỉ cho test/demo có xác thực, không public production.

**Acceptance Criteria**

- [ ] ACK nhận lệnh không bị map thành passage/attendance.
- [ ] Lost response có thể đi cùng physicalOpenCount=1, để test không dựa mỗi DB.
- [ ] Lệnh quá deadline không được mock mở muộn; CLOSE không tạo lượt công.

**Testing Checklist**

- [ ] Contract tests cho fake và adapter mock cùng interface.
- [ ] Kiểm tra commandId idempotency được bật/tắt theo từng mode contract.
- [ ] Gửi callback trùng/sai thứ tự, xác minh raw payload redaction.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- TurnstileGateway, mock TCS, fault contract và independent execution counters.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-014"></a>

### TMC-014 — Lưu attempt idempotent trước khi mở cổng

**Overview**

- Epic: E — Attendance Event Recording
- Feature: E01 — Attempt idempotency và attendance ledger
- User Story: Là kiosk, tôi muốn gửi lại cùng request mà không tạo thêm lượt hoặc lệnh.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 2 + R 0.5 + I 0.5 + T 0.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 13/11/2026
- Due Date: 13/11/2026
- Dependencies: [TMC-004](#tmc-004), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/{application,presentation,infrastructure}/**, api/src/shared/infrastructure/database/**, api/test/idempotency*.ts.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir api test -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo transaction chuẩn bị bền vững trước HTTP tới TCS. Duplicate lookup xảy ra trước replay redemption; requestHash bỏ trường thay đổi theo lần retry.

**Implementation Tasks**

- [ ] Chuẩn hóa request và hash; tìm UNIQUE(stationId,eventId) trước xác thực token lại của request cũ đã tiếp nhận.
- [ ] Cùng ID/hash trả trạng thái cũ, cùng ID khác hash trả 409; station khác không đọc được request.
- [ ] Trong một UnitOfWork lưu AccessAttempt, PREPARED OPEN, audit và hook redemption cho ticket 015.
- [ ] Đảm bảo lỗi persistence dừng trước gateway; lưu denied attempts có reason và không command OPEN.

**Acceptance Criteria**

- [ ] Hai POST đồng thời cùng station/event tạo đúng một attempt và một OPEN cơ sở.
- [ ] Payload khác cùng ID trả 409, không đổi dữ liệu đã lưu.
- [ ] DB unavailable/rollback không có physical OPEN.

**Testing Checklist**

- [ ] Integration race cùng key và collision khác payload.
- [ ] Test duplicate sau token hết hạn trả trạng thái đã có, không tạo request mới.
- [ ] Inject DB fault trước commit, so mock gateway execution counter=0.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Scan preparation use case/API, request hash contract và idempotency tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-015"></a>

### TMC-015 — Chặn QR exposure/replay bằng redemption nguyên tử

**Overview**

- Epic: C — QR Credential Management
- Feature: C02 — QR validation và chống replay
- User Story: Là chủ hệ thống, tôi muốn QR bị chụp lại chỉ thắng một lượt redemption theo policy.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, area:security, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 14/11/2026
- Due Date: 14/11/2026
- Dependencies: [TMC-014](#tmc-014), [TMC-010](#tmc-010)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/eqr/{application,infrastructure}/**, api/src/modules/gate/application/**, doc/adr/qr-replay.md, api/test/qr-replay*.ts.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; review ADR QR với ma trận M2.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Ticket riêng cho cải tiến QR exposure/replay M2: kết hợp token ngắn hạn, chữ ký, quyền online và atomic redemption. Không tuyên bố chống chia sẻ thời gian thực tuyệt đối.

**Implementation Tasks**

- [ ] Ghi qr_redemptions với PK tokenId/UK attemptId trong cùng transaction PREPARED.
- [ ] Tách replay khác event khỏi duplicate cùng event đã nhận; không dùng cooldown 30 giây thay DB uniqueness.
- [ ] Kiểm tra online revocation/grant lúc chuẩn bị và claim; thu hồi token không đảo ngược tác động vật lý đã xảy ra.
- [ ] Ghi ADR trade-off: token bị chặn sau redeem nhưng OPEN fail thì EMP lấy token mới; residual live-sharing risk.

**Acceptance Criteria**

- [ ] Hai trạm quét cùng jti đồng thời: tối đa một redemption và một OPEN cơ sở được phép.
- [ ] Retry cùng eventId không bị báo replay và không tiêu thụ lần hai.
- [ ] Không tự mở offline khi không kiểm tra được quyền/revocation.

**Testing Checklist**

- [ ] PG race jti khác event và khác station.
- [ ] Rollback attempt thì redemption cũng rollback.
- [ ] Revoke giữa issue/scan và giữa PREPARED/claim; test giới hạn chia sẻ được ghi rõ.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Atomic redemption, QR security ADR và race/revocation tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-016"></a>

### TMC-016 — Claim CAS và điều phối command OPEN/CLOSE

**Overview**

- Epic: D — Gate Kiosk & Access Control
- Feature: D02 — Mock TCS và state machine command
- User Story: Là kiosk, tôi muốn chỉ một tiến trình gửi lệnh và trạng thái mở cổng có bằng chứng rõ.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 2 + R 0.5 + I 0.5 + T 0.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 16/11/2026
- Due Date: 16/11/2026
- Dependencies: [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/{domain,application,infrastructure}/**, api/src/bootstrap/**, api/test/command-state*.ts.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Triển khai state machine command; commit quyền gửi trước external HTTP. Kết quả gateway và ghi công là hai bước riêng; đến ticket 019 mới nối AttendanceWriter.

**Implementation Tasks**

- [ ] CAS PREPARED→DISPATCHING cùng history/audit, deadline và điều kiện hiện hành; commit rồi mới gọi gateway.
- [ ] Map ACKNOWLEDGED/CONFIRMED/REJECTED/UNKNOWN; không bắt HTTP transaction DB chờ cả lượt người đi qua.
- [ ] Nhận kết quả/callback có dedupe, kiểm tra transition; CLOSE liên kết OPEN và lỗi đóng tạo cảnh báo.
- [ ] Trả response decision/commandState/attendanceState rõ ràng; crash DISPATCHING đi đối soát, không phát OPEN lại.

**Acceptance Criteria**

- [ ] Hai dispatcher cạnh tranh chỉ một thắng claim; không gọi HTTP khi claim rollback.
- [ ] ACK-only không hiện đã ghi công; UNKNOWN không đổi thành DENIED hoặc retry OPEN mù.
- [ ] Kiểm soát OPEN lẫn CLOSE, lệnh quá deadline không gửi mở muộn.

**Testing Checklist**

- [ ] Unit table mọi transition hợp lệ/bị cấm.
- [ ] PG CAS race, crash sau claim/trước gửi và sau gửi/mất response.
- [ ] Callback trùng/sai thứ tự và lỗi CLOSE không xóa kết quả đã xác nhận.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- GateCommand state machine, dispatcher và API result mapping.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-017"></a>

### TMC-017 — Thay QR tự sinh bằng QR server trên portal

**Overview**

- Epic: C — QR Credential Management
- Feature: C03 — QR cá nhân trên Employee Portal
- User Story: Là EMP, tôi muốn mã QR hiển thị trên điện thoại phản ánh thời hạn thật từ server.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:frontend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 14/11/2026
- Due Date: 14/11/2026
- Dependencies: [TMC-010](#tmc-010), [TMC-008](#tmc-008)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/employee-mobile/**, client/src/features/eqr/** nếu tách, client/src/shared/api/**, client/src/lib/qr.ts.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client build; kiểm tra portal bằng tài khoản EMP.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tái sử dụng trang mobile hiện có, thay makeQr phía client bằng endpoint self. UI chỉ trình bày QR, không giữ signing key hay quyết định quyền.

**Implementation Tasks**

- [ ] Hiển thị token server bằng QR component hiện hữu, countdown từ expiresAt/serverTime.
- [ ] Refresh có loading/error, hạn chế request; hết hạn/thu hồi không hiển thị như mã còn dùng.
- [ ] Xóa payload khi logout/đổi user; không đưa QR vào localStorage journal hoặc telemetry.
- [ ] Giữ layout/tokens Figma và kiểm tra mobile 360px, light/dark.

**Acceptance Criteria**

- [ ] Token UI được server validator chấp nhận, không còn tự sinh tmc-access:v1 cho server mode.
- [ ] Mất mạng cấp mã báo lỗi, không gia hạn QR cũ ở client.
- [ ] EMP không chọn employeeId khác để phát QR.

**Testing Checklist**

- [ ] Manual QR countdown/refresh bằng API clock fixture.
- [ ] Test logout/đổi tài khoản không giữ mã cũ.
- [ ] Responsive/contrast và lỗi 401/expired/revoked.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- QR portal kết nối API và evidence màn mobile.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-018"></a>

### TMC-018 — Nối Virtual Kiosk với API và trạng thái thật

**Overview**

- Epic: D — Gate Kiosk & Access Control
- Feature: D03 — Virtual kiosk, kết quả và webcam
- User Story: Là người demo, tôi muốn dán/quét QR vào kiosk và nhìn thấy kết quả server rõ ràng.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:frontend, priority:P0, core, milestone:M2
- Sprint: Sprint 2
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 17/11/2026
- Due Date: 17/11/2026
- Dependencies: [TMC-016](#tmc-016), [TMC-017](#tmc-017)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/kiosk/**, client/src/shared/api/**, client/src/features/gate/application/**; doc/demo.md.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client build; demo portal→virtual kiosk.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Giữ Virtual Scanner làm đường demo P0 độc lập camera. Public kiosk trải nghiệm hiện tại không được mặc định gọi API trạm có đặc quyền.

**Implementation Tasks**

- [ ] Sinh eventId trước gửi đầu; giữ cùng ID/payload khi lookup/retry, tách debounce UI khỏi idempotency server.
- [ ] Kết nối station đã provision; mode demo public cô lập dữ liệu và không nhúng long-lived station secret trong source.
- [ ] Hiển thị DENIED/PENDING/UNKNOWN/OPEN_CONFIRMED và attendanceState riêng, reason ngắn gọn.
- [ ] Bỏ auto-toggle IN/OUT và employee.site access check ở client; lấy cấu hình/decision server.

**Acceptance Criteria**

- [ ] Virtual scan đi qua API thật, mock TCS và PG; không gọi local api.scan ở server mode.
- [ ] Không hiển thị đã ghi công khi chỉ ALLOW/ACK.
- [ ] Đổi dropdown không nâng quyền station; chưa provision thì không gọi scan đặc quyền.

**Testing Checklist**

- [ ] Happy path, expired QR, wrong grant, inactive và payload malformed.
- [ ] Mở kiosk công khai và xác minh không có server credential hoặc dữ liệu HR.
- [ ] Kiểm tra UI retry không sinh eventId mới ngoài ý muốn.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Virtual kiosk API adapter, kết quả rõ trạng thái và quy trình provision demo.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-019"></a>

### TMC-019 — Ghi attendance và revision gốc theo bằng chứng

**Overview**

- Epic: E — Attendance Event Recording
- Feature: E01 — Attempt idempotency và attendance ledger
- User Story: Là HR, tôi muốn chỉ lượt có bằng chứng hợp lệ mới được lưu thành công và không bị mất một phần.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 2 + R 0.5 + I 0.5 + T 0.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 18/11/2026
- Due Date: 18/11/2026
- Dependencies: [TMC-016](#tmc-016)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/att/{domain,application,infrastructure}/**, api/src/modules/gate/application/**, api/test/attendance*.ts.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir api test -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Nối GATE với ATT qua public AttendanceWriter. Dùng PASSAGE_SENSOR từ mock; OPEN_PROXY chỉ khi baseline phê duyệt, luôn ghi evidenceType.

**Implementation Tasks**

- [ ] Dedupe gate_device_events theo endpoint/vendor event và xác thực event source.
- [ ] Ghi command result/history, AttendanceEvent, revision 1 và audit cùng transactional context.
- [ ] Dùng sourceId ổn định ACCESS:attempt UUID; deferred head FK và UNIQUE attempt/source chống ghi lặp.
- [ ] Giữ dữ liệu gốc bất biến, tách event history khỏi báo cáo tính ca/tính lương; không lấy first-in/last-out làm giờ công.

**Acceptance Criteria**

- [ ] PASSAGE_CONFIRMED tạo một event+revision 1; denied/ACK-only/UNKNOWN không tạo công chính thức.
- [ ] Callback/result lặp không thêm event, DB rollback không để attendance/audit lệch.
- [ ] Restart app vẫn truy vấn được nguồn và evidence, không dựa localStorage.

**Testing Checklist**

- [ ] PG atomic rollback giữa command/event/audit.
- [ ] Duplicate/out-of-order passage, sensor không khớp command và CLOSE event.
- [ ] Check head deferred, unique source, timestamp UTC và direction server.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Attendance ledger writer, revision gốc, event evidence và integration tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-020"></a>

### TMC-020 — Cung cấp status lookup và lịch sử có scope

**Overview**

- Epic: E — Attendance Event Recording
- Feature: E02 — Tra cứu trạng thái, lịch sử và chi tiết
- User Story: Là EMP hoặc SEC, tôi muốn tra cứu đúng sự kiện trong phạm vi được cấp.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 19/11/2026
- Due Date: 19/11/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-007](#tmc-007)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/presentation/**, api/src/modules/gate/application/queries/**, api/src/modules/att/application/queries/**, doc/openapi.yaml.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; validate OpenAPI.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo read models/DTO nhỏ cho status, access history và attendance history. Không cung cấp getDatabase tổng hợp toàn bộ dữ liệu như prototype.

**Implementation Tasks**

- [ ] Tạo lookup theo eventId cho chính trạm hoặc user đủ quyền.
- [ ] Tạo history/detail có pagination, filter thời gian, station/factory và predicate scope ở query.
- [ ] Trả command/evidence/current revision và correlationId; redaction thông tin cá nhân theo actor.
- [ ] Đặt giới hạn page size/range và index query cần dùng; bỏ voided khỏi report hiệu lực theo policy.

**Acceptance Criteria**

- [ ] EMP chỉ đọc self, SEC đúng factory, SUP đúng team, EXE chỉ aggregate.
- [ ] Không truy cập chéo bằng đoán UUID hoặc sửa query filter.
- [ ] Retry lookup sau QR hết hạn vẫn đọc kết quả request đã nhận.

**Testing Checklist**

- [ ] API tests 401/403/404 policy và IDOR đa factory.
- [ ] Pagination/filter ổn định khi nhiều event cùng timestamp.
- [ ] Query plan cơ bản và contract response không chứa QR/session/secret.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Status/history/detail APIs, query scope và OpenAPI cập nhật.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-021"></a>

### TMC-021 — Kết nối lịch sử cá nhân và chi tiết lượt quét

**Overview**

- Epic: E — Attendance Event Recording
- Feature: E02 — Tra cứu trạng thái, lịch sử và chi tiết
- User Story: Là nhân viên, tôi muốn lịch sử hiển thị lượt công thật thay vì bảng mẫu cục bộ.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:frontend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 19/11/2026
- Due Date: 19/11/2026
- Dependencies: [TMC-020](#tmc-020), [TMC-008](#tmc-008)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/employee-mobile/**, client/src/features/access-control/**, client/src/features/attendance/** phần đọc, client/src/shared/api/**.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client build; smoke history/detail.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tái sử dụng UI lịch sử mobile và bảng access để đọc API theo role. Giữ các màn HR/ca làm ngoài scope ở mode mock có nhãn.

**Implementation Tasks**

- [ ] Thay query getDatabase bằng history/detail APIs và query keys scoped theo identity/filter.
- [ ] Hiển thị thời điểm giờ VN, station direction, evidence và trạng thái dữ liệu.
- [ ] Thêm pagination/loading/empty/error và 403; phân biệt nhật ký denied với attendance ledger.
- [ ] Link detail từ eventId/correlationId; bỏ action sửa công chưa có API ở server mode.

**Acceptance Criteria**

- [ ] Cùng dữ liệu PG được nhìn thấy từ hai trình duyệt theo quyền, không dựa storage event.
- [ ] Denied/UNKNOWN không hiển thị như công đã xác nhận.
- [ ] Đăng xuất/đổi user xóa cache nhạy cảm, filter không vượt scope.

**Testing Checklist**

- [ ] Manual EMP-A/EMP-B và SEC-BD/SEC-LA.
- [ ] Mất mạng query và reload deep link detail.
- [ ] Kiểm tra mobile, bảng và timestamp quanh 00:00 VN.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- History/detail UI kết nối API và screenshots kiểm chứng.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-022"></a>

### TMC-022 — Hoàn thiện Network Failure Architecture và ADR

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F01 — Kiến trúc mất mạng và journal kiosk
- User Story: Là người chấm kiến trúc, tôi muốn biết mất mạng ở đâu và hệ thống phục hồi bằng cách nào.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Architecture Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0 + R 0.5 + I 0 + T 0 + D 1.5
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.5 + I 0), đã nằm trong tổng
- Start Date: 18/11/2026
- Due Date: 18/11/2026
- Dependencies: [TMC-016](#tmc-016)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/adr/network-failure.md, doc/recovery-design.md, doc/requirements-traceability.md; cập nhật diagram liên quan.
- Verification Commands: Review Markdown/diagram và đối chiếu từng failure window với user-flow/schema.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Ticket riêng cho Network Failure Architecture M2. Cụ thể hóa R1 online/recover thay vì hứa mở offline; phương án edge chỉ so sánh và để P2.

**Implementation Tasks**

- [ ] Vẽ sequence mất kết nối trước gửi, sau DB commit, sau claim, sau TCS thực thi và mất response.
- [ ] Quy định journal eventId/request fingerprint không raw token; lookup trước, không tự replay stale OPEN.
- [ ] Định nghĩa status lookup, durable jobs, backoff/jitter/budget và SEC reconciliation không có status API.
- [ ] So sánh R1 với edge local DB/quyền offline, nêu residual risk và điểm tích hợp module/physical deployment.

**Acceptance Criteria**

- [ ] Mỗi failure window có state lưu bền vững, cách recovery và hạn chế rõ.
- [ ] Không đồng nhất PENDING/UNKNOWN với công thành công hoặc gate chưa mở.
- [ ] Giải thích được cơ chế giảm mất/trùng dữ liệu và vì sao DB transaction không đảm bảo exactly-once vật lý.

**Testing Checklist**

- [ ] Walk-through sơ đồ bằng fault modes từ 013/026.
- [ ] So ADR với schema GateCommand/Job và kiosk eventId.
- [ ] Review từng câu tuyên bố độ tin cậy với bằng chứng dự kiến, không ghi test đã pass.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Network ADR, sequence/recovery matrix và traceability M2.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-023"></a>

### TMC-023 — Lưu journal metadata và phục hồi eventId ở kiosk

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F01 — Kiến trúc mất mạng và journal kiosk
- User Story: Là kiosk bị mất phản hồi, tôi muốn tìm lại kết quả cũ mà không mở cổng lần hai.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:frontend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 20/11/2026
- Due Date: 20/11/2026
- Dependencies: [TMC-018](#tmc-018), [TMC-020](#tmc-020), [TMC-022](#tmc-022)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/kiosk/{application,infrastructure}/**, client/src/features/kiosk/Kiosk.tsx, client/src/shared/api/**.
- Verification Commands: pnpm --dir client exec tsc --noEmit; pnpm --dir client test:e2e; manual DevTools offline.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Journal client chỉ lưu metadata cần phục hồi, không phải offline attendance database. Không lưu token/PII hoặc tự mở offline.

**Implementation Tasks**

- [ ] Persist journal eventId/station reference/request fingerprint/time/status trước gửi; payload QR chỉ ở memory.
- [ ] Khi timeout/reload, lookup cùng eventId; NOT_FOUND chưa chứng minh request cũ không tới. Chỉ quét lại sau deadline cũ và kiểm tra không còn khả năng dispatch; UNKNOWN chuyển SEC.
- [ ] Áp backoff cho lookup đọc an toàn, giới hạn backlog/TTL và retry budget; không retry OPEN đã DISPATCHING.
- [ ] Hiển thị pending/synced/failed của journal như trạng thái đồng bộ request, không thay command/attendance state.

**Acceptance Criteria**

- [ ] Mất response sau commit vẫn lookup đúng attempt, không tạo eventId mới tự động.
- [ ] Reload không gửi QR cũ đã hết hạn để mở muộn.
- [ ] Journal không chứa raw token, employee name hoặc secret; quota lỗi có thông báo và không báo đã lưu.

**Testing Checklist**

- [ ] Browser offline trước gửi, sau commit và reload khi pending.
- [ ] Test quota/storage failure và backlog đạt giới hạn.
- [ ] Kiểm tra request log không lặp OPEN, clock expiry và lookup hết budget.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Metadata journal adapter, recovery UI và browser failure tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-024"></a>

### TMC-024 — Chạy durable worker đối soát UNKNOWN có fencing

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F02 — Worker, UNKNOWN, đối soát và failure simulation
- User Story: Là SEC, tôi muốn các lệnh không rõ được đối soát bền vững mà không bị worker gửi mở lại.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 2 + R 0.5 + I 0.5 + T 0.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 21/11/2026
- Due Date: 21/11/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-022](#tmc-022), [TMC-026](#tmc-026)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/application/recovery/**, api/src/shared/infrastructure/jobs/**, api/src/bootstrap/worker/**, api/test/worker*.ts.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir api test -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

DB worker xử lý GATE_RECONCILIATION; chỉ status lookup/cập nhật kết quả có bằng chứng. Chưa triển khai HRS outbox consumer.

**Implementation Tasks**

- [ ] Tạo job cùng transaction ghi UNKNOWN; claim có lease/version/fencing và nextRunAt.
- [ ] Đối soát theo commandId qua gateway status; status thiếu thì tạo case SEC, không auto-reopen.
- [ ] Backoff tăng dần có jitter/maxAttempts, lỗi permanent→FAILED, hết budget giữ case và audit.
- [ ] Chỉ update khi còn claim version; nhận callback/worker đồng thời qua idempotent ledger writer.

**Acceptance Criteria**

- [ ] Restart worker không làm mất backlog; hai worker không ghi đè claim nhau.
- [ ] Lease hết hạn không được coi là TCS chưa thực thi; không retry OPEN mù.
- [ ] Một passage được báo lại từ status/callback vẫn chỉ có một attendance.

**Testing Checklist**

- [ ] Claim race, lease expiry và stale worker completion.
- [ ] Status UNKNOWN/unsupported, transient/permanent và max attempts.
- [ ] Callback đồng thời với status kết quả; so physicalOpenCount không tăng do recovery.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Durable reconciliation worker, retry policy và backlog state.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-025"></a>

### TMC-025 — Tạo API và màn hình SEC đối soát tối thiểu

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F02 — Worker, UNKNOWN, đối soát và failure simulation
- User Story: Là SEC được phân công, tôi muốn kết luận case UNKNOWN dựa trên bằng chứng và lý do.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 23/11/2026
- Due Date: 23/11/2026
- Dependencies: [TMC-024](#tmc-024), [TMC-007](#tmc-007), [TMC-020](#tmc-020)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/{application,presentation}/reconciliation/**, client/src/features/access-control/reconciliation/**, api/test/reconciliation*.ts.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client build; demo SEC case.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Phạm vi P0 là màn list/detail/form resolution nhỏ và API tương ứng, không phải console vận hành hoàn chỉnh. Không dùng overrideReason như bypass mọi policy.

**Implementation Tasks**

- [ ] Tạo list/detail case theo factory; nhận resolved outcome PASSED/NOT_PASSED/INSUFFICIENT_EVIDENCE, reason và evidence refs.
- [ ] Kiểm tra permission hiện hành và optimistic version; không nhận actor tự khai.
- [ ] PASSED có đủ bằng chứng thì xác nhận nguồn attempt cũ; MANUAL chỉ khi không có nguồn đã nhận, kiểm tra chống trùng vật lý.
- [ ] Ghi case/result/attendance/audit nguyên tử, giữ dấu vết người xử lý và không tự phát OPEN.

**Acceptance Criteria**

- [ ] SEC-LA không giải quyết case BD; ADM thiếu quyền SEC không được bypass.
- [ ] Hai người xử lý cùng version chỉ một thắng; nguồn đã có không tạo công lần hai.
- [ ] INSUFFICIENT_EVIDENCE không thành attendance CONFIRMED.

**Testing Checklist**

- [ ] API cross-factory/forged actor/reason rỗng và concurrent resolve.
- [ ] Case đã có event rồi resolve lại; manual trùng attempt.
- [ ] Manual UI list/detail và evidence redaction.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Minimal reconciliation API/UI, audit và duplicate tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-026"></a>

### TMC-026 — Tạo kịch bản mất mạng, mất ACK và crash

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F02 — Worker, UNKNOWN, đối soát và failure simulation
- User Story: Là người kiểm thử, tôi muốn tạo lỗi đúng cửa sổ thời gian để chứng minh recovery.
- Type: type:feature
- Priority: P0
- Classification: CORE
- Labels: type:feature, area:backend, priority:P0, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 20/11/2026
- Due Date: 20/11/2026
- Dependencies: [TMC-013](#tmc-013), [TMC-016](#tmc-016), [TMC-022](#tmc-022)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/test/faults/**, api/test/fixtures/mock-tcs/**, scripts/demo-failure.* theo toolchain, doc/failure-scenarios.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; làm theo doc/failure-scenarios.md.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Tạo harness điều khiển lỗi có thể lặp lại và quan sát cả app DB lẫn mock TCS. Không gọi test demo mode là bằng chứng môi trường sản xuất.

**Implementation Tasks**

- [ ] Thêm test hooks trước DB commit, sau claim commit, sau TCS execute và trước gửi response.
- [ ] Cho phép mô phỏng API↔DB, kiosk↔API và API↔TCS độc lập.
- [ ] Thu execution ledger mock, DB counts và correlationId để so sánh trước/sau restart.
- [ ] Khóa fault-control dưới env test/demo, không public hoặc luôn bật.

**Acceptance Criteria**

- [ ] Mỗi fault mode có trigger/expected state/cleanup tái lập được.
- [ ] Mất ACK sau OPEN có physical execution dù client timeout.
- [ ] Restart app không xóa ledger mock trong bài test nhằm che duplicate.

**Testing Checklist**

- [ ] Smoke từng fault switch và reset môi trường test riêng.
- [ ] Kiểm tra disable fault hooks ở config ngoài demo/test.
- [ ] So log và DB snapshot không chứa secret/raw QR.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Fault harness, scenario catalog và cách thu evidence.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-027"></a>

### TMC-027 — Gắn webcam hiện có vào contract quét thật

**Overview**

- Epic: D — Gate Kiosk & Access Control
- Feature: D03 — Virtual kiosk, kết quả và webcam
- User Story: Là người demo, tôi muốn dùng webcam nếu thiết bị cho phép và vẫn có Virtual Scanner thay thế.
- Type: type:feature
- Priority: P1
- Classification: CORE
- Labels: type:feature, area:frontend, priority:P1, core, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 23/11/2026
- Due Date: 23/11/2026
- Dependencies: [TMC-018](#tmc-018)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/kiosk/** phần camera, client test camera lifecycle, doc/demo.md.
- Verification Commands: pnpm --dir client build; manual webcam/fallback; E2E lifecycle bằng fake camera nếu hỗ trợ.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P1: reuse html5-qrcode/ScanCamera hiện có, nối cùng application scan adapter của Virtual Scanner; không xây scanner riêng.

**Implementation Tasks**

- [ ] Đưa callback camera vào cùng eventId/scan flow với ticket 018.
- [ ] Giữ debounce/in-flight, dừng stream khi unmount/đổi station/mode.
- [ ] Xử lý permission denied, camera busy và iframe/HTTPS constraints.
- [ ] Đặt Virtual Scanner luôn dùng được khi camera unavailable; UI theo token có sẵn.

**Acceptance Criteria**

- [ ] Camera đọc QR server đi qua cùng validation/replay/idempotency pipeline.
- [ ] Không gửi nhiều request mới khi callback đọc lặp một ảnh.
- [ ] Từ chối quyền không làm kiosk lỗi hoặc mất đường demo virtual.

**Testing Checklist**

- [ ] Manual camera thật trên HTTPS/localhost nếu có thiết bị.
- [ ] Permission denied/busy/unmount và fallback virtual.
- [ ] Kiểm tra không còn camera indicator sau rời màn.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Webcam adapter được nối API và ghi rõ môi trường đã thử.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-028"></a>

### TMC-028 — Kết nối dashboard tối thiểu và factory filter

**Overview**

- Epic: G — Dashboard & Monitoring
- Feature: G01 — Dashboard cơ bản, bộ lọc và trạng thái cổng
- User Story: Là SEC, tôi muốn xem lượt gần đây và backlog theo nhà máy để demo vận hành.
- Type: type:feature
- Priority: P1
- Classification: SUPPORTING
- Labels: type:feature, area:frontend, priority:P1, supporting, milestone:M2
- Sprint: Sprint 3
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Easy
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 1 + R 0.25 + I 0.25 + T 0.5 + D 0
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 24/11/2026
- Due Date: 24/11/2026
- Dependencies: [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-025](#tmc-025)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: client/src/features/dashboard/**, api/src/modules/gate/application/queries/**, client/src/shared/api/**.
- Verification Commands: pnpm --dir client build; pnpm --dir api test:integration -- --runInBand; manual count comparison.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P1: chỉ thay nguồn số liệu chính của dashboard hiện có, không xây analytics. Nếu cắt ticket, list/history/case P0 vẫn đủ quan sát.

**Implementation Tasks**

- [ ] Tổng hợp counts allowed/denied/unknown/case từ server query scoped, không từ KPI seed 1.400.
- [ ] Hiển thị recent events và thời điểm dữ liệu cập nhật; trạng thái gate dựa evidence/lastSeen, chưa biết phải ghi rõ.
- [ ] Áp factory filter trong quyền, không cho SEC đổi sang factory khác.
- [ ] Giữ biểu đồ/khối ngoài module ở mock mode có nhãn, không trộn totals.

**Acceptance Criteria**

- [ ] Số liệu dashboard khớp query/fixture, không tuyên bố heartbeat thật nếu chưa có.
- [ ] Filter không làm rò scope; không trả danh sách HR toàn hệ thống.
- [ ] Trạng thái loading/error/stale có thông báo.

**Testing Checklist**

- [ ] Compare API count với fixture PG theo factory.
- [ ] Manual 403 và không dữ liệu/mạng lỗi.
- [ ] UI light/dark/responsive với nguồn real/mock phân biệt.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Dashboard tối thiểu có số liệu server và filter an toàn.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-029"></a>

### TMC-029 — Kiểm thử module chính trên PostgreSQL thật

**Overview**

- Epic: H — Testing & Quality Assurance
- Feature: H01 — Kiểm thử module chính
- User Story: Là reviewer, tôi muốn bộ test chứng minh module Gate→ATT hoạt động trên database thật.
- Type: type:test
- Priority: P0
- Classification: SUPPORTING
- Labels: type:test, area:backend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 0 + R 0.5 + I 0.5 + T 1.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 25/11/2026
- Due Date: 25/11/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-015](#tmc-015)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/test/core/**, api/src/modules/*/**/*.spec.ts, doc/evidence/core-tests.md.
- Verification Commands: pnpm --dir api test -- --runInBand; pnpm --dir api test:integration -- --runInBand.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Củng cố unit/integration/API tests đã viết trong từng ticket; không đợi tới tuần 4 mới bắt đầu test. Đây là ticket chất lượng độc lập cho module chính.

**Implementation Tasks**

- [ ] Tạo matrix valid/invalid/expired/revoked QR, access grant và station policy.
- [ ] Chạy PG transaction/unique/deferred head tests và kiểm tra nguồn attendance.
- [ ] Chạy API tests auth/station/status/history theo contract.
- [ ] Lưu command, commit hash, môi trường, số test và kết quả thực tế; ghi failure còn lại.

**Acceptance Criteria**

- [ ] Happy path EMP QR→kiosk→mock passage→PG history tái lập được.
- [ ] Denied/ACK-only/UNKNOWN không tạo công; dữ liệu tồn tại sau restart.
- [ ] Test không dùng SQLite hoặc mock repository để tuyên bố PG constraints đúng.

**Testing Checklist**

- [ ] Unit suite và PG integration suite trên DB sạch.
- [ ] API regression với các role đại diện.
- [ ] Review assertions về state, DB count, audit và mock execution counter.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Core test suite và evidence có commit/environment.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-030"></a>

### TMC-030 — Kiểm thử race, crash và phục hồi không mở lặp

**Overview**

- Epic: H — Testing & Quality Assurance
- Feature: H02 — Kiểm thử concurrency và recovery
- User Story: Là người chấm M2, tôi muốn bằng chứng chống trùng và recovery trong tình huống lỗi thực sự.
- Type: type:test
- Priority: P0
- Classification: SUPPORTING
- Labels: type:test, area:backend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 0 + R 0.5 + I 0.5 + T 2.5 + D 0.5
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 26/11/2026
- Due Date: 26/11/2026
- Dependencies: [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-029](#tmc-029)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/test/reliability/**, client/tests/e2e/recovery*.ts, doc/evidence/failure-recovery.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client test:e2e; review mock execution ledger.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Ticket riêng xác minh hai cải tiến M2 bằng fault harness và concurrent PG transactions. Không coi một demo tuần tự là chứng minh race an toàn.

**Implementation Tasks**

- [ ] Chạy race cùng eventId, khác payload, cùng jti khác trạm và hai dispatcher.
- [ ] Kill/restart tại các fault windows, thử lost-response-after-open và status unavailable.
- [ ] Chạy callback lặp/sai thứ tự, worker stale lease, SEC resolve lặp.
- [ ] Đối chiếu attempt/redemption/command/attendance/audit và physicalOpenCount của mock.

**Acceptance Criteria**

- [ ] Duplicate request và redemption không tạo thêm OPEN/attendance.
- [ ] DISPATCHING/UNKNOWN recovery không gửi OPEN lại khi contract không cho phép.
- [ ] Mỗi failure window có expected/actual/evidence; giới hạn bảo đảm vật lý được công bố.

**Testing Checklist**

- [ ] Lặp race có điều phối barrier thay vì chỉ Promise tuần tự.
- [ ] Kiểm tra crash/restart giữ DB và mock ledger riêng.
- [ ] Regression QR expired khi lookup request cũ và out-of-scope case.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Reliability test suite, fault timeline và bảng evidence M2.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-031"></a>

### TMC-031 — Đo tải kiosk và kiểm thử quyền/redaction

**Overview**

- Epic: H — Testing & Quality Assurance
- Feature: H03 — Hiệu năng, RBAC và dữ liệu cá nhân
- User Story: Là chủ hệ thống, tôi muốn biết module đáp ứng NFR đến đâu và dữ liệu cá nhân được bảo vệ thế nào.
- Type: type:test
- Priority: P0
- Classification: SUPPORTING
- Labels: type:test, area:backend, area:security, priority:P0, supporting, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 0 + R 0.5 + I 0.5 + T 1.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 27/11/2026
- Due Date: 27/11/2026
- Dependencies: [TMC-030](#tmc-030), [TMC-007](#tmc-007)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/test/performance/**, api/test/security/**, doc/evidence/nfr-results.md, client instrument timing ở scan adapter nếu cần.
- Verification Commands: pnpm --dir api test:perf; pnpm --dir api test:integration -- --runInBand; rà log và browser Network/storage.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Đo hiệu năng kiosk với tải 800 giao dịch/30 phút/nhà máy và đợt burst có giả định rõ. Chỉ kết luận trong môi trường mock/PG đã thử, không tự chứng nhận compliance pháp lý.

**Implementation Tasks**

- [ ] Tạo workload 800/30 phút cho từng factory, đo thêm burst và hai factory; giữ tách lỗi chủ ý khỏi happy path.
- [ ] Đo từ kiosk bắt đầu submit đến hiển thị response và API latency riêng, ghi p50/p95/p99/max, errors và timeout.
- [ ] So số nguồn xác nhận với attendance sau tải; test IDOR/RBAC và truy vết audit.
- [ ] Rà log/browser bundle/cookie/storage không chứa secret/raw QR; lập mục giới hạn privacy cần hoàn thiện.

**Acceptance Criteria**

- [ ] Báo cáo có boundary đo, concurrency/arrival rate, cấu hình máy/DB/TCS mock, duration và kết quả thô.
- [ ] Không dùng p95≤2 giây để tự thay yêu cầu ≤2 giây; ghi mọi mẫu vượt ngưỡng và điều kiện.
- [ ] Không mất nguồn đã xác nhận trong tập dữ liệu test; chưa đo hoặc fail phải ghi rõ.

**Testing Checklist**

- [ ] Chạy tải đủ 30 phút cho kịch bản cơ sở; burst script riêng.
- [ ] Security API tests 401/403/IDOR và redaction scan.
- [ ] Đối chiếu counts, CPU/DB latency và error reasons; không tính denied chủ ý như lỗi ngẫu nhiên.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Performance/security scripts, raw report và kết luận NFR có giới hạn.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-032"></a>

### TMC-032 — Chạy E2E và đối chiếu giao diện hiện có

**Overview**

- Epic: H — Testing & Quality Assurance
- Feature: H04 — E2E, UI verification và ổn định bản nộp
- User Story: Là người demo, tôi muốn toàn luồng chạy trên UI và trông nhất quán với thiết kế hiện có.
- Type: type:test
- Priority: P0
- Classification: SUPPORTING
- Labels: type:test, area:backend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0 + R 0.25 + I 0.25 + T 1.25 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 28/11/2026
- Due Date: 28/11/2026
- Dependencies: [TMC-021](#tmc-021), [TMC-023](#tmc-023)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: client/tests/e2e/**, client/playwright.config.ts hoặc cấu hình runner đã chốt, doc/evidence/ui-e2e.md.
- Verification Commands: pnpm --dir client test:e2e; pnpm --dir client exec tsc --noEmit; pnpm --dir client build.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Chạy E2E P0 từ portal→virtual kiosk→history→recovery. Webcam/dashboard chỉ kiểm tra bổ sung nếu P1 được chọn; không để P0 phụ thuộc chúng.

**Implementation Tasks**

- [ ] Tự động hóa login EMP, lấy QR, scan virtual, mock passage và kiểm tra history API/UI.
- [ ] Chạy denied/expired/replay/UNKNOWN và journal reload bằng backend fixtures.
- [ ] Đối chiếu mobile 360/tablet/desktop, keyboard, focus, chữ/icon trạng thái, light/dark với baseline.
- [ ] Ghi ảnh/video, URL/môi trường và Figma source nếu được cung cấp; chưa có Figma URL phải ghi giới hạn.

**Acceptance Criteria**

- [ ] E2E P0 pass không cần camera vật lý hoặc dashboard P1.
- [ ] Không có dữ liệu real/mock trộn mà không nhãn, không xuất hiện đã ghi công ở ACK-only.
- [ ] Browser refresh và session switch không làm rò cache.

**Testing Checklist**

- [ ] Chạy E2E trên ít nhất browser demo được chọn.
- [ ] Manual negative camera nếu đã làm 027; dashboard count nếu đã làm 028.
- [ ] Kiểm tra console errors, assets và responsive baseline.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- E2E scripts, screenshots/video và checklist UI/Figma.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-033"></a>

### TMC-033 — Gắn bằng chứng SOLID với source và tests

**Overview**

- Epic: I — Documentation & Submission
- Feature: I02 — Bằng chứng SOLID và reflection
- User Story: Là người chấm SOLID, tôi muốn ví dụ trỏ tới code thật và tests thay vì định nghĩa chung.
- Type: type:feature
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:feature, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Architecture Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0.75 + R 0.5 + I 0.25 + T 0.25 + D 0.25
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 25/11/2026
- Due Date: 25/11/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-024](#tmc-024)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/solid-implementation.md; api/src/modules/gate/** và ports/adapters liên quan nếu cần refactor nhỏ; tests tương ứng.
- Verification Commands: pnpm --dir api typecheck; pnpm --dir api test -- --runInBand; review source links.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Ticket riêng cho SOLID Implementation Examples. Đánh giá code module đã có, chỉ refactor nhỏ khi có vi phạm cụ thể và bảo toàn behavior.

**Implementation Tasks**

- [ ] Map SRP cho validator/policy/dispatcher/writer; DIP cho use case/ports và bootstrap providers.
- [ ] Map OCP cho mock/HTTP adapter và ISP cho interface tách open/status/query.
- [ ] Chứng minh LSP qua contract tests, giữ UNKNOWN semantics giống nhau giữa adapter.
- [ ] Ghi file/symbol/commit, lợi ích và trade-off; sửa import/framework leakage nếu tìm thấy.

**Acceptance Criteria**

- [ ] Có ví dụ cụ thể cho S/O/L/I/D, link source và assertion/contract test.
- [ ] Không thêm interface/lớp trống chỉ để đủ danh sách SOLID.
- [ ] Refactor nếu có không làm thay đổi policy hoặc bỏ concurrency constraints.

**Testing Checklist**

- [ ] Review import boundary và dùng cùng contract test cho adapters.
- [ ] Chạy suite bị ảnh hưởng bởi refactor.
- [ ] Kiểm tra link source theo commit và so code thật với mô tả.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Bản đồ SOLID có bằng chứng code/test; refactor nhỏ có lý do nếu cần.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-034"></a>

### TMC-034 — Viết SOLID Reflection từ kết quả thực hiện

**Overview**

- Epic: I — Documentation & Submission
- Feature: I02 — Bằng chứng SOLID và reflection
- User Story: Là người nộp bài, tôi muốn reflection phản ánh trải nghiệm áp dụng SOLID thực tế.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Documentation Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0 + R 0.5 + I 0 + T 0 + D 1.5
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.5 + I 0), đã nằm trong tổng
- Start Date: 27/11/2026
- Due Date: 27/11/2026
- Dependencies: [TMC-033](#tmc-033), [TMC-030](#tmc-030)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/solid-reflection.md và phần tương ứng trong bản thảo báo cáo; không sửa code ngoài phát hiện blocker mới.
- Verification Commands: Review tài liệu, link/code evidence và kiểm tra câu hỏi reflection M2.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Viết reflection ngắn theo M2 về lợi ích, khó khăn, modularity, maintainability và extensibility, dựa trên code/review/rework đã xảy ra.

**Implementation Tasks**

- [ ] Chọn ít nhất hai tình huống thực tế như thay gateway hoặc lỗi transaction context.
- [ ] Mô tả trước/sau và nguyên tắc giúp giải quyết; nêu chi phí abstraction/DI.
- [ ] Liên kết ví dụ033 và kết quả030, ghi rõ giới hạn/chưa làm.
- [ ] Viết bằng giọng phản ánh của nhóm, Solo Developer kiểm tra tính xác thực trước nộp.

**Acceptance Criteria**

- [ ] Trả lời đầy đủ lợi ích, khó khăn và ảnh hưởng SOLID theo đề.
- [ ] Không bịa kinh nghiệm, số liệu hoặc test chưa chạy.
- [ ] Nội dung nhất quán với code và architecture cuối cùng.

**Testing Checklist**

- [ ] Cross-review reflection với issue/review log và evidence thực tế.
- [ ] Kiểm tra trích dẫn code/diagram còn đúng.
- [ ] So yêu cầu reflection ở PDF M2 trang3.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- SOLID Reflection Report sẵn để ghép vào báo cáo.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-035"></a>

### TMC-035 — Cập nhật kiến trúc, ADR và ba architectural views

**Overview**

- Epic: I — Documentation & Submission
- Feature: I01 — Baseline FR/NFR, kiến trúc và ba views
- User Story: Là người chấm kiến trúc, tôi muốn ba views và ADR phản ánh đúng bản chạy cuối.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Architecture Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 4h tổng = H 0 + R 0.75 + I 0 + T 0.25 + D 3
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.75 + I 0), đã nằm trong tổng
- Start Date: 28/11/2026
- Due Date: 30/11/2026
- Dependencies: [TMC-001](#tmc-001), [TMC-022](#tmc-022), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-031](#tmc-031)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/m2-architecture.md, doc/adr/**, doc/requirements-traceability.md, doc/structure-architecture.md, doc/user-flow.md khi cần đồng bộ.
- Verification Commands: Review Markdown/diagram, export thử PDF và so toàn bộ Task1 M2.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Hợp nhất M1 và thay đổi M2 thành Software Architecture Design cuối cùng. Không chỉ thêm diagram vào báo cáo cũ mà bỏ các phần characteristic/style/trade-off.

**Implementation Tasks**

- [ ] Cập nhật FR/NFR, measurable scenarios và architecture characteristics; so modular monolith/layered/microservices theo tiêu chí cụ thể.
- [ ] Trình bày từng bước logical→physical, module/dependency view, C&C runtime/sequence và allocation/deployment.
- [ ] Ghi ADR thay đổi QR static→short-lived, R1 recovery, evidence/UNKNOWN, transaction context và dependency Figma.
- [ ] Gắn triển khai thực tế, mock, chưa triển khai, số đo và trade-offs; đối chiếu schema 37 với module code subset.

**Acceptance Criteria**

- [ ] Đủ mọi mục Task1 cùng cả ba architectural views, không nhầm sơ đồ thư mục với runtime view.
- [ ] Hai vấn đề M2 có mitigation, vị trí tích hợp và residual risks rõ.
- [ ] HRS trước noon ngày 1 được giữ ở thiết kế; không tuyên bố đã tích hợp khi 041 chưa làm.

**Testing Checklist**

- [ ] Cross-check diagram node/connector với source/config cuối.
- [ ] Review mapping requirement→design→ticket→test/evidence.
- [ ] Kiểm tra link, caption, readable export và thuật ngữ giữa các tài liệu.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Software Architecture Design cuối, ba views và ADR có trạng thái quyết định.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-036"></a>

### TMC-036 — Viết README, setup và kịch bản demo tái lập

**Overview**

- Epic: I — Documentation & Submission
- Feature: I03 — Runbook, báo cáo và nộp bài
- User Story: Là người tải repo, tôi muốn chạy demo từ hướng dẫn mà không cần biết môi trường máy tác giả.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Documentation Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 2h tổng = H 0 + R 0.25 + I 0.25 + T 0.5 + D 1
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.5h (R 0.25 + I 0.25), đã nằm trong tổng
- Start Date: 30/11/2026
- Due Date: 30/11/2026
- Dependencies: [TMC-005](#tmc-005), [TMC-032](#tmc-032)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: README.md, doc/setup.md, doc/demo.md, .env.example, compose.yaml phần hướng dẫn/config cần thiết.
- Verification Commands: Làm theo doc/setup.md; pnpm --dir api build; pnpm --dir client build; smoke demo.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Viết setup/runbook chính xác cho client/api/PG/mock. Phân biệt preview Figma đang chạy với standalone build; không giả định package private có sẵn.

**Implementation Tasks**

- [ ] Ghi toolchain đã pin, dependency Astra hợp lệ, env, DB migration/seed, start API/worker/client.
- [ ] Liệt kê accounts/station provision và cách tách public demo với server mode.
- [ ] Viết kịch bản happy/denied/replay/timeout/recovery và reset chỉ DB demo.
- [ ] Ghi verification commands, môi trường đã chạy, giới hạn simulator và xử lý lỗi cài đặt.

**Acceptance Criteria**

- [ ] Clean checkout đi theo README có thể chạy slice đã chọn.
- [ ] Không cần secret cá nhân hardcode; step nào cần quyền/package phải ghi nguồn cấp.
- [ ] GitHub URL đúng và mọi giới hạn mock/camera/HRS hiện rõ.

**Testing Checklist**

- [ ] Clean setup smoke test trong thư mục/môi trường tạm được phép.
- [ ] Chạy theo demo steps và đối chiếu expected state.
- [ ] Kiểm tra assets/fonts và dependency install tái lập từ lockfile.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- README, setup/demo runbook, env template và clean-run evidence.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-037"></a>

### TMC-037 — Đóng gói báo cáo M2 và chuẩn bị nộp LMS

**Overview**

- Epic: I — Documentation & Submission
- Feature: I03 — Runbook, báo cáo và nộp bài
- User Story: Là người nộp bài, tôi muốn bộ nộp có báo cáo, GitHub source và bằng chứng đầy đủ trước hạn nội bộ.
- Type: type:documentation
- Priority: P0
- Classification: DOCUMENTATION
- Labels: type:documentation, area:architecture, priority:P0, documentation, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Documentation Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 0 + R 0.5 + I 0.25 + T 0.75 + D 1.5
- Estimated AI-Assisted Effort: 0.5h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: 01/12/2026
- Due Date: 01/12/2026
- Dependencies: [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-038](#tmc-038)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/submission/**, báo cáo M2 nguồn/PDF, README.md phần submission; không sửa core trừ blocker được mở rõ.
- Verification Commands: Review bộ nộp, mở GitHub/PDF, chạy demo theo runbook; xác nhận LMS do Solo Developer.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Đóng gói report PDF và release candidate với URL GitHub thực. Nộp LMS là thao tác của Solo Developer trong kế hoạch; ticket không tự đăng/push/nộp từ nhiệm vụ lập kế hoạch này.

**Implementation Tasks**

- [ ] Ghép Architecture Design, hai cải tiến M2, SOLID/reflection và module implementation/testing evidence.
- [ ] Ghi URL https://github.com/tungbinhdinh89/TMCQRAttendanceSystem_KTPM và commit/release candidate đã kiểm tra quyền đọc.
- [ ] So checklist đề, format PDF, link, hình và hạn LMS chính thức; không coi 01/12 là deadline giảng viên đã xác nhận.
- [ ] Solo Developer chuẩn bị/nộp trên LMS, lưu receipt khi có; cập nhật trạng thái chỉ sau bằng chứng.

**Acceptance Criteria**

- [ ] Báo cáo có URL GitHub chứa source đúng commit và truy cập được theo quyền môn học.
- [ ] Không thiếu Task1/2, reflection hoặc hai vấn đề M2.
- [ ] File/receipt thực tế mới được đánh dấu Submitted; không lấy tạo PDF làm bằng chứng nộp LMS.

**Testing Checklist**

- [ ] Mở PDF và tất cả link quan trọng từ tài khoản kiểm tra phù hợp.
- [ ] Re-run demo release candidate đã khóa.
- [ ] Đối chiếu tên file/dung lượng/deadline LMS và lưu xác nhận sau khi nộp.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Tài liệu và diagram đã được Solo Developer review; source/test links được kiểm tra.
- [ ] Build/typecheck N/A nếu chỉ sửa tài liệu; nếu sửa code thì chạy build/typecheck phần bị ảnh hưởng.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Báo cáo M2/PDF, source commit reference, checklist và receipt nếu đã nộp.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-038"></a>

### TMC-038 — Sửa blocker và xác nhận release candidate

**Overview**

- Epic: H — Testing & Quality Assurance
- Feature: H04 — E2E, UI verification và ổn định bản nộp
- User Story: Là release owner, tôi muốn không còn blocker trước khi đóng gói báo cáo.
- Type: type:test
- Priority: P0
- Classification: SUPPORTING
- Labels: type:test, area:backend, priority:P0, supporting, milestone:M2
- Sprint: Sprint 4
- Primary Owner: Solo Developer
- Executor: Testing/QA Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 0 + R 0.5 + I 0.5 + T 1.75 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 1h (R 0.5 + I 0.5), đã nằm trong tổng
- Start Date: 30/11/2026
- Due Date: 30/11/2026
- Dependencies: [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-035](#tmc-035), [TMC-036](#tmc-036)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: Chỉ file có bug tái lập trong client/api/tests; doc/evidence/release-candidate.md; không mở feature mới.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client test:e2e; pnpm --dir api build; pnpm --dir client build.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

Timebox ổn định 3 giờ đã tính vào plan, khác buffer38 giờ chưa phân công. Nếu phát hiện lỗi lớn thì dùng buffer và cập nhật estimate, không ẩn failure.

**Implementation Tasks**

- [ ] Triage lỗi029–032 theo severity, ghi repro/expected/actual và fix nhỏ.
- [ ] Giữ policy/constraints/secret handling; nếu thay contract thì cập nhật source/docs/test cùng nhau.
- [ ] Re-run regression bị ảnh hưởng và build hai app.
- [ ] Khóa candidate commit, ghi known limitations và bàn giao037.

**Acceptance Criteria**

- [ ] Không còn blocker/critical về mở lặp, mất nguồn, rò scope hoặc không chạy demo.
- [ ] Mọi bug fix có repro và regression assertion phù hợp.
- [ ] Known P1/P2 chưa làm được ghi rõ, không gọi chúng là completed.

**Testing Checklist**

- [ ] Chạy core/reliability/E2E suites liên quan thay đổi.
- [ ] Build/typecheck hai app.
- [ ] Smoke restart/recovery và chạy demo từ đầu theo runbook.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Release candidate, bug log và kết quả regression.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-039"></a>

### TMC-039 — Bổ sung heartbeat và metrics vận hành

**Overview**

- Epic: G — Dashboard & Monitoring
- Feature: G01 — Dashboard cơ bản, bộ lọc và trạng thái cổng
- User Story: Là người vận hành, tôi muốn theo dõi trạm và backlog thực thay vì cờ online seed.
- Type: type:feature
- Priority: P1
- Classification: SUPPORTING
- Labels: type:feature, area:backend, priority:P1, supporting, milestone:M2
- Sprint: Deferred — ngoài 4 Sprint baseline
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 3h tổng = H 1.5 + R 0.5 + I 0.25 + T 0.5 + D 0.25
- Estimated AI-Assisted Effort: 1h máy/agent, không cộng capacity người
- Review & Integration Effort: 0.75h (R 0.5 + I 0.25), đã nằm trong tổng
- Start Date: Chưa xếp lịch — sau 01/12/2026
- Due Date: Chưa xếp lịch — sau 01/12/2026
- Dependencies: [TMC-028](#tmc-028), [TMC-024](#tmc-024)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/gate/application/monitoring/**, client/src/features/dashboard/**, doc/monitoring.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client build; manual stale simulation.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P1 hoãn sau M2 baseline. Mở rộng dashboard bằng heartbeat/authenticated station health và số liệu worker; không triển khai observability platform.

**Implementation Tasks**

- [ ] Thêm heartbeat endpoint từ trạm đã xác thực và lưu lastSeen.
- [ ] Định nghĩa stale threshold cấu hình, phân biệt station connectivity với TCS/device physical health.
- [ ] Tổng hợp pending/failed jobs, case age, UNKNOWN và latency từ dữ liệu thật.
- [ ] Hiển thị timestamp/chất lượng dữ liệu và factory-scoped metrics.

**Acceptance Criteria**

- [ ] Không đồng nhất heartbeat app với cổng vật lý hoạt động.
- [ ] Scope của metrics giống API nghiệp vụ.
- [ ] Backlog tăng có thể quan sát và stale heartbeat hiển thị UNKNOWN/OFFLINE rõ.

**Testing Checklist**

- [ ] Fake clock cho stale threshold và trạm revoked.
- [ ] Cross-factory metrics và API rate limit.
- [ ] So counts với jobs/cases fixture.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Heartbeat/metrics API/UI và monitoring runbook.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-040"></a>

### TMC-040 — Mở rộng workflow HR correction có revision

**Overview**

- Epic: E — Attendance Event Recording
- Feature: E03 — Hiệu chỉnh công có version
- User Story: Là HR được cấp quyền, tôi muốn sửa công có version và giữ nguyên dữ liệu gốc.
- Type: type:feature
- Priority: P2
- Classification: SUPPORTING
- Labels: type:feature, area:backend, priority:P2, supporting, milestone:M2
- Sprint: Deferred — ngoài 4 Sprint baseline
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 8h tổng = H 4 + R 1 + I 1 + T 1.5 + D 0.5
- Estimated AI-Assisted Effort: 2.667h máy/agent, không cộng capacity người
- Review & Integration Effort: 2h (R 1 + I 1), đã nằm trong tổng
- Start Date: Chưa xếp lịch — sau 01/12/2026
- Due Date: Chưa xếp lịch — sau 01/12/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-007](#tmc-007)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/att/** phần correction/review/projection; client/src/features/attendance/**; doc/attendance-correction.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client test:e2e.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P2 ngoài module nộp baseline. Schema đã dự trù correction/revision; hiện thực full workflow cần thêm giờ, không dùng prototype decideAdjustment ghi đè làm sản phẩm thật.

**Implementation Tasks**

- [ ] Thêm correction use case CAS expectedVersion và audit; void/revision không UPDATE payload gốc.
- [ ] Kiểm tra HR permission/scope/reason/evidence; ADM/SUP không tự có quyền sửa.
- [ ] Thêm review request UI tối thiểu, conflict flow và effective history.
- [ ] Rebuild pairing đúng nhiều IN/OUT/overnight; không ghi đè snapshot cũ.

**Acceptance Criteria**

- [ ] Hai HR sửa cùng version: một thành công, một conflict không lưu một phần.
- [ ] Revision 1 không đổi; nguồn correction liên kết đúng before/after versions.
- [ ] Nhiều khoảng trong ngày không tính cả thời gian vắng như first-in/last-out.

**Testing Checklist**

- [ ] Deferred FK/CAS race và rollback correction/revision/audit.
- [ ] API permissions, reason rỗng, void và nhầm employee.
- [ ] Pairing overnight/missing/duplicate IN và boundary month.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Correction API/UI, projection policy, tests và evidence.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-041"></a>

### TMC-041 — Triển khai snapshot tháng và HRS delivery đầy đủ

**Overview**

- Epic: G — Dashboard & Monitoring
- Feature: G02 — Xuất tháng HRS hoàn chỉnh
- User Story: Là HR, tôi muốn lô tháng gửi HRS đúng phiên bản và truy vết được mỗi lần giao nhận.
- Type: type:feature
- Priority: P2
- Classification: SUPPORTING
- Labels: type:feature, area:backend, priority:P2, supporting, milestone:M2
- Sprint: Deferred — ngoài 4 Sprint baseline
- Primary Owner: Solo Developer
- Executor: Backend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 12h tổng = H 6 + R 1.5 + I 1.5 + T 2.25 + D 0.75
- Estimated AI-Assisted Effort: 4h máy/agent, không cộng capacity người
- Review & Integration Effort: 3h (R 1.5 + I 1.5), đã nằm trong tổng
- Start Date: Chưa xếp lịch — sau 01/12/2026
- Due Date: Chưa xếp lịch — sau 01/12/2026
- Dependencies: [TMC-019](#tmc-019), [TMC-024](#tmc-024), [TMC-040](#tmc-040)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: api/src/modules/rpt/**, api/src/shared/infrastructure/jobs/** phần HRS, client/src/features/reports/**, doc/hrs-contract.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client test:e2e; review ACK evidence.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P2 implementation ngoài module baseline; yêu cầu/tích hợp HRS vẫn phải có trong kiến trúc P0. Chỉ triển khai khi đã có contract mock/real được chốt.

**Implementation Tasks**

- [ ] Tạo snapshot Batch/Items/ItemSources với payloadText/checksum/count và source revisions bất biến.
- [ ] Tạo Outbox+Job cùng transaction; adapter HRS submit/status và ExportAttempt mỗi lần.
- [ ] Retry đúng batch ID/content, ACK xác minh kỳ/version/checksum/count/partial; hỗ trợ supersedes khi correction.
- [ ] Lập lịch/alert theo timezone và mốc trước 12:00 ngày 1; tách acceptedAt với remoteReadyAt.

**Acceptance Criteria**

- [ ] Mất response rồi retry không tạo dữ liệu lô khác; partial/mismatch không thành ACCEPTED.
- [ ] Snapshot cũ không đổi khi công live được hiệu chỉnh.
- [ ] Không tính lương; chưa có HRS thật thì chỉ kết luận contract mock.

**Testing Checklist**

- [ ] Snapshot consistency và FK source revisions.
- [ ] Lost ACK/idempotency/status không hỗ trợ/permanent errors.
- [ ] Boundary month/overnight, dueAt và đúng12:00 không là trước hạn.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Export worker/adapter/UI và HRS contract tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-042"></a>

### TMC-042 — Khảo sát và prototype edge offline tự động

**Overview**

- Epic: F — Failure Handling & Recovery
- Feature: F03 — Edge tự động offline
- User Story: Là kiến trúc sư, tôi muốn đánh giá có thể tiếp tục tự động tại nhà máy khi WAN đứt đến đâu.
- Type: type:feature
- Priority: P2
- Classification: SUPPORTING
- Labels: type:feature, area:architecture, priority:P2, supporting, milestone:M2
- Sprint: Deferred — ngoài 4 Sprint baseline
- Primary Owner: Solo Developer
- Executor: Architecture Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Hard
- Story Points: Không sử dụng
- Estimated Human Effort: 16h tổng = H 8 + R 2 + I 2 + T 3 + D 1
- Estimated AI-Assisted Effort: 5.333h máy/agent, không cộng capacity người
- Review & Integration Effort: 4h (R 2 + I 2), đã nằm trong tổng
- Start Date: Chưa xếp lịch — sau 01/12/2026
- Due Date: Chưa xếp lịch — sau 01/12/2026
- Dependencies: [TMC-022](#tmc-022), [TMC-024](#tmc-024), [TMC-030](#tmc-030)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md)
- Files/Modules được phép thay đổi: doc/adr/edge-offline.md, prototype edge/ cô lập nếu được mở scope sau này, integration tests riêng.
- Verification Commands: Chạy test harness edge riêng theo ADR được chọn; review failure/partition matrix.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P2 nghiên cứu/prototype edge, không phải bật offline OPEN cho kiosk hiện tại. Cần chốt threat model, grant cache, khóa và giới hạn consistency trước làm.

**Implementation Tasks**

- [ ] So central R1 với edge local durable DB, sync outbox/inbox, key provisioning và clock.
- [ ] Chốt offline authorization freshness/revocation, replay liên trạm/liên nhà máy và physical safety boundary.
- [ ] Prototype local journal/sync idempotent cùng conflict policy và mô phỏng WAN partition.
- [ ] Đo lưu bền vững/reconcile và ghi điều kiện cho phép/từ chối tự động; không dùng prototype như production.

**Acceptance Criteria**

- [ ] Nêu rõ quyền có thể stale và không hứa one-time token toàn hệ thống khi partition.
- [ ] Offline OPEN chỉ khi policy được chốt; trạng thái chưa xác minh không thành công giả.
- [ ] Có trade-off deploy/ops/key protection và bằng chứng sync.

**Testing Checklist**

- [ ] Partition hai edge dùng cùng QR và revoke khi offline.
- [ ] Crash local persistence, clock drift và reconnect duplicate.
- [ ] Thử conflict/reconciliation và giới hạn lưu trữ.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- Edge ADR, threat model và prototype evidence nếu thực hiện.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="tmc-043"></a>

### TMC-043 — Làm UI quản trị tài khoản/role toàn diện

**Overview**

- Epic: B — Authentication & Employee Foundation
- Feature: B03 — Giao diện quản trị IAM đầy đủ
- User Story: Là ADM, tôi muốn quản trị tài khoản và scope qua UI thay vì sửa seed.
- Type: type:feature
- Priority: P2
- Classification: SUPPORTING
- Labels: type:feature, area:frontend, priority:P2, supporting, milestone:M2
- Sprint: Deferred — ngoài 4 Sprint baseline
- Primary Owner: Solo Developer
- Executor: Frontend Agent (vai trò hỗ trợ; chưa giao việc)
- Reviewer: Solo Developer
- Complexity: Medium
- Story Points: Không sử dụng
- Estimated Human Effort: 6h tổng = H 3 + R 0.75 + I 0.75 + T 1.125 + D 0.375
- Estimated AI-Assisted Effort: 2h máy/agent, không cộng capacity người
- Review & Integration Effort: 1.5h (R 0.75 + I 0.75), đã nằm trong tổng
- Start Date: Chưa xếp lịch — sau 01/12/2026
- Due Date: Chưa xếp lịch — sau 01/12/2026
- Dependencies: [TMC-007](#tmc-007), [TMC-008](#tmc-008)
- Status: Backlog
- Input Documents: [M1](spec.pdf), [M2](SA_CC_hk261_Assignment_M2.pdf), [architecture](structure-architecture.md), [schema](schema-database.md), [flow](user-flow.md), [UI guidelines](../guidelines/Guidelines.md) và baseline source
- Files/Modules được phép thay đổi: api/src/modules/iam/** management, client/src/features/settings/**, doc/permission-matrix.md.
- Verification Commands: pnpm --dir api test:integration -- --runInBand; pnpm --dir client test:e2e.
- Human Approval Required: Solo Developer review/nghiệm thu trước Done; không tự phê duyệt output của AI

**Description**

P2: mở rộng IAM management screens. Auth/RBAC tối thiểu P0 dùng seed và APIs đã kiểm tra, không chờ full console.

**Implementation Tasks**

- [ ] Tạo user/role/scope assignment APIs có permission quản trị và audit.
- [ ] Tạo UI danh sách/form với scope shape SELF/GLOBAL/FACTORY/DEPARTMENT/TEAM.
- [ ] Thu hồi sessions khi disable/revoke theo policy; giữ lịch sử assignments.
- [ ] Chặn tự cấp đặc quyền không được phép, không tạo implicit HR correction quyền ADM.

**Acceptance Criteria**

- [ ] Role/scope persistence đúng unique/shape constraints.
- [ ] ADM quản trị được IAM theo quyền nhưng không tự sửa công HR.
- [ ] Mọi thay đổi có actor/reason/audit và cross-scope negative tests.

**Testing Checklist**

- [ ] Scope NULL uniqueness, revoke và stale sessions.
- [ ] Self escalation/IDOR/invalid scope references.
- [ ] UI conflict/error/empty và permission guards.

**Definition of Done**

- [ ] Phạm vi và mọi Acceptance Criteria của ticket đã đạt, không mở feature ngoài scope.
- [ ] Code/diff đã được Solo Developer review, tuân import boundary, scope và secret handling.
- [ ] Build/typecheck thành công cho phần code bị ảnh hưởng; không che lỗi bằng bỏ qua kiểm tra.
- [ ] Các kiểm chứng trong Testing Checklist có kết quả/evidence thật; không đánh dấu pass khi chưa chạy.
- [ ] Không còn lỗi blocking; limitations hoặc ticket hoãn đã được ghi rõ.
- [ ] Tài liệu/API contract hoặc runbook liên quan đã được cập nhật.
- [ ] Solo Developer nghiệm thu và cập nhật trạng thái Done sau khi tích hợp.

**Deliverables**

- IAM management API/UI và security tests.
- Phạm vi file/module và lệnh kiểm chứng như Overview; lưu evidence theo ticket ID/commit, gồm kết quả lỗi nếu có.

<a id="s9"></a>

## 9. Sprint Planning — Kế hoạch 4 tuần

Ngày ghi theo DD/MM/YYYY, giờ dùng số thập phân. Mỗi tuần có 36h ở kịch bản High; chỉ phân công 25–28h để giữ buffer cho rework, trao đổi và lỗi phát sinh. Số giờ trong bảng đã gồm review/integration/test/docs, không cộng thêm lần nữa.

### 9.1. Sprint Summary

| Sprint | Start | End | Sprint Goal | Tickets | Human Effort (h) | Capacity (h) | Deliverables | Status |
|---|---|---|---|---|---|---|---|---|
| S1 | 04/11/2026 | 10/11/2026 | Foundation tái lập, auth server và QR model | [TMC-001](#tmc-001), [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-004](#tmc-004), [TMC-005](#tmc-005), [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-009](#tmc-009) | 25 | 36 | client/api packages, PG 37 bảng, seed, session/RBAC, QR credential | Planned |
| S2 | 11/11/2026 | 17/11/2026 | QR ký → Virtual Kiosk → access decision → Mock TCS | [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-017](#tmc-017), [TMC-018](#tmc-018) | 27 | 36 | QR issue/revoke/validate/replay, access policy, PREPARED/CAS, mock TCS và virtual kiosk | Planned |
| S3 | 18/11/2026 | 24/11/2026 | Attendance end-to-end và phục hồi có kiểm soát | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-027](#tmc-027), [TMC-028](#tmc-028) | 26 | 36 | Event+revision 1, history/status/UI, network ADR, journal, durable worker/case; webcam/dashboard nếu đủ giờ | Planned |
| S4 | 25/11/2026 | 01/12/2026 | Kiểm chứng module, khóa kiến trúc và chuẩn bị bài nộp | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-037](#tmc-037), [TMC-038](#tmc-038) | 28 | 36 | Core/failure/perf/E2E evidence, SOLID examples/reflection, ba views, README, candidate và report PDF | Planned |

### 9.2. Chi tiết từng Sprint

#### Sprint 1 — Foundation tái lập, auth server và QR model

- Sprint ID: S1; Start/End: 04/11/2026–10/11/2026.
- Assigned Tickets: [TMC-001](#tmc-001), [TMC-002](#tmc-002), [TMC-003](#tmc-003), [TMC-004](#tmc-004), [TMC-005](#tmc-005), [TMC-006](#tmc-006), [TMC-007](#tmc-007), [TMC-008](#tmc-008), [TMC-009](#tmc-009).
- CORE Features: C01 credential/key model; nền cho GATE→ATT.
- Total Human Effort: **25h**; Review & Integration: **6.25h**, đã nằm trong tổng.
- Estimated Capacity: **36h**; chưa phân công **11h**. Deliverables: client/api packages, PG 37 bảng, seed, session/RBAC, QR credential.
- Dependencies: M1/schema/stack hiện có; chưa phụ thuộc code Sprint khác.
- Risks: Astra thiếu nguồn cấp; di chuyển Figma entry; migrations FK vòng; auth integration.

**Acceptance Criteria**

- [ ] Client/API/PG chạy từ hướng dẫn nền; migrations/seed tái lập.
- [ ] Auth server và scope negative tests hoạt động; UI login nhận session.
- [ ] Credential/key metadata có model và constraints, chưa giả định QR flow hoàn tất.

**Sprint Demo Checklist**

- [ ] Mở preview sau chuyển client/, kiểm tra assets và light/dark.
- [ ] Login EMP/SEC, thử 403 scope và logout.
- [ ] Trình bày catalog migration37 bảng và test rollback/deferred ledger.
- [ ] P0 của Sprint đạt DoD; code đã tích hợp, tests liên quan có evidence và không còn blocker.
- [ ] Tài liệu cập nhật; P1/P2 hoặc ticket chưa đạt được đưa lại backlog với remaining effort, không tự đánh Done.

#### Sprint 2 — QR ký → Virtual Kiosk → access decision → Mock TCS

- Sprint ID: S2; Start/End: 11/11/2026–17/11/2026.
- Assigned Tickets: [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016), [TMC-017](#tmc-017), [TMC-018](#tmc-018).
- CORE Features: C01/C02/C03, D01/D02/D03, E01 preparation/idempotency.
- Total Human Effort: **27h**; Review & Integration: **6.75h**, đã nằm trong tổng.
- Estimated Capacity: **36h**; chưa phân công **9h**. Deliverables: QR issue/revoke/validate/replay, access policy, PREPARED/CAS, mock TCS và virtual kiosk.
- Dependencies: Foundation/auth/QR model Sprint 1 Done.
- Risks: Crypto/algorithm claims; race redemption; command UNKNOWN; chưa ghi attendance trước Sprint 3.

**Acceptance Criteria**

- [ ] QR hợp lệ gọi mock TCS qua API; fake/expired/revoked bị từ chối.
- [ ] Cùng station/event idempotent và cùng jti không redeem hai lần.
- [ ] Kiosk thể hiện ALLOW/command/attendance riêng; ACK-only không thành đã ghi công.

**Sprint Demo Checklist**

- [ ] Lấy QR ở portal, scan virtual vào station IN và xem command result.
- [ ] Quét expired/wrong grant/replay và kiểm tra không OPEN.
- [ ] Mô phỏng accepted-only/timeout, chỉ ra trạng thái UNKNOWN.
- [ ] P0 của Sprint đạt DoD; code đã tích hợp, tests liên quan có evidence và không còn blocker.
- [ ] Tài liệu cập nhật; P1/P2 hoặc ticket chưa đạt được đưa lại backlog với remaining effort, không tự đánh Done.

#### Sprint 3 — Attendance end-to-end và phục hồi có kiểm soát

- Sprint ID: S3; Start/End: 18/11/2026–24/11/2026.
- Assigned Tickets: [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-021](#tmc-021), [TMC-022](#tmc-022), [TMC-023](#tmc-023), [TMC-024](#tmc-024), [TMC-025](#tmc-025), [TMC-026](#tmc-026), [TMC-027](#tmc-027), [TMC-028](#tmc-028).
- CORE Features: E01 ledger/E02 history, F01/F02 recovery/SEC.
- Total Human Effort: **26h**; Review & Integration: **6.5h**, đã nằm trong tổng.
- Estimated Capacity: **36h**; chưa phân công **10h**. Deliverables: Event+revision 1, history/status/UI, network ADR, journal, durable worker/case; webcam/dashboard nếu đủ giờ.
- Dependencies: API scan/CAS/mock contract Sprint 2 Done.
- Risks: Mất ACK sau physical OPEN; worker stale lease; journal storage failure; P1 ăn buffer.

**Acceptance Criteria**

- [ ] Mock passage tạo một nguồn công+revision 1/audit; history đọc qua API.
- [ ] Mất response/restart lookup được request cũ, không OPEN lặp.
- [ ] SEC đúng scope có thể xử lý case theo evidence/version; journal không giữ token.

**Sprint Demo Checklist**

- [ ] Chạy portal→virtual scan→passage→history sau restart.
- [ ] Tắt mạng sau commit, reload kiosk, đối soát cùng eventId.
- [ ] Tạo UNKNOWN và xử lý SEC; nếu đã làm P1 thì demo camera/dashboard có nhãn nguồn.
- [ ] P0 của Sprint đạt DoD; code đã tích hợp, tests liên quan có evidence và không còn blocker.
- [ ] Tài liệu cập nhật; P1/P2 hoặc ticket chưa đạt được đưa lại backlog với remaining effort, không tự đánh Done.

#### Sprint 4 — Kiểm chứng module, khóa kiến trúc và chuẩn bị bài nộp

- Sprint ID: S4; Start/End: 25/11/2026–01/12/2026.
- Assigned Tickets: [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-033](#tmc-033), [TMC-034](#tmc-034), [TMC-035](#tmc-035), [TMC-036](#tmc-036), [TMC-037](#tmc-037), [TMC-038](#tmc-038).
- CORE Features: Regression/security/recovery của toàn slice; tài liệu P0.
- Total Human Effort: **28h**; Review & Integration: **7.75h**, đã nằm trong tổng.
- Estimated Capacity: **36h**; chưa phân công **8h**. Deliverables: Core/failure/perf/E2E evidence, SOLID examples/reflection, ba views, README, candidate và report PDF.
- Dependencies: Vertical slice/recovery Sprint 3 chạy được; evidence cập nhật trước report.
- Risks: P0 defect muộn; kết quả performance không đạt; report/code lệch; quyền đọc GitHub/LMS chưa xác minh.

**Acceptance Criteria**

- [ ] 36 P0 tickets đạt DoD hoặc ghi blocker thật và cập nhật kế hoạch, không tự gọi hoàn tất.
- [ ] Có kết quả đo/test thực, residual risks và giới hạn mock rõ.
- [ ] Report đủ Task1/2, SOLID/reflection, GitHub URL và candidate chạy lại được.

**Sprint Demo Checklist**

- [ ] Chạy happy/denied/replay/lost ACK/recovery trên candidate.
- [ ] Mở evidence và giải thích số đo≤2s cùng giới hạn.
- [ ] Mở PDF, ba views, source commit và checklist LMS.
- [ ] P0 của Sprint đạt DoD; code đã tích hợp, tests liên quan có evidence và không còn blocker.
- [ ] Tài liệu cập nhật; P1/P2 hoặc ticket chưa đạt được đưa lại backlog với remaining effort, không tự đánh Done.

### 9.3. Kế hoạch theo ngày và thứ tự xử lý

Bảng là **slot giờ người**, không phải giờ AI. Ticket cùng ngày thực hiện từ trái sang phải; chỉ bắt đầu ticket phụ thuộc khi phần predecessor bắt buộc đã Done. TMC-002 và035 được chia sang hai ngày. Slot còn trống là buffer; không tự nhét thêm P2. Chủ nhật nghỉ.

| Ngày | Slot dự kiến theo thứ tự | Tổng h | Dư trong capacity 6h |
|---|---|---|---|
| 04/11/2026 | [TMC-001](#tmc-001) (2h) → [TMC-002](#tmc-002) (2h) | 4 | 2 |
| 05/11/2026 | [TMC-002](#tmc-002) (1h) → [TMC-003](#tmc-003) (3h) | 4 | 2 |
| 06/11/2026 | [TMC-004](#tmc-004) (6h) | 6 | 0 |
| 07/11/2026 | [TMC-005](#tmc-005) (2h) → [TMC-006](#tmc-006) (2h) | 4 | 2 |
| 09/11/2026 | [TMC-007](#tmc-007) (3h) | 3 | 3 |
| 10/11/2026 | [TMC-008](#tmc-008) (2h) → [TMC-009](#tmc-009) (2h) | 4 | 2 |
| 11/11/2026 | [TMC-010](#tmc-010) (3h) → [TMC-011](#tmc-011) (3h) | 6 | 0 |
| 12/11/2026 | [TMC-012](#tmc-012) (2h) → [TMC-013](#tmc-013) (3h) | 5 | 1 |
| 13/11/2026 | [TMC-014](#tmc-014) (4h) | 4 | 2 |
| 14/11/2026 | [TMC-015](#tmc-015) (3h) → [TMC-017](#tmc-017) (2h) | 5 | 1 |
| 16/11/2026 | [TMC-016](#tmc-016) (4h) | 4 | 2 |
| 17/11/2026 | [TMC-018](#tmc-018) (3h) | 3 | 3 |
| 18/11/2026 | [TMC-019](#tmc-019) (4h) → [TMC-022](#tmc-022) (2h) | 6 | 0 |
| 19/11/2026 | [TMC-020](#tmc-020) (2h) → [TMC-021](#tmc-021) (2h) | 4 | 2 |
| 20/11/2026 | [TMC-023](#tmc-023) (3h) → [TMC-026](#tmc-026) (2h) | 5 | 1 |
| 21/11/2026 | [TMC-024](#tmc-024) (4h) | 4 | 2 |
| 23/11/2026 | [TMC-025](#tmc-025) (3h) → [TMC-027](#tmc-027) (2h) | 5 | 1 |
| 24/11/2026 | [TMC-028](#tmc-028) (2h) | 2 | 4 |
| 25/11/2026 | [TMC-029](#tmc-029) (3h) → [TMC-033](#tmc-033) (2h) | 5 | 1 |
| 26/11/2026 | [TMC-030](#tmc-030) (4h) | 4 | 2 |
| 27/11/2026 | [TMC-031](#tmc-031) (3h) → [TMC-034](#tmc-034) (2h) | 5 | 1 |
| 28/11/2026 | [TMC-032](#tmc-032) (2h) → [TMC-035](#tmc-035) (3h) | 5 | 1 |
| 30/11/2026 | [TMC-035](#tmc-035) (1h) → [TMC-036](#tmc-036) (2h) → [TMC-038](#tmc-038) (3h) | 6 | 0 |
| 01/12/2026 | [TMC-037](#tmc-037) (3h) | 3 | 3 |

Phần review/testing trong một ticket phải hoàn thành trước khi bắt đầu ticket kế tiếp cần output đó. Nếu chưa đạt, đổi slot/buffer và cập nhật backlog, không coi lịch là bằng chứng Done. TMC-035 dùng 3h ngày28 và1h ngày30; ngày30 sau đó mới làm036 rồi038. Ngày 01/12 dành037 và3h dự phòng cuối.

<a id="s10"></a>

## 10. Milestone Roadmap — Các mốc bàn giao

Các mốc dưới là **mục tiêu**, không phải trạng thái đã đạt. Milestone “QR Access” ở Sprint 2 chưa hứa attendance ledger hoàn chỉnh; mốc kế tiếp mới kiểm chứng phần này.

| Milestone | Start Date | End Date | Required Features | Deliverables | Acceptance Criteria |
|---|---|---|---|---|---|
| M-01 Project Foundation Ready | 04/11/2026 | 10/11/2026 | A01…A04, B01/B02, C01 model | client/api/PG/auth/seed/key model | Build/setup nền và auth/scope checks có kết quả |
| M-02 QR Access Flow Working | 11/11/2026 | 17/11/2026 | C01…C03, D01…D03, E01 preparation | QR ký→virtual kiosk→mock TCS | QR lỗi/replay bị chặn, CAS/UNKNOWN rõ; chưa gọi là đã ghi công |
| M-03 Attendance End-to-End Working | 18/11/2026 | 19/11/2026 | E01 persistence, E02 | Ledger revision 1 và history API/UI | Chỉ evidence hợp lệ tạo một event, đọc lại sau restart |
| M-04 Network Failure & QR Security Verified | 18/11/2026 | 27/11/2026 | C02, F01/F02, H01/H02/H03 | Recovery/replay/concurrency/security evidence | Lost ACK/race/revoke được thử và kết quả/giới hạn ghi rõ |
| M-05 Final Demo & Report Ready | 25/11/2026 | 01/12/2026 | H04, I01…I03 | Candidate, SOLID, ba views, PDF/GitHub/checklist | Demo tái lập; không thiếu yêu cầu Task1/2; xác nhận LMS do Solo thực hiện |

~~~mermaid
gantt
    title Roadmap M2 - muc tieu, chua hoan thanh
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    section Sprint
    S1 Foundation          :s1, 2026-11-04, 7d
    S2 QR Access           :s2, 2026-11-11, 7d
    S3 Attendance Recovery :s3, 2026-11-18, 7d
    S4 Verify Submit       :s4, 2026-11-25, 7d
    section Milestone
    Foundation Ready       :milestone, m1, 2026-11-10, 0d
    QR Flow Working        :milestone, m2, 2026-11-17, 0d
    Attendance E2E         :milestone, m3, 2026-11-19, 0d
    Failure Security       :milestone, m4, 2026-11-27, 0d
    Demo Report Ready      :milestone, m5, 2026-12-01, 0d
~~~

Thanh Sprint thể hiện 7 ngày lịch; chỉ 6 ngày làm việc như §9.3. Mốc 12:00 ngày 1 của dữ liệu HRS là yêu cầu nghiệp vụ hằng tháng, **khác** deadline nội bộ nộp bài 01/12.

<a id="s11"></a>

## 11. Work Allocation — Solo Developer + AI Agents

### 11.1. Trách nhiệm và quy tắc giao việc

**Primary Owner=Reviewer=Solo Developer cho mọi ticket.** Executor ghi tên vai trò AI để định tuyến loại công việc, chưa tạo/giao việc cho bất cứ agent nào. Có thể dùng một công cụ AI cho nhiều vai trò.

| Vai trò hỗ trợ | Phạm vi | Solo Developer chịu trách nhiệm |
|---|---|---|
| Architecture Agent | FR/NFR, ADR, views, SOLID mapping | Chốt design/trade-offs, kiểm tra khớp source |
| Frontend Agent | React, API adapters, UI theo token/Figma | Review UX, scope dữ liệu, cache và mode demo |
| Backend Agent | Domain/application/ports/Nest wiring | Review policy, crypto, state/transaction và lỗi |
| Database Agent | Migrations, seed, constraints | Review schema, FK vòng, PG concurrency và rollback |
| Testing/QA Agent | Repro, suite, tải/fault evidence | Xác minh test chạy thật và assertion có ý nghĩa |
| DevOps Agent | Workspace env/CI/test services | Giữ secrets/env độc lập, xác minh build tái lập |
| Documentation Agent | Runbook, reflection, report | Đảm bảo nội dung đúng và thực hiện bài nộp |

Quy trình: chọn Ready → giao ticket kèm input/files/AC/commands → AI nêu cách làm ngắn rồi thực hiện trong phạm vi → chạy kiểm chứng → báo diff/kết quả/giới hạn → Solo review → sửa nếu cần → Testing → Solo nghiệm thu Done. Không cần dừng xin phê duyệt mọi thao tác chỉnh sửa có thể đảo ngược; checkpoint ở đây là **nghiệm thu ticket**, không phải tự tạo thêm bước chặn AI thực hiện phần đã giao.

WIP tối đa2; không có hai executor sửa cùng file/branch không phối hợp. Agent không tự merge/publish/nộp LMS nếu chưa có nhiệm vụ tương ứng được giao. Tài liệu lập kế hoạch này không giao các thao tác đó.

### 11.2. Work Allocation Table theo ticket

Review Effort là R riêng; Human Effort là Total gồm R/I/T/D. Chi tiết I và tổng R+I có trong từng phiếu, tránh cộng đôi.

| Ticket ID | Feature | Primary Owner | Executor | Reviewer | Sprint | Human Effort (h) | Review Effort (h) | Due Date |
|---|---|---|---|---|---|---|---|---|
| [TMC-001](#tmc-001) | I01 | Solo Developer | Architecture Agent | Solo Developer | S1 | 2 | 0.5 | 04/11/2026 |
| [TMC-002](#tmc-002) | A01 | Solo Developer | Frontend Agent | Solo Developer | S1 | 3 | 0.5 | 05/11/2026 |
| [TMC-003](#tmc-003) | A02 | Solo Developer | Backend Agent | Solo Developer | S1 | 3 | 0.5 | 05/11/2026 |
| [TMC-004](#tmc-004) | A03 | Solo Developer | Database Agent | Solo Developer | S1 | 6 | 0.75 | 06/11/2026 |
| [TMC-005](#tmc-005) | A04 | Solo Developer | DevOps Agent | Solo Developer | S1 | 2 | 0.25 | 07/11/2026 |
| [TMC-006](#tmc-006) | B01 | Solo Developer | Database Agent | Solo Developer | S1 | 2 | 0.25 | 07/11/2026 |
| [TMC-007](#tmc-007) | B01 | Solo Developer | Backend Agent | Solo Developer | S1 | 3 | 0.5 | 09/11/2026 |
| [TMC-008](#tmc-008) | B02 | Solo Developer | Frontend Agent | Solo Developer | S1 | 2 | 0.25 | 10/11/2026 |
| [TMC-009](#tmc-009) | C01 | Solo Developer | Backend Agent | Solo Developer | S1 | 2 | 0.25 | 10/11/2026 |
| [TMC-010](#tmc-010) | C01 | Solo Developer | Backend Agent | Solo Developer | S2 | 3 | 0.5 | 11/11/2026 |
| [TMC-011](#tmc-011) | C02 | Solo Developer | Backend Agent | Solo Developer | S2 | 3 | 0.5 | 11/11/2026 |
| [TMC-012](#tmc-012) | D01 | Solo Developer | Backend Agent | Solo Developer | S2 | 2 | 0.25 | 12/11/2026 |
| [TMC-013](#tmc-013) | D02 | Solo Developer | Backend Agent | Solo Developer | S2 | 3 | 0.5 | 12/11/2026 |
| [TMC-014](#tmc-014) | E01 | Solo Developer | Backend Agent | Solo Developer | S2 | 4 | 0.5 | 13/11/2026 |
| [TMC-015](#tmc-015) | C02 | Solo Developer | Backend Agent | Solo Developer | S2 | 3 | 0.5 | 14/11/2026 |
| [TMC-016](#tmc-016) | D02 | Solo Developer | Backend Agent | Solo Developer | S2 | 4 | 0.5 | 16/11/2026 |
| [TMC-017](#tmc-017) | C03 | Solo Developer | Frontend Agent | Solo Developer | S2 | 2 | 0.25 | 14/11/2026 |
| [TMC-018](#tmc-018) | D03 | Solo Developer | Frontend Agent | Solo Developer | S2 | 3 | 0.5 | 17/11/2026 |
| [TMC-019](#tmc-019) | E01 | Solo Developer | Backend Agent | Solo Developer | S3 | 4 | 0.5 | 18/11/2026 |
| [TMC-020](#tmc-020) | E02 | Solo Developer | Backend Agent | Solo Developer | S3 | 2 | 0.25 | 19/11/2026 |
| [TMC-021](#tmc-021) | E02 | Solo Developer | Frontend Agent | Solo Developer | S3 | 2 | 0.25 | 19/11/2026 |
| [TMC-022](#tmc-022) | F01 | Solo Developer | Architecture Agent | Solo Developer | S3 | 2 | 0.5 | 18/11/2026 |
| [TMC-023](#tmc-023) | F01 | Solo Developer | Frontend Agent | Solo Developer | S3 | 3 | 0.5 | 20/11/2026 |
| [TMC-024](#tmc-024) | F02 | Solo Developer | Backend Agent | Solo Developer | S3 | 4 | 0.5 | 21/11/2026 |
| [TMC-025](#tmc-025) | F02 | Solo Developer | Backend Agent | Solo Developer | S3 | 3 | 0.5 | 23/11/2026 |
| [TMC-026](#tmc-026) | F02 | Solo Developer | Testing/QA Agent | Solo Developer | S3 | 2 | 0.25 | 20/11/2026 |
| [TMC-027](#tmc-027) | D03 | Solo Developer | Frontend Agent | Solo Developer | S3 | 2 | 0.25 | 23/11/2026 |
| [TMC-028](#tmc-028) | G01 | Solo Developer | Frontend Agent | Solo Developer | S3 | 2 | 0.25 | 24/11/2026 |
| [TMC-029](#tmc-029) | H01 | Solo Developer | Testing/QA Agent | Solo Developer | S4 | 3 | 0.5 | 25/11/2026 |
| [TMC-030](#tmc-030) | H02 | Solo Developer | Testing/QA Agent | Solo Developer | S4 | 4 | 0.5 | 26/11/2026 |
| [TMC-031](#tmc-031) | H03 | Solo Developer | Testing/QA Agent | Solo Developer | S4 | 3 | 0.5 | 27/11/2026 |
| [TMC-032](#tmc-032) | H04 | Solo Developer | Testing/QA Agent | Solo Developer | S4 | 2 | 0.25 | 28/11/2026 |
| [TMC-033](#tmc-033) | I02 | Solo Developer | Architecture Agent | Solo Developer | S4 | 2 | 0.5 | 25/11/2026 |
| [TMC-034](#tmc-034) | I02 | Solo Developer | Documentation Agent | Solo Developer | S4 | 2 | 0.5 | 27/11/2026 |
| [TMC-035](#tmc-035) | I01 | Solo Developer | Architecture Agent | Solo Developer | S4 | 4 | 0.75 | 30/11/2026 |
| [TMC-036](#tmc-036) | I03 | Solo Developer | Documentation Agent | Solo Developer | S4 | 2 | 0.25 | 30/11/2026 |
| [TMC-037](#tmc-037) | I03 | Solo Developer | Documentation Agent | Solo Developer | S4 | 3 | 0.5 | 01/12/2026 |
| [TMC-038](#tmc-038) | H04 | Solo Developer | Testing/QA Agent | Solo Developer | S4 | 3 | 0.5 | 30/11/2026 |
| [TMC-039](#tmc-039) | G01 | Solo Developer | Backend Agent | Solo Developer | Deferred | 3 | 0.5 | Chưa cam kết, sau 01/12 |
| [TMC-040](#tmc-040) | E03 | Solo Developer | Backend Agent | Solo Developer | Deferred | 8 | 1 | Chưa cam kết, sau 01/12 |
| [TMC-041](#tmc-041) | G02 | Solo Developer | Backend Agent | Solo Developer | Deferred | 12 | 1.5 | Chưa cam kết, sau 01/12 |
| [TMC-042](#tmc-042) | F03 | Solo Developer | Architecture Agent | Solo Developer | Deferred | 16 | 2 | Chưa cam kết, sau 01/12 |
| [TMC-043](#tmc-043) | B03 | Solo Developer | Frontend Agent | Solo Developer | Deferred | 6 | 0.75 | Chưa cam kết, sau 01/12 |

### 11.3. Tổng hợp theo executor và Sprint

Bảng sau chỉ cộng ticket đã chọn baseline; nhóm hoãn được ghi riêng. Mọi giờ trong bảng vẫn là thời gian **cùng một người** phải dành cho công việc có AI hỗ trợ.

| Owner | AI Agent Role | Assigned Tickets | Sprint | Human Hours | Deliverables | Due Date |
|---|---|---|---|---|---|---|
| Solo Developer | Architecture Agent | [TMC-001](#tmc-001) | S1 | 2 | Output của các phiếu §8 | 04/11/2026 |
| Solo Developer | Frontend Agent | [TMC-002](#tmc-002), [TMC-008](#tmc-008) | S1 | 5 | Output của các phiếu §8 | 10/11/2026 |
| Solo Developer | Backend Agent | [TMC-003](#tmc-003), [TMC-007](#tmc-007), [TMC-009](#tmc-009) | S1 | 8 | Output của các phiếu §8 | 10/11/2026 |
| Solo Developer | Database Agent | [TMC-004](#tmc-004), [TMC-006](#tmc-006) | S1 | 8 | Output của các phiếu §8 | 07/11/2026 |
| Solo Developer | DevOps Agent | [TMC-005](#tmc-005) | S1 | 2 | Output của các phiếu §8 | 07/11/2026 |
| Solo Developer | Backend Agent | [TMC-010](#tmc-010), [TMC-011](#tmc-011), [TMC-012](#tmc-012), [TMC-013](#tmc-013), [TMC-014](#tmc-014), [TMC-015](#tmc-015), [TMC-016](#tmc-016) | S2 | 22 | Output của các phiếu §8 | 16/11/2026 |
| Solo Developer | Frontend Agent | [TMC-017](#tmc-017), [TMC-018](#tmc-018) | S2 | 5 | Output của các phiếu §8 | 17/11/2026 |
| Solo Developer | Backend Agent | [TMC-019](#tmc-019), [TMC-020](#tmc-020), [TMC-024](#tmc-024), [TMC-025](#tmc-025) | S3 | 13 | Output của các phiếu §8 | 23/11/2026 |
| Solo Developer | Frontend Agent | [TMC-021](#tmc-021), [TMC-023](#tmc-023), [TMC-027](#tmc-027), [TMC-028](#tmc-028) | S3 | 9 | Output của các phiếu §8 | 24/11/2026 |
| Solo Developer | Architecture Agent | [TMC-022](#tmc-022) | S3 | 2 | Output của các phiếu §8 | 18/11/2026 |
| Solo Developer | Testing/QA Agent | [TMC-026](#tmc-026) | S3 | 2 | Output của các phiếu §8 | 20/11/2026 |
| Solo Developer | Testing/QA Agent | [TMC-029](#tmc-029), [TMC-030](#tmc-030), [TMC-031](#tmc-031), [TMC-032](#tmc-032), [TMC-038](#tmc-038) | S4 | 15 | Output của các phiếu §8 | 30/11/2026 |
| Solo Developer | Architecture Agent | [TMC-033](#tmc-033), [TMC-035](#tmc-035) | S4 | 6 | Output của các phiếu §8 | 30/11/2026 |
| Solo Developer | Documentation Agent | [TMC-034](#tmc-034), [TMC-036](#tmc-036), [TMC-037](#tmc-037) | S4 | 7 | Output của các phiếu §8 | 01/12/2026 |
| Solo Developer | Vai trò theo phiếu | [TMC-039](#tmc-039), [TMC-040](#tmc-040), [TMC-041](#tmc-041), [TMC-042](#tmc-042), [TMC-043](#tmc-043) | Deferred | 45 (ngoài baseline) | Chỉ làm sau replan | Chưa cam kết |

<a id="s12"></a>

## 12. Effort & Capacity Estimation — Ước lượng và khả năng hoàn thành

### 12.1. Quy ước tránh cộng trùng

- **Effort:** giờ người thực sự dành cho công việc. H gồm viết code, hướng dẫn AI và rework kỹ thuật; không mặc định AI làm thay toàn bộ.
- **R:** review kết quả; **I:** nối package/module/env; **T:** thực hiện/xác minh test; **D:** viết/đối chiếu tài liệu. Mỗi hoạt động chỉ hạch toán một nhóm.
- **AI-Assisted Effort:** giờ công cụ/agent dự kiến chạy, có thể overlap hoặc phải chờ; không là một nhân sự 8h/ngày. Thời gian người phải chờ/điều phối vượt estimate dùng buffer.
- **Calendar duration:** 28 ngày lịch/24 ngày làm việc; không bằng tổng effort chia số agent.
- **Story Points:** không dùng; không quy đổi độ khó hoặc points thành giờ.
- **Baseline:** 38 ticket106h. **P0-only:** 36 ticket102h. **Deferred:** 5 ticket45h. **Toàn backlog:** 43 ticket151h.

| Thành phần effort | Baseline 38 ticket | Toàn backlog 43 ticket | Cách cộng |
|---|---|---|---|
| Human Implementation H | 37.25h | 59.75h | Người triển khai/điều phối/rework |
| Human Review R | 16.25h | 22h | Review diff/design/output |
| Integration I | 11h | 16.5h | Tích hợp package/module/env |
| Testing T | 25.75h | 34.125h | Chạy/đánh giá test, fault/load/E2E |
| Documentation D | 15.75h | 18.625h | Tài liệu/runbook/report |
| **Total Human Hours** | **106h** | **151h** | H+R+I+T+D |
| Review & Integration, R+I | 27.25h | 38.5h | Đã nằm trong Total, không cộng lại |
| Integration & Testing, I+T | 36.75h | 50.625h | Góc nhìn khác, có I trùng dòng trên; không cộng hai subtotal |
| AI-assisted machine effort | ~30h | ~45h | Không nằm trong Total/Available Capacity |

Ước lượng trung tâm, chưa có velocity từ dự án server. Nếu baseline thực tế tăng50% thành 159h thì **vượt cả High 144h**, phải replan/cắt P1 hoặc điều chỉnh lịch, không hứa chắc hoàn thành. TMC-004 migration và024 recovery có rủi ro cao; chốt lại estimate ngay sau foundation.

### 12.2. Ba kịch bản capacity

Giả định24 ngày làm việc, cố định20% capacity làm reserve tối thiểu. Gap “còn lại” dương là còn chỗ, âm là thiếu. So cả capacity thô và capacity sau reserve.

| Kịch bản | Giờ/ngày | Capacity thô | Sau reserve20% | Gap thô so 106h | Gap sau reserve so 106h | Gap sau reserve soP0=102h |
|---|---|---|---|---|---|---|
| Low | 2 | 48h | 38.4h | -58h | -67.6h | -63.6h |
| Standard | 4 | 96h | 76.8h | -10h | -29.2h | -25.2h |
| High — dùng để xếp lịch | 6 | 144h | 115.2h | +38h | +9.2h | +13.2h |

**Đánh giá:** High khả thi có điều kiện và phải đo actual mỗi tuần. Standard thiếu cả6h so P0 ngay trước khi giữ reserve; cắt hai P1 chỉ giảm4h, không đủ. Low không thể bảo đảm toàn bộ P0 trong 4 tuần. Không nhân thêm AI agents để lấp gap.

### 12.3. Capacity Validation theo Sprint

Review trong cột là **R+I**, gộp đúng format review/integration; Testing chỉ T, Documentation chỉ D.

| Sprint | Human Implementation | Review + Integration | Testing | Documentation | Total Human Hours | Available Capacity | Gap còn lại |
|---|---|---|---|---|---|---|---|
| S1 | 11 | 6.25 | 5 | 2.75 | 25 | 36 | +11 |
| S2 | 13.5 | 6.75 | 5 | 1.75 | 27 | 36 | +9 |
| S3 | 12 | 6.5 | 5 | 2.5 | 26 | 36 | +10 |
| S4 | 0.75 | 7.75 | 10.75 | 8.75 | 28 | 36 | +8 |
| **Tổng** | **37.25** | **27.25** | **25.75** | **15.75** | **106** | **144** | **+38** |

Ở Standard24h/Sprint, gap thô là S1: -1h, S2: -3h, S3: -2h, S4: -4h. Sau reserve 19.2h/Sprint còn thiếu nhiều hơn. Không chuyển ticket sang Sprint khác rồi cho rằng tổng capacity tự tăng.

### 12.4. Buffer và scope cut

38h chưa phân công gồm dự trù: 14h lỗi/rework vượt ticket; 8h cài đặt/dependency/Astra; 6h planning/triage/điều phối; 6h độ trễ công cụ/AI và gián đoạn; 4h clean-run/nộp bài phát sinh. Đây là **cách giữ chỗ**, chưa là giờ đã dùng. Review/tests chuẩn và timebox fix 038 đã nằm trong 106h.

| Tình huống | Hành động | Tác động và giới hạn |
|---|---|---|
| Baseline chưa bắt đầu | Giữ 039…043 Deferred | Tránh thêm45h vào lịch; không bỏ các nội dung thiết kế hệ thống |
| Buffer bắt đầu giảm | Hoãn 028 dashboard (2h), rồi 027 webcam (2h) | P0 vẫn demo bằng virtual kiosk, history/case APIs/UI |
| Scope hỗ trợ quá rộng | Giữ auth seed/minimal UI, SEC form nhỏ, không thêm analytics/CRUD HR/IAM | Không cắt signature/replay/idempotency/UNKNOWN/evidence |
| Chỉ có4h/ngày | Hoãn toàn P1, trao đổi lịch hoặc tăng giờ thực; P0 cần102h | Vẫn thiếu6h thô,25.2h nếu reserve20%; không gọi khả thi trước01/12 |
| Có thể thay hạn nội bộ | 4h/ngày có thể xét6 Sprint tới15/12/2026 | Phương án thay thế cần đối chiếu LMS; không phải lịch đã được đổi trong tài liệu |
| Chỉ có2h/ngày | Cần lịch dài hơn hoặc scope code module thu hẹp có lý do, vẫn đủ module chính và mọi tài liệu bắt buộc | Khoảng 11 tuần ở12h/tuần và reserve20% cho102h; không xóa yêu cầu M2 |
| P0 tests/design bị đe dọa | Dừng feature bổ sung, dùng buffer sửa correctness/security | Không hi sinh core tests hoặc báo cáo bằng chứng giả để giữ UI phụ |
| Figma dependency không lấy được | TMC-002 Blocked, ghi nguồn thiếu và phương án cung cấp được duyệt | Không đổi design system toàn repo mà không re-estimate |

Mức giờ tối thiểu toán học cho106h với reserve20% là khoảng5.52h/ngày × 24; chọn6h để còn dư. Đây chưa bao gồm sự cố lớn không thể giải quyết bằng thời gian.

<a id="s13"></a>

## 13. Dependencies & Critical Path — Phụ thuộc và đường găng

### 13.1. Quy tắc dependency

Danh sách ở §7/8 là nguồn dependency chi tiết. Tất cả43 ID khác nhau, dependency phải tồn tại và không tạo chu trình; P0 không phụ thuộc P1/P2. Trong một Feature, ticket dễ có thể làm trước chỉ khi không phá điều kiện kỹ thuật. Ví dụ chống replay phải cùng transaction attempt nên015 sau014; persistence019 sau command flow016.

~~~mermaid
flowchart LR
    A["001 Scope"] --> B["002 Client"]
    B --> C["003 API"]
    C --> D["004 DB / 005 Harness"]
    D --> E["006 Seed / 007 Auth"]
    E --> Q["009–011 QR"]
    Q --> P["012 Policy / 014 Attempt"]
    M["013 Mock TCS"] --> P
    P --> R["015 Replay"]
    R --> G["016 CAS / Command"]
    G --> W["019 Attendance"]
    G --> N["022 Network ADR"]
    W --> H["020–021 History"]
    N --> J["023 Journal / 026 Faults"]
    W --> K["024 Worker / 025 SEC"]
    J --> T["029–032 Verification"]
    K --> T
    H --> T
    T --> S["033–036 SOLID / Views / Runbook"]
    S --> F["038 Candidate"]
    F --> Z["037 Report / Submit"]
~~~

Sơ đồ nhóm là overview, không thay mọi cạnh trong registry ticket. Các nhánh017/018,033 chạy được sớm khi dependencies tương ứng xong, không cần chờ toàn nhóm bên trái. Ticket số026 được làm trước024 vì fault harness là input; số ID là mã tra cứu, không là lịch thứ tự tuyệt đối.

### 13.2. Đường găng logic và ràng buộc một người

Chuỗi dài nhất theo **tổng effort người trên DAG P0**, kết thúc037, là:

**001 → 002 → 003 → 004 → 005 → 007 → 010 → 011 → 012 → 014 → 015 → 016 → 019 → 024 → 025 → 030 → 031 → 035 → 038 → 037 = 66h.**

Đây là critical path **logic theo trọng số effort**, không phải66h calendar duration hoặc chứng minh mọi nhánh ngoài chuỗi làm đồng thời được. Seed006, key009, mock013, fault026 và các nhánh khác vẫn bắt buộc. Với **một người**, mọi giờ review/test/tài liệu tranh cùng capacity; lịch khả thi phải dựa **106h tổng + slot §9.3 + buffer38h**, không dựa66h chia số agent.

### 13.3. Ticket dễ trễ và cổng quyết định

| Ticket/cụm | Lý do ảnh hưởng lịch | Cổng kiểm soát |
|---|---|---|
| 002 | Dependency Astra, preview và package path | Cuối 05/11 phải có nguồn dependency/entry chạy; chưa có thì ghi blocker/replan |
| 004 | 37 bảng/FK vòng/deferred/transaction mapping | Cuối 06/11 phải migration/test DB được; dùng buffer S1 nếu cần |
| 010/011/015 | Crypto, online revocation và race replay | Không sang scan demo “an toàn” nếu signature/replay test fail |
| 014/016 | CAS và external effect, lỗi ở đây lan sang mọi demo | Chỉ demo allow khi persisted PREPARED/claim đúng |
| 019/024/025 | Atomic ledger, UNKNOWN và duplicate manual | S3 phải có E2E sau restart và fault counter rõ |
| 030/031 | Failure/load có thể phát hiện lỗi kiến trúc muộn | Core tests viết từ Sprint 1/2; tuần4 là regression và evidence |
| 035/037 | Evidence chưa có khiến report thiếu căn cứ | Khung báo cáo từ001; cập nhật mỗi Sprint, khóa source/candidate30/11 |

Nếu một predecessor chưa Done đúng ngày, không bắt đầu downstream chỉ để giữ bảng lịch. Dời slot, dùng buffer rồi re-estimate; báo rủi ro deadline nếu vượt reserve.

<a id="s14"></a>

## 14. Risks & Mitigation — Rủi ro

| ID | Rủi ro / dấu hiệu | Mức | Giảm thiểu / phương án | Owner và ticket |
|---|---|---|---|---|
| R01 | Thực tế chỉ2–4h/ngày | Cao | Dùng capacity thật; hoãn P1/P2, điều chỉnh lịch nếu được; không thêm người giả | Solo,001 và§12 |
| R02 | Astra import có nhưng dependency/kit chưa cung cấp | Cao | Xác minh ngay foundation; pin nguồn cài hợp lệ, giữ token baseline; ghi blocker nếu thiếu | Solo,002/036 |
| R03 | Di chuyển client làm Figma preview lỗi | Cao | Giữ entry/script tương thích, smoke assets/deep links; checkpoint trước chuyển | Solo,002 |
| R04 | Signature được coi nhầm là chống sao chép | Cao | TTL+jti atomic redemption+revocation+policy; ghi live-sharing residual risk | Solo,010/011/015 |
| R05 | Timeout bị coi là gate chưa mở, gửi OPEN lần hai | Cao | Persist claim, UNKNOWN, status/SEC, physical execution counter riêng | Solo,013/016/024/030 |
| R06 | Transaction repo dùng global manager | Cao | Context riêng, rollback và concurrency tests PG; core không giữ manager mutable | Solo,004/014/019 |
| R07 | Prototype role/override quá rộng | Cao | Map vềactor chuẩn, permission+scope server, bỏ bypass overrideReason | Solo,007/012/025/031 |
| R08 | Snapshot/API/UI lẫn dữ liệu mock/real | Cao | Source mode rõ, query scoped, cache keyed identity, không gọi getDatabase rộng | Solo,008/018/021/028 |
| R09 | Camera/iframe không cho quyền | Trung bình | Reuse existing scanner P1, virtual P0, ghi môi trường thật đã thử | Solo,027/032 |
| R10 | Journal chứa token/PII hoặc lưu hỏng | Cao | Metadata tối thiểu, expiry/backlog limit, quota error, lookup thay stale retry | Solo,023/031 |
| R11 | Tests chỉ mock repository, không chứng minh uniqueness | Cao | PG thật, race barrier, fault windows/restart; no-loss đối chiếu nguồn | Solo,029/030 |
| R12 | Performance fail hoặc đo sai boundary | Cao | Đo end-to-end riêng vớiAPI, đủ workload, ghi outliers/max/error; không tự sửa NFR | Solo,031 |
| R13 | Chạy mô phỏng được rồi tuyên bố hardware/HRS thật | Cao | Nhãn mock/contract và scope code rõ; HRS TMC-041 chưa làm thì không tuyên bố SLA đã đạt | Solo,035/037 |
| R14 | Report sao chép M1 chưa cập nhật views/SOLID | Cao | Traceability từ001, review theoPDF, examples từsource, reflection thực | Solo,033…037 |
| R15 | Deadline/quyền GitHub/LMS khác giả định | Cao | Kiểm tra hạn chính thức và quyền đọc sớm, dự phòng4h submission; receipt mới là submitted | Solo,001/037 |
| R16 | AI output sai hoặc quá nhiều file cùng sửa | Cao | Scope file/ticket, WIP2, review/test bắt buộc; buffer rework14h | Solo, mọi ticket |

Không có rủi ro nào được coi đã xử lý chỉ vì có một dòng mitigation. Actual status/evidence phải cập nhật khi thực hiện.

<a id="s15"></a>

## 15. Acceptance Criteria & Definition of Done — Nghiệm thu

### 15.1. Tiêu chí hoàn thành module M2

- [ ] Từ EMP portal lấy QR ký và scan Virtual Kiosk qua API trạm; PG lưu được kết quả.
- [ ] QR giả/expired/revoked, không có grant và station sai bị từ chối trước OPEN.
- [ ] Cùng event/hash trả kết quả cũ; cùng event khác hash trả409; cùng jti khác attempt có một redemption.
- [ ] CAS commit trước TCS; ACK, OPEN, PASSAGE và UNKNOWN được phân biệt, có history/audit.
- [ ] Event+revision 1 chỉ từ evidence hợp lệ; retry/callback/recovery không tạo thêm nguồn công.
- [ ] Mất mạng/mất response/crash có recovery có thể demo và có evidence; UNKNOWN không auto-OPEN.
- [ ] EMP/SEC/HR/SUP/ADM/EXE bị giới hạn dữ liệu/hành động đúng phần API đã triển khai.
- [ ] Mock TCS/sensor và các phần chưa hiện thực được ghi rõ; không hứa production SLA.
- [ ] Có đo NFR, test outcome thực và giải thích giới hạn/failure; không chỉ có test plan.
- [ ] Code thể hiện SOLID, thiết kế có ba views, reflection và report đúng yêu cầu M2.

### 15.2. DoR / DoD và lỗi chặn

**Definition of Ready:** có scope/AC/deliverables/file boundary; dependencies bắt buộc Done; input/env/secret references có nguồn; verification command tồn tại; owner/executor/reviewer và capacity rõ.

**Definition of Done:** phiếu §8 đạt toàn bộ; reviewer đã xem diff; build/typecheck/test liên quan có kết quả; từng phần việc đã commit, kiểm tra đạt và push đúng nhánh theo §4.6–4.8; evidence gắn commit/môi trường; API/docs đồng bộ; integrated baseline; Solo nghiệm thu. Ticket chỉ tài liệu không bắt chạy unit tests vô nghĩa, nhưng phải kiểm tra nội dung/link/diagram/export phù hợp.

**Blocking/critical cho release:** có thể OPEN lặp ngoài contract, ghi công không bằng chứng, mất công đã xác nhận trong kịch bản kiểm chứng, rò dữ liệu/scope/secret, không chạy được core demo hoặc thiếu yêu cầu báo cáo M2. Thiếu animation, chart phụ hoặc màn P2 không tự trở thành blocker.

<a id="s16"></a>

## 16. Testing Strategy — Chiến lược và evidence

Tests liên quan phải được viết/chạy trong từng ticket implementation từ Sprint 1; TMC-029…032 là đợt tích hợp, regression và bằng chứng cuối. Không chờ cuối dự án mới kiểm tra crypto/state/transaction.

| Lớp | Kịch bản bắt buộc trong slice | Công cụ/hạ tầng dự kiến | Ticket và evidence |
|---|---|---|---|
| Unit domain/application | QR claims/clock/key, grant/time/scope, state transitions, retry policy | Runner Node/TypeScript chốt005, fake clock/ports | 011/012/016/024/029 |
| Integration PG | Partial unique, deferred head, UnitOfWork rollback, atomic redemption/event/audit | PostgreSQL test tách dev; migrations thật | 004/014/015/019/029 |
| API contract/auth | Login/session/station, 401/403/409, history/detail scope/pagination | HTTP test harness và OpenAPI | 007/020/025/031 |
| QR security | Tampered alg/kid/claims, expired/revoked, cùng jti đa trạm, same-event retry | Signature thật với keytest, PG race | 010/011/015/030 |
| Failure/recovery | Mạng ba tuyến, crash trước/sau claim, lost ACK sau OPEN, callback order | Mock TCS độc lập execution ledger + fault hooks | 013/022/026/030 |
| Worker/SEC | Lease stale, two workers, retry budget, unsupportedstatus, resolveversion | PGjobs + fakeclock + SECAPI | 024/025/030 |
| UI/E2E | EMPQR→virtualscan→passage→history, reloadpending, logout/cache/scope | Browser runner chốt005; camera fake/manual nếuP1 | 008/017/018/021/023/032 |
| Performance | 800/30 phút/factory; bursts có giả định; đoend-to-end≤2s | Load script + timing client/API/DB, PG và TCSmock | 031 |
| UI/Figma | Mobile/tablet/desktop, light/dark, token, focus, errorstates | Baseline source/screenshots; Figma gốc khi có URL | 002/032 |
| Setup/release | Clean install/seed/start, build, restart, demo PDF/GitHublinks | Môi trường tạm riêng, lockfile, runbook | 036/038/037 |

### 16.1. Failure matrix tối thiểu

| Điểm lỗi | Expected behavior | Bằng chứng phải thu |
|---|---|---|
| Trước persist attempt | Chưa ghi nhận, không OPEN; user được hướng dẫn thử lại có kiểm soát | DB không có attempt committed; physicalOpenCount=0 |
| Sau attempt commit trước claim | PREPARED có thể claim nếu còn deadline/quyền, không mở muộn | Transaction history/clock |
| Sau claim trước gửi | DISPATCHING còn tồn tại; không giả chắc chưa gửi để auto-reopen | Restart/job/case trail |
| TCS đã mở nhưng response mất | UNKNOWN/status/SEC; không gửi OPEN mù | Physical ledger1 lần; request/command IDs giữ nguyên |
| ACK-only | Chờ bằng chứng, chưa có attendance | Command ACKNOWLEDGED, ledger count0 |
| Passage callback lặp | Một source event/revision 1 | Vendor event dedupe + attendance unique |
| Kiosk reload lúc pending | Journal lookup cùng eventId; không token/stale replay | Storage/network log và server state |
| Hai jti redemption cạnh tranh | Một thắng, bên khác replay denied | Unique constraint + command/attendance counts |
| Hai worker/case resolver | Claim/version bảo vệ, stale update bị từ chối | Lease/CAS histories, rollback atomic |
| CLOSE lỗi sau passage | Cảnh báo thiết bị; công đã xác nhận vẫn tồn tại | Command CLOSE failed/UNKNOWN và ledger event giữ nguyên |

### 16.2. Mẫu evidence và cách diễn giải NFR

Mỗi evidence ghi **ticket/requirement ID, commit, ngày, môi trường/tool versions, fixture, command, expected/actual, stdout/report/screenshot và limitations**. Fail cũng phải lưu; không thay test result bằng ảnh UI đẹp.

Đối với≤2s: công bố ranh giới từ submit kiosk đến response render, latency API riêng, số request/tỷ lệ lỗi và p50/p95/p99/max. p95 là chỉ số chẩn đoán bổ sung, không tự đổi yêu cầu≤2s thành p95≤2s. Sensor passage sau response phải được đo/trình bày riêng. Một request timeout/done ởUI không chứng minh physical actuation chỉ một lần.

“No loss” chỉ được kết luận cho các nguồn xác nhận/đã tiếp nhận trong kịch bản đã kiểm chứng; kiểm đếm trước/sau restart. Không mở rộng thành bảo đảm mọi crash/thiên tai hay hardware thật. Privacy tests là bằng chứng kỹ thuật, không phải chứng chỉ tuân thủ pháp luật.

<a id="s17"></a>

## 17. Progress Tracking Checklist — Theo dõi tiến độ

Không đánh dấu[x] lúc lập kế hoạch. Actual hours và remaining estimate nhập mỗi ngày; Total remaining không bằng estimate ban đầu nếu đã phát hiện rework.

### 17.1. Epic checklist

- [ ] Epic A — Project Setup & Foundation: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic B — Authentication & Employee Foundation: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic C — QR Credential Management: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic D — Gate Kiosk & Access Control: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic E — Attendance Event Recording: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic F — Failure Handling & Recovery: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic G — Dashboard & Monitoring: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic H — Testing & Quality Assurance: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.
- [ ] Epic I — Documentation & Submission: phần P0/P1 được chọn đạt DoD; phần hoãn có ghi nhận riêng.

### 17.2. Feature checklist

- [ ] A01 — Tái cấu trúc client và workspace: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] A02 — Backend Clean Architecture và API contract: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] A03 — Database và migration lõi: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] A04 — Môi trường kiểm thử, CI và OpenAPI: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] B01 — Định danh, seed, session và RBAC tối thiểu: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] B02 — Đăng nhập frontend và protected routes: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] B03 — Giao diện quản trị IAM đầy đủ: kiểm tra các ticket liên quan; Deferred, không phải cam kết Sprint 1–4.
- [ ] C01 — Credential, khóa ký và phát hành/thu hồi QR: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] C02 — QR validation và chống replay: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] C03 — QR cá nhân trên Employee Portal: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] D01 — Access policy và cấu hình trạm: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] D02 — Mock TCS và state machine command: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] D03 — Virtual kiosk, kết quả và webcam: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] E01 — Attempt idempotency và attendance ledger: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] E02 — Tra cứu trạng thái, lịch sử và chi tiết: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] E03 — Hiệu chỉnh công có version: kiểm tra các ticket liên quan; Deferred, không phải cam kết Sprint 1–4.
- [ ] F01 — Kiến trúc mất mạng và journal kiosk: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] F02 — Worker, UNKNOWN, đối soát và failure simulation: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] F03 — Edge tự động offline: kiểm tra các ticket liên quan; Deferred, không phải cam kết Sprint 1–4.
- [ ] G01 — Dashboard cơ bản, bộ lọc và trạng thái cổng: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] G02 — Xuất tháng HRS hoàn chỉnh: kiểm tra các ticket liên quan; Deferred, không phải cam kết Sprint 1–4.
- [ ] H01 — Kiểm thử module chính: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] H02 — Kiểm thử concurrency và recovery: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] H03 — Hiệu năng, RBAC và dữ liệu cá nhân: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] H04 — E2E, UI verification và ổn định bản nộp: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] I01 — Baseline FR/NFR, kiến trúc và ba views: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] I02 — Bằng chứng SOLID và reflection: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.
- [ ] I03 — Runbook, báo cáo và nộp bài: kiểm tra các ticket liên quan; không coi Feature Done nếu ticket đã chọn chưa nghiệm thu.

### 17.3. Sprint và chỉ số theo dõi

- [ ] S1: Foundation/auth/model; planned25h, actual/remaining/evidence đã cập nhật.
- [ ] S2: QR/access/command; planned27h, replay/idempotency có tests.
- [ ] S3: Attendance/history/recovery; planned26h, P1 có làm hay hoãn được ghi rõ.
- [ ] S4: Verification/SOLID/views/report; planned28h, candidate và bài nộp được kiểm tra.
- [ ] Final Submission: báo cáo/source đúng commit, quyền GitHub hợp lệ, LMS receipt đã lưu nếu đã nộp.

| Chỉ số | Cách cập nhật | Điều kiện hành động |
|---|---|---|
| P0 Done /36 | Chỉ tăng sau DoD/evidence | P0 phụ thuộc chưa xong thì không đẩy downstream Ready |
| Baseline remaining hours | Re-estimate hằng ngày | Remaining > capacity còn lại trừ reserve → cắt P1/replan |
| Buffer remaining /38h | Ghi giờ phát sinh và lý do | Dùng>50% trước hết S2 → review phạm vi ngay |
| WIP | InProgress tối đa2; ưu tiên review/test xong | Hàng review tăng → ngừng mở feature |
| Blocked age | Lý do, ngày, người xử lý, bước tiếp | Foundation blocker đe dọaCP → báo/cập nhật lịch |
| Defect severity | Repro, expected/actual, ticket liên quan | Critical correctness/security chặn candidate |
| AI rework | Giờ người sửa/lần giao và nguồn lỗi | Estimate thấp lặp lại → tăngH/R/T, giảmP1 |
| Evidence coverage | Requirement→test/report/source link | Thiếu evidence không đánh đạt NFR |
| Deployment truth | Implemented / mock / designed / deferred | Report/UI không được gộp chung thành done |

Mẫu cập nhật hằng ngày: **Ngày — Ticket — Planned/Actual/Remaining — Verification result — Blocker — Next action**. Không dùng số dòng code hoặc số agent làm phần trăm hoàn thành.

<a id="s18"></a>

## 18. Release & Submission Checklist — Bàn giao và nộp bài

### 18.1. Code và demo

- [ ] client/ và api/ đúng cấu trúc, dependency lockfile tái lập; env/secret references có hướng dẫn.
- [ ] Migrations 37 bảng chạy từDB rỗng; seed hai factory/role/station; DB demo/test tách biệt.
- [ ] Virtual QR flow qua API/PG/mockTCS và history chạy; webcam/dashboard chỉ ghi đã làm khi có evidence.
- [ ] Core unit/integration/API/replay/race/failure/E2E suites có kết quả; load report có boundary/limitations.
- [ ] QR keys/session/station secrets không trong repository, bundle công khai hoặc logs.
- [ ] Main/candidate không có blocker; known P1/P2/deferred được liệt kê; source commit khớp report.

### 18.2. Báo cáo M2

- [ ] Context, scope, FR/NFR và architecture characteristics có success criteria.
- [ ] So styles/trade-offs và lý do chọn modular monolith/Clean Architecture/ports-adapters.
- [ ] Trình bày từng bước logical và physical architecture.
- [ ] Module view, component-and-connector view và allocation view rõ, nhất quán.
- [ ] Architecture decisions/design principles cập nhật từ M1.
- [ ] Network failure: có mitigation, vị trí tích hợp, failure windows và giới hạn R1.
- [ ] QR exposure/replay: có mitigation, expiry/jti/revocation, residual live-sharing risk.
- [ ] SOLID giải thích qua code thật vàreflection report ngắn, không bịa trải nghiệm.
- [ ] Module chính được triển khai theo thiết kế; đủ evidence và giới hạnmock.
- [ ] HRS API/trước noon ngày 1 và toàn hệ thống vẫn được mô tả dù code export đầy đủ được hoãn.

### 18.3. Repository và LMS

- [ ] Báo cáo chứa GitHub URL source: [TMCQRAttendanceSystem_KTPM](https://github.com/tungbinhdinh89/TMCQRAttendanceSystem_KTPM).
- [ ] Solo Developer xác minh người chấm mở được repo/commit, source không chỉ nằm ở máy local.
- [ ] README clean setup/demo/test commands đúng, các file evidence mở được.
- [ ] PDF cuối không lỗi font/hình/link; tên file và định dạng theo LMS.
- [ ] Deadline LMS chính thức đã kiểm tra; nếu khác 01/12 thì cập nhật kế hoạch.
- [ ] Solo Developer thực hiện nộp LMS, lưu receipt/thời gian xác nhận; chưa có receipt thì chưa ghi Submitted.

**Kết luận khả thi của kế hoạch:** 38 ticket baseline/106h trong 4 Sprint có thể làm bởi một người với AI hỗ trợ nếu thực sự có 6h/ngày,6 ngày/tuần và foundation không bị blocker kéo dài. 36 P0/102h phải được giữ; Standard 4h/ngày chưa đủ cho deadline 01/12 với phạm vi này. Toàn 43 ticket/151h không nằm trong cam kết4 tuần. Mọi tiến độ và kết quả kiểm thử vẫn là chưa thực hiện cho tới khi có bằng chứng.

**Kiểm tra tài liệu lúc lập kế hoạch:** đủ 18 phần và 43 phiếu; ID/Feature/Epic hợp lệ; dependency không có vòng lặp; không có P0 phụ thuộc P1/P2; slot ngày nằm đúng Sprint và không vượt 6h/ngày; tổng giờ khớp từng phiếu/bảng/Sprint; liên kết nội bộ và checklist đã kiểm tra. Các kiểm tra này chỉ xác nhận tính nhất quán kế hoạch, chưa xác nhận build, test hoặc milestone của ứng dụng.

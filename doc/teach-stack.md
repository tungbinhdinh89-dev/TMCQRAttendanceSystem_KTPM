# Đề xuất tech stack, architecture và design pattern cho TMC — giai đoạn M2

**Stack và thư mục đã chốt:** React trong client/; Node.js/NestJS + TypeScript + TypeORM + PostgreSQL trong api/. Skeleton chi tiết và các ví dụ DI/transaction sử dụng thống nhất lựa chọn này. [Cấu trúc kiến trúc](structure-architecture.md).

**Kết luận đề xuất:** Giữ frontend React hiện có; xây backend **NestJS + TypeScript + TypeORM**, dùng **PostgreSQL**, triển khai theo **modular monolith**, phân lớp trong từng module và kết nối TCS/HRS qua **Ports & Adapters**. Tác vụ xuất công/đối soát dùng hàng chờ bền vững trong PostgreSQL. Ưu tiên hoàn thành một luồng GATE → ATT có xử lý lỗi thực sự trước khi mở rộng giao diện và hạ tầng.

**Căn cứ:** Đã đọc [spec.pdf — báo cáo M1 của nhóm](spec.pdf), đối chiếu [đề M2](SA_CC_hk261_Assignment_M2.pdf) và cấu hình/source frontend hiện có. Đây là **bản tư vấn lựa chọn và kế hoạch triển khai**, không phải thông báo đã cài đặt, hiện thực hoặc kiểm thử các công nghệ đề xuất.

> **Phân biệt nguồn:** **[M1 ĐÃ CHỌN]** = quyết định trong spec.pdf; **[ĐỀ M2]** = yêu cầu của giảng viên; **[ĐỀ XUẤT]** = lựa chọn triển khai trong tài liệu này; **[MỞ RỘNG]** = chỉ thêm khi có nhu cầu hoặc nguồn lực. Chỉ dẫn trong PDF được dùng làm căn cứ phân tích bài tập, không được coi là lệnh sửa/chạy hệ thống trong lần tạo tài liệu này.

**Quy ước trích dẫn spec:** Link “trang PDF” dùng số trang của trình đọc, bao gồm bìa và mục lục. Phần nội dung đánh số Ả Rập bắt đầu ở trang PDF 8; ví dụ trang nội dung 20 tương ứng trang PDF 27.

## 1. Bộ công nghệ nên chốt

### 1.1. Stack chính — lựa chọn phù hợp với repo và M1

| Thành phần | Lựa chọn đề xuất | Lý do áp dụng cho TMC | Mức ưu tiên |
|---|---|---|---|
| Frontend | **React 19 + TypeScript + Vite 8** | Đã có trong repo; phù hợp portal nội bộ, web nhân viên và kiosk; không cần đổi framework để làm M2 | Giữ lại |
| UI | **MUI 7 + lớp theme hiện có; Tailwind CSS 4 cho layout khi cần** | Tái sử dụng form, dialog, bảng và bộ lọc; thống nhất theme thay vì thêm một bộ UI mới | Giữ lại |
| Routing và dữ liệu server | **React Router 7 + TanStack Query 5** | Đã có; chuyển lớp API demo sang API backend và truy vấn theo quyền | Giữ lại |
| Form và validation phía trình duyệt | **React Hook Form + Zod** | Đã có; phù hợp form nhân viên, cổng, sửa công, bộ lọc báo cáo | Giữ lại |
| Hiển thị/quét QR | **react-qr-code; scanner USB làm luồng chính, html5-qrcode cho camera demo** | Hai thư viện QR đã được khai báo; spec chọn scanner USB, nên camera là phương án bổ trợ | Giữ/tích hợp |
| Runtime backend | **Node.js 22 LTS, bản vá còn hỗ trợ và tối thiểu đáp ứng yêu cầu Vite** | .mise.toml hiện chọn Node 22; giảm thay đổi môi trường. Node 24 LTS là lựa chọn nâng cấp có kiểm chứng | Chốt môi trường |
| Backend | **NestJS + TypeScript**, REST API | Hợp sáu module M1; module, DI và guard giúp thể hiện ranh giới nghiệp vụ, SOLID và quyền truy cập | Bổ sung |
| Truy cập dữ liệu | **TypeORM + driver pg + migrations** | Hợp Repository/Unit of Work, giao dịch nhiều module, truy vấn SQL và khóa xử lý đồng thời | Bổ sung |
| Database chính | **PostgreSQL 18.x** hoặc một bản PostgreSQL còn hỗ trợ đã thống nhất | PostgreSQL đã được M1 chọn; có transaction, ràng buộc dữ liệu và cơ chế lưu/khôi phục cần thiết | Giữ quyết định M1 |
| Tác vụ nền | **Bảng Job/Outbox trong PostgreSQL + worker dùng chung codebase** | Đúng ADR-07; chưa cần thêm broker. Scheduler chỉ đánh thức worker, dữ liệu công việc nằm trong DB | Ưu tiên M2 |
| QR bảo mật | **jose** để ký/xác minh token; trạng thái credential và chống replay trong DB | Bổ sung QR thời hạn ngắn và kiểm soát dùng lại để xử lý vấn đề QR tĩnh của M2 | Ưu tiên M2 |
| API contract | **OpenAPI/Swagger qua NestJS** | Chốt request/response và mã lỗi trước khi frontend/backend tích hợp | Nên có |
| Kiểm thử | **Jest + Supertest** cho backend; **Playwright** cho luồng UI; **k6** cho tải | Đủ kiểm chứng nghiệp vụ, transaction, mất phản hồi và hiệu năng; thêm test frontend nhỏ bằng Vitest khi cần | Theo phạm vi code |
| Môi trường demo | **Docker Compose + PostgreSQL + backend + TCS/HRS simulator**; reverse proxy khi đóng gói | Dễ tái tạo môi trường chấm bài, chủ động gây timeout/mất ACK và chạy lại kịch bản | Nên có |

Các major frontend ở trên lấy từ [package.json](../package.json), chưa khẳng định mọi thư viện đều đã được tích hợp đầy đủ. Node 22/24 có trong danh sách LTS; Vite công bố yêu cầu Node 20.19+ hoặc 22.12+. Với nhánh 22, hãy chọn bản vá phù hợp, không hiểu cấu hình “22” là bất kỳ bản 22.0 nào cũng đủ. [Node releases](https://nodejs.org/en/about/previous-releases), [Vite — Getting Started](https://vite.dev/guide/).

**Quy tắc version:** Giữ lockfile; pin bộ NestJS / @nestjs/typeorm / TypeORM / pg tương thích sau một thử nghiệm nhỏ gồm kết nối DB, migration, transaction và một integration test. Không tự ghép các major mới nhất của từng package rồi coi là đã tương thích. Tài liệu này đề xuất stack, không cam kết một tổ hợp version chưa được chạy thử.

### 1.2. Hình dung toàn hệ thống

~~~mermaid
flowchart TB
    subgraph CLIENT["Frontend — cùng codebase React, các màn hình khác nhau"]
        PORTAL["HR / SUP / SEC / ADM / EXE"]
        EMP["Web nhân viên trên điện thoại"]
        KIOSK["Kiosk + scanner USB"]
    end
    PORTAL -->|"HTTPS REST API"| API
    EMP -->|"Đăng nhập, lấy QR, xem công cá nhân"| API
    KIOSK -->|"Gửi lượt quét, tra cứu trạng thái"| API
    subgraph APP["TMC Backend — NestJS modular monolith"]
        API["Controllers + Auth / Scope Guards"]
        MOD["IAM / EQR / GATE / ATT / RPT / CFG"]
        WORKER["Job / Outbox Worker"]
        TCSAD["Turnstile Adapter"]
        HRSAD["HR Export Adapter"]
        API --> MOD
        MOD --> TCSAD
        WORKER --> HRSAD
    end
    MOD --> DB[("PostgreSQL<br/>Dữ liệu nghiệp vụ, Audit, Job / Outbox")]
    WORKER <--> DB
    TCSAD -->|"API qua tuyến mạng đã xác thực"| TCS["TCS hai nhà máy<br/>Hệ thống có sẵn / simulator"]
    HRSAD -->|"API + xác nhận lô"| HRS["HRS hiện có / simulator"]
~~~

Sơ đồ là **[ĐỀ XUẤT]** cụ thể hóa M1. Luồng cơ sở giữ đúng việc **kiosk chỉ gọi backend; backend gọi TCS**. Không tự chuyển quyền điều khiển cổng xuống trình duyệt. Worker ban đầu có thể cùng process với API; tách process khi kết quả đo cho thấy tác vụ nền ảnh hưởng kiosk. [Spec §8.1–8.3, trang PDF 25–26](spec.pdf#page=25).

## 2. Kế thừa M1 và thay đổi cần thiết cho M2

### 2.1. Những quyết định nên giữ

| Nội dung M1 đã chọn | Đề xuất triển khai tương ứng | Nguồn trong spec |
|---|---|---|
| Modular monolith, phân lớp bên trong | Một backend NestJS, sáu business modules, công khai interface có giới hạn | §4.3, §5, ADR-01; [PDF 17](spec.pdf#page=17) |
| PostgreSQL dùng chung, mỗi module sở hữu nhóm bảng | Một database vật lý, migrations; chỉ truy cập dữ liệu qua phần chịu trách nhiệm | §5.3, ADR-02; [PDF 18](spec.pdf#page=18), [PDF 27](spec.pdf#page=27) |
| Lưu yêu cầu trước khi gửi lệnh; CAS và UNKNOWN | AccessAttempt/GateCommand bền vững, state machine, đối soát kết quả không chắc chắn | §7, ADR-03; [PDF 22–23](spec.pdf#page=22), [PDF 28](spec.pdf#page=28) |
| Tách TurnstileGateway và HrExporter | Adapter thật và simulator dùng chung hợp đồng hành vi | §5.2, ADR-07; [PDF 18](spec.pdf#page=18), [PDF 29](spec.pdf#page=29) |
| Job trong DB, chưa dùng message broker | Worker đọc Job/Outbox, claim có điều kiện và retry được kiểm soát | §4.3, ADR-07; [PDF 17](spec.pdf#page=17), [PDF 29](spec.pdf#page=29) |
| Chỉ ghi công khi đủ nguồn xác nhận | Tách access decision, gate result và attendance state; giữ evidenceType | §6.3, ADR-05; [PDF 21](spec.pdf#page=21), [PDF 28](spec.pdf#page=28) |
| RBAC kèm phạm vi tổ/nhà máy | Authorization ở backend, lọc dữ liệu trước khi trả về, audit cùng transaction | §10.2–10.3, ADR-08; [PDF 31–32](spec.pdf#page=31) |
| UTC trong lưu trữ, Asia/Ho_Chi_Minh cho nghiệp vụ | Thời điểm dùng timestamptz; tính kỳ và hiển thị theo múi giờ nghiệp vụ | §1.4; [PDF 9](spec.pdf#page=9) |

### 2.2. Hai phần M1 chưa đủ để trả lời M2

| M1 hiện tại | Yêu cầu mới của M2 | Đề xuất cập nhật |
|---|---|---|
| ADR-04 dùng QR tĩnh có chữ ký; chia sẻ ảnh là rủi ro còn lại | Phải đề xuất cải tiến chống truy cập trái phép/gian lận do QR tĩnh lộ | Bổ sung QR ngắn hạn, token ID, kiểm soát replay, thu hồi và xác thực người dùng khi lấy mã; cập nhật kênh email từ ảnh tĩnh sang link portal |
| ADR-10 vận hành online; mất WAN dùng SEC ghi sự cố và HR nhập bù | Phải cải tiến kiến trúc cho mất kết nối trong xử lý giao dịch | Cụ thể hóa phục hồi theo eventId, theo dõi request chưa biết kết quả, durable jobs và quy trình đối soát; cân nhắc edge nếu cần tiếp tục tự động khi WAN đứt |

Đề M2 yêu cầu **giải thích giải pháp và cách tích hợp vào kiến trúc**, không chỉ ghi hai rủi ro rồi để giai đoạn sau. Tuy nhiên, đề **không bắt buộc** offline tự động mở cổng hay bắt buộc dùng QR động theo một giao thức cụ thể; các cơ chế ở đây là lựa chọn thiết kế cần lập luận. [M2, trang 2](SA_CC_hk261_Assignment_M2.pdf#page=2).

Mục tiêu RPO 15 phút/RTO 4 giờ, bốn kiosk mỗi nhà máy, chặn quét liên tiếp 5 giây, cảnh báo và lịch retry trong spec là **mục tiêu/giả định do nhóm đặt**, chưa phải kết quả đã đo hoặc con số được đề gốc ấn định. Khi đưa vào M2, cần kiểm chứng hoặc giải thích việc điều chỉnh. [Spec §2.2, §6.2, §11.1](spec.pdf#page=12).

## 3. Frontend: tận dụng phần đã có, tập trung kết nối nghiệp vụ thật

### 3.1. Phân công trách nhiệm giữa các thư viện

| Công nghệ | Dùng ở đâu? | Lưu ý triển khai |
|---|---|---|
| React + React Router | Portal theo vai trò, web EMP và màn kiosk | Giữ một frontend; route guard phục vụ trải nghiệm, quyền thực tế do server thực thi |
| MUI + theme | Form HR, bảng nhân viên, dialog hiệu chỉnh, bộ lọc và trạng thái | Ưu tiên component đã có; tránh thêm bộ UI khác khiến giao diện và công sức bảo trì bị phân tán |
| Tailwind/global CSS | Bố cục, responsive, màn hình kiosk và nhân viên | Có thể cùng tồn tại với MUI khi thống nhất nơi quản lý màu, spacing và typography |
| TanStack Query | GET danh sách, trạng thái yêu cầu, báo cáo; invalidate sau mutation | Query key chứa kỳ/nhà máy/bộ lọc phù hợp. Xóa cache liên quan khi logout hoặc đổi tài khoản |
| React Hook Form + Zod | Form và lỗi nhập liệu trước khi submit | Backend vẫn validate độc lập; kiểu TypeScript và schema frontend không thay thế xác thực request server |
| react-qr-code | Biến token backend cấp thành ảnh QR | Thư viện vẽ mã không cấp quyền truy cập, không thay phần ký token hoặc xác thực |
| Scanner USB | Nhận chuỗi QR như đầu vào bàn phím theo spec | Giới hạn độ dài, chuẩn hóa input, chống submit lặp; chuỗi QR là dữ liệu, không tự mở URL |
| html5-qrcode | Dùng camera cho demo khi chưa có scanner | Kiểm tra quyền camera/môi trường trình duyệt; không dùng kết quả camera demo để suy ra độ trễ scanner thật |
| Recharts + date-fns/Intl | Tổng hợp báo cáo, định dạng thời gian | Dữ liệu tổng hợp lấy từ API theo quyền; trình duyệt không tự quyết định quy tắc chấm công/lương |

TanStack Query có cơ chế mutation và tùy chọn retry/persist. Với yêu cầu mở cổng, đề xuất **tách rõ GET trạng thái và POST gây tác động**, không dùng cơ chế resume mutation chung để phát lại lệnh cũ lúc mạng trở lại. Retry luồng này phải tuân thủ eventId, deadline và trạng thái backend. [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations).

### 3.2. Những điểm cần chuyển từ demo sang hệ thống M2

Đối chiếu [src/data/api.ts](../src/data/api.ts), [src/app/context.tsx](../src/app/context.tsx) và [src/app/router.tsx](../src/app/router.tsx): lớp API hiện đọc/ghi dữ liệu demo trong localStorage; context lấy toàn bộ “database” và phiên chọn account lưu ở trình duyệt. Đây là nền UI có thể tận dụng, còn backend M2 cần thay nguồn dữ liệu và cơ chế xác thực.

| Hiện trạng quan sát được | Bước chuyển đề xuất |
|---|---|
| api.getDatabase trả tập dữ liệu demo cho context | Tách API theo use case: /me, /employees, /attendance, /gate-attempts, /reports; phân trang và lọc quyền tại server |
| Phiên demo lưu account ID trong localStorage | Đăng nhập thật, session có hạn do backend quản lý; không tin account ID hoặc role do client tự gửi |
| Guard và kiểm tra role trong frontend | Giữ để điều hướng; bổ sung kiểm tra permission + scope + đối tượng ở mọi API |
| Dữ liệu browser là nguồn ghi nhận demo | PostgreSQL trở thành nguồn dữ liệu chính; cache frontend chỉ phục vụ hiển thị |
| Các role hiện có không trùng hoàn toàn EMP/SUP/HR/SEC/ADM/EXE của spec | Lập bảng ánh xạ/chuẩn hóa role trước khi nối API; đặc biệt bổ sung EXE nếu tiếp tục theo ma trận M1 |

Gợi ý ánh xạ: EMPLOYEE → EMP; DEPARTMENT_MANAGER → SUP; HR_MANAGER → HR; SYSTEM_ADMIN → ADM. SECURITY_MANAGER và GATE_OPERATOR có thể là hai tập quyền thuộc SEC nếu nhóm quyết định giữ; không tự xem cả hai là ADM. Enum role trong schema demo ở api.ts chưa có EXE, trong khi M1 có actor này.

**Đóng gói ngoài Figma Make:** [App.tsx](../src/App.tsx) và [index.css](../src/index.css) đang tham chiếu @figma/astraui. Cần xác nhận cách cung cấp dependency/theme này trong môi trường chạy độc lập hoặc lập kế hoạch thay lớp liên quan. Đây là điểm tích hợp cần kiểm tra, chưa phải kết luận build hiện tại bị lỗi.

## 4. Backend: vì sao chọn NestJS + TypeORM?

### 4.1. Chọn framework theo thiết kế đã có

| Phương án | Đánh giá cho bài này | Khi nào nên chọn? |
|---|---|---|
| **NestJS + TypeScript — đề xuất chính** | Hợp frontend TypeScript, ví dụ TypeScript và DI trong spec; có cấu trúc modules/providers/guards để tổ chức sáu module | Nhóm chưa bị ràng buộc backend khác và muốn giảm chi phí chuyển ngôn ngữ |
| Express/Fastify dùng trực tiếp | Làm được bài, nhưng nhóm phải tự đặt quy ước module, DI, validation, quyền và kiểm thử | Nhóm đã có skeleton rõ ràng, không để toàn bộ use case dồn vào route/controller |
| Spring Boot + Java | Là phương án thay thế hợp lý về tổ chức lớp, DI và transaction; frontend vẫn giữ React | Nhóm thành thạo Java/Spring hơn TypeScript backend; cần đổi công cụ triển khai, không cần đổi quyết định modular monolith/PostgreSQL |

Bảng là **đánh giá áp dụng cho TMC**, không phải benchmark tốc độ framework. Nest hỗ trợ module có public interface qua các provider được export, cùng cơ chế DI/custom provider; đây là công cụ hỗ trợ thực thi thiết kế, không tự bảo đảm module độc lập hoặc code tuân thủ SOLID. [Nest — Modules](https://docs.nestjs.com/modules), [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers).

### 4.2. Chọn ORM

| Lựa chọn | Điểm phù hợp | Đánh đổi |
|---|---|---|
| **TypeORM — đề xuất chính** | Repository, transaction manager/QueryRunner và QueryBuilder phù hợp UnitOfWork, CAS và worker DB của spec | Cần kiểm soát migration, SQL sinh ra, quan hệ và transaction context; đặt ORM entity ở hạ tầng để domain không bị phụ thuộc decorators |
| Prisma — lựa chọn thay thế | Client sinh từ schema, phù hợp nhóm đã quen cách làm schema/client | Vẫn phải thiết kế UnitOfWork, constraint, concurrency và SQL đặc thù; API và khả năng tích hợp phụ thuộc major được chọn |

Chọn **một ORM chính** cho backend. Đề xuất TypeORM dựa trên mức phù hợp với mô hình transaction/Repository của nhóm, không phải yêu cầu của đề. Nest có tài liệu tích hợp TypeORM và cũng hỗ trợ Prisma qua provider. [Nest — Databases](https://docs.nestjs.com/techniques/database), [Nest — TypeORM](https://docs.nestjs.com/data/typeorm).

**Quy tắc transaction quan trọng:** Các repository cùng một UnitOfWork phải dùng cùng transactional EntityManager/QueryRunner; gọi repository dùng global manager ở giữa luồng có thể khiến ghi dữ liệu nằm ngoài transaction mong muốn. [TypeORM — Transactions](https://typeorm.io/docs/transactions/).

### 4.3. Các thành phần backend nên dùng

| Thành phần | Công cụ/cách làm đề xuất | Áp dụng |
|---|---|---|
| Module/DI | Nest modules, providers; token Symbol hoặc abstract class cho port | Đổi TCS/HRS adapter hoặc QR verifier qua composition root |
| Validation | Nest ValidationPipe + DTO validation; có thể chọn Zod integration nếu nhóm muốn thống nhất schema | Chốt một cách validate request backend; tách DTO khỏi entity DB |
| Authentication người dùng | Session ID ngẫu nhiên, cookie HttpOnly/Secure phù hợp môi trường HTTPS; session lưu bền vững trong PostgreSQL | Thu hồi phiên, hết hạn, CSRF và kiểm tra quyền hiện hành; QR không được dùng làm phiên đăng nhập portal |
| Authentication kiosk | Enrollment có kiểm soát, phiên/credential riêng gắn stationId và phạm vi API | Không đặt secret thiết bị dài hạn trong biến VITE_* hoặc public bundle; stationId/gateId lấy từ dữ liệu server |
| Authorization | Guard + Authorizer(permission, scope) và query lọc đối tượng | Giữ tách nhiệm vụ HR/ADM, SEC theo nhà máy, SUP theo tổ, EXE xem tổng hợp |
| API contract | @nestjs/swagger, request/response DTO, reasonCode/correlationId | Frontend không cần đoán ý nghĩa UNKNOWN, PENDING hoặc HTTP 409 |
| HTTP đến TCS/HRS | Adapter với timeout/deadline và chuẩn hóa kết quả | Phân biệt lỗi trước khi gửi, kết quả bị từ chối và kết quả không xác định |
| Lịch và jobs | Scheduler đánh thức worker; Job/Outbox trong DB lưu nextAttemptAt, attempts, lease/state | Khởi động lại vẫn biết công việc còn tồn; chống nhiều worker chạy cùng tác vụ |
| Logging | Structured logs, correlationId, lọc token/secret; AuditWriter nghiệp vụ lưu DB | Log vận hành và audit có mục tiêu khác nhau; console log không thay audit nguyên tử |

Guard chỉ là điểm kiểm tra đầu vào; phạm vi dữ liệu và quyền đối với đối tượng vẫn cần được thực thi trong use case/query. [Nest — Authorization](https://docs.nestjs.com/security/authorization). Scheduler hỗ trợ kích hoạt theo lịch, còn cơ chế bền vững/claim/recovery ở đây do thiết kế Job trong DB đảm nhiệm. [Nest — Task Scheduling](https://docs.nestjs.com/application/task-scheduling).

## 5. Database: PostgreSQL và thiết kế bảo vệ tính đúng đắn

### 5.1. Vì sao giữ PostgreSQL?

**[M1 ĐÃ CHỌN]** PostgreSQL đã có trong §8.1 và ADR-02. Bài toán cần giao dịch nhiều bảng, ràng buộc chống trùng, báo cáo theo nhân viên/kỳ/nhà máy và lưu lịch sử. Giữ database quan hệ giúp hiện thực trực tiếp thiết kế M1; chưa có nhu cầu đã chứng minh để thay database chính hoặc tách DB theo microservice. [Spec, trang PDF 25 và 27](spec.pdf#page=25).

PostgreSQL hỗ trợ UNIQUE, CHECK và FOREIGN KEY để bảo vệ dữ liệu ngay tại DB. Các constraint này cần đi cùng quy tắc nghiệp vụ; một UNIQUE không tự ngăn mọi lệnh mở cổng lặp ở thiết bị. [PostgreSQL — Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).

### 5.2. Nhóm dữ liệu và ràng buộc chính

Tên bảng SQL dưới đây là **gợi ý ánh xạ**, không phải schema đã có trong repo. Một schema với tên bảng rõ ràng là đủ cho M2; tách PostgreSQL schemas theo module là lựa chọn bổ sung, không bắt buộc.

| Module | Thực thể/bảng dự kiến | Ràng buộc hoặc quy tắc đáng ưu tiên |
|---|---|---|
| IAM | User, Role, RoleAssignment, Session, AuditEntry | RoleAssignment mang phạm vi; session có hết hạn/thu hồi; thay đổi quan trọng và AuditEntry cùng transaction |
| EQR | Employee, QrCredential, AccessGrant; QrRedemption bổ sung cho M2 | Mã HRS ổn định; credential có keyId/revokedAt; việc khóa nhân viên và vô hiệu QR nhất quán; jti đã dùng gắn với attempt |
| GATE | GateStation, AccessAttempt, GateCommand, CommandHistory | UNIQUE(stationId,eventId); requestHash; tối đa một OPEN cơ sở cho attempt; CAS khi nhận quyền gửi |
| ATT | AttendanceEvent, PresenceInterval, Correction | UNIQUE(sourceId); source ổn định cho cùng lượt xác nhận; sự kiện gốc được giữ; correction có expectedVersion và lý do |
| RPT | ExportBatch, ExportItem, ExportAttempt | Kỳ/phiên bản không trùng trong phạm vi xuất đã chọn; snapshot và checksum cố định; bản thay thế liên kết supersedesBatchId |
| CFG | Factory, Department, Team, ConfigVersion | Cổng có lịch sử được ngừng sử dụng; cấu hình và quan hệ tổ chức cần hiệu lực/phiên bản khi ảnh hưởng báo cáo |
| Hạ tầng | Job / Outbox | jobKey duy nhất theo loại công việc; state, nextAttemptAt, attempts, leaseOwner/leaseUntil khi cần nhiều worker |

Giữ đặc tả dữ liệu ở [spec §6.1, trang PDF 19–20](spec.pdf#page=19); QrRedemption, Session và trường claim chi tiết là phần **đề xuất hiện thực/bổ sung**.

~~~mermaid
erDiagram
    EMPLOYEE ||--o{ QR_CREDENTIAL : has
    EMPLOYEE ||--o{ ACCESS_GRANT : granted
    GATE_STATION ||--o{ ACCESS_ATTEMPT : receives
    EMPLOYEE o|--o{ ACCESS_ATTEMPT : identified_in
    ACCESS_ATTEMPT ||--o{ GATE_COMMAND : tracks
    ACCESS_ATTEMPT ||--o| ATTENDANCE_EVENT : may_confirm
    EMPLOYEE ||--o{ ATTENDANCE_EVENT : attends
    EMPLOYEE ||--o{ PRESENCE_INTERVAL : has
    ATTENDANCE_EVENT ||--o{ CORRECTION : corrected_by
    EXPORT_BATCH ||--o{ EXPORT_ITEM : contains
    EXPORT_BATCH ||--o{ EXPORT_ATTEMPT : delivery_attempts
~~~

ER diagram được rút gọn cho luồng quét tự động: attempt bị từ chối có thể không xác định được nhân viên; attempt chỉ tạo công khi đủ bằng chứng. Luồng nhập MANUAL có nguồn và kiểm soát riêng. Mỗi PresenceInterval tham chiếu các lượt IN/OUT liên quan; lệnh CLOSE không tạo thêm AttendanceEvent.

### 5.3. Các quyết định dữ liệu nên hiện thực sớm

1. **Idempotency:** eventId tạo trước lần gửi; UNIQUE(stationId,eventId), requestHash ổn định. Cùng ID/cùng nội dung trả trạng thái cũ; khác nội dung trả 409. Không chỉ “SELECT xem tồn tại rồi INSERT” vì hai request đồng thời vẫn có thể cùng vượt qua SELECT.
2. **Một nguồn, một lượt công:** sourceId đại diện ổn định cho cùng lượt đã xác nhận, chẳng hạn nguồn gắn AccessAttempt. Không tạo sourceId mới mỗi khi nhận lại callback. Vendor event ID được kiểm tra trùng riêng khi cần.
3. **CAS cho lệnh cổng:** chỉ tiến trình đổi thành công PREPARED → DISPATCHING mới được gửi. Khi kết quả gửi đã không chắc chắn, chuyển đối soát, không coi quyền claim hết hạn là lý do gửi lại OPEN.
4. **Correction có version:** cập nhật có điều kiện theo expectedVersion; xung đột trả lỗi để HR đọc bản mới. Giữ bản gốc và before/after có lý do.
5. **Thời gian:** thời điểm dùng timestamptz, trao đổi ISO 8601 có timezone; kỳ tháng dùng khoảng [đầu tháng, đầu tháng kế tiếp) theo Asia/Ho_Chi_Minh. Không cắt ngày UTC để thay ngày nghiệp vụ.
6. **Chỉ mục:** ưu tiên (employeeId, occurredAt), (factoryId, occurredAt) khi mô hình có trường này, chỉ mục cho attempt/status và Job(state,nextAttemptAt); đo bằng truy vấn thực tế trước khi thêm hàng loạt index.
7. **Migrations:** review migration, tạo constraint trong DB, seed hai nhà máy/roles/kiosk; dùng tài khoản migration tách quyền ứng dụng. Tránh dùng tự đồng bộ schema thay cho migration trong môi trường nộp bài cần tái tạo.
8. **Lưu bền vững:** cấu hình commit/WAL phù hợp; giữ yêu cầu đã ACK qua restart; có backup và phục hồi thử. Docker volume chỉ giúp giữ dữ liệu qua vòng đời container, không thay bản sao lưu.

Ví dụ constraint/claim mang tính minh họa, cần điều chỉnh tên bảng theo migration thực tế:

~~~sql
CREATE UNIQUE INDEX uq_attempt_station_event
    ON access_attempt (station_id, event_id);

CREATE UNIQUE INDEX uq_open_per_attempt
    ON gate_command (access_attempt_id)
    WHERE kind = 'OPEN';

UPDATE gate_command
SET state = 'DISPATCHING'
WHERE command_id = $1 AND state = 'PREPARED'
RETURNING command_id;
~~~

CAS trên chỉ minh họa nhận quyền gửi. Hiện thực còn phải kiểm tra deadline, trạng thái nhân viên và quyền trước khi dispatch, hoàn tất transaction trước khi gọi TCS và kiểm soát tương tranh với các thao tác đổi quyền theo chính sách đã chốt.

Commit bất đồng bộ có thể trả thành công trước khi WAL xuống lưu trữ bền vững, làm mất các giao dịch gần nhất khi crash. Vì vậy, không đánh đổi độ bền chỉ để cải thiện số đo latency của bài. Mục tiêu phục hồi 15 phút/4 giờ trong M1 cần backup/WAL archive và diễn tập tương ứng, không suy ra từ việc dùng PostgreSQL. [PostgreSQL — Asynchronous Commit](https://www.postgresql.org/docs/18/wal-async-commit.html), [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html).

## 6. Architecture: cụ thể hóa thiết kế M1 thành code

### 6.1. Kết hợp các mức kiến trúc

| Mức quyết định | Lựa chọn đề xuất | Ý nghĩa |
|---|---|---|
| Toàn hệ thống | **Modular monolith** | Sáu module nghiệp vụ trong một backend; một database vật lý; có ranh giới sở hữu dữ liệu |
| Bên trong module | **Layered / Clean Architecture ở mức vừa đủ** | Presentation → Application → Domain/Ports; hạ tầng triển khai port. Không bắt mọi CRUD đơn giản phải có nhiều lớp rỗng |
| Tích hợp ngoài | **Hexagonal / Ports & Adapters** | TCS/HRS thật, simulator và repository là adapters; use case dùng interface |
| Công việc nền | **DB-backed jobs + Transactional Outbox khi cần chuyển tiếp dữ liệu** | Lưu ý định công việc cùng dữ liệu liên quan, worker xử lý sau commit |
| Đọc/ghi | **Tách command/query ở mức code nếu hữu ích** | Query báo cáo có DTO riêng, command cập nhật giữ quy tắc; chưa cần CQRS phân tán hay hai database |

Đây là các lựa chọn có thể kết hợp. “Clean Architecture” không có nghĩa triển khai microservices; “dùng Outbox” không có nghĩa phải bổ sung Kafka. Event Sourcing toàn hệ thống cũng chưa cần thiết: giữ sự kiện công gốc và lịch sử correction không tự biến cả ứng dụng thành Event Sourcing.

### 6.2. Module view — giữ tên và quan hệ của M1

~~~mermaid
flowchart LR
    GATE["GATE<br/>Quét, trạm, lệnh cổng"] -->|"QrVerifier / EmployeeQuery"| EQR["EQR<br/>Nhân viên, QR, AccessGrant"]
    GATE -->|"AttendanceWriter"| ATT["ATT<br/>Sự kiện, khoảng hiện diện, correction"]
    RPT["RPT<br/>Báo cáo và xuất HRS"] -->|"AttendanceQuery"| ATT
    RPT -->|"EmployeeQuery"| EQR
    GATE --> IAM["IAM<br/>Authorizer / AuditWriter"]
    EQR --> IAM
    ATT --> IAM
    RPT --> IAM
    GATE --> CFG["CFG<br/>ConfigReader / Cơ cấu tổ chức"]
    RPT --> CFG
~~~

Mũi tên là **phụ thuộc giao diện nghiệp vụ**, không phải đường mạng. ATT không cần import ngược GATE chỉ để lưu sourceId. IAM/CFG không import ngược mọi module để làm “service tổng”. Port và kiểu dữ liệu công khai phải nhỏ, tránh import ORM entity/repository nội bộ của module khác. [Spec §5.1–5.4](spec.pdf#page=17).

### 6.3. Cấu trúc thư mục đề xuất

Bố cục thống nhất là **client/** chứa frontend và **api/** chứa backend NestJS. Đây là cấu trúc đích trong tài liệu; mã frontend hiện tại vẫn đang ở src tại root cho đến bước chuyển source. Mỗi ứng dụng có package.json, src và cấu hình riêng; pnpm workspace ở root có thể quản lý cả hai.

~~~text
TMCQRAttendanceSystem_KTPM/
├─ client/                          # Ứng dụng React
│  ├─ src/
│  │  ├─ app/                      # Bootstrap, providers, router
│  │  ├─ features/                 # Clean Architecture theo feature
│  │  └─ shared/
│  ├─ public/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ package.json
├─ api/                             # Ứng dụng NestJS
│  ├─ src/
│  │  ├─ main.ts
│  │  ├─ app.module.ts
│  │  ├─ worker.ts                 # Entry point nền tùy chọn
│  │  ├─ bootstrap/                # Nest modules, DI bindings và tokens
│  │  ├─ modules/
│  │  │  ├─ iam/
│  │  │  ├─ eqr/
│  │  │  ├─ gate/
│  │  │  │  ├─ domain/
│  │  │  │  ├─ application/
│  │  │  │  │  ├─ commands/
│  │  │  │  │  └─ ports/
│  │  │  │  ├─ infrastructure/     # TypeORM, HTTP/simulator adapters
│  │  │  │  └─ presentation/http/ # Controllers, DTO, mappers
│  │  │  ├─ att/
│  │  │  ├─ rpt/
│  │  │  └─ cfg/
│  │  └─ platform/
│  │     ├─ application/           # UnitOfWork, transaction context, clock, jobs
│  │     └─ infrastructure/        # Database/migrations, job store, logging
│  ├─ test/
│  ├─ simulators/
│  ├─ nest-cli.json
│  ├─ tsconfig.json
│  └─ package.json
├─ doc/
├─ package.json                     # Workspace/scripts điều phối nếu dùng workspace
├─ pnpm-workspace.yaml              # client + api
├─ pnpm-lock.yaml
├─ compose.yaml
└─ .mise.toml
~~~

Tên module, lớp và bảng trong sơ đồ/báo cáo/code phải đối chiếu được với nhau. Domain/use case không phụ thuộc Nest/TypeORM; bootstrap nối port với adapter. HTTP DTO và domain/ORM entity được tách rõ. client không import api/src; contract dùng chung chỉ được tách thành package thuần nếu cần.

Xem [structure-architecture.md](structure-architecture.md) để đọc cây đầy đủ, quy tắc import, TypeScript ports, Nest factory providers và kế hoạch chuyển Vite root. Tên client/api mô tả hai ứng dụng; không cần thêm tầng client/frontend hoặc api/backend.

## 7. Design patterns nên áp dụng — dùng cho vấn đề nào?

Các pattern dưới đây là **[ĐỀ XUẤT]** gắn với thiết kế M1. Không cần tạo một class cho mỗi tên pattern; với rule đơn giản, hàm thuần hoặc bảng chuyển trạng thái có thể đủ rõ.

| Pattern / kỹ thuật | Đặt ở đâu? | Vấn đề giải quyết | Ưu tiên |
|---|---|---|---|
| **Repository** | AccessRepository, AttendanceRepository, ExportBatchRepository | Tách nghiệp vụ khỏi SQL/ORM, tập trung truy cập dữ liệu thuộc module | Cốt lõi |
| **Unit of Work** | Tầng application + transaction adapter | GATE result + ATT event + IAM audit cùng commit/rollback; không có “ghi công xong nhưng audit thất bại” ngoài dự kiến | Cốt lõi |
| **Adapter** | TurnstileHttpAdapter, HrApiAdapter; simulator adapters | Chuẩn hóa API ngoài thành contract của hệ thống, kiểm thử khi chưa có thiết bị | Cốt lõi |
| **Dependency Injection / Composition Root** | Nest providers ở nơi khởi tạo | Chọn adapter thật/giả, truyền repository/clock; use case phụ thuộc abstraction | Cốt lõi |
| **State Machine** | GateCommand và ExportBatch | Ngăn chuyển trạng thái không hợp lệ; biểu diễn UNKNOWN, PENDING, ACK và phục hồi | Cốt lõi |
| **Command / Use Case** | ScanUseCase, DispatchOpen, ReconcileGate, ExportMonth, CorrectAttendance | Một điểm điều phối nghiệp vụ, quyền, transaction và kết quả; giữ controller mỏng | Cốt lõi |
| **Strategy** | StaticQrVerifier/ShortLivedQrVerifier khi chuyển giai đoạn; export mapping khi có nhiều contract | Đổi thuật toán/chính sách qua interface thay vì rải if/else khắp luồng | Khi có biến thể thật |
| **Transactional Outbox** | Tạo lô xuất hoặc yêu cầu gửi thông báo trong transaction nghiệp vụ | Tránh lưu DB thành công nhưng quên tạo công việc phải gửi tiếp | Nên có cho xuất/tích hợp |
| **Retry + Backoff + Jitter** | Worker gửi HRS, thông báo; GET tra cứu phù hợp | Phục hồi lỗi tạm thời, tránh nhiều tác vụ gửi dồn; giữ idempotency và retry budget | Cốt lõi cho jobs |
| **Optimistic Concurrency / CAS** | expectedVersion khi HR sửa công; claim GateCommand/Job | Phát hiện cập nhật đè và tranh chấp giữa nhiều tiến trình | Cốt lõi |
| **Factory/Provider selection** | Bootstrap chọn adapter theo config | Tập trung cách tạo implementation theo môi trường; thường Nest provider đã đủ, chưa cần thêm Abstract Factory | Tùy độ phức tạp |
| **Observer / Domain Events** | Thông báo sau thay đổi, tác vụ phụ | Giảm nối trực tiếp ở công việc không cần đồng bộ; sự kiện quan trọng cần lưu bền vững | Bổ sung có chọn lọc |

**Phân biệt để trình bày chính xác:** Repository/Adapter/Strategy/State/Command là các mẫu tổ chức thiết kế quen thuộc; Outbox/Retry là mẫu xử lý tin cậy; CAS, UNIQUE và version là cơ chế kiểm soát đồng thời/dữ liệu. Chúng cùng hữu ích nhưng không nên gọi tất cả là GoF design patterns.

### 7.1. Outbox và DB jobs: triển khai đến mức nào?

Ví dụ xuất tháng: transaction tạo snapshot ExportBatch và Job/Outbox cùng lúc → commit → worker claim → gửi HRS → cập nhật trạng thái từ ACK. Nếu chỉ gọi HTTP ngay sau commit mà không có dữ liệu công việc bền vững, crash ở khoảng giữa vẫn có thể làm mất ý định gửi.

Outbox giải quyết vấn đề ghi DB và phát thông điệp/tác vụ không nguyên tử; việc giao nhận có thể lặp nên bên nhận hoặc adapter vẫn phải xử lý idempotent. Nó không bảo đảm cổng vật lý thực hiện đúng một lần. [AWS — Transactional Outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

Với nhiều worker, có thể claim bằng transaction ngắn và SELECT ... FOR UPDATE SKIP LOCKED, cập nhật trạng thái/lease rồi commit trước HTTP. Worker cũ quay lại sau khi mất lease phải bị ngăn ghi đè kết quả bằng owner/version phù hợp. Tác động ở HRS còn cần batchId/idempotency của hệ thống nhận. PostgreSQL ghi rõ SKIP LOCKED phù hợp trường hợp bảng dạng queue; không dùng nó như cách đọc báo cáo nhất quán. [PostgreSQL — SELECT](https://www.postgresql.org/docs/18/sql-select.html), [TypeORM — Locking](https://typeorm.io/docs/query-builder/select-query-builder/).

**Riêng GateCommand:** Nếu worker/process dừng ở DISPATCHING, không tự thu hồi lease rồi gửi OPEN như một job email. Cổng có thể đã mở. Phải tra cứu theo commandId khi API hỗ trợ hoặc chuyển SEC đối soát, đúng ADR-03. Không áp dụng một hàm retry chung cho mọi API gây tác động. [Spec §7.3 và ADR-03](spec.pdf#page=23).

### 7.2. Liên hệ patterns với SOLID để viết báo cáo M2

| SOLID | Bằng chứng nên có trong code/báo cáo |
|---|---|
| SRP | QR verifier, dispatch, repository, tính PresenceInterval và xuất HRS có trách nhiệm riêng |
| OCP | Đổi TCS/HRS adapter hoặc cách xác minh QR qua interface; không sửa quy trình lõi khi contract không đổi |
| LSP | Simulator và adapter thật cùng ý nghĩa kết quả/timeout; simulator “luôn thành công” không đủ bằng chứng |
| ISP | Tách TurnstileGateway khỏi CommandStatusReader nếu vendor không có API status; tách query báo cáo khỏi command điều khiển |
| DIP | Use case phụ thuộc port; composition root cấp implementation; DB/HTTP nằm ở hạ tầng |

Với TypeScript interface, DI cần runtime token hoặc abstract class tương ứng; interface không tồn tại như một đối tượng để Nest tự resolve ở runtime. Đây là chi tiết triển khai quan trọng khi hiện thực ví dụ DI của M1. [Nest — Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers).

## 8. Luồng cốt lõi nên triển khai: quét QR → điều khiển cổng → ghi công

### 8.1. Trình tự đề xuất

~~~mermaid
sequenceDiagram
    participant K as Kiosk React
    participant G as GATE Use Case
    participant E as EQR / IAM
    participant D as PostgreSQL
    participant T as TCS Adapter / Simulator
    participant A as ATT + AuditWriter
    K->>G: POST eventId + token; xác thực trạm
    G->>E: Kiểm tra QR, nhân viên, quyền và replay policy
    G->>D: TX-A: lưu attempt, PREPARED, audit; commit
    G->>D: TX-B: kiểm tra hạn/quyền, CAS DISPATCHING; commit
    alt Claim hợp lệ và còn deadline
        G->>T: open(commandId, turnstileId, deadline)
        T-->>G: OPEN_CONFIRMED / OPEN_REJECTED / UNKNOWN
        G->>A: Hoàn tất theo kết quả và nguồn bằng chứng
        A->>D: TX-C: kết quả + công nếu đủ bằng chứng + audit; commit
        G-->>K: Decision, commandState, attendanceState
    else Yêu cầu trùng, hết hạn hoặc không còn quyền
        G-->>K: Trạng thái cũ hoặc kết quả kết thúc; không phát OPEN mới
    end
~~~

Sơ đồ mô tả nhánh QR/quyền hợp lệ. QR bị từ chối vẫn lưu AccessAttempt/audit khi DB hoạt động, nhưng không tạo OPEN hay công. TX-A có thể kết hợp các bước kiểm tra/trạng thái thích hợp; với QR một lần, việc gắn jti vào attempt phải chống tương tranh ngay trong transaction. Mọi transaction kết thúc **trước** khi chờ HTTP TCS/HRS.

**Ba kết quả độc lập cần hiển thị và lưu:**

| Loại kết quả | Ví dụ | Không được suy diễn |
|---|---|---|
| Quyết định truy cập | ALLOW / DENIED | ALLOW chưa chứng minh cổng đã mở |
| Trạng thái lệnh | PREPARED / DISPATCHING / OPEN_CONFIRMED / OPEN_REJECTED / UNKNOWN | HTTP nhận lệnh thành công chưa phải OPEN_CONFIRMED; timeout chưa chứng minh cổng chưa mở |
| Trạng thái chấm công | NOT_CREATED / PROVISIONAL / CONFIRMED | Quét hoặc mở cổng chưa luôn chứng minh nhân viên đã đi qua |

Tên OPEN_CONFIRMED/OPEN_REJECTED được dùng ở contract adapter của spec; cách ánh xạ enum lưu DB cần thống nhất. Khi có cảm biến, ghi công từ bằng chứng qua cổng. Nếu dùng “đã mở” làm đại diện, cần ghi evidenceType và công bố giả định này, không áp dụng ngầm. [Spec §6.3–7.2, trang PDF 21–23](spec.pdf#page=21).

### 8.2. State machine cho GateCommand

~~~mermaid
stateDiagram-v2
    [*] --> PREPARED: ALLOW và đã lưu bền vững
    PREPARED --> DISPATCHING: CAS thành công, còn hạn và có quyền
    PREPARED --> EXPIRED: Quá hạn trước khi gửi
    DISPATCHING --> OPEN_CONFIRMED: Có xác nhận đã mở
    DISPATCHING --> OPEN_REJECTED: Có kết quả từ chối chắc chắn
    DISPATCHING --> UNKNOWN: Mất phản hồi hoặc process dừng
    UNKNOWN --> OPEN_CONFIRMED: Tra cứu hoặc SEC xác nhận có bằng chứng
    UNKNOWN --> OPEN_REJECTED: Đối soát kết luận chưa mở / bị từ chối
    EXPIRED --> [*]
    OPEN_CONFIRMED --> [*]
    OPEN_REJECTED --> [*]
~~~

EXPIRED là trạng thái kết thúc **đề xuất** cho lệnh chưa gửi đã quá hạn. Không tự chuyển UNKNOWN về PREPARED để mở lại; nếu cần hành động mới, phải có quy trình/quyền và tham chiếu rõ ràng. Chỉ cho phép gửi lại cùng commandId khi contract TCS bảo đảm cách làm đó an toàn. Callback muộn hoặc trùng cần kiểm tra chữ ký/xác thực nguồn, event ID và điều kiện chuyển trạng thái.

**Điểm crash cần giữ đúng:** Nếu TCS đã mở nhưng TX-C lỗi, dữ liệu PREPARED/DISPATCHING trước đó vẫn là căn cứ phục hồi. Chỉ retry phần lưu/đối soát theo idempotency phù hợp; không chạy lại cả luồng quét để phát thêm lệnh OPEN. DB transaction không bao gồm tác động vật lý của TCS.

## 9. Kiến trúc bổ sung cho hai vấn đề của M2

### 9.1. QR tĩnh bị lộ: nâng cấp có giới hạn rõ ràng

**[ĐỀ XUẤT CHÍNH]** Backend cấp QR ngắn hạn cho EMP đã đăng nhập; giao diện React hiển thị và làm mới; backend xác minh token, quyền hiện hành và tình trạng dùng lại khi quét. Cập nhật ADR-04, use case xem QR và các view liên quan.

| Thành phần | Cách triển khai đề xuất |
|---|---|
| QR Issuer trong EQR | Dùng jose ký token; private key nằm phía backend, có keyId và quy trình luân chuyển |
| Nội dung token | Header có kid; payload có credential reference, jti ngẫu nhiên, iat/exp, issuer/audience theo contract. Tránh tên, email, lịch sử công và quyền có thể bị stale |
| Thời hạn | Có thể bắt đầu với **30–60 giây cho demo**, đo trải nghiệm quét rồi hiệu chỉnh; đây là thông số đề xuất, không phải yêu cầu của đề |
| QR Validator | Allowlist thuật toán, kiểm tra chữ ký, issuer/audience, thời hạn và credential bị thu hồi; tra nhân viên/quyền hiện hành tại server |
| Replay Guard | UNIQUE(jti) hoặc cơ chế tương đương, gắn token đã nhận vào attempt trong transaction; cùng attempt retry trả trạng thái cũ, attempt khác dùng lại bị từ chối |
| UI nhân viên | Lấy token từ API sau đăng nhập, hiển thị QR + thời hạn; refresh không giữ mã cũ hợp lệ vô thời hạn |
| Kênh email | Gửi link về portal để lấy mã hiện hành; nếu vẫn cho dùng ảnh QR tĩnh không giới hạn thì rủi ro cũ chưa được loại bỏ |
| Audit và log | Ghi kết quả/credential reference phù hợp, lọc raw QR và secret; thu hồi credential/khóa theo chính sách |

jose hỗ trợ ký/xác minh JWT và kiểm tra claims; thư viện hiện dùng ESM, nên cần kiểm tra cách import/runtime trong thử nghiệm tương thích backend. Việc token là JWT được ký không có nghĩa payload được mã hóa. [jose — tài liệu của tác giả](https://github.com/panva/jose).

**Ràng buộc quan trọng:** Idempotency của request và chống replay của QR là hai vấn đề khác nhau. Request đã được nhận phải có đường tra cứu lại dù token đã hết hạn sau đó; không tiêu thụ jti lần nữa hoặc tạo công mới vì client mất phản hồi. Khi triển khai chuyển từ QR tĩnh sang QR ngắn hạn, cần công bố thời điểm/chính sách ngừng chấp nhận credential cũ.

**Rủi ro còn lại:** QR ngắn hạn vẫn có thể bị chuyển tiếp ngay cho người khác; chữ ký không chứng minh người cầm mã là đúng nhân viên. Có thể bổ sung SEC xác minh, kiểm tra bất thường và quy trình xử lý; không tự đưa sinh trắc học, GPS hoặc nhận diện khuôn mặt vào phạm vi code. Bản M2 cần mô tả mức giảm rủi ro và giới hạn thực tế.

### 9.2. Mất kết nối: chọn mức hỗ trợ phù hợp

| Phương án | Thành phần cần có | Mức kế thừa M1 | Đánh đổi |
|---|---|---|---|
| **R0 — nền M1 hiện tại** | Online trung tâm; lưu trước khi mở; UNKNOWN; SEC ghi sự cố và HR nhập MANUAL | Đã mô tả trong ADR-03/10 | Quét tự động gián đoạn khi mất WAN; nếu chỉ lặp lại mô tả này thì chưa làm rõ phần cải tiến M2 |
| **R1 — đề xuất cho phạm vi M2 vừa sức** | Bổ sung tra cứu trạng thái theo eventId, journal metadata request chờ ở kiosk khi cần, watchdog/worker đối soát, phản hồi offline rõ ràng và quy trình MANUAL có truy vết | Giữ mô hình trung tâm và chính sách không tự mở offline | Phục hồi giao dịch đã tiếp nhận, giảm nhập trùng và mất dấu vết; không cung cấp quét tự động liên tục khi WAN đứt |
| **R2 — mở rộng hoạt động tự động tại nhà máy** | Edge Agent, SQLite cục bộ, chính sách quyền/QR offline, đồng bộ và đối soát về trung tâm | Thay đổi allocation view, ADR-10 và ranh giới transaction | Tăng code, cài đặt, quản lý khóa/thiết bị, dữ liệu stale và khó chống replay xuyên nhà máy |

**R1 nên cụ thể hóa thành hành vi kiểm thử được:**

1. Kiosk tạo eventId trước POST; nếu cần phục hồi sau reload, lưu metadata tối thiểu của request đang chờ vào IndexedDB, không lưu raw QR hoặc toàn bộ hồ sơ nhân viên như một database cục bộ.
2. Nếu mất phản hồi, kiosk hiển thị “chưa xác định”, không tự kết luận đã ghi công hoặc quét lại bằng ID mới.
3. Khi kết nối lại, xác thực trạm rồi **GET trạng thái eventId**. Nếu server đã nhận thì đọc kết quả cũ; nếu không tìm thấy, không tự phát lệnh mở từ dữ liệu cũ — yêu cầu quét mới khi còn hiện diện hoặc chuyển quy trình SEC/HR.
4. Backend watchdog tìm DISPATCHING/UNKNOWN và các job chưa xong; đối soát theo contract TCS/HRS. PREPARED quá hạn không được mở muộn.
5. Nếu server chưa tiếp nhận được lượt nào khi mất mạng, chỉ có hồ sơ sự cố/metadata chưa xác minh; HR nhập bù sau đối chiếu với nguồn MANUAL, phân biệt giờ xảy ra và giờ nhập.

IndexedDB có thể hỗ trợ journal phía trình duyệt, nhưng storage mặc định có giới hạn và có thể bị thu hồi; xin persistent storage cũng không ngăn người dùng xóa dữ liệu. Vì vậy, journal này là hỗ trợ phục hồi, không đủ làm căn cứ cam kết “không mất chấm công trong mọi sự cố”. [MDN — Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

**Nếu chọn R2:** Edge mới có quyền xác thực/điều phối tại nhà máy và lưu bền vững trước tác động cổng; browser vẫn không tự giữ private key hoặc quyền điều khiển tùy ý. Cần quy định thời gian quyền cache còn được tin cậy, thu hồi khi offline, độ lệch đồng hồ, token replay giữa nhiều edge, dung lượng đệm và thứ tự đồng bộ. Transaction GATE–ATT–IAM ở trung tâm không thể tự bao trùm một DB edge bị ngắt mạng; phải thiết kế đồng bộ idempotent và đối soát riêng. QR chỉ được cấp khi điện thoại truy cập được Issuer cũng là một giới hạn availability cần nói rõ.

**Lựa chọn khuyến nghị:** Thực hiện R1 và QR ngắn hạn trong phạm vi module chính; đưa R2 thành phương án mở rộng có sơ đồ và đánh đổi nếu nhóm chưa đủ thời gian hiện thực. Trong báo cáo, ghi đúng “phục hồi giao dịch khi mất kết nối” hoặc “tiếp tục tự động khi mất WAN”, vì đây là hai mức chức năng khác nhau. [Yêu cầu vấn đề M2, trang 2](SA_CC_hk261_Assignment_M2.pdf#page=2).

## 10. API và tích hợp: hợp đồng cần chốt trước khi code

### 10.1. Các endpoint đề xuất

| Nhóm | API minh họa | Quy tắc chính |
|---|---|---|
| IAM | POST /api/auth/login; POST /api/auth/logout; GET /api/me | Phiên thật; cookie/CSRF theo cách triển khai; danh tính và quyền từ server |
| EQR | GET /api/me/qr; /api/employees; /api/employees/:id/access-grants | Cấp QR cần đăng nhập; cập nhật/thu hồi do role và scope thích hợp |
| Kiosk | POST /api/kiosk/access-attempts | Body gồm eventId, token, protocolVersion; station/gate/direction xác minh theo thiết bị và cấu hình server |
| Kiosk | GET /api/kiosk/access-attempts/:eventId | Chỉ trạm tạo yêu cầu hoặc người có quyền được đọc; endpoint chỉ tra cứu, không mở cổng |
| TCS callback | POST /api/integrations/tcs/events | Xác thực hệ thống gửi, kiểm tra trùng và trạng thái; đường dẫn/contract phụ thuộc vendor |
| SEC | /api/gate-reconciliations | Ghi bằng chứng/lý do, scope nhà máy, version; không sửa trạng thái tùy ý ngoài use case |
| ATT | GET /api/attendance/events; POST /api/attendance/corrections | Query theo quyền; correction có expectedVersion/lý do và audit |
| RPT | GET /api/reports/monthly; POST /api/hr-exports; GET /api/hr-exports/:batchId | Bảo vệ quyền xuất, jobKey/idempotency, snapshot và trạng thái ACK |

GET /api/me/qr là lấy mã mới để hiển thị trong thiết kế này, cần chỉ định Cache-Control thích hợp để không cache token nhạy cảm. Nhóm cũng có thể dùng POST cho thao tác phát hành token; chọn một contract và tài liệu hóa rõ trước khi frontend tích hợp.

Phản hồi quét nên giữ các trường spec đã có: eventId, decision, commandState, attendanceState, reasonCode, correlationId. HTTP 409 dùng cho cùng ID/khác nội dung; lỗi auth/quyền và lỗi nghiệp vụ cần phân biệt. Tránh chỉ trả allowed=true/false vì không thể diễn đạt trường hợp được phép nhưng chưa biết cổng đã mở chưa.

### 10.2. Simulator là phần rất đáng đầu tư

| Simulator | Chế độ tối thiểu nên tạo |
|---|---|
| TCS | Mở thành công; từ chối; chậm; chỉ ACK đã nhận; mở xong rồi mất phản hồi; callback trùng/sai thứ tự; đóng thất bại; status có/không hỗ trợ |
| HRS | Nhận đúng lô; nhận xong mất ACK; từ chối định dạng; lỗi 5xx; nhận một phần; đọc lại trạng thái; xử lý cùng batchId và phiên bản thay thế |

Simulator phải ghi nhận số lần nhận command/batch để kiểm tra tác động lặp, không chỉ trả mã HTTP. TCS/HRS thật và simulator cần cùng vượt qua contract tests có ý nghĩa về xác nhận, timeout và idempotency. Đây là cách thể hiện Adapter, DIP và LSP rõ hơn việc chỉ mock thành công mọi lời gọi. [Spec §10.1, §11.1](spec.pdf#page=30).

### 10.3. Xuất HR giữ nguyên nguyên tắc M1

Tạo snapshot tháng trước theo timezone nghiệp vụ; batch có ID, kỳ, version, checksum, recordCount và trạng thái. Cùng nội dung retry giữ batchId; dữ liệu đổi tạo version mới và supersedesBatchId. Định nghĩa cách sắp xếp/chuẩn hóa payload trước khi tính checksum để cùng dữ liệu không cho ra mã khác do thứ tự trường.

HRS phải xác nhận kết quả xử lý khớp kỳ/phiên bản/checksum/số lượng theo contract; HTTP 2xx không tự đồng nghĩa đã sẵn sàng đối soát. Lỗi tạm thời retry có giới hạn; mất ACK ưu tiên status; lỗi định dạng/quyền chuyển người phụ trách. HRS thiếu idempotency hoặc status phải được ghi thành giới hạn tích hợp, không thể sửa hoàn toàn bằng một UNIQUE cục bộ.

Mốc bắt buộc là **trước 12:00 ngày 1 hằng tháng**. Spec đề xuất khởi chạy 01:00, retry 1/5/15/30 phút, tăng cảnh báo lúc 09:00/11:00 và mục tiêu nội bộ 11:30; các con số nội bộ cần được giữ hoặc điều chỉnh có giải thích trong M2. [Spec §7.4, trang PDF 24–25](spec.pdf#page=24).

## 11. Deployment: môi trường demo gọn và tái tạo được

### 11.1. Thành phần triển khai đề xuất

| Thành phần | Cách chạy ban đầu | Khi nào cần nâng cấp? |
|---|---|---|
| Frontend | Tiếp tục dev server hiện có khi phát triển; build static khi đóng gói | Khi demo tích hợp thì cấu hình /api proxy hoặc base URL và cookie phù hợp |
| Backend API | Một service NestJS | Thêm process/replica sau khi đo và kiểm chứng claim/concurrency |
| Worker | Cùng codebase; có thể cùng process lúc đầu, giới hạn concurrency | Tách process khi báo cáo/xuất gây chậm luồng kiosk; không cần tách thành microservice nghiệp vụ |
| PostgreSQL | Một DB có volume; migration/seed khi dựng môi trường | Backup/PITR; replica/failover chỉ khi mục tiêu và phạm vi thực sự yêu cầu |
| TCS/HRS simulators | Service riêng hoặc process test riêng, chọn tình huống qua cấu hình | Thay adapter bằng API thật khi có contract/thiết bị; giữ simulator để chạy test |
| Reverse proxy | Nginx hoặc proxy tương đương khi đóng gói web và /api cùng origin | HTTPS và topology đúng môi trường; demo local không chứng minh VPN/TLS production đã sẵn sàng |
| Edge Agent + SQLite | Chỉ khi chọn R2 | Có cài đặt, quản trị, local storage, sync và policy offline riêng |

Docker Compose phù hợp việc mô tả và chia sẻ môi trường nhiều service để phát triển/kiểm thử; đây là công cụ đóng gói, không tự cung cấp HA, backup hoặc bảo đảm hiệu năng. [Docker — Why use Compose?](https://docs.docker.com/compose/intro/features-uses/).

Nếu bổ sung SQLite cho edge, database đặt trên ổ đĩa cục bộ của node đó; SQLite WAL yêu cầu các process dùng cùng database ở cùng host, không phải cách đặt một file DB dùng chung qua network filesystem. [SQLite — WAL](https://www.sqlite.org/wal.html).

### 11.2. Allocation view minh họa

~~~mermaid
flowchart TB
    subgraph BD["Nhà máy Bình Dương"]
        KBD["Kiosk browser + scanner USB"]
        TBD["TCS / Cổng Bình Dương"]
    end
    subgraph LA["Nhà máy Long An"]
        KLA["Kiosk browser + scanner USB"]
        TLA["TCS / Cổng Long An"]
    end
    subgraph CENTRAL["Máy chủ trung tâm / môi trường demo"]
        PROXY["Reverse proxy + React static build"]
        API["NestJS API<br/>IAM / EQR / GATE / ATT / RPT / CFG"]
        WORK["Worker<br/>Cùng codebase; tách process khi cần"]
        DB[("PostgreSQL")]
        BACKUP["Kho backup / WAL<br/>Tách khỏi máy DB khi kiểm chứng phục hồi"]
        PROXY --> API
        API --> DB
        WORK --> DB
        DB -.-> BACKUP
    end
    KBD -->|"HTTPS qua mạng đã xác thực"| PROXY
    KLA -->|"HTTPS qua mạng đã xác thực"| PROXY
    USERS["EMP mobile web<br/>Portal HR / SUP / SEC / ADM / EXE"] --> PROXY
    API -->|"Turnstile Adapter"| TBD
    API -->|"Turnstile Adapter"| TLA
    WORK -->|"HrExporter"| HRS["HRS / HRS simulator"]
~~~

Hình giữ cấu trúc cơ sở M1 và minh họa trường hợp worker tách process. Trong development có thể chưa có reverse proxy; môi trường chấm bài cần mô tả đúng thành phần thực chạy. Nếu chọn R2, thêm edge/local DB ở từng nhà máy và sửa lại đường điều khiển TCS, luồng đồng bộ, sơ đồ hành vi và các ADR tương ứng.

### 11.3. Thành phần chỉ nên thêm khi có lý do

| Công nghệ/giải pháp | Khi nào mới đáng bổ sung? |
|---|---|
| Redis / BullMQ | Khi DB jobs hiện tại không đáp ứng nhu cầu đã đo hoặc nhóm có lý do vận hành rõ ràng; cần cập nhật ADR-07 và giải quyết tính nhất quán DB–queue |
| RabbitMQ / Kafka | Có luồng sự kiện/phân phối tới nhiều consumer hoặc nhu cầu độc lập đã chứng minh; bài hiện tại chưa đòi kiến trúc phân tán này |
| Kubernetes | Cần vận hành nhiều service/replica và nhóm có nguồn lực quản trị; Docker Compose đủ cho môi trường demo ban đầu |
| WebSocket | Có nhu cầu push trạng thái rõ ràng; polling có kiểm soát cho attempt/report có thể đủ ở giai đoạn đầu |
| Redux/Zustand | State UI phát sinh độ phức tạp thật; dữ liệu server đã có TanStack Query, session UI có thể dùng context nhỏ |
| Mobile native, sinh trắc học, GPS, tính lương | Không phải phần cần thêm để hoàn thành phạm vi đang xét; các mục ngoài scope M1 cần quyết định riêng |

## 12. Kiểm thử: công nghệ nào kiểm chứng yêu cầu nào?

### 12.1. Bộ công cụ đề xuất

| Cấp kiểm thử | Công cụ | Nội dung đáng kiểm tra |
|---|---|---|
| Unit | Jest cho backend; Vitest/React Testing Library nếu cần test component | Policy QR/quyền, chuyển trạng thái, ghép IN/OUT, xử lý version và render trạng thái quan trọng |
| Integration DB | Jest + PostgreSQL thật trong Compose hoặc test container | UNIQUE, transaction rollback, CAS, claim nhiều worker, audit nguyên tử; không dùng SQLite để suy ra mọi hành vi PostgreSQL |
| Contract | Jest + TCS/HRS simulator | Cùng ngữ nghĩa adapter, ACK, timeout, callback, idempotency và mapping lỗi |
| API | Supertest hoặc HTTP client trong test runner | Auth/session, role/scope, validation, 409, eventId/status và correction conflict |
| UI end-to-end | Playwright | EMP lấy QR → kiosk quét → kết quả/công → SEC đối soát; luồng HR xuất nếu đã code |
| Load | k6 + số đo frontend/kiosk | 800 lượt/30 phút/nhà máy, dồn tải, phản hồi kiosk, report/export đồng thời và tỷ lệ lỗi |
| Fault/recovery | Điều khiển simulator, dừng/restart process, diễn tập DB restore | TCS đã mở nhưng mất phản hồi, crash sau DISPATCHING, mất ACK HRS, phục hồi từ backup |

Nest có công cụ kiểm thử và ví dụ dùng Jest/Supertest; Playwright phù hợp tự động hóa luồng trình duyệt. [Nest — Testing](https://docs.nestjs.com/fundamentals/testing), [Playwright — Writing Tests](https://playwright.dev/docs/writing-tests). Các scenario trong bảng là đề xuất cho TMC, không phải tiêu chí do các thư viện quy định.

### 12.2. Ưu tiên theo kế hoạch VT trong M1

| Kịch bản M1 | Bằng chứng M2 nên lưu |
|---|---|
| VT-01/02 — tải cơ sở và dồn tải | Cấu hình máy, phiên bản code, DB/network/TCS mode; latency max, p50/p95/p99, số lỗi, UNKNOWN và số mở thành công |
| VT-03 — request trùng/xung đột | Một quyền gửi OPEN, tối đa một lượt công; cùng ID khác payload trả 409; có test song song |
| VT-04/05 — crash, mất phản hồi, callback | Bản ghi trước/sau restart; không mở lại chỉ vì chưa nhận ACK; công chỉ được xác nhận từ nguồn hợp lệ |
| VT-06 — khoảng hiện diện/correction | 08–12 và 13–17 thành 8 giờ; qua đêm/qua tháng; conflict khi hai HR sửa cùng version |
| VT-07 — xuất HRS | Snapshot/checksum đúng, cùng batch không cộng lặp, thay version đúng, biết trường hợp partial/timeout |
| VT-08/09 — quyền và audit | Gọi API vượt role/nhà máy/tổ bị từ chối; thay đổi và audit nguyên tử; không có raw token trong log |
| VT-10 — backup/restore | Ghi thời điểm dữ liệu cuối và thời gian phục hồi; so với mục tiêu RPO/RTO do nhóm đặt; đối soát trạng thái ngoài DB |
| VT-11 — adapter và module boundary | Contract tests, kiểm tra import không vòng, module không gọi repository nội bộ của nhau |
| VT-12 — mất WAN/DB và nhập bù | Hồ sơ sự cố, nguồn MANUAL, giờ xảy ra/giờ nhập riêng, người xử lý và audit |

[Kế hoạch VT-01 đến VT-12 trong spec, trang PDF 33–34](spec.pdf#page=33). Thêm test cho QR ngắn hạn, jti replay và phục hồi eventId vì đây là thay đổi đề xuất cho M2. Những mục ngoài module được triển khai cần ghi rõ “đã thiết kế/chưa kiểm thử bằng code”, không đánh dấu đạt thay cho bằng chứng.

**Đo 2 giây đúng phạm vi:** Spec định nghĩa từ lúc kiosk nhận đủ QR đến khi hiển thị kết quả; tải backend đơn thuần không gồm toàn bộ thời gian này. k6 đo phần HTTP/backend và tải, còn UI/device instrumentation bổ sung thời gian decode/hiển thị và đường mạng thực. Báo cáo giá trị lớn nhất bên cạnh các phân vị; p95 ≤ 2 giây không đủ thay yêu cầu từng phản hồi trong kịch bản cơ sở. k6 hỗ trợ threshold và custom metric để mã hóa điều kiện pass/fail. [Spec §3.2, §11.1](spec.pdf#page=15), [k6 — Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/).

**Ngân sách tham khảo từ M1:** 300 ms kiosk/mạng + 200 ms xác thực + 200 ms lưu/claim + 900 ms TCS + 200 ms hoàn tất + 200 ms dự phòng = 2.000 ms. Đây là phân bổ thiết kế cần đo lại. Phản hồi UNKNOWN nhanh có thể đúng về deadline, nhưng nếu hầu hết lượt đều UNKNOWN thì không thể chỉ dựa vào latency để kết luận nghiệp vụ đã đạt.

## 13. Lộ trình M2: làm đến đâu là có bài hoàn chỉnh?

### 13.1. Phạm vi code khuyến nghị

**[ĐỀ M2]** Task 2 yêu cầu triển khai **ít nhất một module chính**, code tuân thủ SOLID; phần thiết kế vẫn phải có đầy đủ các views, giải pháp cho hai vấn đề và reflection. [M2, trang 3](SA_CC_hk261_Assignment_M2.pdf#page=3).

**[ĐỀ XUẤT]** Chọn **GATE / Attendance Access Processing** làm module chính. Hiện thực phần EQR, IAM và ATT cần thiết để luồng này chạy được; không cần toàn bộ màn CRUD của sáu module trước khi có một luồng hoàn chỉnh.

| Giai đoạn | Công việc | Tiêu chí hoàn thành |
|---|---|---|
| **Bước 1 — Chốt nền** | Giữ frontend; thêm backend; pin bộ dependency tương thích; PostgreSQL, migration và seed | Clone/cài theo hướng dẫn, chạy được một API kết nối DB; có migration và integration test transaction |
| **Bước 2 — Hợp đồng và quyền** | OpenAPI, device identity, role/scope, session; mô hình attempt/command/event | Frontend và backend thống nhất DTO; dữ liệu trạm/quyền không tin từ client; có audit cơ bản |
| **Bước 3 — Luồng thành công** | EQR verify, GATE prepare/claim, TCS simulator, ATT confirm/UoW | EMP quét hợp lệ, cổng được xử lý, công/audit đúng nguồn và không ghi trùng |
| **Bước 4 — Lỗi và M2** | UNKNOWN/reconcile, crash/restart, R1 mất kết nối, QR ngắn hạn/replay | Chứng minh được các tình huống lỗi quan trọng; không tự mở muộn hoặc phát lệnh lặp |
| **Bước 5 — Chức năng kế tiếp** | Correction, interval/report và xuất HRS theo nguồn lực; simulator HRS | Nếu code RPT thì snapshot/ACK/retry đúng; nếu chưa code phải có thiết kế/giới hạn rõ trong báo cáo |
| **Bước 6 — Kiểm chứng và bàn giao** | Load, quyền, contract, bằng chứng; cập nhật views/ADR, SOLID reflection và README | Báo cáo khớp code; GitHub URL có trong báo cáo nộp LMS; người chấm chạy lại được phạm vi công bố |

Những việc như báo cáo, export HRS và phục hồi vẫn thuộc thiết kế hệ thống; việc chọn một module code không loại bỏ chúng khỏi phân tích kiến trúc. Visitor management, tính lương và phần cứng/thoát hiểm theo scope M1 không trở thành hạng mục phải lập trình thêm.

### 13.2. Checklist kỹ thuật trước khi nộp

- [ ] Chốt runtime và dependency bằng lockfile; ghi rõ cách build, migration, seed và chạy demo.
- [ ] Có một module chính hoạt động thật theo use case đã công bố, không chỉ dữ liệu localStorage.
- [ ] Nhận diện rõ sáu module M1; module view khớp code và interface công khai.
- [ ] Có component-and-connector view cho luồng quét/lỗi; allocation view phản ánh môi trường thực chạy.
- [ ] Lưu yêu cầu trước khi mở; UNIQUE/requestHash/CAS/sourceId có kiểm chứng đồng thời.
- [ ] Phân biệt ALLOW, kết quả cổng và công chính thức; có UNKNOWN và đường đối soát.
- [ ] Không giữ DB transaction chờ TCS/HRS; các ghi liên quan dùng cùng transaction context.
- [ ] Bảo vệ QR và mất kết nối có giải pháp, vị trí tích hợp, test/bằng chứng hoặc giới hạn hiện thực rõ ràng.
- [ ] Quyền và phạm vi thực thi ở server; audit và thay đổi nhạy cảm được commit cùng nhau.
- [ ] Simulator thể hiện mất ACK/tác động đã xảy ra; không chỉ mô phỏng thành công.
- [ ] Số liệu hiệu năng ghi môi trường, biên đo và latency max; không trình bày giả định M1 thành kết quả thực đo.
- [ ] Có giải thích SOLID gắn code và reflection về việc thật đã làm, gồm khó khăn/đánh đổi.
- [ ] Nếu đã code export: theo dõi ACK nội dung và mốc trước 12:00 ngày 1, cùng ID khi retry, version mới khi dữ liệu đổi.
- [ ] Báo cáo M2 có GitHub URL; source, sơ đồ, dữ liệu demo và hướng dẫn chạy đối chiếu được với nhau.

## 14. Những quyết định cần ghi vào báo cáo M2

### 14.1. Bảng cập nhật ADR

| ADR/nội dung | Hành động đề xuất cho M2 |
|---|---|
| ADR-01 — Modular monolith | Giữ; bổ sung ánh xạ Nest modules, public ports và quy tắc import |
| ADR-02 — PostgreSQL và chống trùng | Giữ; cụ thể hóa TypeORM/UoW, migration, constraint, transaction và cấu hình độ bền |
| ADR-03 — Lưu trước mở, UNKNOWN | Giữ; có code CAS, crash recovery, deadline và quy trình đối soát có quyền |
| ADR-04 — QR tĩnh | **Cập nhật hoặc tạo ADR thay thế** cho QR ngắn hạn/replay/thu hồi; nêu ảnh hưởng đến email và hành vi xem QR |
| ADR-05 — Nguồn ghi công, ghép khoảng | Giữ; test evidenceType, nhiều IN/OUT và biên ngày/tháng trong phạm vi code |
| ADR-06 — Export snapshot có version | Giữ; hiện thực hoặc mô tả contract HRS và giới hạn phần chưa code |
| ADR-07 — Adapter và DB jobs | Giữ; bổ sung Outbox/claim/retry và kiểm chứng simulator |
| ADR-08/09 — Scope, audit, dữ liệu | Giữ; cụ thể hóa API/query quyền, transaction audit, quyền lưu trữ và các chính sách còn giả định |
| ADR-10 — Online và phục hồi | **Bổ sung** mức R1 được chọn; nếu chọn R2, cập nhật node edge, local DB, đồng bộ và giới hạn quyền offline |
| ADR mới — Stack/backend | Ghi lý do chọn React hiện có + NestJS/TypeORM, phương án thay thế và bộ version thực đã kiểm chứng |

### 14.2. Bản đồ tra cứu nhanh

| Nội dung | Nguồn chính |
|---|---|
| Phạm vi, actors, timezone và giả định | [Spec §1, PDF 8–10](spec.pdf#page=8) |
| FR/NFR, use cases và kịch bản chất lượng | [Spec §2–3, PDF 10–15](spec.pdf#page=10) |
| Lựa chọn architecture và sáu module | [Spec §4–5, PDF 15–19](spec.pdf#page=15) |
| Dữ liệu, kiosk/TCS/HRS và state machine | [Spec §6–7, PDF 19–25](spec.pdf#page=19) |
| Deployment, PostgreSQL, backup và ADR | [Spec §8–9, PDF 25–30](spec.pdf#page=25) |
| SOLID, role/scope và audit | [Spec §10, PDF 30–32](spec.pdf#page=30) |
| VT-01…VT-12, truy vết và rủi ro | [Spec §11, PDF 33–36](spec.pdf#page=33) |
| Hai vấn đề mới, views, reflection và code ≥ 1 module | [Đề M2, PDF 2–3](SA_CC_hk261_Assignment_M2.pdf#page=2) |

Các nguồn công nghệ chính thức được dẫn ngay tại phần liên quan. Lý do chọn stack, ưu tiên triển khai và cách ghép patterns trong tài liệu là **phân tích đề xuất cho nhóm**, không phải quy định bắt buộc của giảng viên hoặc kết quả benchmark đã có.

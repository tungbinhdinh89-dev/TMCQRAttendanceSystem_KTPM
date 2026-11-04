# Structure Architecture — Clean Architecture cho client/ và api/

**Stack thống nhất:** Frontend **React + TypeScript + Vite** trong **client/**; backend **Node.js + NestJS + TypeScript + TypeORM + PostgreSQL** trong **api/**, đúng hướng lựa chọn trong [teach-stack.md](teach-stack.md). Backend giữ modular monolith và sáu module M1.

**Phạm vi tài liệu:** Cây thư mục, trách nhiệm, chiều import, interface và wiring mẫu để hình dung trước khi tạo skeleton source. Cấu trúc bên dưới là thiết kế đích; source hiện tại chưa được di chuyển hoặc sinh thêm ứng dụng trong lần cập nhật tài liệu này.

**Căn cứ nghiệp vụ:** [spec.pdf](spec.pdf), đặc biệt §5–7 về module và luồng cổng; [đề M2](SA_CC_hk261_Assignment_M2.pdf). Các lựa chọn kỹ thuật cụ thể trong tài liệu là cách hiện thực đề xuất, không thay các yêu cầu nghiệp vụ của đề.

## 1. Tên client/ và api/ có phù hợp không?

**Phù hợp.** client/ và api/ là hai thư mục ngang hàng, mỗi thư mục là một ứng dụng có package.json, src và cấu hình build riêng.

| Thư mục | Chứa gì? | Cách hiểu |
|---|---|---|
| client/ | Toàn bộ frontend React: source, public, index.html, Vite config, dependencies | client/src là mã frontend |
| api/ | Toàn bộ backend NestJS: domain, use case, adapter, controller, migrations, tests | api/src là mã backend; thư mục api không chỉ chứa controller |
| doc/ | Đề, báo cáo và tài liệu thiết kế | Dùng chung cho cả dự án |

Không cần thêm tầng client/frontend hoặc api/backend khi mỗi bên chỉ có một ứng dụng. Tên client/api mô tả hai ứng dụng; Domain/Application/Infrastructure/Presentation là các lớp **bên trong** ứng dụng, không phải những server bắt buộc chạy riêng.

### 1.1. Nguyên tắc Clean Architecture

| Lớp | Trách nhiệm | Ví dụ TMC |
|---|---|---|
| **Domain** | Mô hình, trạng thái và quy tắc thuần | GateCommand, AttendanceEvent, policy chuyển trạng thái |
| **Application** | Điều phối use case và định nghĩa port | SubmitQrScan ở FE; ScanQrUseCase, UnitOfWork, TurnstileGateway ở BE |
| **Infrastructure** | Triển khai port bằng công nghệ cụ thể | Fetch/IndexedDB ở FE; TypeORM, PostgreSQL, TCS/HRS HTTP adapters ở BE |
| **Presentation** | Nhận input và chuyển đổi output ở biên | React page/hook; Nest controller/guard/DTO |
| **Composition root** | Nối port với implementation | client/src/app/bootstrap; api/src/bootstrap và app.module.ts |

**Chiều import:** Presentation → Application → Domain; Infrastructure → Application/Domain. Composition root được biết các lớp để nối chúng lại. Application gọi port mà không import adapter thực tế.

NestJS cung cấp modules/providers/DI để tổ chức ứng dụng; cấu trúc Clean Architecture bên dưới là quy ước thiết kế của dự án, không phải một cây thư mục duy nhất do Nest bắt buộc. Trong skeleton này, class domain và use case thuần không import @nestjs/*, typeorm, HTTP request hoặc DTO có decorators. [Nest — Modules](https://docs.nestjs.com/modules), [Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers).

**FE và BE có trách nhiệm khác nhau:** Domain frontend chỉ phục vụ mô hình/trạng thái và quy tắc thao tác UI. Backend quyết định quyền, QR hợp lệ, điều khiển cổng và ghi công. Kiểm tra phía FE không thay authorization phía server.

## 2. Cấu trúc tổng thể repository

~~~text
TMCQRAttendanceSystem_KTPM/
├─ client/                           # Ứng dụng frontend
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  ├─ index.css
│  │  ├─ app/                        # Bootstrap, providers, router
│  │  ├─ features/                   # Clean Architecture theo feature
│  │  └─ shared/
│  ├─ public/                        # Font và static assets của frontend
│  ├─ index.html
│  ├─ package.json                   # Đề xuất name: @tmc/client
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ .env.example                   # Cấu hình public như API base URL
├─ api/                              # Ứng dụng backend NestJS
│  ├─ src/
│  │  ├─ main.ts                     # HTTP bootstrap
│  │  ├─ app.module.ts               # Root Nest module
│  │  ├─ worker.ts                   # Tùy chọn: entry point process nền
│  │  ├─ bootstrap/                  # DI bindings, modules, tokens
│  │  ├─ modules/                    # IAM / EQR / GATE / ATT / RPT / CFG
│  │  └─ platform/                   # Transaction, clock, jobs, logging
│  ├─ test/
│  ├─ simulators/                    # TCS/HRS giả lập khi hiện thực
│  ├─ package.json                   # Đề xuất name: @tmc/api
│  ├─ nest-cli.json
│  ├─ tsconfig.json
│  ├─ tsconfig.build.json
│  └─ .env.example                   # DB, integration và secret references
├─ doc/
│  ├─ teach-stack.md
│  ├─ structure-architecture.md
│  └─ explain-detail.md
├─ package.json                      # Nếu dùng workspace: scripts quản lý hai app
├─ pnpm-workspace.yaml               # Đề xuất quản lý client + api
├─ pnpm-lock.yaml                    # Một lockfile chung theo cấu hình workspace
├─ .mise.toml                        # Toolchain dùng chung
├─ compose.yaml                      # Đề xuất môi trường tích hợp
└─ .gitignore
~~~

Root package.json phục vụ quản lý repository/workspace; dependencies chạy frontend đặt tại client/package.json, dependencies backend tại api/package.json. Root không trở thành ứng dụng React hoặc NestJS thứ ba.

**Đề xuất workspace pnpm** vì repo đã dùng pnpm: khai báo hai package bằng cấu hình tối thiểu dưới đây. Đây là cấu hình dự kiến, chưa được tạo trong workspace hiện tại. [pnpm — Workspace](https://pnpm.io/workspaces).

~~~yaml
packages:
  - client
  - api
~~~

Frontend và backend trao đổi qua HTTP contract. client không import api/src hoặc entity TypeORM. Nếu cần dùng chung contract về sau, có thể tạo package DTO/schema thuần riêng; không cần thêm package này ngay từ skeleton.

### 2.1. Ánh xạ sáu module M1

| Mã M1 | Module trong api/src/modules | Feature trong client/src/features | Phạm vi |
|---|---|---|---|
| IAM | iam | iam | Phiên, tài khoản, vai trò/phạm vi và audit |
| EQR | eqr | eqr | Nhân viên, QR và quyền nhà máy |
| GATE | gate | gate | Trạm, lượt quét, lệnh cổng, đối soát UNKNOWN |
| ATT | att | attendance | Sự kiện công, khoảng hiện diện, correction |
| RPT | rpt | reports | Báo cáo, snapshot và xuất HRS |
| CFG | cfg | configuration | Cơ cấu tổ chức và cấu hình |

GATE dùng public API của EQR/ATT/IAM/CFG khi cần; RPT đọc dữ liệu qua public API ATT/EQR/CFG và kiểm tra quyền IAM. ATT không import ngược GATE chỉ để lưu sourceId. [Spec §5.1–5.3, trang PDF 17–18](spec.pdf#page=17).

## 3. Frontend skeleton — tổ chức theo feature

### 3.1. Cây thư mục

~~~text
client/src/
├─ main.tsx
├─ App.tsx
├─ index.css
├─ app/
│  ├─ bootstrap/
│  │  ├─ createHttpClient.ts          # Khởi tạo HTTP adapter dùng chung
│  │  ├─ createGateDependencies.ts    # Repository -> use cases cho gate
│  │  └─ createEqrDependencies.ts     # Wiring tương tự khi cần
│  ├─ providers/
│  │  └─ AppProviders.tsx             # Theme, QueryClient, session, feature providers
│  ├─ router/
│  │  ├─ AppRouter.tsx
│  │  ├─ routes.tsx
│  │  └─ RouteGuard.tsx               # Điều hướng UI theo phiên/quyền đã nhận
│  ├─ layouts/
│  │  ├─ PortalLayout.tsx
│  │  ├─ EmployeeLayout.tsx
│  │  └─ KioskLayout.tsx
│  └─ config/
│     └─ env.ts                      # Đọc VITE_* ở biên ứng dụng
├─ features/
│  ├─ gate/                          # Feature mẫu, mở rộng cấu trúc cho feature khác
│  │  ├─ domain/
│  │  │  ├─ models/
│  │  │  │  └─ GateAttempt.ts
│  │  │  └─ policies/
│  │  │     └─ canStartNewScan.ts     # Quy tắc thao tác UI, không cấp quyền mở cổng
│  │  ├─ application/
│  │  │  ├─ models/
│  │  │  │  └─ SubmitQrScanInput.ts
│  │  │  ├─ ports/
│  │  │  │  ├─ GateAttemptRepository.ts
│  │  │  │  └─ PendingAttemptJournal.ts
│  │  │  └─ use-cases/
│  │  │     ├─ SubmitQrScan.ts
│  │  │     ├─ GetGateAttemptStatus.ts
│  │  │     └─ RecoverPendingAttempt.ts
│  │  ├─ infrastructure/
│  │  │  ├─ api/
│  │  │  │  ├─ GateApiDto.ts         # Wire types, không dùng làm domain model trực tiếp
│  │  │  │  ├─ GateApiSchemas.ts     # Validate dữ liệu HTTP bằng Zod nếu chọn
│  │  │  │  ├─ GateDtoMapper.ts
│  │  │  │  └─ HttpGateAttemptRepository.ts
│  │  │  └─ persistence/
│  │  │     └─ IndexedDbPendingAttemptJournal.ts
│  │  ├─ presentation/
│  │  │  ├─ pages/
│  │  │  │  ├─ KioskPage.tsx
│  │  │  │  └─ GateReconciliationPage.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ QrScannerInput.tsx
│  │  │  │  └─ AttemptStatusCard.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useSubmitQrScan.ts
│  │  │  │  └─ useGateAttemptStatus.ts
│  │  │  ├─ providers/
│  │  │  │  └─ GateDependenciesProvider.tsx
│  │  │  └─ view-models/
│  │  │     └─ GateAttemptViewModel.ts
│  │  └─ index.ts                   # Chỉ export public API đã chọn
│  ├─ iam/                          # domain/application/infrastructure/presentation
│  ├─ eqr/                          # Nhân viên, trang lấy/hiển thị QR
│  ├─ attendance/                   # Lịch sử và yêu cầu hiệu chỉnh
│  ├─ reports/                      # Báo cáo, theo dõi export batch
│  ├─ configuration/                # Cơ cấu, trạm và cấu hình theo quyền
│  └─ public/                       # Landing/error pages; có thể chỉ cần presentation
└─ shared/
   ├─ domain/
   │  └─ AppError.ts                # Kiểu lỗi thuần, không phụ thuộc HTTP
   ├─ application/
   │  └─ ports/
   │     └─ Clock.ts                # Chỉ thêm abstraction khi có nhu cầu thay thế/test
   ├─ infrastructure/
   │  └─ http/
   │     ├─ HttpClient.ts
   │     ├─ FetchHttpClient.ts       # fetch, cookie/CSRF, timeout và parsing
   │     └─ ApiProblemMapper.ts
   └─ presentation/
      ├─ components/                # Button/table/dialog dùng chung
      ├─ hooks/                     # Hook UI tổng quát, không import feature
      └─ formatting/                # Hiển thị giờ/múi giờ, nhãn giao diện
~~~

Các feature IAM/EQR/ATT/RPT/CFG lặp lại nguyên tắc phân lớp của gate khi có use case cần tách; không cần tạo thư mục rỗng hoặc các class trung gian cho mọi trang tĩnh. Component React dùng default export theo quy ước repo.

### 3.2. Vai trò của từng lớp frontend

| Vị trí | Được chứa | Không đặt ở đây |
|---|---|---|
| domain | Type/model thuần, trạng thái và policy UI | React, MUI, fetch, React Query, window/localStorage |
| application | Use case, port repository/journal, input/output nội bộ | useState/useMutation, URL endpoint, JSON DTO backend, thư viện IndexedDB |
| infrastructure | HTTP DTO/schema/mapper, repository và journal adapter | Quyết định cấp quyền, tính công chính thức hoặc điều khiển trực tiếp TCS |
| presentation | Page, component, hook React Query, view model, feature provider | SQL, secret, thuật toán ký QR, mở cổng từ browser |
| app/bootstrap | Khởi tạo adapter và use case, chọn cấu hình môi trường | Nghiệp vụ bị dồn vào một file khởi tạo |
| shared | Thành phần dùng chung ở đúng lớp | Import ngược feature hoặc một “database toàn cục” chứa mọi hồ sơ |

Hook React Query nằm ở presentation vì phụ thuộc React và quản lý trạng thái UI. Use case thuần nằm ở application; adapter HTTP nằm ở infrastructure. Các component giữ render thuần, tác động được gọi từ event handler/hook thích hợp. [React — Keeping Components Pure](https://react.dev/learn/keeping-components-pure).

### 3.3. Chiều import frontend

~~~mermaid
flowchart TB
    ROOT["app/bootstrap<br/>Composition root"] --> UI["Feature Presentation<br/>React, MUI, hooks"]
    ROOT --> INF["Feature Infrastructure<br/>HTTP / IndexedDB adapters"]
    ROOT --> APP["Feature Application<br/>Use cases + ports"]
    UI --> APP
    UI --> DOM["Feature Domain<br/>Model / UI policy thuần"]
    APP --> DOM
    INF --> APP
    INF --> DOM
~~~

Mũi tên biểu diễn **import source code**. Lúc chạy, use case gọi port rồi implementation HTTP được thực thi; điều đó không có nghĩa application được import HttpGateAttemptRepository.

Quy ước áp dụng cho skeleton:

- Domain không import lớp bên ngoài; application chỉ dùng domain, port và mã thuần ở lớp tương ứng.
- Presentation gọi use case, không tạo HTTP repository hoặc gọi fetch trực tiếp trong page.
- Infrastructure không import presentation; shared không import features hoặc app.
- app/bootstrap được import implementation để wiring; các feature khác chỉ dùng public API được công bố, không import thư mục nội bộ tùy ý.
- Feature provider nằm trong presentation của feature. AppProviders cấp dependency từ ngoài; hook feature không import ngược app/bootstrap để tự tạo implementation.
- Không re-export infrastructure qua index.ts dùng chung của feature rồi vô tình cho các lớp bên trong truy cập adapter.

### 3.4. Skeleton interface và use case frontend

Ví dụ rút gọn, các phần đặt ở các file đã ghi trong cây thư mục. Cần bổ sung import/type theo module khi hiện thực.

~~~typescript
// domain/models/GateAttempt.ts
export interface GateAttempt {
  eventId: string;
  decision: "ALLOW" | "DENIED";
  commandState: string;
  attendanceState: "NOT_CREATED" | "PROVISIONAL" | "CONFIRMED";
  reasonCode: string;
  correlationId: string;
}

// application/models/SubmitQrScanInput.ts
export interface SubmitQrScanInput {
  eventId: string;
  token: string;
}

// application/ports/GateAttemptRepository.ts
export interface GateAttemptRepository {
  submit(input: SubmitQrScanInput): Promise<GateAttempt>;
  findByEventId(eventId: string): Promise<GateAttempt | null>;
}

// application/use-cases/SubmitQrScan.ts
export class SubmitQrScan {
  constructor(private readonly repository: GateAttemptRepository) {}

  execute(input: SubmitQrScanInput): Promise<GateAttempt> {
    if (!input.eventId || !input.token.trim()) {
      throw new Error("Thiếu eventId hoặc dữ liệu QR.");
    }
    return this.repository.submit(input);
  }
}
~~~

commandState được để string trong skeleton nhằm tránh liệt kê enum chưa chốt. Khi hiện thực cần chuẩn hóa trạng thái và xử lý giá trị API chưa nhận diện; không mặc định giá trị lạ thành đã mở/đã chấm công. Việc kiểm tra token rỗng ở FE chỉ phục vụ thao tác UI; backend vẫn xác thực toàn bộ request. protocolVersion là chi tiết contract HTTP: adapter thêm vào request, không đưa vào use case input thuần.

**Cách nối:** createGateDependencies tạo HttpGateAttemptRepository rồi truyền vào SubmitQrScan/GetGateAttemptStatus. AppProviders cấp các use case qua GateDependenciesProvider. KioskPage gọi useSubmitQrScan, hook này gọi use case; DTO được chuyển thành GateAttempt trong adapter.

Với POST quét QR, đề xuất hook mutation có retry: false và networkMode: "always" để lỗi mạng được trả ngay thay vì giữ mutation offline rồi tự gửi khi online trở lại. Không persist/resume mutation điều khiển cổng chung với mutation CRUD. Khôi phục bằng use case GET trạng thái theo eventId; request chưa tới server cần quét mới/quy trình hỗ trợ phù hợp. [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode).

## 4. Backend skeleton — NestJS trong api/

### 4.1. Cây thư mục

Tổ chức theo module nghiệp vụ, rồi chia lớp bên trong từng module. Nest module và DI bindings đặt ở bootstrap; entity TypeORM đặt trong infrastructure. Domain entity và use case là TypeScript thuần.

~~~text
api/
├─ package.json
├─ nest-cli.json
├─ tsconfig.json
├─ tsconfig.build.json
├─ .env.example
├─ src/
│  ├─ main.ts                         # Bootstrap HTTP; prefix /api nếu chọn
│  ├─ app.module.ts                   # Root composition module
│  ├─ worker.ts                       # Tùy chọn: bootstrap process nền
│  ├─ bootstrap/
│  │  ├─ modules/
│  │  │  ├─ database.module.ts         # DataSource, UnitOfWork và Clock bindings
│  │  │  ├─ iam.module.ts
│  │  │  ├─ eqr.module.ts
│  │  │  ├─ gate.module.ts
│  │  │  ├─ att.module.ts
│  │  │  ├─ rpt.module.ts
│  │  │  ├─ cfg.module.ts
│  │  │  └─ worker.module.ts          # Tùy chọn: chỉ wiring công việc nền
│  │  ├─ tokens/
│  │  │  ├─ persistence.tokens.ts
│  │  │  ├─ iam.tokens.ts
│  │  │  ├─ eqr.tokens.ts
│  │  │  ├─ gate.tokens.ts
│  │  │  ├─ att.tokens.ts
│  │  │  ├─ rpt.tokens.ts
│  │  │  └─ cfg.tokens.ts
│  │  └─ config/                     # Đọc env, validate cấu hình chạy
│  ├─ modules/
│  │  ├─ gate/                       # Module mẫu đầy đủ bốn lớp
│  │  │  ├─ domain/
│  │  │  │  ├─ entities/
│  │  │  │  │  ├─ access-attempt.ts
│  │  │  │  │  ├─ gate-command.ts
│  │  │  │  │  └─ gate-station.ts
│  │  │  │  ├─ value-objects/
│  │  │  │  │  └─ gate-command-state.ts
│  │  │  │  └─ policies/
│  │  │  │     └─ gate-command-transition.policy.ts
│  │  │  ├─ application/
│  │  │  │  ├─ commands/
│  │  │  │  │  ├─ scan-qr.use-case.ts
│  │  │  │  │  ├─ dispatch-open.use-case.ts
│  │  │  │  │  ├─ complete-gate.use-case.ts
│  │  │  │  │  └─ reconcile-gate.use-case.ts
│  │  │  │  ├─ queries/
│  │  │  │  │  └─ get-attempt-status.query.ts
│  │  │  │  ├─ models/
│  │  │  │  │  ├─ scan-qr.command.ts
│  │  │  │  │  └─ scan-qr.result.ts
│  │  │  │  └─ ports/
│  │  │  │     ├─ access-attempt.repository.ts
│  │  │  │     ├─ gate-command.repository.ts
│  │  │  │     └─ turnstile.gateway.ts
│  │  │  ├─ infrastructure/
│  │  │  │  ├─ persistence/
│  │  │  │  │  ├─ access-attempt.orm-entity.ts
│  │  │  │  │  ├─ gate-command.orm-entity.ts
│  │  │  │  │  ├─ typeorm-access-attempt.repository.ts
│  │  │  │  │  ├─ typeorm-gate-command.repository.ts
│  │  │  │  │  └─ gate-persistence.mapper.ts
│  │  │  │  └─ integrations/
│  │  │  │     └─ turnstile-http.gateway.ts
│  │  │  └─ presentation/
│  │  │     └─ http/
│  │  │        ├─ controllers/
│  │  │        │  ├─ kiosk-access-attempts.controller.ts
│  │  │        │  └─ gate-reconciliation.controller.ts
│  │  │        ├─ dto/
│  │  │        │  ├─ scan-qr.request.dto.ts
│  │  │        │  └─ scan-qr.response.dto.ts
│  │  │        └─ mappers/
│  │  │           └─ gate-http.mapper.ts
│  │  ├─ iam/
│  │  │  ├─ domain/                  # User, RoleAssignment, AuditEntry
│  │  │  ├─ application/
│  │  │  │  ├─ public-api/           # Authorizer, AuditWriter
│  │  │  │  ├─ ports/                # UserRepository, AuditEntryRepository
│  │  │  │  └─ commands/             # Login, Logout, ChangeRole
│  │  │  ├─ infrastructure/          # Persistence/session adapters
│  │  │  └─ presentation/http/       # Auth controllers, guards, identity mapping
│  │  ├─ eqr/
│  │  │  ├─ domain/                  # Employee, QrCredential, AccessGrant
│  │  │  ├─ application/
│  │  │  │  ├─ public-api/           # QrVerifier, EmployeeQuery
│  │  │  │  ├─ ports/                # QrCredentialRepository, QrTokenService
│  │  │  │  └─ commands/             # IssueQr, RevokeQr, UpdateEmployee
│  │  │  ├─ infrastructure/          # TypeORM, jose / SignedQrTokenService
│  │  │  └─ presentation/http/
│  │  ├─ att/
│  │  │  ├─ domain/                  # AttendanceEvent, PresenceInterval, Correction
│  │  │  ├─ application/
│  │  │  │  ├─ public-api/           # AttendanceWriter, AttendanceQuery
│  │  │  │  ├─ ports/                # Event/Correction repositories
│  │  │  │  └─ commands/             # ConfirmAttendance, CorrectAttendance
│  │  │  ├─ infrastructure/
│  │  │  └─ presentation/http/
│  │  ├─ rpt/
│  │  │  ├─ domain/                  # ExportBatch, ExportItem, ExportBatchState
│  │  │  ├─ application/
│  │  │  │  ├─ ports/                # HrExporter, ExportBatchRepository
│  │  │  │  ├─ commands/             # ExportMonth, RetryExport
│  │  │  │  ├─ queries/              # MonthlyReport, ExportStatus
│  │  │  │  └─ jobs/                 # ExportBatchJobHandler
│  │  │  ├─ infrastructure/          # TypeORM / HRS HTTP adapter
│  │  │  └─ presentation/http/
│  │  └─ cfg/
│  │     ├─ domain/                  # Factory, Department, Team, ConfigVersion
│  │     ├─ application/
│  │     │  ├─ public-api/           # ConfigReader
│  │     │  ├─ ports/                # ConfigRepository
│  │     │  └─ commands/             # UpdateConfig / cơ cấu
│  │     ├─ infrastructure/
│  │     └─ presentation/http/
│  └─ platform/
│     ├─ domain/                    # Chỉ các kiểu/rule thuần thật sự dùng chung
│     ├─ application/
│     │  ├─ unit-of-work.ts
│     │  ├─ transaction-context.ts
│     │  ├─ current-actor.ts
│     │  ├─ current-station.ts
│     │  ├─ clock.ts
│     │  └─ jobs/                   # JobStore / JobHandler contracts
│     ├─ infrastructure/
│     │  ├─ database/
│     │  │  ├─ data-source.ts        # TypeORM options/DataSource, CLI migrations
│     │  │  ├─ typeorm-unit-of-work.ts
│     │  │  ├─ typeorm-transaction-context.ts
│     │  │  └─ migrations/
│     │  ├─ jobs/                   # PostgresJobStore, claim/lease storage
│     │  └─ logging/                # Operational logs, redaction
│     └─ presentation/http/
│        ├─ filters/                # Exception -> HTTP error
│        └─ interceptors/           # Correlation ID / vận hành
├─ test/
│  ├─ unit/
│  ├─ integration/
│  ├─ contract/
│  ├─ e2e/
│  └─ architecture/
└─ simulators/
   ├─ tcs/
   └─ hrs/
~~~

**Public API khác port:** public-api là giao diện nghiệp vụ module cung cấp cho module khác, như ATT cung cấp AttendanceWriter. Port là nhu cầu của application đối với hạ tầng, như TurnstileGateway hoặc repository. Public API có thể do application service triển khai; không phải mọi interface đều do Infrastructure triển khai.

**Domain entity khác ORM entity:** GateCommand giữ trạng thái/invariant thuần. GateCommandOrmEntity và mapper giữ decorators, tên bảng, index, quan hệ TypeORM. Không đưa @Entity hoặc @Column vào domain để tiện lưu DB.

**HTTP DTO khác application model:** scan-qr.request.dto.ts ở presentation chứa validation/serialization phù hợp HTTP; ScanQrCommand/ScanQrResult là model thuần phía application. Không truyền Request/Response của Express/Fastify xuống use case.

### 4.2. Quy tắc import backend

| Vị trí | Được import | Giới hạn |
|---|---|---|
| modules/*/domain | Domain nội bộ và platform/domain thuần | Không NestJS, TypeORM, bootstrap, HTTP hoặc application |
| modules/*/application | Domain, port thuần của platform/application, public API application module khác đã cho phép | Không adapter, DataSource, DTO HTTP hoặc Nest decorators |
| modules/*/infrastructure | Port/application, domain, TypeORM/HTTP/crypto libraries | Không controller/presentation; không truy cập bảng module khác tùy tiện |
| modules/*/presentation | Application/public API, framework HTTP, DTO/mappers | Không inject DataSource/repository implementation để bypass use case |
| bootstrap | Các lớp cần wiring, Nest modules/providers/tokens | Không chứa quy trình nghiệp vụ thay cho application |
| platform | Mã dùng chung theo đúng lớp | Không import ngược modules cụ thể; không trở thành service chứa mọi nghiệp vụ |

~~~mermaid
flowchart TB
    BOOT["bootstrap / app.module.ts<br/>Nest DI composition root"] --> UI["Presentation<br/>Controllers / guards / DTO"]
    BOOT --> INF["Infrastructure<br/>TypeORM / HTTP / crypto adapters"]
    BOOT --> APP["Application<br/>Use cases / public API / ports"]
    UI --> APP
    INF --> APP
    APP --> DOM["Domain<br/>Entities / invariants thuần"]
    INF --> DOM
~~~

Folders và TypeScript path aliases không tự chặn import sai. Cần lint/architecture checks để giữ dependency rule và ranh giới module. Trong Nest module, chỉ export các provider thuộc public API được chọn; tránh export toàn bộ repositories ra mọi module. [Nest — Module Encapsulation](https://docs.nestjs.com/modules).

## 5. Skeleton port và DI backend bằng TypeScript

### 5.1. Contract thuần

Mẫu rút gọn theo các file tương ứng trong cây; imports và implementation sẽ được bổ sung khi tạo source.

~~~typescript
// platform/application/transaction-context.ts
export interface TransactionContext {
  readonly transactionId: string;
}

// platform/application/unit-of-work.ts
export interface UnitOfWork {
  execute<T>(
    work: (tx: TransactionContext) => Promise<T>,
  ): Promise<T>;
}

// modules/gate/application/ports/turnstile.gateway.ts
export interface OpenGateRequest {
  commandId: string;
  turnstileId: string;
  deadlineAt: Date;
}

export type OpenGateResult =
  | { kind: "OPEN_CONFIRMED"; vendorRef?: string }
  | { kind: "OPEN_REJECTED"; reason: string }
  | { kind: "UNKNOWN"; reason: string };

export interface TurnstileGateway {
  open(request: OpenGateRequest): Promise<OpenGateResult>;
}

// modules/gate/application/ports/gate-command.repository.ts
export interface GateCommandRepository {
  claimPrepared(
    commandId: string,
    now: Date,
    tx: TransactionContext,
  ): Promise<boolean>;
}
~~~

TransactionContext là hợp đồng thuần, không chứa EntityManager/QueryRunner trong type công khai. Infrastructure tạo context của transaction và lấy đúng manager gắn với context đó; khi context sai/đã kết thúc phải báo lỗi thay vì âm thầm dùng global manager.

UnitOfWork.execute mở transaction ngắn, cấp context cho callback, commit/rollback theo kết quả. Repositories và public API cần cùng transaction như AttendanceWriter/AuditWriter nhận context đó; mỗi implementation dùng cùng transactional manager. Cách cụ thể hóa context có thể điều chỉnh khi hiện thực, nhưng không đưa TypeORM vào application.

### 5.2. Nest provider tạo class use case thuần

TypeScript interface bị xóa ở runtime; dùng Symbol token cho port. Domain/use case không cần @Injectable nếu composition root tạo chúng qua useFactory.

~~~typescript
// bootstrap/tokens/gate.tokens.ts
export const GATE_COMMAND_REPOSITORY = Symbol("GATE_COMMAND_REPOSITORY");
export const TURNSTILE_GATEWAY = Symbol("TURNSTILE_GATEWAY");

// bootstrap/tokens/persistence.tokens.ts
export const UNIT_OF_WORK = Symbol("UNIT_OF_WORK");
export const CLOCK = Symbol("CLOCK");

// Trích bootstrap/modules/gate.module.ts, bỏ imports cho ngắn.
@Module({
  imports: [DatabaseModule, EqrModule, IamModule, AttModule, CfgModule],
  controllers: [KioskAccessAttemptsController],
  providers: [
    {
      provide: GATE_COMMAND_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new TypeOrmGateCommandRepository(dataSource),
      inject: [DataSource],
    },
    {
      provide: TURNSTILE_GATEWAY,
      useClass: TurnstileHttpGateway,
    },
    {
      provide: DispatchOpenUseCase,
      useFactory: (
        commands: GateCommandRepository,
        gateway: TurnstileGateway,
        unitOfWork: UnitOfWork,
        clock: Clock,
      ) => new DispatchOpenUseCase(commands, gateway, unitOfWork, clock),
      inject: [
        GATE_COMMAND_REPOSITORY,
        TURNSTILE_GATEWAY,
        UNIT_OF_WORK,
        CLOCK,
      ],
    },
  ],
})
export class GateModule {}
~~~

Đây là phần trích wiring; ScanQrUseCase, các mapper/query và những dependency khác vẫn phải được đăng ký khi dựng module hoàn chỉnh. DatabaseModule cung cấp DataSource, UnitOfWork và Clock; các module nghiệp vụ export đúng public API cần dùng. Adapter dùng useClass cần được cấu hình constructor/provider tương ứng. [Nest — Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers).

Use case thao tác bằng port; controller gọi use case đã được cấp sẵn. Tránh import Symbol token từ bootstrap rồi dùng @Inject trong application, vì như vậy application lại phụ thuộc composition root. DTO/guard/controller ở presentation và adapter hạ tầng có thể dùng framework phù hợp; core vẫn thuần.

## 6. Một luồng đi xuyên từ client đến api

~~~mermaid
sequenceDiagram
    participant P as client: KioskPage / Hook
    participant F as client: SubmitQrScan
    participant H as client: HTTP repository
    participant C as api: Nest Controller / Guard
    participant U as api: ScanQrUseCase
    participant D as PostgreSQL qua repositories / UoW
    participant T as TurnstileGateway
    P->>F: execute(eventId, token)
    F->>H: Gọi port repository
    H->>C: POST /api/kiosk/access-attempts
    C->>U: Map DTO + station context đã xác thực -> command
    U->>U: Kiểm tra EQR / IAM và cấu hình
    U->>D: TX-A: attempt + PREPARED + audit; commit
    U->>D: TX-B: kiểm tra điều kiện, CAS DISPATCHING; commit
    U->>T: open(commandId, turnstileId, deadline)
    T-->>U: OPEN_CONFIRMED / OPEN_REJECTED / UNKNOWN
    U->>D: TX-C: kết quả + công nếu đủ bằng chứng + audit; commit
    U-->>C: ScanQrResult thuần
    C-->>H: Response DTO
    H-->>F: Map DTO -> GateAttempt
    F-->>P: Hiển thị trạng thái
~~~

Sơ đồ là nhánh hợp lệ và claim thành công. QR bị từ chối, request trùng, DB lỗi, hết hạn và UNKNOWN cần xử lý riêng. Với QR một lần, việc gắn jti vào attempt phải chống tương tranh trong bước chuẩn bị.

| Chặng | Trách nhiệm | Quy tắc |
|---|---|---|
| Client UI | Quét và hiển thị | Tạo eventId trước gửi; render không tự phát request mở cổng |
| Client use case | Điều phối thao tác frontend | Dùng repository port; không biết URL/TCS/TypeORM |
| Client HTTP adapter | Serialize, gọi API, validate/map response | Không tự biến lỗi mạng thành DENIED hoặc CONFIRMED |
| API controller/guard | Biên HTTP, xác thực và mapping | Lấy actor/station từ nguồn server đã xác thực; không tin role/gateId do client tự khai |
| API use case | Nghiệp vụ và điều phối | Gọi public API/repository port; không dùng Request/Response hoặc entity TypeORM |
| Infrastructure | Transaction và hệ thống ngoài | Lưu/claim nguyên tử, adapter diễn giải đúng ACK và timeout |

Actor/station context thuộc từng request, truyền vào command/context phù hợp; không lưu người dùng hiện tại hoặc manager hiện tại thành field dùng chung của một use case singleton. Use case vẫn kiểm tra quyền nghiệp vụ, kể cả controller đã chạy guard.

Ba dữ liệu cần giữ riêng: AccessAttempt là lượt yêu cầu; GateCommand là lệnh thiết bị; AttendanceEvent là công đã đủ nguồn xác nhận. ALLOW chưa chứng minh cổng đã mở; đã mở chưa luôn chứng minh nhân viên đã qua. [Spec §6–7](spec.pdf#page=19).

## 7. TypeORM transaction và tác vụ nền

### 7.1. Unit of Work với transaction context

- DataSource dùng chung là đầu mối kết nối; mỗi UnitOfWork tạo transactional EntityManager/QueryRunner riêng cho transaction đó.
- Mọi repository/public API ghi kết quả cổng, công và audit trong cùng UnitOfWork phải nhận cùng TransactionContext và dùng cùng transactional manager.
- Không gọi repository dùng DataSource.manager/global repository ở giữa thao tác đáng lẽ phải thuộc transaction; cũng không âm thầm mở transaction khác trong AttendanceWriter/AuditWriter.
- UnitOfWork không giữ activeManager/activeTransaction trong field singleton. Context truyền tường minh vào callback/phương thức để hai request đồng thời không dùng lẫn manager.
- Hoàn tất transaction trước khi chờ HTTP TCS/HRS. Không đặt cả luồng quét trong một transaction decorator tự bao cả lời gọi mạng.
- Sau khi DISPATCHING đã commit, lỗi/cancel chờ HTTP không chứng minh thiết bị chưa thực hiện. Phục hồi bằng trạng thái đã lưu và đối soát, không phát OPEN lại tùy ý.

TypeORM yêu cầu thao tác thuộc transaction dùng manager được cấp cho transaction đó; QueryRunner là một cách kiểm soát connection/transaction. Cơ chế truyền TransactionContext ở đây là thiết kế đề xuất để giữ core không phụ thuộc TypeORM. [TypeORM — Transactions](https://typeorm.io/docs/transactions/).

CAS được thực hiện bằng conditional UPDATE và kiểm tra kết quả ở DB. Kiểm tra trạng thái của object TypeScript trước khi gọi adapter không tự ngăn được request trùng đồng thời.

### 7.2. Worker dùng chung codebase api

| Thành phần | Vị trí đề xuất | Vai trò |
|---|---|---|
| Job/Outbox contract | platform/application/jobs | Giao diện thuần |
| DB job store | platform/infrastructure/jobs | Claim, state, nextAttemptAt, attempts, lease |
| Worker loop/scheduler adapter | Lớp ngoài, được bootstrap đăng ký | Đọc công việc, gọi handler đã được cấp |
| Handler nghiệp vụ | modules/rpt/application/jobs hoặc application module tương ứng | Xử lý export/đối soát qua port |
| HTTP host ban đầu | main.ts + app.module.ts | Có thể chạy worker cùng process với concurrency giới hạn |
| Host nền tùy chọn | worker.ts + bootstrap/modules/worker.module.ts | Tạo Nest application context, dùng lại code/bindings phù hợp, không mở HTTP server |

WorkerModule chỉ đăng ký các provider cần cho xử lý nền; dùng lại bindings để tránh nhân đôi nghiệp vụ. platform nhận handler qua interface/registry được wiring ở bootstrap, không import ngược trực tiếp use case của RPT.

Scheduler/lifecycle hook chỉ kích hoạt công việc; Job/Outbox trong DB và contract bên nhận mới cung cấp cơ chế tiếp tục, retry và chống tác động trùng. Không dùng mỗi setInterval hoặc cron trong memory như bằng chứng công việc đã bền vững. [Nest — Task Scheduling](https://docs.nestjs.com/application/task-scheduling).

Riêng GateCommand đã DISPATCHING cần status lookup/SEC đối soát theo ADR-03; không nhận lại claim hết lease rồi gửi OPEN như một job email. [Spec, trang PDF 28](spec.pdf#page=28).

## 8. Vị trí mở rộng cho M2

| Vấn đề | client/ | api/ |
|---|---|---|
| QR tĩnh bị lộ | EQR UI lấy/refresh QR ngắn hạn | EQR application phát hành/xác minh; token adapter ký/xác minh, DB kiểm soát jti/revocation |
| Mất ACK khi quét | Metadata journal và GET trạng thái eventId | Attempt/command bền vững, idempotency, recovery/reconcile |
| Chưa gửi được lượt vì offline | Báo chưa ghi nhận, hướng dẫn SEC/HR; không tự xác nhận công | Quy trình MANUAL có lý do và nguồn khi áp dụng |
| Cần tự động khi WAN đứt hoàn toàn | Cần phương án edge riêng nếu nhóm chọn | Bổ sung node/local storage, policy offline và sync; chưa phải khả năng mặc định của skeleton trung tâm |
| HRS lỗi hoặc mất ACK | Reports UI theo dõi trạng thái lô | RPT + HrExporter + snapshot/version + Outbox/retry và xác nhận nội dung |

Journal của client chỉ hỗ trợ phục hồi, không thay database công chính thức. Private key ký QR và secret tích hợp thuộc phía server. Hai vấn đề M2 phải có giải pháp, đánh đổi và cách tích hợp vào kiến trúc. [M2, trang 2](SA_CC_hk261_Assignment_M2.pdf#page=2).

## 9. Chuyển từ repo hiện tại sang cấu trúc client/api

Bảng này là kế hoạch chuyển source ở bước hiện thực sau; lần cập nhật tài liệu chỉ chốt thiết kế.

| Hiện trạng | Đích | Việc phải xử lý khi thực sự chuyển |
|---|---|---|
| src/ ở root | client/src/ | Giữ main.tsx/App.tsx/index.css và các import nội bộ đúng |
| public/ ở root | client/public/ | Font/static URL tiếp tục trỏ đúng public assets |
| index.html ở root | client/index.html | Đây là HTML entry của Vite; phải đi cùng frontend root |
| vite.config.ts, tsconfig.json | client/ cùng cấu hình tương ứng | Cập nhật alias, root, include và đường dẫn cấu hình/plugin liên quan |
| package.json ứng dụng hiện tại | client/package.json | Chuyển dependencies/scripts frontend; root package.json quản lý workspace |
| pnpm-lock.yaml, .mise.toml | Root repository | Giữ toolchain, cập nhật lockfile theo workspace khi triển khai |
| app/context và data/api demo | Session provider, feature use case/adapters | Tách database demo toàn cục, nối API theo quyền/use case |
| Chưa có backend NestJS | api/ | Tạo package Nest, TypeORM DataSource, migrations và bootstrap |
| Cấu hình Figma Make/preview đang gắn với root hiện tại | Cấu hình tương thích root mới | Rà đường dẫn .figma/plugin, script chạy, port và preview trước khi áp dụng |

Vite coi root là thư mục chứa index.html, vì vậy chuyển riêng src mà bỏ quên index.html/config/public sẽ không hoàn thành việc chuyển frontend. [Vite — root](https://vite.dev/config/shared-options.html#root).

Lệnh phát triển dự kiến khi workspace/package name đã được tạo: pnpm --filter @tmc/client dev và pnpm --filter @tmc/api start:dev. Hai lệnh thuộc hai ứng dụng; không khởi động thêm dev server chỉ để sửa tài liệu.

## 10. Thứ tự dựng skeleton và checklist review

### 10.1. Thứ tự thực hiện khi bắt đầu viết source

1. Tạo client/ và api/ với package/config riêng; xác nhận workspace, Vite root và preview sau khi chuyển.
2. Dựng domain/application thuần cho GATE; định nghĩa port, public API và transaction context.
3. Tạo infrastructure: DataSource, ORM entities/mappers, migrations, UnitOfWork và TCS simulator adapter.
4. Tạo Nest modules/providers/tokens tại bootstrap; controller/DTO/guard tại presentation.
5. Nối client gate feature qua HTTP repository; dùng GET eventId để phục hồi khi mất ACK.
6. Hoàn thiện luồng chuẩn bị/claim/dispatch/hoàn tất rồi kiểm chứng đồng thời, UNKNOWN và audit.
7. Bổ sung EQR ngắn hạn/replay, ATT/RPT và worker theo phạm vi module đã chọn.

Skeleton file rỗng/endpoint trả cứng thành công chưa phải hoàn thành module chính M2. Cần công bố đúng phần đã code và bằng chứng đã kiểm chứng.

### 10.2. Checklist

- [ ] client/package.json chứa dependency React; api/package.json chứa dependency NestJS/TypeORM.
- [ ] client không import api/src, ORM entity hoặc secret backend.
- [ ] Domain/application hai bên không import adapters hoặc framework ở lớp ngoài.
- [ ] React Query/hooks nằm ở presentation; fetch nằm trong HTTP adapter.
- [ ] Nest controller không inject DataSource/repository implementation để bỏ qua application.
- [ ] Nest modules/providers/tokens nằm tại composition root theo quy ước đã chọn.
- [ ] Application thuần được tạo qua factory; không import token từ bootstrap để resolve dependency.
- [ ] TypeORM decorators và ORM entities chỉ nằm trong infrastructure.
- [ ] Module khác chỉ dùng public API được cho phép; platform không import ngược module cụ thể.
- [ ] UnitOfWork truyền đúng transaction context; repository không dùng global manager khi đang ở transaction.
- [ ] Không giữ transaction chờ TCS/HRS; CAS/idempotency được kiểm chứng bằng DB.
- [ ] DI singleton không giữ actor hoặc transaction mutable dùng chung giữa requests.
- [ ] Worker/Outbox có state bền vững; DISPATCHING không được tự gửi lại OPEN.
- [ ] Source chuyển thư mục có kiểm tra build/preview/API test phù hợp trước khi coi hoàn tất.

§3.3 là dependency view frontend; §4.2 là dependency view backend; §6 là tương tác runtime. Allocation/deployment view trong báo cáo cần phản ánh các process/node thực chạy, không suy ra số server từ số thư mục.

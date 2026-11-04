# Schema Database — TMC Attendance & Access Control

**Stack:** PostgreSQL + TypeORM trong backend Node.js/NestJS ở api/. Đây là **thiết kế schema đề xuất**, không phải migration đã chạy hay database đã tạo trên server.

**Phạm vi:** table, column, property TypeScript, PK/FK, quan hệ, constraint/index và ý nghĩa nghiệp vụ. Mô hình bao phủ sáu module M1 cùng phần hạ tầng; tách rõ yêu cầu từ [spec.pdf](spec.pdf) với các bảng chi tiết hóa cho [M2](SA_CC_hk261_Assignment_M2.pdf).

Đọc cùng [user-flow.md](user-flow.md), [structure-architecture.md](structure-architecture.md), [teach-stack.md](teach-stack.md) và [explain-detail.md](explain-detail.md). Tên bảng và phương án cụ thể ở đây là nguồn tham chiếu để viết migrations tiếp theo, không tự tạo thêm yêu cầu của giảng viên.

**Cách đọc nhanh:** xem §2 để chọn bảng, §3 để nhìn quan hệ, rồi mở từ điển của bảng qua liên kết. §12 tra toàn bộ FK; §13–15 giải thích ràng buộc và cách ghi dữ liệu đúng.

| Nhóm cần tìm | Điểm bắt đầu | Nội dung chính |
|---|---|---|
| CFG | [Factory](#t-factories) | Nhà máy, bộ phận, tổ, cấu hình và đầu kết nối |
| IAM | [User](#t-users) | Tài khoản, role, permission, phạm vi, phiên và audit |
| EQR | [Employee](#t-employees) | Nhân viên, lịch sử phân công, quyền nhà máy và QR |
| GATE | [GateStation](#t-gate_stations) | Trạm, lượt quét, lệnh cổng, phản hồi và đối soát |
| ATT | [AttendanceEvent](#t-attendance_events) | Công gốc, phiên bản hiệu lực, hiệu chỉnh và ghép IN/OUT |
| RPT | [ExportBatch](#t-export_batches) | Lô xuất tháng, snapshot nguồn và lịch sử gửi HRS |
| OPS | [OutboxMessage](#t-outbox_messages) | Ý định gửi, hàng chờ và worker |

## 1. Quyết định nền và cách đọc

- Một PostgreSQL database vật lý, schema public; mỗi module sở hữu nhóm bảng của mình. FK liên module không đồng nghĩa application được gọi repository nội bộ của module khác.
- Table/column dùng snake_case; entity/property dùng PascalCase/camelCase. Bảng nối có thể chỉ cần ORM model, không bắt buộc là một Domain Aggregate độc lập.
- UUID được API tạo trước ghi; eventId từ kiosk, command ID và batch ID là các khái niệm riêng. Một request không phải một lượt công.
- Thời điểm dùng timestamptz; API trao đổi instant/ISO 8601; lịch nghiệp vụ hiển thị/chốt theo Asia/Ho_Chi_Minh. PostgreSQL không giữ tên timezone IANA trong từng timestamptz.
- Ngày kỳ dùng date; khoảng thời gian dùng [bắt đầu, kết thúc). Không dùng giờ float để lưu tổng hiện diện: dùng số giây nguyên và quy tắc làm tròn đã công bố.
- Không có bảng tính lương, khách, GPS hoặc sinh trắc học. MFA/SSO, lưu file nhị phân và workflow pháp lý chuyên biệt không được tự coi là đã có chỉ vì schema lõi tồn tại.
- Bảng mức **M2** phục vụ QR ngắn hạn/replay. **RPT** là nhóm xuất tháng. **Mở rộng workflow** chỉ cần khi nhóm chọn lưu ticket. Các nhãn là phân nhóm triển khai, không phải thang điểm hay danh sách bắt buộc code toàn bộ M2.
- Thiết kế ưu tiên PostgreSQL còn hỗ trợ; các ví dụ NULLS NOT DISTINCT yêu cầu PostgreSQL 15+. Stack đã đề xuất PostgreSQL 18.x.

**Khác biệt chi tiết hóa so với M1:** thêm token/redemption cho QR động; thêm revision để biểu diễn công gốc và công hiệu lực; thêm case/ticket để lưu đối soát; tách outbox intent, job execution và HRS delivery. Đây là các lựa chọn cụ thể hóa, không đổi ranh giới tính lương.

### 1.1. Chú giải khóa và quan hệ

| Ký hiệu | Nghĩa |
|---|---|
| PK | Primary Key; có thể gồm nhiều cột |
| UK | Unique trên một cột; UK ghép/partial được ghi ở rules/index |
| FK → table.column | Tham chiếu vật lý; các FK ghép được liệt kê riêng dưới bảng và ở §12 |
| NN / NULL | Bắt buộc có giá trị / được phép thiếu |
| 1:N | Một bản ghi cha có nhiều bản ghi con; con trỏ tối đa một cha theo FK |
| N:N | Dùng bảng nối có PK/UK phù hợp, không lưu danh sách ID như thể đó là FK |
| source reference / external reference | Tham chiếu logic hoặc mã vendor; KHÔNG phải FK local nếu được ghi rõ |
| FK deferred | Kiểm tra cuối transaction để tạo head/revision/correction nhất quán |

Mặc định FK dùng **ON DELETE NO ACTION**, không cascade xóa công/audit/snapshot. FK không tự thực thi RBAC. Các check liên nhiều bảng hoặc phụ thuộc quyền hiện hành được phân biệt với constraint DB ở §13–14. [PostgreSQL — Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).

### 1.2. Mapping kiểu và metadata

| PostgreSQL | Property TypeScript thường dùng | Lưu ý |
|---|---|---|
| uuid, varchar, text, char | string | UUID/key không phải bằng chứng có quyền |
| integer / smallint | number | Có CHECK range/count/version phù hợp |
| bigint | string, hoặc bigint qua transformer | Không tự ép thành number nếu có nguy cơ vượt số nguyên an toàn |
| timestamptz | Date trong API/domain phù hợp | Serialize ISO 8601; không nhầm với date nghiệp vụ |
| date | string YYYY-MM-DD | Tránh dịch ngày vì timezone khi biến thành Date |
| boolean | boolean | Không dùng chuỗi true/false |
| jsonb | JsonValue đã validate | Key trong JSON không tự có FK; không chứa secret/raw QR |

Các cột chung được ghi đầy đủ trong từng bảng. id là PK UUID; created_at là lúc ghi lần đầu; updated_at theo thay đổi trạng thái/metadata; row_version dùng optimistic concurrency. Default ghi trong từ điển là giá trị thiết kế; “UUID do API tạo” không phải biểu thức SQL default.

Độ dài VARCHAR, tập trạng thái và cấu trúc JSON là đề xuất triển khai; cần chốt theo contract TCS/HRS và dữ liệu thực tế. Thời điểm/hướng quét gốc của AttendanceEvent nằm trong revision 1, còn current_revision_no chỉ trỏ phiên bản đang có hiệu lực.

ORM entity có thể chứa scalar FK IDs và mapping riêng; domain entity giữ thuần TypeScript. Với FK liên module, có thể tạo FK trong migration mà không bắt hai domain module import ORM entity của nhau.

## 2. Danh mục entity và table

Có **37 bảng, 425 cột và 109 ràng buộc FK được mô tả** trong bản thiết kế này, gồm cả FK ghép. Một số cột có FK đơn và FK ghép để bảo vệ cả tồn tại lẫn sự nhất quán.

| Mã | Table | Logical entity / ORM entity | Nhóm triển khai | Chức năng |
|---|---|---|---|---|
| CFG-01 | [factories](#t-factories) | Factory / FactoryOrmEntity | Core | Danh mục nhà máy; tách nơi quét thực tế khỏi nơi nhân viên được phân công. |
| CFG-02 | [departments](#t-departments) | Department / DepartmentOrmEntity | Core | Bộ phận thuộc một nhà máy, phục vụ tổ chức và scope báo cáo. |
| CFG-03 | [teams](#t-teams) | Team / TeamOrmEntity | Core | Tổ sản xuất/nhóm nhân viên; SUP được phân quyền theo tổ. |
| CFG-04 | [config_versions](#t-config_versions) | ConfigVersion / ConfigVersionOrmEntity | Core | Lưu snapshot cấu hình không chứa secret thô để giải thích hành vi tại một thời điểm. |
| CFG-05 | [integration_endpoints](#t-integration_endpoints) | IntegrationEndpoint / IntegrationEndpointOrmEntity | Core | Danh tính đầu kết nối TCS/HRS; cấu hình hiện tại có liên kết snapshot version. |
| IAM-01 | [users](#t-users) | User / UserOrmEntity | Core | Tài khoản người dùng portal; job hệ thống không giả làm một user có đặc quyền. |
| IAM-02 | [roles](#t-roles) | Role / RoleOrmEntity | Core | Vai trò ứng dụng; seed EMP, HR, SUP, SEC, ADM, EXE. |
| IAM-03 | [permissions](#t-permissions) | Permission / PermissionOrmEntity | Core | Đơn vị quyền như attendance.correct, gate.reconcile, hr_export.submit. |
| IAM-04 | [role_permissions](#t-role_permissions) | RolePermission / RolePermissionOrmEntity | Core | Bảng nối N:N giữa vai trò và các quyền. |
| IAM-05 | [user_role_assignments](#t-user_role_assignments) | RoleAssignment / RoleAssignmentOrmEntity | Core | Gán role cho user kèm phạm vi và thời gian hiệu lực. |
| IAM-06 | [user_sessions](#t-user_sessions) | UserSession / UserSessionOrmEntity | Core | Phiên đăng nhập portal có thể thu hồi; cookie chứa token ngẫu nhiên, DB chỉ lưu hash. |
| IAM-07 | [audit_entries](#t-audit_entries) | AuditEntry / AuditEntryOrmEntity | Core | Nhật ký nghiệp vụ có cấu trúc, ghi cùng transaction thay đổi nhạy cảm. |
| EQR-01 | [employees](#t-employees) | Employee / EmployeeOrmEntity | Core | Hồ sơ nhân viên tối thiểu, mã ổn định để đối soát HRS. |
| EQR-02 | [employee_assignments](#t-employee_assignments) | EmployeeAssignment / EmployeeAssignmentOrmEntity | Core | Lịch sử tổ chức của nhân viên; tránh đổi tổ hiện tại làm sai báo cáo quá khứ. |
| EQR-03 | [access_grants](#t-access_grants) | AccessGrant / AccessGrantOrmEntity | Core | Quyền nhân viên vào một nhà máy; tách khỏi quyền quản trị portal. |
| EQR-04 | [qr_signing_keys](#t-qr_signing_keys) | QrSigningKey / QrSigningKeyOrmEntity | M2 | Metadata khóa ký QR; hỗ trợ keyId, luân chuyển và thu hồi mà không lưu private key thô. |
| EQR-05 | [qr_credentials](#t-qr_credentials) | QrCredential / QrCredentialOrmEntity | Core | Định danh credential QR dài hạn; một credential phát sinh nhiều token ngắn hạn. |
| EQR-06 | [qr_tokens](#t-qr_tokens) | QrToken / QrTokenOrmEntity | M2 | Một lần phát hành token QR ngắn hạn; id chính là jti. |
| EQR-07 | [qr_redemptions](#t-qr_redemptions) | QrRedemption / QrRedemptionOrmEntity | M2 | Gắn một jti vào đúng attempt để chống dùng một token cho nhiều lượt. |
| GATE-01 | [gate_stations](#t-gate_stations) | GateStation / GateStationOrmEntity | Core | Một làn/điểm quét có cấu hình server; không phải chiếc điện thoại của nhân viên. |
| GATE-02 | [station_credentials](#t-station_credentials) | StationCredential / StationCredentialOrmEntity | Core | Thông tin xác thực riêng của thiết bị/kiosk, có vòng đời và thu hồi. |
| GATE-03 | [access_attempts](#t-access_attempts) | AccessAttempt / AccessAttemptOrmEntity | Core | Nhật ký yêu cầu quét/ngoại lệ, kể cả bị từ chối; chưa phải công chính thức. |
| GATE-04 | [gate_commands](#t-gate_commands) | GateCommand / GateCommandOrmEntity | Core | Lệnh vật lý OPEN/CLOSE; một attempt có nhiều command nhưng tối đa một OPEN cơ sở. |
| GATE-05 | [gate_command_history](#t-gate_command_history) | GateCommandHistory / GateCommandHistoryOrmEntity | Core | Lịch sử chuyển trạng thái append-only của command, không chỉ trạng thái cuối. |
| GATE-06 | [gate_device_events](#t-gate_device_events) | GateDeviceEvent / GateDeviceEventOrmEntity | Theo contract TCS | Inbox sự kiện TCS đã xác thực; hỗ trợ callback trùng, sai thứ tự hoặc chưa ghép được command. |
| GATE-07 | [reconciliation_cases](#t-reconciliation_cases) | ReconciliationCase / ReconciliationCaseOrmEntity | Core | Hồ sơ SEC/HR xử lý UNKNOWN, mất mạng hoặc ngoại lệ; là nguồn nhập MANUAL khi được xác minh. |
| ATT-01 | [attendance_events](#t-attendance_events) | AttendanceEvent / AttendanceEventOrmEntity | Core | Nguồn công đã được xác nhận, một dòng cho một lượt; head revision là metadata, không ghi đè nội dung gốc. |
| ATT-02 | [attendance_event_revisions](#t-attendance_event_revisions) | AttendanceEventRevision / AttendanceEventRevisionOrmEntity | Core | Nội dung hiệu lực từng phiên bản; revision 1 là dữ liệu gốc, bản sau append-only. |
| ATT-03 | [attendance_corrections](#t-attendance_corrections) | AttendanceCorrection / AttendanceCorrectionOrmEntity | Core | Bằng chứng hiệu chỉnh có version, actor và lý do; nội dung trước/sau đọc từ hai revision được khóa FK. |
| ATT-04 | [presence_intervals](#t-presence_intervals) | PresenceInterval / PresenceIntervalOrmEntity | Core | Projection hiện tại ghép IN/OUT; có thể dựng lại từ ledger, không phải dữ liệu gốc để sửa trực tiếp. |
| ATT-05 | [attendance_review_requests](#t-attendance_review_requests) | AttendanceReviewRequest / AttendanceReviewRequestOrmEntity | Mở rộng workflow | Yêu cầu EMP nhờ HR kiểm tra công; cụ thể hóa form/ticket trong user flow, không thêm quyền tự sửa công. |
| RPT-01 | [export_batches](#t-export_batches) | ExportBatch / ExportBatchOrmEntity | RPT | Lô snapshot tháng bất biến; theo dõi gửi/ACK/thay thế, không tính lương. |
| RPT-02 | [export_items](#t-export_items) | ExportItem / ExportItemOrmEntity | RPT | Một item nhân viên trong lô minh họa; có snapshot dữ liệu và tham chiếu nguồn bất biến. |
| RPT-03 | [export_item_sources](#t-export_item_sources) | ExportItemSource / ExportItemSourceOrmEntity | RPT | Bảng nối snapshot HRS tới chính xác revision công đã dùng, kể cả lượt sát ranh giới tháng. |
| RPT-04 | [export_attempts](#t-export_attempts) | ExportAttempt / ExportAttemptOrmEntity | RPT | Mỗi lần SUBMIT/STATUS với HRS; tách số lần giao nhận khỏi một lô nghiệp vụ. |
| OPS-01 | [outbox_messages](#t-outbox_messages) | OutboxMessage / OutboxMessageOrmEntity | RPT / tích hợp | Ý định gửi bền vững, tạo cùng transaction với nghiệp vụ; không đồng nhất với WAL. |
| OPS-02 | [background_jobs](#t-background_jobs) | BackgroundJob / BackgroundJobOrmEntity | Core | Hàng chờ DB cho export, đối soát, rebuild projection và thông báo. |

## 3. ERD theo nhóm

ERD rút gọn chỉ hiện các khóa/quan hệ trọng tâm; từ điển §4–10 và registry FK §12 mới là danh sách đầy đủ, kể cả FK actor, scope và version.

### 3.1. Tổ chức, phân công và quyền nhà máy

~~~mermaid
erDiagram
    factories ||--o{ departments : contains
    departments ||--o{ teams : contains
    employees ||--o{ employee_assignments : assigned_over_time
    factories ||--o{ employee_assignments : primary_organization
    departments o|--o{ employee_assignments : department
    teams o|--o{ employee_assignments : team
    employees ||--o{ access_grants : granted
    factories ||--o{ access_grants : permits_entry
    factories {
        uuid id PK
        varchar code UK
    }
    employees {
        uuid id PK
        varchar employee_code UK
        varchar external_hr_id UK
        varchar status
    }
    employee_assignments {
        uuid id PK
        uuid employee_id FK
        uuid factory_id FK
        uuid department_id FK
        uuid team_id FK
        timestamp valid_from
        timestamp valid_to
    }
    access_grants {
        uuid id PK
        uuid employee_id FK
        uuid factory_id FK
        timestamp valid_from
        timestamp valid_to
        timestamp revoked_at
    }
~~~

Phân công tổ chức không tự cấp quyền qua cổng; quyền nhà máy kiểm tra AccessGrant. Nhân viên có thể được phân công Bình Dương nhưng có grant hợp lệ vào Long An. Scope SUP dùng tổ/phân công lịch sử; scope SEC dùng nhà máy của cổng.

### 3.2. IAM, vai trò và phiên

~~~mermaid
erDiagram
    employees ||--o| users : portal_account
    users ||--o{ user_sessions : owns
    users ||--o{ user_role_assignments : assigned_roles
    roles ||--o{ user_role_assignments : role
    roles ||--o{ role_permissions : contains
    permissions ||--o{ role_permissions : grants
    users o|--o{ audit_entries : actor_user
    users {
        uuid id PK
        uuid employee_id FK,UK
        varchar username UK
        varchar status
    }
    user_role_assignments {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        varchar scope_type
        uuid factory_id FK
        uuid department_id FK
        uuid team_id FK
    }
    role_permissions {
        uuid role_id PK,FK
        uuid permission_id PK,FK
    }
~~~

### 3.3. QR ngắn hạn và replay

~~~mermaid
erDiagram
    employees ||--o{ qr_credentials : has_history
    qr_credentials ||--o{ qr_tokens : issues
    qr_signing_keys ||--o{ qr_tokens : signs
    qr_tokens ||--o| qr_redemptions : consumed_once
    access_attempts ||--o| qr_redemptions : owns_redemption
    qr_tokens o|--o{ access_attempts : token_reference
    qr_tokens {
        uuid id PK
        uuid credential_id FK
        varchar signing_key_id FK
        varchar token_hash UK
        timestamp expires_at
    }
    qr_redemptions {
        uuid token_id PK,FK
        uuid access_attempt_id FK,UK
    }
~~~

Nhiều attempt có thể nhắc cùng token, nhưng chỉ một attempt được redemption theo policy một lần. Retry cùng station/eventId tra attempt cũ, không tiêu thụ lại token đã dùng.

### 3.4. Trạm, lệnh và đối soát

~~~mermaid
erDiagram
    factories ||--o{ gate_stations : location
    integration_endpoints ||--o{ gate_stations : controls
    gate_stations ||--o{ station_credentials : authenticates
    gate_stations ||--o{ access_attempts : receives
    station_credentials o|--o{ access_attempts : used_credential
    access_attempts ||--o{ gate_commands : commands
    gate_commands ||--o{ gate_command_history : transitions
    gate_commands o|--o{ gate_device_events : matches
    gate_stations ||--o{ reconciliation_cases : incident_at
    access_attempts o|--o{ reconciliation_cases : reconciles
    gate_commands o|--o{ reconciliation_cases : target
    gate_commands {
        uuid id PK
        uuid access_attempt_id FK
        uuid parent_open_command_id FK
        varchar kind
        varchar state
        timestamp deadline_at
        int row_version
    }
    gate_device_events {
        uuid id PK
        uuid integration_endpoint_id FK
        varchar vendor_event_id
        uuid command_id FK
    }
~~~

Một attempt có tối đa một OPEN cơ sở qua partial UNIQUE; CLOSE được theo dõi riêng. Parent command, endpoint/config version và actor FK được tra trong từ điển/registry.

### 3.5. Công gốc, revision và correction

~~~mermaid
erDiagram
    employees ||--o{ attendance_events : original_employee
    access_attempts o|--o| attendance_events : confirmed_attempt
    reconciliation_cases o|--o| attendance_events : resolved_source
    attendance_events ||--|{ attendance_event_revisions : versions
    attendance_event_revisions ||--o| attendance_events : current_head
    attendance_events ||--o{ attendance_corrections : corrected
    attendance_corrections o|--|| attendance_event_revisions : creates_new_revision
    attendance_event_revisions o|--o| presence_intervals : in_revision
    attendance_event_revisions o|--o| presence_intervals : out_revision
    employees ||--o{ attendance_review_requests : requests_review
    attendance_review_requests o|--o{ attendance_corrections : may_result_in
    attendance_events {
        uuid id PK
        uuid employee_id FK
        varchar source_id UK
        int current_revision_no FK
    }
    attendance_event_revisions {
        uuid event_id PK,FK
        int revision_no PK
        timestamp occurred_at
        varchar direction
        boolean is_voided
        uuid correction_id FK,UK
    }
    attendance_corrections {
        uuid id PK
        uuid event_id FK
        int expected_version FK
        int new_version FK
        uuid actor_user_id FK
    }
~~~

FK current_head và FK correction phiên bản mới là deferred, không tạo công mới khi sửa cùng nguồn. PresenceInterval chỉ là projection hiện tại; dữ liệu HRS chốt theo revision bất biến.

### 3.6. Snapshot HRS, nguồn công và jobs

~~~mermaid
erDiagram
    export_batches ||--o{ export_items : contains
    employees ||--o{ export_items : employee_snapshot
    export_items ||--o{ export_item_sources : uses
    attendance_event_revisions ||--o{ export_item_sources : frozen_revision
    export_batches o|--o| outbox_messages : hrs_export_intent
    outbox_messages o|--o| background_jobs : execution
    export_batches ||--o{ export_attempts : deliveries
    background_jobs ||--o{ export_attempts : performed_by
    gate_commands o|--o{ background_jobs : reconciliation_target
    export_batches {
        uuid id PK
        date period_start
        varchar scope_type
        uuid factory_id FK
        int batch_version
        uuid supersedes_batch_id FK
        varchar payload_checksum
        varchar status
    }
    export_item_sources {
        uuid export_item_id PK,FK
        uuid event_id PK,FK
        int revision_no FK
    }
    background_jobs {
        uuid id PK
        varchar job_key UK
        uuid outbox_message_id FK,UK
        varchar state
        bigint lease_version
    }
~~~

Quan hệ Batch–Outbox vẽ cho HRS_EXPORT; loại thông báo khác có thể không có batch. Outbox lưu intent, Job lưu trạng thái thực thi, ExportBatch/ExportAttempt lưu kết quả HRS; không nhân ba nguồn sự thật về cùng một status.

## 4. Từ điển CFG — Tổ chức và cấu hình

<a id="t-factories"></a>

### CFG-01 · Factory → factories

**Chức năng:** Danh mục nhà máy; tách nơi quét thực tế khỏi nơi nhân viên được phân công.

**Logical/ORM model:** Factory / FactoryOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| code | code | varchar(32) → string | NN | UK | Mã nhà máy ổn định, ví dụ BD/LA. |
| name | name | varchar(150) → string | NN | — | Tên hiển thị của nhà máy. |
| timezone | timezone | varchar(64) → string | NN; mặc định Asia/Ho_Chi_Minh | — | Múi giờ IANA dùng cho nghiệp vụ tại nhà máy. |
| status | status | varchar(20) → string | NN; mặc định ACTIVE | — | ACTIVE hoặc DISABLED; ngừng sử dụng thay vì xóa lịch sử. |

**Rules:**

- UNIQUE(code); không đổi mã để tái sử dụng cho nhà máy khác.
<a id="t-departments"></a>

### CFG-02 · Department → departments

**Chức năng:** Bộ phận thuộc một nhà máy, phục vụ tổ chức và scope báo cáo.

**Logical/ORM model:** Department / DepartmentOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| factoryId | factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Nhà máy sở hữu bộ phận. |
| code | code | varchar(32) → string | NN | — | Mã bộ phận, duy nhất trong nhà máy. |
| name | name | varchar(150) → string | NN | — | Tên bộ phận. |
| isActive | is_active | boolean → boolean | NN; mặc định true | — | Bộ phận còn được dùng cho phân công mới. |

**Rules:**

- UNIQUE(factory_id,code); giữ bản ghi đã có lịch sử.

**UK ghép trong schema:** (factory_id, code); (id, factory_id).
<a id="t-teams"></a>

### CFG-03 · Team → teams

**Chức năng:** Tổ sản xuất/nhóm nhân viên; SUP được phân quyền theo tổ.

**Logical/ORM model:** Team / TeamOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| departmentId | department_id | uuid → string | NN | FK → [departments.id](#t-departments) | Bộ phận chứa tổ; suy ra nhà máy qua department. |
| code | code | varchar(32) → string | NN | — | Mã tổ duy nhất trong bộ phận. |
| name | name | varchar(150) → string | NN | — | Tên tổ. |
| isActive | is_active | boolean → boolean | NN; mặc định true | — | Có cho phân công mới hay không. |

**Rules:**

- UNIQUE(department_id,code).

**UK ghép trong schema:** (department_id, code); (id, department_id).
<a id="t-config_versions"></a>

### CFG-04 · ConfigVersion → config_versions

**Chức năng:** Lưu snapshot cấu hình không chứa secret thô để giải thích hành vi tại một thời điểm.

**Logical/ORM model:** ConfigVersion / ConfigVersionOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| configKey | config_key | varchar(150) → string | NN | — | Tên cấu hình có phạm vi, ví dụ gate:UUID hoặc integration:CODE. |
| version | version | integer → number | NN | — | Số phiên bản tăng trong cùng configKey. |
| payload | payload | jsonb → JsonValue | NN | — | Snapshot giá trị cấu hình/secret reference; không chứa private key hoặc password. |
| supersedesId | supersedes_id | uuid → string | NULL | FK → [config_versions.id](#t-config_versions) | Phiên bản cấu hình được thay thế. |
| effectiveFrom | effective_from | timestamptz → Date | NULL | — | Thời điểm phiên bản được áp dụng; NULL là chưa kích hoạt. |
| createdByUserId | created_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người tạo; NULL dành cho seed/system có audit. |

**Rules:**

- UNIQUE(config_key,version); version >= 1.
- Phiên bản đã dùng không sửa payload; tạo bản mới. supersedes phải cùng key và version thấp hơn: use case kiểm tra.

**UK ghép trong schema:** (config_key, version).
<a id="t-integration_endpoints"></a>

### CFG-05 · IntegrationEndpoint → integration_endpoints

**Chức năng:** Danh tính đầu kết nối TCS/HRS; cấu hình hiện tại có liên kết snapshot version.

**Logical/ORM model:** IntegrationEndpoint / IntegrationEndpointOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| code | code | varchar(64) → string | NN | UK | Mã connector ổn định. |
| providerType | provider_type | varchar(16) → string | NN | — | TCS hoặc HRS. |
| factoryId | factory_id | uuid → string | NULL | FK → [factories.id](#t-factories) | Nhà máy của kết nối TCS; có thể NULL cho HRS toàn công ty. |
| baseUrl | base_url | text → string | NN | — | Địa chỉ API đã được quản trị kiểm soát; không nhận tùy ý từ request quét. |
| authSecretRef | auth_secret_ref | text → string | NN | — | Tên/tham chiếu secret phía server, không phải giá trị bí mật. |
| requestTimeoutMs | request_timeout_ms | integer → number | NN | — | Budget gọi connector, số nguyên > 0; còn bị giới hạn bởi deadline toàn luồng. |
| contractVersion | contract_version | varchar(50) → string | NN | — | Phiên bản contract adapter/mock/vendor đang dùng. |
| configVersionId | config_version_id | uuid → string | NN | FK → [config_versions.id](#t-config_versions) | Snapshot cấu hình hiện tại; thay connector phải cập nhật cùng transaction. |
| isEnabled | is_enabled | boolean → boolean | NN; mặc định true | — | Cho phép dùng connector. |

**Rules:**

- provider_type IN ('TCS','HRS'); request_timeout_ms > 0.
- TCS phải thuộc đúng nhà máy của station; use case xác minh. Snapshot dùng cho lệnh/lô được giữ riêng.

## 5. Từ điển IAM — Tài khoản, quyền và audit

<a id="t-users"></a>

### IAM-01 · User → users

**Chức năng:** Tài khoản người dùng portal; job hệ thống không giả làm một user có đặc quyền.

**Logical/ORM model:** User / UserOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeId | employee_id | uuid → string | NN | UK · FK → [employees.id](#t-employees) | Nhân viên sở hữu tài khoản; một nhân viên tối đa một tài khoản trong thiết kế này. |
| username | username | varchar(100) → string | NN | UK | Tên đăng nhập đã chuẩn hóa, không dùng accountId client tự khai làm bằng chứng. |
| passwordHash | password_hash | text → string | NN | — | Chuỗi password hash có salt/parameters theo thư viện chuẩn; không lưu plaintext. |
| status | status | varchar(16) → string | NN; mặc định ACTIVE | — | ACTIVE, LOCKED hoặc DISABLED. |
| lastLoginAt | last_login_at | timestamptz → Date | NULL | — | Lần đăng nhập thành công gần nhất. |

**Rules:**

- Username chuẩn hóa trước ghi; UNIQUE(username).
- User ACTIVE vẫn phải bị từ chối khi nhân viên/phiên/quyền không còn hợp lệ; không dựa chỉ vào UI.
<a id="t-roles"></a>

### IAM-02 · Role → roles

**Chức năng:** Vai trò ứng dụng; seed EMP, HR, SUP, SEC, ADM, EXE.

**Logical/ORM model:** Role / RoleOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| code | code | varchar(32) → string | NN | UK | Mã vai trò ổn định. |
| name | name | varchar(100) → string | NN | — | Tên hiển thị. |
| description | description | text → string | NULL | — | Giải thích trách nhiệm. |
| isActive | is_active | boolean → boolean | NN; mặc định true | — | Role còn được cấp/sử dụng theo policy. |

**Rules:**

- Role không tự tạo quyền trên mọi đối tượng; còn permission và scope.
<a id="t-permissions"></a>

### IAM-03 · Permission → permissions

**Chức năng:** Đơn vị quyền như attendance.correct, gate.reconcile, hr_export.submit.

**Logical/ORM model:** Permission / PermissionOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| code | code | varchar(100) → string | NN | UK | Mã quyền duy nhất để Authorizer kiểm tra. |
| name | name | varchar(150) → string | NN | — | Tên quyền. |
| description | description | text → string | NULL | — | Phạm vi hành động của quyền. |

**Rules:**

- Mã quyền do hệ thống kiểm soát; không chấp nhận quyền do client tự khai.
<a id="t-role_permissions"></a>

### IAM-04 · RolePermission → role_permissions

**Chức năng:** Bảng nối N:N giữa vai trò và các quyền.

**Logical/ORM model:** RolePermission / RolePermissionOrmEntity. **Mức:** Core. **PK:** (role_id, permission_id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| roleId | role_id | uuid → string | NN | PK · FK → [roles.id](#t-roles) | Role được cấp quyền. |
| permissionId | permission_id | uuid → string | NN | PK · FK → [permissions.id](#t-permissions) | Quyền thuộc role. |

**Rules:**

- PK(role_id,permission_id); thay đổi role-permission có audit.
<a id="t-user_role_assignments"></a>

### IAM-05 · RoleAssignment → user_role_assignments

**Chức năng:** Gán role cho user kèm phạm vi và thời gian hiệu lực.

**Logical/ORM model:** RoleAssignment / RoleAssignmentOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| userId | user_id | uuid → string | NN | FK → [users.id](#t-users) | Người nhận role. |
| roleId | role_id | uuid → string | NN | FK → [roles.id](#t-roles) | Role được gán. |
| scopeType | scope_type | varchar(16) → string | NN | — | SELF, GLOBAL, FACTORY, DEPARTMENT hoặc TEAM. |
| factoryId | factory_id | uuid → string | NULL | FK → [factories.id](#t-factories) | Chỉ có giá trị khi scopeType=FACTORY. |
| departmentId | department_id | uuid → string | NULL | FK → [departments.id](#t-departments) | Chỉ có giá trị khi scopeType=DEPARTMENT. |
| teamId | team_id | uuid → string | NULL | FK → [teams.id](#t-teams) | Chỉ có giá trị khi scopeType=TEAM. |
| validFrom | valid_from | timestamptz → Date | NN | — | Bắt đầu hiệu lực. |
| validTo | valid_to | timestamptz → Date | NULL | — | Kết thúc độc quyền [from,to); NULL là không ấn định. |
| assignedByUserId | assigned_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người cấp; NULL cho seed/system có audit. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Thời điểm thu hồi. |
| revokedByUserId | revoked_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người thu hồi. |
| revokeReason | revoke_reason | text → string | NULL | — | Lý do thu hồi. |

**Rules:**

- CHECK đúng tổ hợp scope; SELF/GLOBAL không có factory/department/team; scope cụ thể chỉ có đúng FK tương ứng.
- valid_to IS NULL OR valid_to > valid_from; trường thu hồi phải nhất quán.
- Unique assignment chưa thu hồi theo user/role/scope, xử lý NULLS NOT DISTINCT (§13).
<a id="t-user_sessions"></a>

### IAM-06 · UserSession → user_sessions

**Chức năng:** Phiên đăng nhập portal có thể thu hồi; cookie chứa token ngẫu nhiên, DB chỉ lưu hash.

**Logical/ORM model:** UserSession / UserSessionOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| userId | user_id | uuid → string | NN | FK → [users.id](#t-users) | Chủ phiên. |
| tokenHash | token_hash | char(64) → string | NN | UK | SHA-256 của token phiên ngẫu nhiên entropy cao; không phải cách hash password. |
| expiresAt | expires_at | timestamptz → Date | NN | — | Hết hạn tuyệt đối của phiên. |
| lastSeenAt | last_seen_at | timestamptz → Date | NULL | — | Lần sử dụng gần nhất, cập nhật có tiết chế. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Thu hồi khi logout/sự cố/quy trình khóa. |
| revokeReason | revoke_reason | varchar(100) → string | NULL | — | Mã lý do thu hồi. |

**Rules:**

- expires_at > created_at; token raw không lưu DB/log.
- Không nhúng bản quyền stale làm nguồn quyết định duy nhất; backend kiểm tra trạng thái hiện hành.
<a id="t-audit_entries"></a>

### IAM-07 · AuditEntry → audit_entries

**Chức năng:** Nhật ký nghiệp vụ có cấu trúc, ghi cùng transaction thay đổi nhạy cảm.

**Logical/ORM model:** AuditEntry / AuditEntryOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| actorType | actor_type | varchar(16) → string | NN | — | USER, DEVICE, SYSTEM hoặc ANONYMOUS. |
| actorUserId | actor_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Actor người dùng, chỉ dùng với USER. |
| actorStationId | actor_station_id | uuid → string | NULL | FK → [gate_stations.id](#t-gate_stations) | Actor thiết bị, chỉ dùng với DEVICE. |
| factoryId | factory_id | uuid → string | NULL | FK → [factories.id](#t-factories) | Ngữ cảnh nhà máy để lọc audit; NULL không có nghĩa mọi người được xem. |
| action | action | varchar(100) → string | NN | — | Tên hành động, ví dụ QR_REVOKED hoặc ATTENDANCE_CORRECTED. |
| objectType | object_type | varchar(64) → string | NN | — | Loại đối tượng được tác động. |
| objectId | object_id | text → string | NN | — | Mã đối tượng phục vụ truy vết; tham chiếu logic đa hình, KHÔNG phải FK. |
| outcome | outcome | varchar(16) → string | NN | — | SUCCESS, DENIED hoặc ERROR. |
| reason | reason | text → string | NULL | — | Lý do/diễn giải đã lọc dữ liệu nhạy cảm. |
| beforeData | before_data | jsonb → JsonValue | NULL | — | Giá trị trước được chọn tối thiểu và redaction. |
| afterData | after_data | jsonb → JsonValue | NULL | — | Giá trị sau được chọn tối thiểu và redaction. |
| correlationId | correlation_id | uuid → string | NN | — | Mã nối request, command, công và job. |

**Rules:**

- Actor type phải khớp actor_user_id/actor_station_id; SYSTEM/ANONYMOUS không tự gắn user.
- Ứng dụng chỉ được INSERT/đọc theo quyền; không coi đó là bất biến trước mọi tài khoản DB.
- Không ghi password, raw QR/token hoặc private key.

## 6. Từ điển EQR — Nhân viên, quyền nhà máy và QR

<a id="t-employees"></a>

### EQR-01 · Employee → employees

**Chức năng:** Hồ sơ nhân viên tối thiểu, mã ổn định để đối soát HRS.

**Logical/ORM model:** Employee / EmployeeOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeCode | employee_code | varchar(32) → string | NN | UK | Mã nhân viên nội bộ ổn định, không tái dùng cho người khác. |
| externalHrId | external_hr_id | varchar(64) → string | NN | UK | Mã nhân viên tại HRS. |
| fullName | full_name | varchar(150) → string | NN | — | Họ tên dùng cho nghiệp vụ có quyền. |
| email | email | varchar(254) → string | NULL | — | Email công ty khi cần kênh liên hệ/portal; không thu thêm PII mặc định. |
| status | status | varchar(16) → string | NN; mặc định ACTIVE | — | ACTIVE hoặc INACTIVE. |
| deactivatedAt | deactivated_at | timestamptz → Date | NULL | — | Thời điểm ngừng hoạt động. |

**Rules:**

- Không lưu lương, GPS, sinh trắc học hoặc hồ sơ khách trong schema này.
- Ngừng hoạt động nhân viên và thu hồi credential/grant liên quan trong transaction nghiệp vụ phù hợp.
<a id="t-employee_assignments"></a>

### EQR-02 · EmployeeAssignment → employee_assignments

**Chức năng:** Lịch sử tổ chức của nhân viên; tránh đổi tổ hiện tại làm sai báo cáo quá khứ.

**Logical/ORM model:** EmployeeAssignment / EmployeeAssignmentOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên được phân công. |
| factoryId | factory_id | uuid → string | NN | FK → [factories.id](#t-factories) · FK ghép bên dưới | Nhà máy phân công; khác với nhà máy thực sự có lượt quét. |
| departmentId | department_id | uuid → string | NULL | FK → [departments.id](#t-departments) · FK ghép bên dưới | Bộ phận; có thể chưa gán ở giai đoạn tạo hồ sơ. |
| teamId | team_id | uuid → string | NULL | FK → [teams.id](#t-teams) · FK ghép bên dưới | Tổ; nếu có team thì phải có department tương ứng. |
| validFrom | valid_from | timestamptz → Date | NN | — | Bắt đầu khoảng phân công. |
| validTo | valid_to | timestamptz → Date | NULL | — | Kết thúc độc quyền; NULL là còn mở. |
| assignedByUserId | assigned_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | HR tạo phân công; NULL cho seed có audit. |

**Rules:**

- valid_to IS NULL OR valid_to > valid_from; các khoảng phân công chính của cùng employee không chồng nhau.
- team_id IS NULL OR department_id IS NOT NULL; FK ghép giữ đúng cây tổ chức.
- Factory/department/team đã được tham chiếu lịch sử không đổi ngầm; đóng khoảng và tạo phân công mới.

**FK ghép:**

- (department_id, factory_id) → [departments(id, factory_id)](#t-departments).
- (team_id, department_id) → [teams(id, department_id)](#t-teams).
<a id="t-access_grants"></a>

### EQR-03 · AccessGrant → access_grants

**Chức năng:** Quyền nhân viên vào một nhà máy; tách khỏi quyền quản trị portal.

**Logical/ORM model:** AccessGrant / AccessGrantOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Người được quyền vào. |
| factoryId | factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Nhà máy được cho phép. |
| validFrom | valid_from | timestamptz → Date | NN | — | Bắt đầu hiệu lực. |
| validTo | valid_to | timestamptz → Date | NULL | — | Kết thúc hiệu lực; NULL là không ấn định. |
| grantedByUserId | granted_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | HR cấp quyền. |
| grantReason | grant_reason | text → string | NN | — | Lý do cấp/quyết định nghiệp vụ. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Đã thu hồi thì không dùng lại. |
| revokedByUserId | revoked_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người thu hồi. |
| revokeReason | revoke_reason | text → string | NULL | — | Lý do thu hồi. |

**Rules:**

- Một grant chưa thu hồi cho mỗi employee/factory; UNIQUE partial theo revoked_at IS NULL.
- valid_to IS NULL OR valid_to > valid_from; thay thời gian/thu hồi có version + audit.
- Role ADM không mặc định tạo quyền vào nhà máy; kiểm tra qua use case HR.
<a id="t-qr_signing_keys"></a>

### EQR-04 · QrSigningKey → qr_signing_keys

**Chức năng:** Metadata khóa ký QR; hỗ trợ keyId, luân chuyển và thu hồi mà không lưu private key thô.

**Logical/ORM model:** QrSigningKey / QrSigningKeyOrmEntity. **Mức:** M2. **PK:** (key_id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| keyId | key_id | varchar(64) → string | NN | PK | Mã khóa xuất hiện ở header kid của token. |
| algorithm | algorithm | varchar(20) → string | NN | — | Thuật toán đã allowlist ở server. |
| publicJwk | public_jwk | jsonb → JsonValue | NN | — | Public key/JWK dùng xác minh; tuyệt đối không chứa private parameters. |
| privateSecretRef | private_secret_ref | text → string | NN | — | Tham chiếu private key tại nơi quản lý secret. |
| status | status | varchar(20) → string | NN | — | ACTIVE, VERIFY_ONLY hoặc REVOKED. |
| validFrom | valid_from | timestamptz → Date | NN | — | Bắt đầu dùng khóa. |
| validTo | valid_to | timestamptz → Date | NULL | — | Giới hạn hiệu lực khóa theo policy. |

**Rules:**

- PK(key_id); valid_to IS NULL OR valid_to > valid_from.
- Chọn khóa ký hiện hành bằng config; VERIFY_ONLY không cấp token mới; REVOKED không được tin cậy.
<a id="t-qr_credentials"></a>

### EQR-05 · QrCredential → qr_credentials

**Chức năng:** Định danh credential QR dài hạn; một credential phát sinh nhiều token ngắn hạn.

**Logical/ORM model:** QrCredential / QrCredentialOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên sở hữu credential. |
| credentialRef | credential_ref | varchar(128) → string | NN | UK | Opaque reference ngẫu nhiên dùng trong token, không chứa mã HR/họ tên. |
| status | status | varchar(16) → string | NN; mặc định ACTIVE | — | ACTIVE hoặc REVOKED. |
| issuedByUserId | issued_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | HR cấp/cấp lại credential. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Thời điểm thu hồi credential và từ chối token liên quan. |
| revokedByUserId | revoked_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người thu hồi. |
| revokeReason | revoke_reason | text → string | NULL | — | Lý do lộ mã/nghỉ việc/cấp lại. |

**Rules:**

- Tối đa một credential ACTIVE mỗi employee bằng partial UNIQUE.
- Credential khác token hiển thị: keyId/tokenHash chuyển xuống qr_tokens cho thiết kế QR động M2.
- Thu hồi credential phải kiểm tra ở server, không chỉ đánh dấu ảnh QR trên client.
<a id="t-qr_tokens"></a>

### EQR-06 · QrToken → qr_tokens

**Chức năng:** Một lần phát hành token QR ngắn hạn; id chính là jti.

**Logical/ORM model:** QrToken / QrTokenOrmEntity. **Mức:** M2. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| credentialId | credential_id | uuid → string | NN | FK → [qr_credentials.id](#t-qr_credentials) | Credential nguồn. |
| signingKeyId | signing_key_id | varchar(64) → string | NN | FK → [qr_signing_keys.key_id](#t-qr_signing_keys) | Khóa đã ký token này. |
| issuedByUserId | issued_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | EMP đã xác thực yêu cầu phát mã; phải khớp chủ credential theo policy. |
| tokenHash | token_hash | char(64) → string | NN | UK | Dấu vân tay token đã ký; không lưu chuỗi JWT/raw QR. |
| expiresAt | expires_at | timestamptz → Date | NN | — | Hết hạn token; createdAt là thời điểm phát hành. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Thu hồi riêng token nếu cần. |

**Rules:**

- expires_at > created_at; token chỉ có giá trị cùng policy credential/employee/grant/key.
- Client chỉ hiển thị mã do server cấp; payload không thay thông tin quyền hiện hành.
<a id="t-qr_redemptions"></a>

### EQR-07 · QrRedemption → qr_redemptions

**Chức năng:** Gắn một jti vào đúng attempt để chống dùng một token cho nhiều lượt.

**Logical/ORM model:** QrRedemption / QrRedemptionOrmEntity. **Mức:** M2. **PK:** (token_id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| tokenId | token_id | uuid → string | NN | PK · FK → [qr_tokens.id](#t-qr_tokens) | Token đã tiêu thụ; PK bảo đảm một token chỉ gắn một attempt. |
| accessAttemptId | access_attempt_id | uuid → string | NN | UK · FK → [access_attempts.id](#t-access_attempts) | Attempt sở hữu lần tiêu thụ; một attempt tối đa một token. |

**Rules:**

- PK(token_id); UNIQUE(access_attempt_id). createdAt là thời điểm redemption được ghi.
- Ghi redemption cùng attempt/PREPARED trong transaction; retry cùng eventId tra lại attempt trước khi tiêu thụ jti.
- Chống replay token không thay idempotency request; không giữ raw QR trong bảng.

## 7. Từ điển GATE — Cổng, lượt quét và đối soát

<a id="t-gate_stations"></a>

### GATE-01 · GateStation → gate_stations

**Chức năng:** Một làn/điểm quét có cấu hình server; không phải chiếc điện thoại của nhân viên.

**Logical/ORM model:** GateStation / GateStationOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| factoryId | factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Nhà máy sở hữu trạm. |
| integrationEndpointId | integration_endpoint_id | uuid → string | NN | FK → [integration_endpoints.id](#t-integration_endpoints) | Connector TCS của trạm. |
| configVersionId | config_version_id | uuid → string | NN | FK → [config_versions.id](#t-config_versions) | Phiên bản cấu hình hiện hành. |
| code | code | varchar(50) → string | NN | — | Mã làn/trạm ổn định trong nhà máy. |
| direction | direction | varchar(3) → string | NN | — | IN hoặc OUT, do server cấu hình. |
| turnstileId | turnstile_id | varchar(100) → string | NN | — | Mã thiết bị tại TCS; mã ngoài hệ thống, KHÔNG phải FK local. |
| status | status | varchar(20) → string | NN; mặc định ACTIVE | — | ACTIVE, MAINTENANCE hoặc DISABLED. |
| lastSeenAt | last_seen_at | timestamptz → Date | NULL | — | Heartbeat gần nhất, nếu triển khai chức năng mức S. |

**Rules:**

- UNIQUE(factory_id,code). Station có lịch sử không chuyển factory/xóa; thay đổi cấu hình phải có version.
- Endpoint phải là TCS và cùng factory; use case/constraint trigger kiểm tra.
- Direction/turnstile/config dùng tại thời điểm quét được snapshot vào attempt/command.

**UK ghép trong schema:** (factory_id, code).
<a id="t-station_credentials"></a>

### GATE-02 · StationCredential → station_credentials

**Chức năng:** Thông tin xác thực riêng của thiết bị/kiosk, có vòng đời và thu hồi.

**Logical/ORM model:** StationCredential / StationCredentialOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| stationId | station_id | uuid → string | NN | FK → [gate_stations.id](#t-gate_stations) | Trạm mà credential được phép đại diện. |
| secretHash | secret_hash | text → string | NN | — | Hash/encoded verification material của credential ngẫu nhiên; không lưu secret thô. |
| expiresAt | expires_at | timestamptz → Date | NULL | — | Hết hiệu lực credential. |
| revokedAt | revoked_at | timestamptz → Date | NULL | — | Thời điểm thu hồi. |
| issuedByUserId | issued_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | ADM cấp qua quy trình enrollment có kiểm soát. |
| revokedByUserId | revoked_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người thu hồi. |
| revokeReason | revoke_reason | text → string | NULL | — | Lý do thu hồi. |

**Rules:**

- Có thể giữ nhiều credential lịch sử cho một station; xác thực phải xét expiry/revocation/station.status.
- Không đưa secret dài hạn vào VITE_* hoặc public bundle. expires_at NULL hoặc > created_at.
<a id="t-access_attempts"></a>

### GATE-03 · AccessAttempt → access_attempts

**Chức năng:** Nhật ký yêu cầu quét/ngoại lệ, kể cả bị từ chối; chưa phải công chính thức.

**Logical/ORM model:** AccessAttempt / AccessAttemptOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| stationId | station_id | uuid → string | NN | FK → [gate_stations.id](#t-gate_stations) | Trạm đã được nhận diện phía server. |
| stationCredentialId | station_credential_id | uuid → string | NULL | FK → [station_credentials.id](#t-station_credentials) | Credential đã dùng; NULL khi SEC thực hiện ngoại lệ bằng user. |
| factoryId | factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Snapshot nhà máy của lượt quét. |
| eventId | event_id | uuid → string | NN | — | ID do kiosk/SEC client tạo trước gửi và giữ nguyên khi retry. |
| requestHash | request_hash | char(64) → string | NN | — | Hash payload chuẩn hóa; loại timestamp retry và secret ra khỏi dấu vân tay. |
| sourceKind | source_kind | varchar(20) → string | NN | — | QR_SCAN hoặc SEC_EXCEPTION. |
| actingUserId | acting_user_id | uuid → string | NULL | FK → [users.id](#t-users) | SEC thao tác ngoại lệ; không nhận tùy ý từ body. |
| employeeId | employee_id | uuid → string | NULL | FK → [employees.id](#t-employees) | Nhân viên đã xác minh; NULL khi không nhận diện được QR. |
| qrTokenId | qr_token_id | uuid → string | NULL | FK → [qr_tokens.id](#t-qr_tokens) | Token đã xác minh nếu có; QR sai/ngoại lệ có thể NULL. |
| tokenFingerprint | token_fingerprint | char(64) → string | NULL | — | Fingerprint mã quét, không lưu raw QR. |
| direction | direction | varchar(3) → string | NN | — | Snapshot IN/OUT của làn. |
| decision | decision | varchar(16) → string | NN; mặc định PENDING | — | PENDING, ALLOW hoặc DENIED; tách khỏi kết quả cổng. |
| reasonCode | reason_code | varchar(64) → string | NULL | — | Mã lý do hiển thị/tra cứu phù hợp. |
| receivedAt | received_at | timestamptz → Date | NN | — | Server nhận request lúc nào, khác giờ sự kiện xảy ra thực tế. |
| deadlineAt | deadline_at | timestamptz → Date | NN | — | Hạn xử lý request/dispatch theo budget đã chọn. |
| correlationId | correlation_id | uuid → string | NN | — | Mã truy vết toàn luồng. |

**Rules:**

- UNIQUE(station_id,event_id). Cùng key khác request_hash trả 409; cùng key/cùng hash đọc lại trạng thái.
- QR_SCAN cần credential/fingerprint hợp lệ theo bước xác thực; SEC_EXCEPTION cần acting_user_id/lý do có quyền.
- Payload cũ không đổi khi retry; dữ liệu trạm/nhà máy/chiều phải từ server.

**UK ghép trong schema:** (station_id, event_id).
<a id="t-gate_commands"></a>

### GATE-04 · GateCommand → gate_commands

**Chức năng:** Lệnh vật lý OPEN/CLOSE; một attempt có nhiều command nhưng tối đa một OPEN cơ sở.

**Logical/ORM model:** GateCommand / GateCommandOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| accessAttemptId | access_attempt_id | uuid → string | NN | FK → [access_attempts.id](#t-access_attempts) | Lượt nguồn của lệnh. |
| parentOpenCommandId | parent_open_command_id | uuid → string | NULL | FK → [gate_commands.id](#t-gate_commands) | OPEN mà CLOSE phụ thuộc; NULL cho OPEN. |
| integrationEndpointId | integration_endpoint_id | uuid → string | NN | FK → [integration_endpoints.id](#t-integration_endpoints) | Connector đã chọn lúc phát lệnh. |
| endpointConfigVersionId | endpoint_config_version_id | uuid → string | NN | FK → [config_versions.id](#t-config_versions) | Snapshot config connector đã dùng. |
| turnstileId | turnstile_id | varchar(100) → string | NN | — | Mã TCS được chụp lại; không đọc lại cấu hình mới khi đối soát lệnh cũ. |
| kind | kind | varchar(5) → string | NN | — | OPEN hoặc CLOSE. |
| state | state | varchar(20) → string | NN; mặc định PREPARED | — | PREPARED, DISPATCHING, ACKNOWLEDGED, CONFIRMED, REJECTED, UNKNOWN, EXPIRED hoặc CANCELLED. |
| requestSnapshot | request_snapshot | jsonb → JsonValue | NN | — | Payload kỹ thuật đã lọc secret, phục vụ truy vết/contract; không đổi nội dung lệnh. |
| deadlineAt | deadline_at | timestamptz → Date | NN | — | Hạn gửi/thực thi được adapter áp theo contract. |
| claimedBy | claimed_by | varchar(100) → string | NULL | — | Process nhận quyền gửi, không phải ID người dùng. |
| claimedAt | claimed_at | timestamptz → Date | NULL | — | Lúc CAS nhận quyền. |
| sentAt | sent_at | timestamptz → Date | NULL | — | Lần bắt đầu gửi được ghi nhận. |
| acknowledgedAt | acknowledged_at | timestamptz → Date | NULL | — | ACK tiếp nhận, chưa chắc đã mở. |
| confirmedAt | confirmed_at | timestamptz → Date | NULL | — | Xác nhận thực thi theo contract. |
| vendorReference | vendor_reference | varchar(150) → string | NULL | — | Mã tham chiếu TCS; KHÔNG phải FK local. |
| resultCode | result_code | varchar(64) → string | NULL | — | Mã kết quả đã chuẩn hóa. |
| lastError | last_error | text → string | NULL | — | Lỗi vận hành đã redaction. |

**Rules:**

- Partial UNIQUE(access_attempt_id) WHERE kind='OPEN'.
- OPEN không có parent; CLOSE phải trỏ OPEN cùng attempt: use case/trigger kiểm tra.
- CAS trạng thái/version rồi commit trước HTTP. DISPATCHING không bị tự gửi lại chỉ vì lease/process hết hạn.
- CONFIRMED ở command OPEN tương ứng OPEN_CONFIRMED của API; không đồng nghĩa công đã CONFIRMED.
<a id="t-gate_command_history"></a>

### GATE-05 · GateCommandHistory → gate_command_history

**Chức năng:** Lịch sử chuyển trạng thái append-only của command, không chỉ trạng thái cuối.

**Logical/ORM model:** GateCommandHistory / GateCommandHistoryOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| commandId | command_id | uuid → string | NN | FK → [gate_commands.id](#t-gate_commands) | Command được đổi trạng thái. |
| fromState | from_state | varchar(20) → string | NULL | — | Trạng thái trước; NULL cho lần khởi tạo. |
| toState | to_state | varchar(20) → string | NN | — | Trạng thái sau theo cùng tập state của GateCommand. |
| reasonCode | reason_code | varchar(64) → string | NN | — | Nguyên nhân chuyển trạng thái. |
| actorType | actor_type | varchar(10) → string | NN | — | USER, SYSTEM hoặc TCS. |
| actorUserId | actor_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người đối soát/thao tác khi actorType=USER. |
| deviceEventId | device_event_id | uuid → string | NULL | FK → [gate_device_events.id](#t-gate_device_events) | Callback nguồn khi actorType=TCS. |
| correlationId | correlation_id | uuid → string | NN | — | Liên kết log/request/job. |

**Rules:**

- Ghi cùng transaction với thay đổi command; không tự cho phép transition chỉ vì có history row.
- USER cần actor_user_id; TCS callback cần device_event_id; status lookup tự động có thể ghi SYSTEM.
<a id="t-gate_device_events"></a>

### GATE-06 · GateDeviceEvent → gate_device_events

**Chức năng:** Inbox sự kiện TCS đã xác thực; hỗ trợ callback trùng, sai thứ tự hoặc chưa ghép được command.

**Logical/ORM model:** GateDeviceEvent / GateDeviceEventOrmEntity. **Mức:** Theo contract TCS. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| integrationEndpointId | integration_endpoint_id | uuid → string | NN | FK → [integration_endpoints.id](#t-integration_endpoints) | TCS đã gửi sự kiện. |
| vendorEventId | vendor_event_id | varchar(150) → string | NN | — | ID ổn định do vendor cung cấp theo contract; mã ngoài, không phải FK. |
| commandId | command_id | uuid → string | NULL | FK → [gate_commands.id](#t-gate_commands) | Command đã đối chiếu được; NULL khi sự kiện chưa khớp. |
| eventType | event_type | varchar(32) → string | NN | — | COMMAND_ACK, OPEN_CONFIRMED, OPEN_REJECTED, PASSAGE_CONFIRMED, CLOSE_CONFIRMED hoặc CLOSE_REJECTED. |
| occurredAt | occurred_at | timestamptz → Date | NULL | — | Giờ sự kiện từ nguồn tin cậy; NULL nếu vendor không cung cấp. |
| receivedAt | received_at | timestamptz → Date | NN | — | Giờ server nhận để phân biệt sự kiện đến muộn. |
| payloadHash | payload_hash | char(64) → string | NN | — | Fingerprint nội dung để phát hiện ID trùng nhưng payload khác. |
| payload | payload | jsonb → JsonValue | NN | — | Bằng chứng đã lọc secret/PII không cần thiết. |
| processingState | processing_state | varchar(16) → string | NN; mặc định RECEIVED | — | RECEIVED, UNMATCHED, PROCESSED hoặc REJECTED. |
| processedAt | processed_at | timestamptz → Date | NULL | — | Giờ hoàn tất đối chiếu/xử lý. |

**Rules:**

- UNIQUE(integration_endpoint_id,vendor_event_id).
- Nếu vendor thiếu event ID, phải chốt cách nhận diện sự kiện; hash payload một mình không chứng minh hai sự kiện là một.
- Callback chưa xác thực không được dùng làm bằng chứng công. Kiểm tra command thuộc đúng TCS.

**UK ghép trong schema:** (integration_endpoint_id, vendor_event_id).
<a id="t-reconciliation_cases"></a>

### GATE-07 · ReconciliationCase → reconciliation_cases

**Chức năng:** Hồ sơ SEC/HR xử lý UNKNOWN, mất mạng hoặc ngoại lệ; là nguồn nhập MANUAL khi được xác minh.

**Logical/ORM model:** ReconciliationCase / ReconciliationCaseOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| caseKey | case_key | uuid → string | NN | UK | Khóa idempotency của hồ sơ sự cố/ngoại lệ, giữ khi gửi lại. |
| caseType | case_type | varchar(24) → string | NN | — | UNKNOWN_COMMAND, OFFLINE hoặc SEC_EXCEPTION. |
| accessAttemptId | access_attempt_id | uuid → string | NULL | FK → [access_attempts.id](#t-access_attempts) | Lượt nguồn nếu tìm được; offline có thể chưa có attempt. |
| targetCommandId | target_command_id | uuid → string | NULL | FK → [gate_commands.id](#t-gate_commands) | Lệnh cần đối soát nếu có. |
| stationId | station_id | uuid → string | NN | FK → [gate_stations.id](#t-gate_stations) | Điểm cổng liên quan. |
| employeeId | employee_id | uuid → string | NULL | FK → [employees.id](#t-employees) | Nhân viên xác minh được; hồ sơ chưa rõ có thể NULL. |
| direction | direction | varchar(3) → string | NULL | — | IN/OUT của sự cố nếu đã biết. |
| occurredAt | occurred_at | timestamptz → Date | NULL | — | Giờ sự kiện/sự cố được xác minh; khác createdAt là giờ nhập. |
| reason | reason | text → string | NN | — | Mô tả/lý do không rỗng. |
| evidenceRefs | evidence_refs | jsonb → JsonValue | NN; mặc định [] | — | Danh sách tham chiếu bằng chứng được kiểm soát; không phải FK tới file nhị phân. |
| status | status | varchar(16) → string | NN; mặc định OPEN | — | OPEN, IN_REVIEW, RESOLVED hoặc REJECTED. |
| outcome | outcome | varchar(32) → string | NULL | — | PASSED, NOT_PASSED hoặc INSUFFICIENT_EVIDENCE; tách khỏi command state. |
| openedByUserId | opened_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | SEC/HR tạo hồ sơ. |
| assignedToUserId | assigned_to_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người nhận xử lý trong scope. |
| resolvedByUserId | resolved_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người kết luận. |
| resolvedAt | resolved_at | timestamptz → Date | NULL | — | Giờ kết luận. |

**Rules:**

- Target command phải thuộc attempt/trạm tương ứng; kiểm tra use case/trigger.
- Chỉ tạo công khi đủ employee/direction/time/evidence và quyền; case RESOLVED không tự đồng nghĩa cổng đã mở.
- Đối soát attempt đã có công không được tạo thêm MANUAL cho cùng nguồn.

## 8. Từ điển ATT — Sổ công, revision và hiệu chỉnh

<a id="t-attendance_events"></a>

### ATT-01 · AttendanceEvent → attendance_events

**Chức năng:** Nguồn công đã được xác nhận, một dòng cho một lượt; head revision là metadata, không ghi đè nội dung gốc.

**Logical/ORM model:** AttendanceEvent / AttendanceEventOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK · FK ghép bên dưới | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên gốc của nguồn xác nhận; không sửa trực tiếp. |
| sourceType | source_type | varchar(10) → string | NN | — | GATE hoặc MANUAL. |
| sourceId | source_id | varchar(180) → string | NN | UK | Khóa nguồn ổn định có namespace, ví dụ ACCESS:UUID hoặc MANUAL:CASE_UUID. |
| accessAttemptId | access_attempt_id | uuid → string | NULL | UK · FK → [access_attempts.id](#t-access_attempts) | Attempt đã xác nhận; tối đa một event cho một attempt. |
| reconciliationCaseId | reconciliation_case_id | uuid → string | NULL | UK · FK → [reconciliation_cases.id](#t-reconciliation_cases) | Case chứng minh đối soát/nhập bù; tối đa một event cho một case. |
| evidenceDeviceEventId | evidence_device_event_id | uuid → string | NULL | FK → [gate_device_events.id](#t-gate_device_events) | Sự kiện thiết bị được dùng làm bằng chứng nếu có. |
| evidenceType | evidence_type | varchar(24) → string | NN | — | PASSAGE_SENSOR, OPEN_PROXY, SEC_CONFIRMED hoặc HR_MANUAL. |
| recordedByUserId | recorded_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người xác nhận/nhập bù; NULL khi nguồn hệ thống hợp lệ. |
| currentRevisionNo | current_revision_no | integer → number | NN; mặc định 1 | FK ghép bên dưới | Phiên bản hiệu lực hiện tại; dùng CAS để đổi head, mặc định 1. |

**Rules:**

- GATE cần access_attempt_id; MANUAL cần case và không có attempt chưa xác minh. Có attempt cũ thì xác nhận theo nguồn GATE thay vì tạo MANUAL trùng.
- source_id, employee_id và bằng chứng gốc bất biến; chỉnh nội dung bằng revision/correction.
- FK head (id,current_revision_no) tới revision là DEFERRABLE INITIALLY DEFERRED; tạo event và revision 1 trong cùng transaction.
- Đối soát phải kiểm tra nguồn đã tồn tại theo cả attempt/case; UNIQUE không tự suy luận hai hồ sơ vật lý là một.

**FK ghép:**

- (id, current_revision_no) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions); DEFERRABLE INITIALLY DEFERRED.
<a id="t-attendance_event_revisions"></a>

### ATT-02 · AttendanceEventRevision → attendance_event_revisions

**Chức năng:** Nội dung hiệu lực từng phiên bản; revision 1 là dữ liệu gốc, bản sau append-only.

**Logical/ORM model:** AttendanceEventRevision / AttendanceEventRevisionOrmEntity. **Mức:** Core. **PK:** (event_id, revision_no).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| eventId | event_id | uuid → string | NN | PK · FK → [attendance_events.id](#t-attendance_events) · FK ghép bên dưới | Event gốc. |
| revisionNo | revision_no | integer → number | NN | PK · FK ghép bên dưới | Số phiên bản trong event, bắt đầu 1. |
| occurredAt | occurred_at | timestamptz → Date | NN | — | Thời điểm thực tế được công nhận ở phiên bản này. |
| direction | direction | varchar(3) → string | NN | — | IN hoặc OUT của phiên bản. |
| activityFactoryId | activity_factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Nhà máy thực tế có lượt vào/ra, không nhất thiết là nhà máy phân công. |
| organizationAssignmentId | organization_assignment_id | uuid → string | NULL | FK → [employee_assignments.id](#t-employee_assignments) | Phân công tổ chức dùng để giải thích lịch sử tại thời điểm sự kiện. |
| isVoided | is_voided | boolean → boolean | NN; mặc định false | — | Phiên bản vô hiệu công này; dữ liệu gốc vẫn còn. |
| correctionId | correction_id | uuid → string | NULL | UK · FK → [attendance_corrections.id](#t-attendance_corrections) · FK ghép bên dưới | NULL ở revision 1; bản sau phải gắn correction. |
| createdByUserId | created_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | HR tạo phiên bản; NULL khi tạo revision 1 tự động. |

**Rules:**

- PK(event_id,revision_no); revision_no >= 1.
- revision_no=1 phải correction_id NULL; revision_no>1 phải correction_id NOT NULL.
- FK ghép tới Correction buộc correction cùng event và new_version; dữ liệu phiên bản không được UPDATE/DELETE tùy ý.
- Assignment phải thuộc nhân viên gốc và phù hợp thời gian; use case/trigger kiểm tra. NULL là chưa xác định tổ chức, không tự gán tổ hiện tại vào quá khứ.

**FK ghép:**

- (correction_id, event_id, revision_no) → [attendance_corrections(id, event_id, new_version)](#t-attendance_corrections).
<a id="t-attendance_corrections"></a>

### ATT-03 · AttendanceCorrection → attendance_corrections

**Chức năng:** Bằng chứng hiệu chỉnh có version, actor và lý do; nội dung trước/sau đọc từ hai revision được khóa FK.

**Logical/ORM model:** AttendanceCorrection / AttendanceCorrectionOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| eventId | event_id | uuid → string | NN | FK → [attendance_events.id](#t-attendance_events) · FK ghép bên dưới | Event được sửa. |
| expectedVersion | expected_version | integer → number | NN | FK ghép bên dưới | Phiên bản HR đã đọc; cũng là revision trước. |
| newVersion | new_version | integer → number | NN | FK ghép bên dưới | Phiên bản sau, phải bằng expectedVersion+1. |
| reason | reason | text → string | NN | — | Lý do không rỗng. |
| actorUserId | actor_user_id | uuid → string | NN | FK → [users.id](#t-users) | HR có quyền thực hiện. |
| reviewRequestId | review_request_id | uuid → string | NULL | FK → [attendance_review_requests.id](#t-attendance_review_requests) | Yêu cầu kiểm tra nguồn nếu có. |
| evidenceRefs | evidence_refs | jsonb → JsonValue | NN; mặc định [] | — | Tham chiếu bằng chứng hiệu chỉnh đã kiểm soát. |

**Rules:**

- UNIQUE(event_id,new_version); CHECK(new_version=expected_version+1), expected_version>=1.
- FK phiên bản trước có ngay; FK phiên bản mới deferred để tạo correction và revision mới cùng transaction.
- Trước/after không phải JSON tùy ý: nối revision expected/new để đọc đúng dữ liệu bất biến.
- CAS head event + insert Correction + insert revision + audit trong một transaction; conflict thì rollback.

**UK ghép trong schema:** (event_id, new_version); (id, event_id, new_version).

**FK ghép:**

- (event_id, expected_version) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions).
- (event_id, new_version) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions); DEFERRABLE INITIALLY DEFERRED.
<a id="t-presence_intervals"></a>

### ATT-04 · PresenceInterval → presence_intervals

**Chức năng:** Projection hiện tại ghép IN/OUT; có thể dựng lại từ ledger, không phải dữ liệu gốc để sửa trực tiếp.

**Logical/ORM model:** PresenceInterval / PresenceIntervalOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên của khoảng. |
| activityFactoryId | activity_factory_id | uuid → string | NN | FK → [factories.id](#t-factories) | Nhà máy hoạt động của khoảng; ghép khác nhà máy phải được gắn bất thường/đối soát. |
| inEventId | in_event_id | uuid → string | NULL | FK ghép bên dưới | Event IN, có thể thiếu. |
| inRevisionNo | in_revision_no | integer → number | NULL | FK ghép bên dưới | Đúng revision IN đã dùng khi tính. |
| outEventId | out_event_id | uuid → string | NULL | FK ghép bên dưới | Event OUT, có thể thiếu. |
| outRevisionNo | out_revision_no | integer → number | NULL | FK ghép bên dưới | Đúng revision OUT đã dùng. |
| startsAt | starts_at | timestamptz → Date | NULL | — | Giờ IN đã chiếu từ revision; NULL khi thiếu IN. |
| endsAt | ends_at | timestamptz → Date | NULL | — | Giờ OUT đã chiếu từ revision; NULL khi thiếu OUT. |
| durationSeconds | duration_seconds | integer → number | NULL | — | Số giây hiện diện hợp lệ; không dùng số giờ float; NULL khi chưa tính được. |
| status | status | varchar(16) → string | NN | — | COMPLETE, MISSING_IN, MISSING_OUT hoặc ANOMALY. |
| anomalyCodes | anomaly_codes | jsonb → JsonValue | NN; mặc định [] | — | Mảng cờ như REPEATED_IN, TOO_LONG, CROSS_FACTORY, TIME_ORDER. |
| computedAt | computed_at | timestamptz → Date | NN | — | Lần tính projection. |
| calculationVersion | calculation_version | varchar(32) → string | NN | — | Phiên bản thuật toán/policy tính để giải thích kết quả. |

**Rules:**

- FK ghép IN/OUT tới đúng revision, dùng MATCH FULL để mỗi cặp cùng NULL hoặc cùng có giá trị.
- Có ít nhất một endpoint; hai đầu không được cùng event. Mỗi IN/OUT tối đa ở một khoảng projection hiện tại.
- Nếu có starts/ends thì ends>=starts; COMPLETE cần đủ hai đầu, giờ và duration>=0.
- Kiểm tra employee, direction và thời điểm khớp revision bằng use case/trigger. Report/export không tin projection stale; dùng nguồn/rebuild phù hợp.
- Projection được rebuild; snapshot HRS tham chiếu revision bất biến, không FK vào projection mutable.

**FK ghép:**

- (in_event_id, in_revision_no) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions); MATCH FULL.
- (out_event_id, out_revision_no) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions); MATCH FULL.
<a id="t-attendance_review_requests"></a>

### ATT-05 · AttendanceReviewRequest → attendance_review_requests

**Chức năng:** Yêu cầu EMP nhờ HR kiểm tra công; cụ thể hóa form/ticket trong user flow, không thêm quyền tự sửa công.

**Logical/ORM model:** AttendanceReviewRequest / AttendanceReviewRequestOrmEntity. **Mức:** Mở rộng workflow. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên có dữ liệu cần kiểm tra. |
| submittedByUserId | submitted_by_user_id | uuid → string | NN | FK → [users.id](#t-users) | Người gửi; EMP chỉ gửi cho chính mình theo policy. |
| eventId | event_id | uuid → string | NULL | FK → [attendance_events.id](#t-attendance_events) | Event cụ thể khi đã xác định; NULL khi báo thiếu lượt. |
| periodStart | period_start | date → string (date) | NN | — | Ngày đầu kỳ cần kiểm tra, YYYY-MM-01. |
| reason | reason | text → string | NN | — | Mô tả sai lệch không rỗng. |
| status | status | varchar(16) → string | NN; mặc định OPEN | — | OPEN, IN_REVIEW hoặc CLOSED. |
| assignedHrUserId | assigned_hr_user_id | uuid → string | NULL | FK → [users.id](#t-users) | HR được giao xử lý trong scope. |
| resolution | resolution | text → string | NULL | — | Kết luận, có thể là không cần hiệu chỉnh. |
| closedByUserId | closed_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | Người kết luận. |
| closedAt | closed_at | timestamptz → Date | NULL | — | Giờ đóng yêu cầu. |

**Rules:**

- Một yêu cầu có thể dẫn tới 0..N corrections; CLOSED không đồng nghĩa đã sửa công.
- CHECK ngày đầu tháng; dữ liệu event phải thuộc employee; quyền/scope kiểm tra ở backend.

## 9. Từ điển RPT — Snapshot và giao nhận HRS

<a id="t-export_batches"></a>

### RPT-01 · ExportBatch → export_batches

**Chức năng:** Lô snapshot tháng bất biến; theo dõi gửi/ACK/thay thế, không tính lương.

**Logical/ORM model:** ExportBatch / ExportBatchOrmEntity. **Mức:** RPT. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| rowVersion | row_version | integer → number | NN; mặc định 1 | — | Version kiểm soát cập nhật đồng thời; UPDATE có điều kiện rồi tăng khi sửa. |
| periodStart | period_start | date → string (date) | NN | — | Ngày đầu tháng được xuất, theo timezone nghiệp vụ. |
| scopeType | scope_type | varchar(12) → string | NN | — | COMPANY hoặc FACTORY trong phương án thiết kế này. |
| factoryId | factory_id | uuid → string | NULL | FK → [factories.id](#t-factories) | NN khi scope FACTORY, NULL khi COMPANY. |
| batchVersion | batch_version | integer → number | NN | — | Phiên bản tăng trong cùng kỳ và scope. |
| supersedesBatchId | supersedes_batch_id | uuid → string | NULL | FK → [export_batches.id](#t-export_batches) | Lô mà phiên bản mới thay thế; có thể NULL ở bản đầu. |
| timezone | timezone | varchar(64) → string | NN; mặc định Asia/Ho_Chi_Minh | — | Múi giờ dùng để chốt kỳ, không đổi theo config tương lai. |
| windowStart | window_start | timestamptz → Date | NN | — | Instant đầu kỳ, bao gồm. |
| windowEnd | window_end | timestamptz → Date | NN | — | Instant đầu kỳ kế tiếp, loại trừ. |
| snapshotAt | snapshot_at | timestamptz → Date | NN | — | Thời điểm/ranh giới snapshot dữ liệu đã chốt. |
| schemaVersion | schema_version | varchar(32) → string | NN | — | Phiên bản wire contract HRS minh họa. |
| payloadText | payload_text | text → string | NN | — | Payload đã serialize/canonicalize thực sự gửi; giữ nguyên byte UTF-8 khi retry. |
| payloadChecksum | payload_checksum | char(64) → string | NN | — | SHA-256 theo byte payloadText và contract; không hash lại JSONB với thứ tự tùy ý. |
| recordCount | record_count | integer → number | NN | — | Số item nhân viên trong contract minh họa; không phải số lần gửi. |
| integrationEndpointId | integration_endpoint_id | uuid → string | NN | FK → [integration_endpoints.id](#t-integration_endpoints) | HRS connector của lô. |
| endpointConfigVersionId | endpoint_config_version_id | uuid → string | NN | FK → [config_versions.id](#t-config_versions) | Snapshot cấu hình/schema kết nối dùng khi tạo lô. |
| status | status | varchar(20) → string | NN; mặc định PREPARED | — | PREPARED, QUEUED, SENDING, AWAITING_ACK, ACCEPTED, PARTIAL, REJECTED, UNKNOWN hoặc FAILED. |
| dueAt | due_at | timestamptz → Date | NN | — | Mốc đối soát áp dụng; lô kỳ ban đầu là 12:00 ngày 1 tháng kế tiếp. |
| acceptedAt | accepted_at | timestamptz → Date | NULL | — | Giờ TMC đã kiểm tra đủ ACK xử lý. |
| remoteReadyAt | remote_ready_at | timestamptz → Date | NULL | — | Giờ HRS xác nhận sẵn sàng nếu contract có bằng chứng tin cậy. |
| createdByUserId | created_by_user_id | uuid → string | NULL | FK → [users.id](#t-users) | HR khởi tạo; NULL khi scheduler có audit SYSTEM. |
| correlationId | correlation_id | uuid → string | NN | — | Mã truy vết lô/jobs/delivery. |

**Rules:**

- UNIQUE NULLS NOT DISTINCT(period_start,scope_type,factory_id,batch_version). scope COMPANY cần factory NULL; FACTORY cần factory NN.
- Ngày đầu tháng; batch_version>=1; window_end>window_start; record_count>=0.
- Payload/snapshot/version/source references không thay sau khi seal; retry giữ id/payload. Chỉ metadata giao nhận/status được cập nhật.
- supersedes phải cùng kỳ/scope, version nhỏ hơn, không tạo vòng; kiểm tra transaction nghiệp vụ.
- ACCEPTED cần ACK hợp lệ, không chỉ HTTP 2xx. dueAt không tự thay accepted/ready timestamp.

**UK ghép trong schema:** (period_start, scope_type, factory_id, batch_version).
<a id="t-export_items"></a>

### RPT-02 · ExportItem → export_items

**Chức năng:** Một item nhân viên trong lô minh họa; có snapshot dữ liệu và tham chiếu nguồn bất biến.

**Logical/ORM model:** ExportItem / ExportItemOrmEntity. **Mức:** RPT. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| batchId | batch_id | uuid → string | NN | FK → [export_batches.id](#t-export_batches) | Lô sở hữu item. |
| employeeId | employee_id | uuid → string | NN | FK → [employees.id](#t-employees) | Nhân viên được xuất; không đọc hồ sơ hiện tại để tái tạo retry. |
| itemNo | item_no | integer → number | NN | — | Thứ tự ổn định trong payload. |
| externalHrIdSnapshot | external_hr_id_snapshot | varchar(64) → string | NN | — | Mã HRS tại thời điểm chốt, giữ lại dù mapping hiện tại đổi. |
| organizationSnapshot | organization_snapshot | jsonb → JsonValue | NN | — | Thông tin tổ chức lịch sử/nhãn cần cho contract, có thể nhiều phân công trong kỳ. |
| payloadSnapshot | payload_snapshot | jsonb → JsonValue | NN | — | Item đã chốt gồm nguồn IN/OUT, khoảng và cờ bất thường; không chứa QR/secret. |
| itemChecksum | item_checksum | char(64) → string | NN | — | Checksum item theo quy tắc canonical của contract. |

**Rules:**

- UNIQUE(batch_id,employee_id), UNIQUE(batch_id,item_no); item_no>=1.
- Một item/employee/batch là contract minh họa, có thể đổi nếu HRS thực tế nhận format khác.
- Chỉ INSERT sau khi chốt, không cập nhật item trong lô đã seal; thay bằng batchVersion mới.

**UK ghép trong schema:** (batch_id, employee_id); (batch_id, item_no).
<a id="t-export_item_sources"></a>

### RPT-03 · ExportItemSource → export_item_sources

**Chức năng:** Bảng nối snapshot HRS tới chính xác revision công đã dùng, kể cả lượt sát ranh giới tháng.

**Logical/ORM model:** ExportItemSource / ExportItemSourceOrmEntity. **Mức:** RPT. **PK:** (export_item_id, event_id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| exportItemId | export_item_id | uuid → string | NN | PK · FK → [export_items.id](#t-export_items) | Item sử dụng nguồn. |
| eventId | event_id | uuid → string | NN | PK · FK ghép bên dưới | Event công nguồn. |
| revisionNo | revision_no | integer → number | NN | FK ghép bên dưới | Revision bất biến đã chốt. |
| sourceRole | source_role | varchar(20) → string | NN | — | IN_PERIOD hoặc BOUNDARY_CONTEXT để phân biệt nguồn trong kỳ với nguồn giải thích ca qua tháng. |

**Rules:**

- PK(export_item_id,event_id); một item chỉ chọn một revision của cùng event.
- FK ghép(event_id,revision_no) -> attendance_event_revisions.
- Nguồn phải thuộc employee của item và đúng scope/contract; use case/trigger kiểm tra. Không FK vào PresenceInterval có thể rebuild.

**FK ghép:**

- (event_id, revision_no) → [attendance_event_revisions(event_id, revision_no)](#t-attendance_event_revisions).
<a id="t-export_attempts"></a>

### RPT-04 · ExportAttempt → export_attempts

**Chức năng:** Mỗi lần SUBMIT/STATUS với HRS; tách số lần giao nhận khỏi một lô nghiệp vụ.

**Logical/ORM model:** ExportAttempt / ExportAttemptOrmEntity. **Mức:** RPT. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| batchId | batch_id | uuid → string | NN | FK → [export_batches.id](#t-export_batches) | Lô đang xử lý. |
| jobId | job_id | uuid → string | NN | FK → [background_jobs.id](#t-background_jobs) | Job có quyền thực hiện lần gọi này. |
| attemptNo | attempt_no | integer → number | NN | — | Số thứ tự lần gọi trong batch; không mặc định bằng job.attemptCount. |
| operation | operation | varchar(10) → string | NN | — | SUBMIT hoặc STATUS. |
| idempotencyKey | idempotency_key | varchar(180) → string | NN | — | Khóa intent của batch, không tạo key mới cho mỗi retry. |
| endpointConfigVersionId | endpoint_config_version_id | uuid → string | NN | FK → [config_versions.id](#t-config_versions) | Config thực tế dùng ở lần gọi, kể cả thay credential reference theo policy. |
| jobLeaseVersion | job_lease_version | bigint → string / bigint | NN | — | Fencing/version claim của job khi thực hiện. |
| startedAt | started_at | timestamptz → Date | NN | — | Giờ bắt đầu gọi. |
| finishedAt | finished_at | timestamptz → Date | NULL | — | Giờ kết thúc chờ/phản hồi. |
| httpStatus | http_status | smallint → number | NULL | — | Mã HTTP nếu có phản hồi. |
| outcome | outcome | varchar(24) → string | NN; mặc định STARTED | — | STARTED, ACCEPTED, RECEIVED, PARTIAL, REJECTED, TIMEOUT_UNKNOWN, NETWORK_ERROR hoặc ERROR. |
| remoteReference | remote_reference | varchar(150) → string | NULL | — | Mã giao nhận HRS, không phải FK. |
| ackPeriodStart | ack_period_start | date → string (date) | NULL | — | Kỳ HRS xác nhận. |
| ackBatchVersion | ack_batch_version | integer → number | NULL | — | Phiên bản HRS xác nhận. |
| ackChecksum | ack_checksum | char(64) → string | NULL | — | Checksum HRS xác nhận. |
| ackRecordCount | ack_record_count | integer → number | NULL | — | Tổng số bản ghi theo ACK. |
| acceptedCount | accepted_count | integer → number | NULL | — | Số được nhận theo ACK, nếu contract cung cấp. |
| rejectedCount | rejected_count | integer → number | NULL | — | Số bị từ chối, nếu contract cung cấp. |
| remoteReadyAt | remote_ready_at | timestamptz → Date | NULL | — | Dấu thời gian readiness từ HRS nếu có. |
| errorCode | error_code | varchar(64) → string | NULL | — | Mã lỗi chuẩn hóa. |
| errorDetail | error_detail | text → string | NULL | — | Chi tiết đã lọc secret/PII không cần thiết. |
| correlationId | correlation_id | uuid → string | NN | — | Truy vết call/job/batch. |

**Rules:**

- UNIQUE(batch_id,attempt_no); attempt_no>=1; counts>=0 khi có; finished_at NULL hoặc >= started_at.
- ACK chỉ cập nhật batch ACCEPTED sau khi đối chiếu đủ trường theo contract.
- TIMEOUT_UNKNOWN không có nghĩa HRS chưa xử lý; retry chỉ khi contract cho phép.

**UK ghép trong schema:** (batch_id, attempt_no).

## 10. Từ điển OPS — Outbox và hàng chờ nền

<a id="t-outbox_messages"></a>

### OPS-01 · OutboxMessage → outbox_messages

**Chức năng:** Ý định gửi bền vững, tạo cùng transaction với nghiệp vụ; không đồng nhất với WAL.

**Logical/ORM model:** OutboxMessage / OutboxMessageOrmEntity. **Mức:** RPT / tích hợp. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| messageType | message_type | varchar(50) → string | NN | — | HRS_EXPORT hoặc loại thông báo đã đăng ký. |
| dedupeKey | dedupe_key | varchar(180) → string | NN | UK | Khóa ý định gửi duy nhất, ví dụ HRS_EXPORT:BATCH_UUID. |
| exportBatchId | export_batch_id | uuid → string | NULL | FK → [export_batches.id](#t-export_batches) | Lô nguồn nếu là HRS_EXPORT. |
| payload | payload | jsonb → JsonValue | NN | — | Tham chiếu/dữ liệu chuyển tiếp tối thiểu; payload HRS đầy đủ đọc từ snapshot batch. |
| correlationId | correlation_id | uuid → string | NN | — | Liên kết nghiệp vụ và worker. |

**Rules:**

- HRS_EXPORT bắt buộc export_batch_id; partial UNIQUE(export_batch_id) cho HRS_EXPORT.
- Trạng thái chạy nằm trong background_jobs, ACK nghiệp vụ nằm trong export_batches; tránh ba cột status mâu thuẫn.
- Tạo Batch/Outbox/Job trong cùng transaction; nếu dùng relay tạo Job sau, có cơ chế tìm outbox chưa có job.
<a id="t-background_jobs"></a>

### OPS-02 · BackgroundJob → background_jobs

**Chức năng:** Hàng chờ DB cho export, đối soát, rebuild projection và thông báo.

**Logical/ORM model:** BackgroundJob / BackgroundJobOrmEntity. **Mức:** Core. **PK:** (id).

| Property TS | Column PostgreSQL | SQL → TS type | NULL / default | Khóa | Ý nghĩa chức năng |
|---|---|---|---|---|---|
| id | id | uuid → string | NN; mặc định UUID do API tạo | PK | Định danh nội bộ bất biến của bản ghi; API tạo UUID trước khi ghi. |
| createdAt | created_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm server ghi bản ghi lần đầu; lưu instant, hiển thị theo múi giờ nghiệp vụ. |
| updatedAt | updated_at | timestamptz → Date | NN; mặc định now() | — | Thời điểm cập nhật metadata/trạng thái gần nhất; ứng dụng phải cập nhật. |
| jobKey | job_key | varchar(180) → string | NN | UK | Khóa việc ổn định, không tạo việc mới mỗi lần retry. |
| jobType | job_type | varchar(32) → string | NN | — | HRS_EXPORT, GATE_RECONCILIATION, ATT_REBUILD hoặc NOTIFY. |
| outboxMessageId | outbox_message_id | uuid → string | NULL | UK · FK → [outbox_messages.id](#t-outbox_messages) | Ý định gửi nguồn; tối đa một job cho mỗi outbox. |
| gateCommandId | gate_command_id | uuid → string | NULL | FK → [gate_commands.id](#t-gate_commands) | Command cần đối soát khi jobType=GATE_RECONCILIATION. |
| employeeId | employee_id | uuid → string | NULL | FK → [employees.id](#t-employees) | Employee cần rebuild projection khi jobType=ATT_REBUILD. |
| payload | payload | jsonb → JsonValue | NN; mặc định {} | — | Tham số không bí mật; reference bên trong JSON không phải FK. |
| state | state | varchar(16) → string | NN; mặc định PENDING | — | PENDING, PROCESSING, RETRY_WAIT, SUCCEEDED hoặc FAILED. |
| nextRunAt | next_run_at | timestamptz → Date | NN; mặc định now() | — | Khi nào được claim/chạy lại. |
| attemptCount | attempt_count | integer → number | NN; mặc định 0 | — | Số lần worker nhận chạy; không phải số event công. |
| maxAttempts | max_attempts | integer → number | NN | — | Giới hạn retry theo loại việc; cấu hình >0, không gán số bắt buộc của đề. |
| lockedBy | locked_by | varchar(100) → string | NULL | — | Worker đang giữ claim. |
| lockedUntil | locked_until | timestamptz → Date | NULL | — | Lease điều phối job. |
| leaseVersion | lease_version | bigint → string / bigint | NN; mặc định 0 | — | Fencing token tăng mỗi lần claim để chặn worker cũ ghi đè. |
| startedAt | started_at | timestamptz → Date | NULL | — | Lúc thực thi gần nhất. |
| finishedAt | finished_at | timestamptz → Date | NULL | — | Khi job hoàn tất/kết thúc theo state. |
| lastErrorCode | last_error_code | varchar(64) → string | NULL | — | Lỗi gần nhất. |
| lastErrorDetail | last_error_detail | text → string | NULL | — | Lỗi đã redaction để vận hành. |
| correlationId | correlation_id | uuid → string | NN | — | Liên kết trace. |

**Rules:**

- HRS_EXPORT cần outbox; GATE_RECONCILIATION cần gate_command_id; ATT_REBUILD cần employee_id. Kiểm tra loại đích/nhất quán dữ liệu.
- Claim ngắn bằng DB, commit trước HTTP; điều kiện owner/leaseVersion khi ghi kết quả.
- Lease hết hạn cho phép điều phối việc, không chứng minh tác động ngoài chưa xảy ra. Với command DISPATCHING chỉ đối soát, không tự OPEN lại.
- Job HRS_EXPORT chỉ SUCCEEDED khi đạt ACK nghiệp vụ đã định; PARTIAL/UNKNOWN không tự thành công.

## 11. Entity, ORM entity và property quan hệ

Mỗi dòng trong từ điển là scalar property có cột lưu trữ. Property điều hướng như user.roleAssignments, station.commands hoặc batch.items có thể được khai báo ở ORM khi phù hợp; bản thân chúng không phải thêm một cột JSON/array chứa mọi bản ghi con.

- Logical/domain entity giữ quy tắc thuần; ORM entity mang decorators/mapping ở api/src/modules/MODULE/infrastructure/persistence.
- FK liên module có thể tạo trong migration qua scalar IDs, không bắt domain ATT import domain/ORM GATE để chứa một sourceId.
- Join N:N dùng role_permissions, không lưu permissionIds JSON trên Role.
- TypeORM mapping tường minh name: snake_case; không trả ORM entity trực tiếp cho client thay HTTP DTO.
- Các quan hệ không cần eager-load toàn đồ thị; report/query lấy đúng projection và quyền.

Ví dụ ORM entity đầy đủ cho bảng roles; domain Role vẫn là lớp thuần riêng:

~~~typescript
import {
  Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn,
} from "typeorm";

@Entity({ name: "roles" })
export class RoleOrmEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 32, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "row_version", type: "integer", default: 1 })
  rowVersion!: number;
}
~~~

UUID được API tạo trước insert trong lựa chọn này. rowVersion chỉ là cột; code cập nhật phải thực sự đặt điều kiện expected version rồi tăng version, không mặc định có CAS chỉ vì dùng decorator. Direct SQL/CAS cũng phải cập nhật updated_at phù hợp. [TypeORM — Entities](https://typeorm.io/docs/entity/entities/).

## 12. Registry FK và cardinality đầy đủ

Bảng dưới liệt kê từng ràng buộc FK vật lý, bao gồm FK đơn và ghép. Cardinality thể hiện theo PK/UK trực tiếp; rules nghiệp vụ có thể siết thêm. “1 : 0..N” nghĩa mỗi con có một cha, mỗi cha có thể chưa có hoặc có nhiều con; “0..1” phía cha nghĩa FK con được NULL.

Mặc định ON DELETE NO ACTION. Mã FK-xxx là mã tra cứu của tài liệu, không phải tên constraint do framework tự sinh.

| Mã | Bảng/cột con | Bảng/cột cha | Cha : con | Ghi chú |
|---|---|---|---|---|
| FK-001 | [departments](#t-departments) (factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-002 | [teams](#t-teams) (department_id) | [departments](#t-departments) (id) | 1 : 0..N | Immediate |
| FK-003 | [config_versions](#t-config_versions) (supersedes_id) | [config_versions](#t-config_versions) (id) | 0..1 : 0..N | Immediate |
| FK-004 | [config_versions](#t-config_versions) (created_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-005 | [integration_endpoints](#t-integration_endpoints) (factory_id) | [factories](#t-factories) (id) | 0..1 : 0..N | Immediate |
| FK-006 | [integration_endpoints](#t-integration_endpoints) (config_version_id) | [config_versions](#t-config_versions) (id) | 1 : 0..N | Immediate |
| FK-007 | [users](#t-users) (employee_id) | [employees](#t-employees) (id) | 1 : 0..1 | Immediate |
| FK-008 | [role_permissions](#t-role_permissions) (role_id) | [roles](#t-roles) (id) | 1 : 0..N | Immediate |
| FK-009 | [role_permissions](#t-role_permissions) (permission_id) | [permissions](#t-permissions) (id) | 1 : 0..N | Immediate |
| FK-010 | [user_role_assignments](#t-user_role_assignments) (user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-011 | [user_role_assignments](#t-user_role_assignments) (role_id) | [roles](#t-roles) (id) | 1 : 0..N | Immediate |
| FK-012 | [user_role_assignments](#t-user_role_assignments) (factory_id) | [factories](#t-factories) (id) | 0..1 : 0..N | Immediate |
| FK-013 | [user_role_assignments](#t-user_role_assignments) (department_id) | [departments](#t-departments) (id) | 0..1 : 0..N | Immediate |
| FK-014 | [user_role_assignments](#t-user_role_assignments) (team_id) | [teams](#t-teams) (id) | 0..1 : 0..N | Immediate |
| FK-015 | [user_role_assignments](#t-user_role_assignments) (assigned_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-016 | [user_role_assignments](#t-user_role_assignments) (revoked_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-017 | [user_sessions](#t-user_sessions) (user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-018 | [audit_entries](#t-audit_entries) (actor_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-019 | [audit_entries](#t-audit_entries) (actor_station_id) | [gate_stations](#t-gate_stations) (id) | 0..1 : 0..N | Immediate |
| FK-020 | [audit_entries](#t-audit_entries) (factory_id) | [factories](#t-factories) (id) | 0..1 : 0..N | Immediate |
| FK-021 | [employee_assignments](#t-employee_assignments) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-022 | [employee_assignments](#t-employee_assignments) (factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-023 | [employee_assignments](#t-employee_assignments) (department_id) | [departments](#t-departments) (id) | 0..1 : 0..N | Immediate |
| FK-024 | [employee_assignments](#t-employee_assignments) (team_id) | [teams](#t-teams) (id) | 0..1 : 0..N | Immediate |
| FK-025 | [employee_assignments](#t-employee_assignments) (assigned_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-026 | [employee_assignments](#t-employee_assignments) (department_id, factory_id) | [departments](#t-departments) (id, factory_id) | 0..1 : 0..N | Immediate |
| FK-027 | [employee_assignments](#t-employee_assignments) (team_id, department_id) | [teams](#t-teams) (id, department_id) | 0..1 : 0..N | Immediate |
| FK-028 | [access_grants](#t-access_grants) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-029 | [access_grants](#t-access_grants) (factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-030 | [access_grants](#t-access_grants) (granted_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-031 | [access_grants](#t-access_grants) (revoked_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-032 | [qr_credentials](#t-qr_credentials) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-033 | [qr_credentials](#t-qr_credentials) (issued_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-034 | [qr_credentials](#t-qr_credentials) (revoked_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-035 | [qr_tokens](#t-qr_tokens) (credential_id) | [qr_credentials](#t-qr_credentials) (id) | 1 : 0..N | Immediate |
| FK-036 | [qr_tokens](#t-qr_tokens) (signing_key_id) | [qr_signing_keys](#t-qr_signing_keys) (key_id) | 1 : 0..N | Immediate |
| FK-037 | [qr_tokens](#t-qr_tokens) (issued_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-038 | [qr_redemptions](#t-qr_redemptions) (token_id) | [qr_tokens](#t-qr_tokens) (id) | 1 : 0..1 | Immediate |
| FK-039 | [qr_redemptions](#t-qr_redemptions) (access_attempt_id) | [access_attempts](#t-access_attempts) (id) | 1 : 0..1 | Immediate |
| FK-040 | [gate_stations](#t-gate_stations) (factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-041 | [gate_stations](#t-gate_stations) (integration_endpoint_id) | [integration_endpoints](#t-integration_endpoints) (id) | 1 : 0..N | Immediate |
| FK-042 | [gate_stations](#t-gate_stations) (config_version_id) | [config_versions](#t-config_versions) (id) | 1 : 0..N | Immediate |
| FK-043 | [station_credentials](#t-station_credentials) (station_id) | [gate_stations](#t-gate_stations) (id) | 1 : 0..N | Immediate |
| FK-044 | [station_credentials](#t-station_credentials) (issued_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-045 | [station_credentials](#t-station_credentials) (revoked_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-046 | [access_attempts](#t-access_attempts) (station_id) | [gate_stations](#t-gate_stations) (id) | 1 : 0..N | Immediate |
| FK-047 | [access_attempts](#t-access_attempts) (station_credential_id) | [station_credentials](#t-station_credentials) (id) | 0..1 : 0..N | Immediate |
| FK-048 | [access_attempts](#t-access_attempts) (factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-049 | [access_attempts](#t-access_attempts) (acting_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-050 | [access_attempts](#t-access_attempts) (employee_id) | [employees](#t-employees) (id) | 0..1 : 0..N | Immediate |
| FK-051 | [access_attempts](#t-access_attempts) (qr_token_id) | [qr_tokens](#t-qr_tokens) (id) | 0..1 : 0..N | Immediate |
| FK-052 | [gate_commands](#t-gate_commands) (access_attempt_id) | [access_attempts](#t-access_attempts) (id) | 1 : 0..N | Immediate |
| FK-053 | [gate_commands](#t-gate_commands) (parent_open_command_id) | [gate_commands](#t-gate_commands) (id) | 0..1 : 0..N | Immediate |
| FK-054 | [gate_commands](#t-gate_commands) (integration_endpoint_id) | [integration_endpoints](#t-integration_endpoints) (id) | 1 : 0..N | Immediate |
| FK-055 | [gate_commands](#t-gate_commands) (endpoint_config_version_id) | [config_versions](#t-config_versions) (id) | 1 : 0..N | Immediate |
| FK-056 | [gate_command_history](#t-gate_command_history) (command_id) | [gate_commands](#t-gate_commands) (id) | 1 : 0..N | Immediate |
| FK-057 | [gate_command_history](#t-gate_command_history) (actor_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-058 | [gate_command_history](#t-gate_command_history) (device_event_id) | [gate_device_events](#t-gate_device_events) (id) | 0..1 : 0..N | Immediate |
| FK-059 | [gate_device_events](#t-gate_device_events) (integration_endpoint_id) | [integration_endpoints](#t-integration_endpoints) (id) | 1 : 0..N | Immediate |
| FK-060 | [gate_device_events](#t-gate_device_events) (command_id) | [gate_commands](#t-gate_commands) (id) | 0..1 : 0..N | Immediate |
| FK-061 | [reconciliation_cases](#t-reconciliation_cases) (access_attempt_id) | [access_attempts](#t-access_attempts) (id) | 0..1 : 0..N | Immediate |
| FK-062 | [reconciliation_cases](#t-reconciliation_cases) (target_command_id) | [gate_commands](#t-gate_commands) (id) | 0..1 : 0..N | Immediate |
| FK-063 | [reconciliation_cases](#t-reconciliation_cases) (station_id) | [gate_stations](#t-gate_stations) (id) | 1 : 0..N | Immediate |
| FK-064 | [reconciliation_cases](#t-reconciliation_cases) (employee_id) | [employees](#t-employees) (id) | 0..1 : 0..N | Immediate |
| FK-065 | [reconciliation_cases](#t-reconciliation_cases) (opened_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-066 | [reconciliation_cases](#t-reconciliation_cases) (assigned_to_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-067 | [reconciliation_cases](#t-reconciliation_cases) (resolved_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-068 | [attendance_events](#t-attendance_events) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-069 | [attendance_events](#t-attendance_events) (access_attempt_id) | [access_attempts](#t-access_attempts) (id) | 0..1 : 0..1 | Immediate |
| FK-070 | [attendance_events](#t-attendance_events) (reconciliation_case_id) | [reconciliation_cases](#t-reconciliation_cases) (id) | 0..1 : 0..1 | Immediate |
| FK-071 | [attendance_events](#t-attendance_events) (evidence_device_event_id) | [gate_device_events](#t-gate_device_events) (id) | 0..1 : 0..N | Immediate |
| FK-072 | [attendance_events](#t-attendance_events) (recorded_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-073 | [attendance_events](#t-attendance_events) (id, current_revision_no) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 1 : 0..1 | Deferred cuối transaction |
| FK-074 | [attendance_event_revisions](#t-attendance_event_revisions) (event_id) | [attendance_events](#t-attendance_events) (id) | 1 : 0..N | Immediate |
| FK-075 | [attendance_event_revisions](#t-attendance_event_revisions) (activity_factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-076 | [attendance_event_revisions](#t-attendance_event_revisions) (organization_assignment_id) | [employee_assignments](#t-employee_assignments) (id) | 0..1 : 0..N | Immediate |
| FK-077 | [attendance_event_revisions](#t-attendance_event_revisions) (correction_id) | [attendance_corrections](#t-attendance_corrections) (id) | 0..1 : 0..1 | Immediate |
| FK-078 | [attendance_event_revisions](#t-attendance_event_revisions) (created_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-079 | [attendance_event_revisions](#t-attendance_event_revisions) (correction_id, event_id, revision_no) | [attendance_corrections](#t-attendance_corrections) (id, event_id, new_version) | 0..1 : 0..1 | Immediate |
| FK-080 | [attendance_corrections](#t-attendance_corrections) (event_id) | [attendance_events](#t-attendance_events) (id) | 1 : 0..N | Immediate |
| FK-081 | [attendance_corrections](#t-attendance_corrections) (actor_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-082 | [attendance_corrections](#t-attendance_corrections) (review_request_id) | [attendance_review_requests](#t-attendance_review_requests) (id) | 0..1 : 0..N | Immediate |
| FK-083 | [attendance_corrections](#t-attendance_corrections) (event_id, expected_version) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 1 : 0..N | Immediate |
| FK-084 | [attendance_corrections](#t-attendance_corrections) (event_id, new_version) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 1 : 0..1 | Deferred cuối transaction |
| FK-085 | [presence_intervals](#t-presence_intervals) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-086 | [presence_intervals](#t-presence_intervals) (activity_factory_id) | [factories](#t-factories) (id) | 1 : 0..N | Immediate |
| FK-087 | [presence_intervals](#t-presence_intervals) (in_event_id, in_revision_no) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 0..1 : 0..N | Immediate; MATCH FULL: cặp NULL/có giá trị đồng thời |
| FK-088 | [presence_intervals](#t-presence_intervals) (out_event_id, out_revision_no) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 0..1 : 0..N | Immediate; MATCH FULL: cặp NULL/có giá trị đồng thời |
| FK-089 | [attendance_review_requests](#t-attendance_review_requests) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-090 | [attendance_review_requests](#t-attendance_review_requests) (submitted_by_user_id) | [users](#t-users) (id) | 1 : 0..N | Immediate |
| FK-091 | [attendance_review_requests](#t-attendance_review_requests) (event_id) | [attendance_events](#t-attendance_events) (id) | 0..1 : 0..N | Immediate |
| FK-092 | [attendance_review_requests](#t-attendance_review_requests) (assigned_hr_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-093 | [attendance_review_requests](#t-attendance_review_requests) (closed_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-094 | [export_batches](#t-export_batches) (factory_id) | [factories](#t-factories) (id) | 0..1 : 0..N | Immediate |
| FK-095 | [export_batches](#t-export_batches) (supersedes_batch_id) | [export_batches](#t-export_batches) (id) | 0..1 : 0..N | Immediate |
| FK-096 | [export_batches](#t-export_batches) (integration_endpoint_id) | [integration_endpoints](#t-integration_endpoints) (id) | 1 : 0..N | Immediate |
| FK-097 | [export_batches](#t-export_batches) (endpoint_config_version_id) | [config_versions](#t-config_versions) (id) | 1 : 0..N | Immediate |
| FK-098 | [export_batches](#t-export_batches) (created_by_user_id) | [users](#t-users) (id) | 0..1 : 0..N | Immediate |
| FK-099 | [export_items](#t-export_items) (batch_id) | [export_batches](#t-export_batches) (id) | 1 : 0..N | Immediate |
| FK-100 | [export_items](#t-export_items) (employee_id) | [employees](#t-employees) (id) | 1 : 0..N | Immediate |
| FK-101 | [export_item_sources](#t-export_item_sources) (export_item_id) | [export_items](#t-export_items) (id) | 1 : 0..N | Immediate |
| FK-102 | [export_item_sources](#t-export_item_sources) (event_id, revision_no) | [attendance_event_revisions](#t-attendance_event_revisions) (event_id, revision_no) | 1 : 0..N | Immediate |
| FK-103 | [export_attempts](#t-export_attempts) (batch_id) | [export_batches](#t-export_batches) (id) | 1 : 0..N | Immediate |
| FK-104 | [export_attempts](#t-export_attempts) (job_id) | [background_jobs](#t-background_jobs) (id) | 1 : 0..N | Immediate |
| FK-105 | [export_attempts](#t-export_attempts) (endpoint_config_version_id) | [config_versions](#t-config_versions) (id) | 1 : 0..N | Immediate |
| FK-106 | [outbox_messages](#t-outbox_messages) (export_batch_id) | [export_batches](#t-export_batches) (id) | 0..1 : 0..N | Immediate |
| FK-107 | [background_jobs](#t-background_jobs) (outbox_message_id) | [outbox_messages](#t-outbox_messages) (id) | 0..1 : 0..1 | Immediate |
| FK-108 | [background_jobs](#t-background_jobs) (gate_command_id) | [gate_commands](#t-gate_commands) (id) | 0..1 : 0..N | Immediate |
| FK-109 | [background_jobs](#t-background_jobs) (employee_id) | [employees](#t-employees) (id) | 0..1 : 0..N | Immediate |

## 13. Constraint và index quan trọng

Các đoạn SQL dưới đây minh họa những constraint khó bỏ sót **sau khi các bảng/cột đã được tạo**. Đây không phải script CREATE TABLE đầy đủ để chạy lên database; khi viết migration, chọn một tên/constraint tương đương, không tạo chồng các UK đã có.

### 13.1. Idempotency, QR và một OPEN cơ sở

~~~sql
CREATE UNIQUE INDEX uq_attempt_station_event
    ON access_attempts (station_id, event_id);

CREATE UNIQUE INDEX uq_one_open_per_attempt
    ON gate_commands (access_attempt_id)
    WHERE kind = 'OPEN';

CREATE UNIQUE INDEX uq_active_qr_credential
    ON qr_credentials (employee_id)
    WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX uq_unrevoked_access_grant
    ON access_grants (employee_id, factory_id)
    WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX uq_hrs_outbox_per_batch
    ON outbox_messages (export_batch_id)
    WHERE message_type = 'HRS_EXPORT';
~~~

PK qr_redemptions(token_id), UK access_attempt_id, UK attendance_events.source_id và UK access_attempt_id/case_id là các tầng chống trùng khác nhau. Chỉ source key đã biết mới được bảo vệ; DB không tự nhận biết hai hồ sơ con người thực ra là cùng một lần đi qua.

Partial index áp dụng uniqueness cho các dòng thỏa điều kiện; không thay validation trạng thái và quyền. [PostgreSQL — Partial Indexes](https://www.postgresql.org/docs/18/indexes-partial.html).

### 13.2. Scope có NULL và UK lô tháng

~~~sql
ALTER TABLE user_role_assignments
ADD CONSTRAINT ck_role_scope CHECK (
    (scope_type IN ('SELF', 'GLOBAL')
        AND factory_id IS NULL AND department_id IS NULL AND team_id IS NULL)
 OR (scope_type = 'FACTORY'
        AND factory_id IS NOT NULL AND department_id IS NULL AND team_id IS NULL)
 OR (scope_type = 'DEPARTMENT'
        AND factory_id IS NULL AND department_id IS NOT NULL AND team_id IS NULL)
 OR (scope_type = 'TEAM'
        AND factory_id IS NULL AND department_id IS NULL AND team_id IS NOT NULL)
);

CREATE UNIQUE INDEX uq_unrevoked_role_scope
    ON user_role_assignments
       (user_id, role_id, scope_type, factory_id, department_id, team_id)
    NULLS NOT DISTINCT
    WHERE revoked_at IS NULL;

ALTER TABLE export_batches
ADD CONSTRAINT uq_export_scope_version
    UNIQUE NULLS NOT DISTINCT
      (period_start, scope_type, factory_id, batch_version);

ALTER TABLE export_batches
ADD CONSTRAINT ck_export_scope CHECK (
    (scope_type = 'COMPANY' AND factory_id IS NULL)
 OR (scope_type = 'FACTORY' AND factory_id IS NOT NULL)
);
~~~

Không dùng UNIQUE thông thường rồi nghĩ các dòng cùng scope GLOBAL/factory NULL đã bị chống trùng. Với lựa chọn một assignment/grant chưa thu hồi cho mỗi khóa, cần thu hồi/đóng bản cũ đúng policy trước khi tạo bản mới cùng khóa. Scope GLOBAL chỉ được cấp có kiểm soát; NULL trong một FK khác không tự mang nghĩa GLOBAL. [PostgreSQL — Unique Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html).

### 13.3. Sổ công bất biến và FK deferred

Các bảng phải có PK/UK như từ điển trước khi thêm FK. Đặc biệt Correction cần UK(id,event_id,new_version) cho FK binding.

~~~sql
ALTER TABLE attendance_events
ADD CONSTRAINT fk_event_current_revision
    FOREIGN KEY (id, current_revision_no)
    REFERENCES attendance_event_revisions (event_id, revision_no)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE attendance_corrections
ADD CONSTRAINT ck_correction_version CHECK (
    expected_version >= 1 AND new_version = expected_version + 1
);

ALTER TABLE attendance_corrections
ADD CONSTRAINT fk_correction_previous_revision
    FOREIGN KEY (event_id, expected_version)
    REFERENCES attendance_event_revisions (event_id, revision_no);

ALTER TABLE attendance_corrections
ADD CONSTRAINT fk_correction_new_revision
    FOREIGN KEY (event_id, new_version)
    REFERENCES attendance_event_revisions (event_id, revision_no)
    DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE attendance_event_revisions
ADD CONSTRAINT ck_revision_origin CHECK (
    (revision_no = 1 AND correction_id IS NULL)
 OR (revision_no > 1 AND correction_id IS NOT NULL)
);

ALTER TABLE attendance_event_revisions
ADD CONSTRAINT fk_revision_correction_binding
    FOREIGN KEY (correction_id, event_id, revision_no)
    REFERENCES attendance_corrections (id, event_id, new_version);
~~~

**Tại sao deferred?** Khi tạo mới, Event cần trỏ revision 1 trong khi Revision cần trỏ Event. Khi sửa, head/correction cần trỏ revision mới chưa được insert ở bước đầu. Kiểm tra cuối transaction cho phép tạo đủ các dòng rồi commit; nếu còn thiếu hoặc lệch FK thì commit thất bại.

FK deferred không có nghĩa được để dữ liệu lệch sau commit. FK bình thường khác vẫn được kiểm tra theo khai báo; không tắt toàn bộ constraints để nhập công. [PostgreSQL — CREATE TABLE / DEFERRABLE](https://www.postgresql.org/docs/18/sql-createtable.html).

### 13.4. Endpoint projection và dữ liệu thời gian

~~~sql
ALTER TABLE presence_intervals
ADD CONSTRAINT fk_presence_in_revision
    FOREIGN KEY (in_event_id, in_revision_no)
    REFERENCES attendance_event_revisions (event_id, revision_no)
    MATCH FULL;

ALTER TABLE presence_intervals
ADD CONSTRAINT fk_presence_out_revision
    FOREIGN KEY (out_event_id, out_revision_no)
    REFERENCES attendance_event_revisions (event_id, revision_no)
    MATCH FULL;

CREATE UNIQUE INDEX uq_presence_in_event
    ON presence_intervals (in_event_id)
    WHERE in_event_id IS NOT NULL;

CREATE UNIQUE INDEX uq_presence_out_event
    ON presence_intervals (out_event_id)
    WHERE out_event_id IS NOT NULL;

ALTER TABLE presence_intervals
ADD CONSTRAINT ck_presence_endpoint CHECK (
    (in_event_id IS NOT NULL OR out_event_id IS NOT NULL)
    AND (in_event_id IS NULL OR out_event_id IS NULL OR in_event_id <> out_event_id)
    AND (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at)
    AND (duration_seconds IS NULL OR duration_seconds >= 0)
);
~~~

Bổ sung CHECK cho COMPLETE đủ endpoint/time/duration, cặp timestamp khớp đầu IN/OUT khi có, version/count dương, enum đúng tập giá trị và các lý do bắt buộc không rỗng. Đối chiếu timestamp/direction/employee với **dòng revision khác** cần service/constraint trigger; CHECK đơn giản không được coi là cơ chế query bảng khác.

Các khoảng phân công của một employee không được chồng nhau. Có thể khóa row employee rồi kiểm tra/ghi trong transaction. Nếu chọn bảo vệ trực tiếp ở DB bằng range/exclusion, cần migration và môi trường cho extension btree_gist:

~~~sql
-- Tùy chọn triển khai, không tự cài extension trong lần tạo tài liệu này.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE employee_assignments
ADD CONSTRAINT ex_assignment_no_overlap
    EXCLUDE USING gist (
        employee_id WITH =,
        tstzrange(valid_from, valid_to, '[)') WITH &&
    );
~~~

valid_to NULL biểu diễn khoảng mở; CHECK valid_to>valid_from khi có vẫn cần. Đây là phương án tăng cường, không phải extension được đề gốc bắt buộc. [PostgreSQL — Range Types](https://www.postgresql.org/docs/18/rangetypes.html).

### 13.5. Index phục vụ các query chính

PK/UK đã có index thích hợp; FK phía con không mặc định tự được index. Danh sách sau là ưu tiên cho query/cleanup/đối soát thực tế, cần đo và tránh tạo trùng index có cùng prefix hữu ích.

| Nhóm | Index đề xuất ngoài PK/UK | Query phục vụ |
|---|---|---|
| IAM | user_sessions(user_id), (expires_at); role_assignments(user_id,valid_from) | Phiên/quyền hiện hành, thu hồi và cleanup có policy |
| Tổ chức | employee_assignments(employee_id,valid_from,valid_to); team/department FK | Lấy phân công đúng thời điểm, scope lịch sử |
| QR | qr_tokens(credential_id,expires_at), (expires_at) | Cấp mã, kiểm tra/cleanup đúng quan hệ |
| Attempt | (factory_id,received_at DESC), (employee_id,received_at DESC) | Nhật ký cổng theo scope, lịch sử cá nhân |
| Command | partial (state,deadline_at) cho PREPARED/DISPATCHING/UNKNOWN; FK attempt | Tìm lệnh quá hạn/chưa rõ, đọc kết quả request |
| Case | (station_id,status,created_at), (assigned_to_user_id,status) | Backlog SEC/HR |
| Ledger | attendance_events(employee_id); revisions(activity_factory_id,occurred_at) | Sự kiện cá nhân, khoảng thời gian theo nhà máy; join head đúng revision |
| Projection | presence_intervals(employee_id,starts_at), (activity_factory_id,starts_at) | Báo cáo/tra cứu; không dùng để thay ledger |
| Batch | partial (status,due_at) cho lô chưa ACCEPTED | Cảnh báo trước hạn đối soát |
| Sources | export_item_sources(event_id,revision_no) | Truy vết/purge an toàn từ nguồn sang snapshot |
| Delivery | export_attempts(job_id), UK(batch_id,attempt_no) | Theo dõi lần giao nhận và job |
| Job | partial (next_run_at,created_at) cho PENDING/RETRY_WAIT; (locked_until) khi PROCESSING | Worker claim và recovery |
| Audit | (factory_id,created_at), (actor_user_id,created_at), (object_type,object_id) | Điều tra trong phạm vi và truy vết đối tượng |

## 14. Quy tắc vượt ra ngoài một FK/CHECK

| Quy tắc | DB bảo vệ được phần nào? | Use case/transaction còn phải làm |
|---|---|---|
| QR bị dùng lại | PK token redemption; UK attempt | Xác minh chữ ký, expiry, key/credential/employee/grant; ghi redemption khi đúng bước |
| Request trùng | UK(station,event), requestHash | Chuẩn hóa nội dung, kiểm tra chủ trạm và trả lại kết quả cũ; không re-consume token |
| Một OPEN cơ sở | Partial UNIQUE attempt | CAS, deadline, quyền hiện hành và hiểu trạng thái TCS; không đồng nhất DB với thực thi vật lý |
| FK thiết bị đúng nhà máy | Endpoint/station tồn tại | Endpoint phải là TCS cùng factory; config/version đã dùng được snapshot |
| Nhập MANUAL / đối soát | UK source/attempt/case; FK bằng chứng | Xác minh cùng lượt vật lý, employee/direction/time, quyền SEC/HR; không tạo nguồn mới để bỏ qua trùng |
| Công hiệu lực | FK head, UK revision, correction binding | CAS head, append revisions/audit; report bỏ bản voided theo policy |
| Pairing | FK tới revision cụ thể; CHECK endpoint/time cơ bản | IN/OUT đúng hướng, cùng employee, flags qua nhà máy/qua tháng, không cộng khoảng bất thường tùy ý |
| Snapshot HRS | FK nguồn revision bất biến; UK scope/version | Chọn dữ liệu nhất quán, seal payload/item/source cùng nhau; không retry bằng dữ liệu live |
| ACK xử lý | Lưu metadata/kết quả nhận | Xác thực nguồn, đối chiếu kỳ/version/checksum/count/partial; timestamp sẵn sàng cần bằng chứng contract |
| Job claim | jobKey/lease version, conditional update | Backoff/budget, chống worker cũ ghi đè; nhận biết tác động ngoài có thể đã xảy ra |
| RBAC/scope | FK scope tồn tại, CHECK shape đúng | Đọc permission hiện hành; áp điều kiện vào query và object action, không tin filter client |
| Cấu hình/secret | FK config version; cột secret reference | Validate payload, kiểm soát nơi giữ key, rotation/revocation và redaction |
| Bảo vệ lịch sử | FK NO ACTION, append-only version/snapshot | Quyền DB, retention/giữ chứng cứ và quy trình xử lý đã duyệt; không cascade xóa dấu vết |

**Quy ước scope minh họa:** SEC lọc theo nhà máy hoạt động của gate; SUP theo phân công tổ lịch sử; report HR theo policy được cấp. Trong schema export minh họa, FACTORY lọc theo activity_factory_id của nguồn, COMPANY cần quyền tương ứng toàn công ty. Nếu HRS yêu cầu lọc theo nhà máy tổ chức thay vì nơi quét, phải chốt lại contract/schemaVersion và predicate trước khi code. Nguồn BOUNDARY_CONTEXT không được tự làm lộ dữ liệu ngoài quyền.

**Trạng thái API và DB không trộn lẫn:** AccessAttempt.decision, GateCommand.state, nguồn AttendanceEvent và hiệu lực current revision là các khái niệm riêng. Command CONFIRMED với kind OPEN được map thành OPEN_CONFIRMED của adapter/API. Công đã từng xác nhận nhưng current revision is_voided phải hiện rõ hiệu lực đã hủy khi tra cứu/báo cáo; không đổi lịch sử cổng để che việc đã hiệu chỉnh.

## 15. Ba transaction mẫu để hiện thực đúng schema

### 15.1. Lượt quét

1. Xác thực trạm, scope, QR/quyền và request key; dữ liệu xác thực không đến từ actor ID tự khai.
2. Transaction chuẩn bị: tạo AccessAttempt + GateCommand PREPARED + QrRedemption nếu áp dụng + AuditEntry. Lỗi thì rollback, không OPEN.
3. Transaction claim: kiểm tra điều kiện hiện hành; CAS PREPARED -> DISPATCHING, ghi history/audit, commit.
4. Gọi TCS ngoài transaction DB.
5. Transaction kết quả: cập nhật command/history; khi đủ bằng chứng thì tạo AttendanceEvent + revision 1 + audit. FK head deferred kiểm tra đủ ở cuối transaction.
6. Nếu không rõ sau bước gửi/crash, giữ căn cứ DISPATCHING/UNKNOWN để đối soát, không tự phát OPEN mới.

### 15.2. Hiệu chỉnh công

1. HR đọc Event.currentRevisionNo = n và nội dung revision n, kiểm tra scope/lý do.
2. Transaction CAS head từ n sang n+1; nếu không thắng thì trả conflict.
3. Insert Correction(expectedVersion=n,newVersion=n+1) + revision n+1 gắn đúng correction + audit; commit để deferred FKs kiểm tra đủ.
4. Rebuild projection liên quan theo chính sách nhất quán; RPT chốt phải đọc ledger hiệu lực hoặc chờ projection đủ mới.
5. Sự kiện gốc revision 1 không thay; lô đã seal không thay. Sửa nhầm người không được UPDATE employeeId gốc tùy ý: áp policy void nguồn sai và xác nhận nguồn đúng có đối soát/truy vết.

### 15.3. Xuất tháng

1. Chọn kỳ/scope và version dưới cơ chế chống hai job tạo cùng lô; đọc tập nguồn nhất quán.
2. Tạo Batch + Items + ItemSources trỏ đúng revisions; serialize một lần payloadText, checksum/count.
3. Lưu Outbox intent và Job cùng transaction nghiệp vụ; sau commit worker mới gọi HRS.
4. Mỗi lần SUBMIT/STATUS thêm ExportAttempt, giữ batch ID/snapshot khi retry; cập nhật state qua version/lease và contract.
5. ACCEPTED chỉ khi đủ bằng chứng xử lý. Mốc lô kỳ ban đầu là **trước** 12:00 ngày 1: thời điểm đúng 12:00 không được coi là trước hạn.
6. acceptedAt là lúc TMC kiểm tra ACK, remoteReadyAt chỉ có khi HRS cung cấp bằng chứng đáng tin. Nếu thiếu bằng chứng, không suy đoán readiness trước hạn từ một HTTP thành công.
7. Correction sau chốt tạo batch version thay thế theo contract, không ghi đè batch cũ.

TypeORM phải dùng cùng transactional EntityManager/QueryRunner cho các bước thuộc một UnitOfWork; không fallback sang global manager giữa transaction. Node/Nest provider dùng chung không được giữ active manager/actor mutable cho tất cả request.

## 16. Thứ tự migration, seed và kiểm chứng

### 16.1. Migration/seed

- Tạo các bảng với PK/UK/CHECK; thêm FK sau khi cả hai bảng đã có. Vòng ledger event/revision/correction dùng deferred constraints như §13, không tắt kiểm tra toàn DB.
- Scope/actor/count/time/reason và trạng thái VARCHAR phải có CHECK tương ứng. Một số rules cần service hoặc constraint trigger đã chỉ rõ, không chỉ thêm comment.
- Seed factory BD/LA, cơ cấu mẫu, role EMP/HR/SUP/SEC/ADM/EXE và permission matrix. Seed Employee rồi User, role assignment, config/integration/station, credential và dữ liệu demo theo dependencies.
- Secret lấy từ môi trường/kho secret; không seed mật khẩu plaintext/raw QR/private key vào bảng hoặc commit vào repo.
- Migrations và ORM mapping ở infrastructure theo cấu trúc api/ đã chốt. Dùng synchronize: false khi quản lý schema bằng migration.
- Nếu triển khai subset M2, chọn các bảng cần cho use case và dependencies; không giả lập phần chưa code như đã đạt toàn bộ schema. Ticket review, callback inbox và contract HRS phụ thuộc phạm vi được chọn.

### 16.2. Checklist kiểm chứng

- [ ] Tất cả 37 table có PK; cột nullable/default và property mapping đúng từ điển.
- [ ] FK/UK ghép tham chiếu đúng kiểu và khóa đích; scope NULL không bỏ lọt uniqueness.
- [ ] QR/token/redemption và request trùng có thử song song, không chỉ thử tuần tự.
- [ ] Chỉ một OPEN cơ sở; DISPATCHING không được retry mù sau crash.
- [ ] Tạo Event + revision 1 commit được; thiếu revision hoặc head sai phải commit thất bại.
- [ ] Hai HR sửa cùng version: một thành công, một conflict; correction/revision/audit không được lưu một phần.
- [ ] Source identity không đổi khi retry; manual đã có nguồn không tạo công lần hai.
- [ ] Assignment/team/factory và người sở hữu event được kiểm tra nhất quán; FK tồn tại không thay business ownership.
- [ ] Projection rebuild không làm đổi snapshot HRS; snapshot trỏ đúng revision cũ vẫn đọc được sau correction.
- [ ] Lô COMPANY/factory có uniqueness đúng với NULL; retry giữ payload/checksum/batch ID.
- [ ] ACK partial/mismatch/timeout không tự thành ACCEPTED; giữ lịch sử từng lần giao nhận.
- [ ] Worker cũ không ghi đè job sau khi mất claim; thao tác HRS/TCS ngoài DB có contract riêng.
- [ ] Kiểm tra quyền/scope ở server và query; EXE không nhận full hồ sơ cá nhân, SEC không nhận full HR data.
- [ ] Retention/cleanup không tự xóa nguồn còn được snapshot/audit/đối soát giữ lại; backup/restore có kiểm chứng riêng.

Các checklist là tiêu chí để hiện thực/test sau, không phải kết quả test DB đã chạy. Tài liệu này hoàn tất thiết kế và kiểm tra nhất quán mô hình; không tạo kết nối DB, migration hay dữ liệu vận hành.

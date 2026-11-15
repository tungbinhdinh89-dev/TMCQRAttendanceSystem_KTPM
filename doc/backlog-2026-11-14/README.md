# TMC Access — Tasks & Tickets

[Mở Project mới](https://github.com/orgs/tungbinhdinh89-dev/projects/2) · [Repository Projects](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/projects)

Project thuộc tổ chức tungbinhdinh89-dev, cùng owner hiện tại của repository và đã liên kết vào repository. Hai Project TMC cũ và bảng cá nhân tạo tạm đã được xóa sau khi sao lưu và kiểm chứng. Các issue được giữ nguyên ID/URL, nội dung, phân công và quan hệ cha/con; 14 issue cấp cao được đổi từ EPIC sang TASK.

**Cấu trúc:** 14 Task lớn → 91 ticket thực thi, trong đó 15 sub-ticket. Tổng 105 issue. Không tạo issue trùng và không đánh dấu hoàn thành thêm.

**Cách dùng:** có 14 table view riêng cho từng Task; mở Tasks để xem nhóm lớn; mở Tasks & Tickets rồi lọc cột Task để xem toàn bộ ticket của một nhóm. Dùng Assignees để phân công, Parent issue / Sub-issues progress để theo dõi cấp con.

**Trạng thái:** Backlog → Ready → In progress → In review → Done; Blocked phải có lý do và bước tiếp theo. Giữ trạng thái, ngày hạn và ước lượng có sẵn; chưa có trạng thái thì Backlog. Done cần người dùng nghiệm thu.

**Quy ước:** `[TMC-NNN] [TASK] Name` cho Task lớn; các ticket giữ ID TMC-NNN và type tương ứng. Label `level:task` nhận diện cấp lớn; `feature:*`, `type:*`, `area:*`, `priority:*` giữ phân loại công việc.

**Phạm vi:** M1 tập trung thiết kế; M2 yêu cầu ít nhất một module chính. Backlog đầy đủ có cả phần mở rộng, không phải toàn bộ 105 issue đều bắt buộc để nộp M2.

## Task và ticket tương ứng

### [TMC-089 — Authorization & session RBAC](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/95)

- [TMC-007](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/7) Complete server session authorization and scope checks
- [TMC-008](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/8) Verify session login and protected navigation
- [TMC-050](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/54) Restrict demo bootstrap data to authorized scopes
- [TMC-087](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/91) Isolate session use cases from persistence and HTTP adapters

### [TMC-090 — Employee Management](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/96)

- [TMC-055](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/59) Manage employee profiles with audited updates
- [TMC-056](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/60) Manage effective employee assignments and factory grants
- [TMC-057](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/61) Connect HR employee and access-grant screens

### [TMC-091 — QR Credential Management](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/97)

- [TMC-009](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/9) Implement QR credential and signing-key metadata
- [TMC-010](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/10) Issue short-lived QR tokens and revoke credentials
- [TMC-011](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/11) Validate QR signatures and token claims
- [TMC-015](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/15) Prevent QR replay with atomic redemption
- [TMC-017](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/17) Display server-issued QR codes in the employee portal

### [TMC-092 — Gate & Factory Configuration](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/98)

- [TMC-006](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/6) Verify identity, scope and station fixtures
- [TMC-039](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/39) Monitor station heartbeat and pending work
- [TMC-072](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/76) Administer effective factory organization data
- [TMC-073](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/77) Provision and retire authenticated gate stations
- [TMC-074](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/78) Connect station and organization administration screens
- [TMC-083](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/87) Version integration settings and secret references
- [TMC-084](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/88) Expose scoped service readiness and integration alerts

### [TMC-093 — Gate Scan & Access Processing](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/99)

- [TMC-012](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/12) Evaluate access policies using server-owned data
- [TMC-013](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/13) Implement a fault-capable turnstile simulator
- [TMC-014](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/14) Persist idempotent attempts before gate dispatch
- [TMC-016](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/16) Claim and reconcile gate commands with CAS
- [TMC-018](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/18) Connect the virtual kiosk to real attempt states
- [TMC-027](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/27) Connect camera scans to the server contract

### [TMC-094 — Attendance Event Recording](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/100)

- [TMC-019](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/19) Write attendance revisions from verified passage evidence
- [TMC-020](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/20) Expose scoped attempt status and attendance history
- [TMC-021](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/21) Connect personal history and attempt details

### [TMC-095 — Reliability, Recovery & Offline Policy](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/101)

- [TMC-022](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/22) Finalize network failure architecture decisions
- [TMC-023](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/23) Recover kiosk requests with a metadata journal
- [TMC-024](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/24) Reconcile unknown commands using durable fenced jobs
- [TMC-025](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/25) Implement scoped security reconciliation cases
- [TMC-026](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/26) Exercise lost responses and process crash scenarios
- [TMC-042](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/42) Evaluate and prototype autonomous offline edge operation
- [TMC-069](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/73) Decide the offline edge authorization threat model (sub-ticket)
- [TMC-070](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/74) Prototype durable offline journals and synchronization (sub-ticket)
- [TMC-071](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/75) Verify edge partition and replay limitations (sub-ticket)

### [TMC-096 — Audit & Traceability](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/102)

- [TMC-103](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/92) Implement durable audit writes and scoped audit search

### [TMC-097 — Reporting & HRS Integration](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/103)

- [TMC-028](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/28) Connect scoped dashboard data and factory filters
- [TMC-041](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/41) Deliver versioned monthly HRS exports
- [TMC-065](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/69) Create immutable monthly export snapshots (sub-ticket)
- [TMC-066](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/70) Implement HRS delivery and acknowledgment reconciliation (sub-ticket)
- [TMC-067](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/71) Schedule durable exports and deadline alerts (sub-ticket)
- [TMC-068](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/72) Verify monthly HRS version and deadline behavior (sub-ticket)
- [TMC-075](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/79) Query monthly reports with role-specific projections
- [TMC-076](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/80) Connect scoped monthly reports and anomaly views
- [TMC-077](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/81) Export scoped CSV reports with download auditing

### [TMC-098 — Administration: Accounts & Role Assignments](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/104)

- [TMC-043](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/43) Deliver the IAM administration interface
- [TMC-058](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/62) Administer accounts and session revocation APIs
- [TMC-059](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/63) Manage scoped role assignments without privilege escalation
- [TMC-060](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/64) Build account administration screens (sub-ticket)
- [TMC-061](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/65) Build scoped role-assignment administration screens (sub-ticket)

### [TMC-099 — Nghiệp vụ mở rộng: ca làm & hiệu chỉnh](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/105)

- [TMC-040](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/40) Deliver versioned HR attendance corrections
- [TMC-062](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/66) Pair attendance intervals and classify anomalies (sub-ticket)
- [TMC-063](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/67) Apply audited attendance corrections with version checks (sub-ticket)
- [TMC-064](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/68) Connect attendance review and correction workflows (sub-ticket)
- [TMC-104](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/93) Implement shift definitions and effective employee schedules
- [TMC-105](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/94) Connect shift and schedule screens to persisted APIs

### [TMC-100 — Architecture, Privacy & Assignment Deliverables](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/106)

- [TMC-001](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/1) Confirm M2 scope and requirement traceability
- [TMC-033](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/33) Document SOLID evidence from implementation
- [TMC-034](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/34) Write the implementation-based SOLID reflection
- [TMC-035](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/35) Align architecture decisions and three required views
- [TMC-036](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/36) Verify setup instructions and the reproducible demo
- [TMC-037](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/37) Package the M2 report and submission evidence
- [TMC-078](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/82) Decide privacy notice, retention and evidence-hold policies
- [TMC-079](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/83) Implement authorized privacy request lifecycle APIs
- [TMC-080](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/84) Add privacy workflow and retention-hold persistence
- [TMC-081](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/85) Execute policy-based retention without erasing held evidence
- [TMC-082](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/86) Verify privacy requests, retention and evidence holds
- [TMC-086](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/90) Show privacy purpose and scoped personal-profile states

### [TMC-101 — Foundation, Delivery & Operations](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/107)

- [TMC-002](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/2) Verify the client workspace and preview baseline
- [TMC-003](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/3) Complete backend ports and shared wire contracts
- [TMC-004](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/4) Verify PostgreSQL migrations and core constraints
- [TMC-005](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/5) Complete Node test runners and CI contracts
- [TMC-044](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/48) Audit current acceptance evidence and replan capacity
- [TMC-045](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/49) Define issue templates and label taxonomy
- [TMC-046](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/50) Prepare the GitHub Project field schema
- [TMC-047](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/51) Configure saved views and safe project automations
- [TMC-048](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/52) Define protected-branch checks and human review ownership
- [TMC-049](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/53) Import verified ticket metadata without duplicate issues
- [TMC-054](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/58) Exercise PostgreSQL backup and point-in-time recovery
- [TMC-088](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/46) UI foundations and component alignment

### [TMC-102 — Verification: API, DB, E2E & NFR](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/108)

- [TMC-029](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/29) Verify the main module against PostgreSQL
- [TMC-030](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/30) Verify concurrent replay and crash recovery
- [TMC-031](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/31) Coordinate kiosk performance and data-access verification
- [TMC-032](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/32) Verify the complete user journey and UI states
- [TMC-038](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/38) Verify the release candidate and triage blockers
- [TMC-051](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/55) Measure kiosk response latency under shift-change load (sub-ticket)
- [TMC-052](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/56) Verify role, object and factory authorization boundaries (sub-ticket)
- [TMC-053](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/57) Verify payload redaction and session data isolation (sub-ticket)
- [TMC-085](https://github.com/tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM/issues/89) Verify module boundaries and replaceable integration ports

## Kiểm chứng

Đã đọc lại đủ 105 item, đối chiếu Task ID, Task, Work Type, dependencies và dữ liệu tiến độ; kiểm tra trạng thái issue, assignees và parent không đổi. Chi tiết: task-project-verified.json và task-project-migration.json. Snapshot hai bảng cũ được giữ trong task-project-source.json và task-project-legacy-backup.json.

Đây là thao tác tổ chức backlog; không triển khai tính năng hoặc chạy product tests.

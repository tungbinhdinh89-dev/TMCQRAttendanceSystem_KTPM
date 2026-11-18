# TMC-090 / TMC-092 execution

Assigned: TMC-090 (#96), TMC-092 (#98), TMC-055/056/057 (#59/#60/#61).
Repository: tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM.
Branch: feat/tmc-090-092-employee-gate-config; isolated .tmp-employee-gates from origin/main 2924561.
Native children: #96 -> #59,#60,#61; #98 -> #6,#39,#76,#77,#78,#87,#88. All children have no native descendants (paginated API inspected).

## Ownership

- employee_api: EQR CRUD, status, effective assignments/access grants and contracts employee.ts.
- gate_configuration: CFG/GATE organization, station provisioning/heartbeat, config versions/readiness and their contracts.
- management_ui: client management UI only, real cookie session; no fake save/localStorage role fallback.
- Coordinator: shared IAM exports, integration, commits, minimum necessary verification and PR.

User requests lean verification: build/typecheck plus essential authorization/validation/transaction checks, no elaborate or repeated test matrix. No database reset, automatic seed, arbitrary migration apply or deployment. Existing schema preferred. No hardware/HRS integration claims from configured endpoints or last-seen timestamps.

## Progress

Issue/AC intake, native tree inspection, clean main branch and frozen-lockfile dependency installation complete. Implementation in progress. Current permissions: employee write requires scoped HR business role; ADM does not automatically receive HR write. Configuration mutations require ADM with iam:manage on the same applicable scope. API remains authoritative.

# TMC-091 QR execution

Assigned parent TMC-091 (#97) and explicit children TMC-009 (#9), TMC-010 (#10), TMC-011 (#11), TMC-017 (#17).
Native parent children additionally include TMC-015 (#15); all five are native leaves, inspected with pagination. Children are CLOSED remotely but source lacks QR services; no automatic reopen/close or Done changes.
Repository: tungbinhdinh89-dev/TMCQRAttendanceSystem_KTPM.
Branch: feat/tmc-091-qr-credentials, isolated worktree .tmp-qr-credentials from origin/main 0850dcf (Employee/Gate management merged).

## Ownership and scope

- qr_api: EQR credential/key lifecycle, server signed short-lived tokens, strict online validation, QR contracts and atomic redemption application helper. Any migration authored but not applied.
- qr_ui: client real self QR display and HR lifecycle controls; frontend-design skill.
- qr_verification: small focused security/expiry/replay tests; no broad test matrix.
- Coordinator: shared package exports/scripts, integration, commits/evidence and PR.

Existing GATE scan PREPARED/claim pipeline and TCS execution are not implemented here. Redemption must use caller transaction/attempt; helper evidence is not physical OPEN or cross-station PG race evidence. Never issue from client employeeId, never store private key/raw tokens in DB, browser storage, journal or logs. QR payload exists only transiently for display. Residual live-sharing risk must be documented.

User's lean verification preference retained: API/client build + few essential QR cases. No arbitrary DB apply/seed/reset or deployment. Key material only env/secret provider; public metadata/explicit provisioning documented; no automatic demo operational data.

## Progress

Main/issue intake complete, roles assigned and frozen dependency install initiated. Implementation in progress.

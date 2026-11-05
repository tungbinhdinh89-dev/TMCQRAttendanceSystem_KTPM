# Cấu trúc repository TMC Access

Cập nhật 05/11/2026. Repo dùng pnpm workspace với ba package cùng cấp,
không còn ứng dụng frontend thứ hai ở root.

```text
TMCQRAttendanceSystem_KTPM/
├── api/                       # NestJS, entity/migration, test, cấu hình DB local
├── client/                    # React, HTML, Vite, TypeScript, tài nguyên frontend
│   ├── .figma/                # Site metadata, Vite plugins, hook preview/deploy
│   ├── guidelines/            # Hướng dẫn UI của client
│   ├── public/
│   └── src/
├── contracts/                 # Package @tmc/contracts dùng chung FE/BE
├── doc/                       # Spec, kiến trúc, workflow và tài liệu dự án
├── plans/                     # Kế hoạch triển khai
├── scripts/                   # Điều phối dev và thao tác database
├── skills/                    # Hướng dẫn AI tái sử dụng, checkout skill local
├── AGENTS.md                  # Quy tắc repo cho AI; CLAUDE.md tham chiếu file này
├── package.json               # Lệnh workspace và công cụ dùng chung
├── pnpm-workspace.yaml        # Khai báo api, client, contracts
├── pnpm-lock.yaml             # Một lockfile tái lập dependency cho workspace
├── .mise.toml                 # Phiên bản Node/pnpm
├── .gitignore / .gitattributes # Quy tắc Git và Git LFS
└── README.md
```

## Vì sao giữ contracts ở root?

`contracts` là package có tên `@tmc/contracts`, được pnpm liên kết bằng
`workspace:*`. Nó định nghĩa dữ liệu trên đường giao tiếp: UUID, phân trang,
ApiProblem, gate attempt, attendance event và report/export response. Đặt nó
cạnh hai ứng dụng thể hiện đây là hợp đồng chung, không phải code nội bộ do
frontend hoặc backend sở hữu riêng.

API hiện đã dùng các JSON types từ package này; client sẽ dùng các contract
tương ứng khi triển khai HTTP adapters. Các kiểu không tự xác thực JSON ở runtime.
Không đặt NestJS decorators, TypeORM entity, repository hoặc React component
trong `contracts`. Xem [hướng dẫn package](../contracts/README.md).

## Các file và thư mục root còn cần

- `package.json`: điều phối lệnh; runtime dependencies nằm trong package sở hữu.
  Root chỉ giữ formatter dùng chung, không khai báo lại React/Vite/MUI của client.
- `pnpm-workspace.yaml` và `pnpm-lock.yaml`: định nghĩa các package và khóa đúng
  cây dependency. Không tách ba lockfile hoặc chuyển manifest workspace vào client.
- `node_modules/`: thư mục sinh ra, được Git ignore. Với linker mặc định của pnpm,
  `node_modules/.pnpm` chứa virtual store mà `api/node_modules` và
  `client/node_modules` liên kết tới. Đây không phải một app dư; xóa riêng nó sẽ
  làm hỏng các liên kết. Chỉ xóa khi chủ đích cài lại cả workspace bằng pnpm.
- `AGENTS.md`, `CLAUDE.md`, `.mise.toml`, `.gitignore`, `.gitattributes` và README
  có trách nhiệm toàn repo, nên giữ ở root.

Vite xác định app root theo nơi chứa `index.html`; app root ở đây là `client/`.
Root `vite.config.ts`, `tsconfig.json`, `index.html` và `dist/` của scaffold cũ
đã được dọn. Build mới sinh `client/dist/` và `api/dist/`, không sinh root `dist/`.

## Cấu hình và tài nguyên đã chuyển

| Trước | Sau | Cách sử dụng |
|---|---|---|
| `.figma/` | `client/.figma/` | Client Vite đọc metadata/plugin; hook build/deploy chạy trong client. |
| `guidelines/Guidelines.md` | `client/guidelines/Guidelines.md` | Quy tắc UI, được client AGENTS tham chiếu. |
| `.env.example` của frontend | `client/.env.example` | Dùng đúng biến `VITE_API_URL` mà client đang đọc. |
| `env-variable.txt` local | `api/env-variable.txt` | API start và các script database đọc vị trí mới; vẫn Git ignore. |
| `stephen-skills/` local | `skills/stephen-skills/` | Giữ nội dung và Git metadata riêng, vẫn ignore checkout bên ngoài. |

Ví dụ cấu hình được version control là `api/.env.example` và
`client/.env.example`; cấu hình thật không được commit. API ưu tiên `DATABASE_URL`
đã đặt, sau đó `api/.env`, rồi mới đọc `api/env-variable.txt`. `DATABASE_NAME`
mặc định là `tmc` cho cấu hình local dạng host/port/username/pass.

## Chạy và kiểm tra

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev                 # Chỉ frontend, mặc định cổng 5173
pnpm.cmd dev:full            # Backend + frontend qua scripts/dev.ps1 trên Windows
pnpm.cmd build              # Build cả client và API
pnpm.cmd typecheck          # Contracts, client và API
pnpm.cmd test               # Test backend không cần PostgreSQL thật
```

Backend riêng: build trước bằng `pnpm.cmd build:api`, rồi
`pnpm.cmd start:api`. Các lệnh migration/seed/integration test vẫn yêu cầu DB và
cấu hình bí mật phù hợp; cleanup không tự chạy seed hay migration.

Các hook Figma nằm ở `client/.figma/make`. Khi cấu hình môi trường Figma bên ngoài,
chọn `client` làm app root hoặc trỏ runner tới các hook ở vị trí này; repo không
giữ một bộ hook frontend thứ hai ở root. Hook dev mặc định PORT=8443 khi không
được môi trường cấp; deploy dùng `client/dist`. CLI deploy chỉ chạy khi có yêu cầu
publish/deploy, không phải bước kiểm chứng của cleanup.

Nguồn: [pnpm workspace](https://pnpm.io/10.x/workspaces),
[pnpm node_modules structure](https://pnpm.io/symlinked-node-modules-structure),
[Vite root](https://vite.dev/config/shared-options.html#root).

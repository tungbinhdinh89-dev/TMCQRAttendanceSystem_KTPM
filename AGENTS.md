# TMC Access workspace

This repository is a pnpm workspace with three packages: `api/` (NestJS),
`client/` (React + Vite + Tailwind CSS v4), and `contracts/` (shared wire types).

## Start here

- `README.md` and `doc/repository-layout.md` describe setup and directory ownership.
- Read `doc/work-flow.md` for ticket requirements, branch names, commit messages,
  verification and push checkpoints. Work only on the assigned ticket.
- `client/src/main.tsx`, `client/src/App.tsx`, `client/src/index.css` are the UI entry points.
- `client/index.html`, `client/vite.config.ts`, `client/tsconfig.json` belong to the client.
- `api/src/main.ts` and `api/src/app.module.ts` bootstrap the backend.
- `contracts/src/` contains framework-independent request/response types.
- `scripts/` contains workspace development and database operations.
- `client/.figma/` contains client preview/deployment tooling and site metadata.
- `client/guidelines/Guidelines.md` applies to UI work; also read `client/AGENTS.md`.

## Workspace rules

- Keep application dependencies in their owning package. Root `package.json`
  contains orchestration and shared development tools only.
- Keep the root pnpm workspace manifest and single lockfile. Root `node_modules/.pnpm`
  is required by pnpm's default workspace linker; it is generated and ignored.
- Build artifacts belong in `client/dist` or `api/dist`; do not restore a root UI scaffold.
- Use Node/pnpm versions from `.mise.toml` and `packageManager` in root `package.json`.
- Run `pnpm build`, `pnpm typecheck` and `pnpm test` as appropriate to the change.
  In Windows PowerShell, use `pnpm.cmd` if script execution blocks `pnpm.ps1`.
- Preserve unrelated changes and local configuration. Never commit real credentials.
  Local API configuration lives in `api/.env` or ignored `api/env-variable.txt`.
- Do not start duplicate dev servers. Figma-managed previews use the configured
  `PORT` (commonly 8443); local client development defaults to 5173.

## Backend bounded contexts

- Backend entities belong to the owning bounded context under `api/src/modules/<context>/infrastructure/persistence/entities/`.
- Use one `*.orm-entity.ts` file per TypeORM entity. Do not add entity definitions back to the central registry.
- Shared persistence column bases may live under `api/src/platform/infrastructure/database/`; they must not contain business entities.
- Keep `api/src/platform/infrastructure/database/entities.ts` as a TypeORM registry only: imports plus the `databaseEntities` array.
- Keep ORM entities separate from domain entities and HTTP DTOs. ORM entities may use scalar FK IDs without importing another module's ORM entity.
- Shared FE/BE wire contracts belong in `contracts/src/` and must remain framework- and TypeORM-free. API-specific validation DTOs can wrap those types in the API presentation layer.
- Name persistence classes with the `OrmEntity` suffix and files with kebab-case, for example `factory.orm-entity.ts`.
- When adding a table, update its bounded-context entity, the central registry, and the migration/constraint plan. Do not use TypeORM `synchronize` for schema management.

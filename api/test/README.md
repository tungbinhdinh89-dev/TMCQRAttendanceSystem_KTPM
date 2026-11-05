# Backend tests

Organize tests by scope: `unit`, `integration`, `contract`, `e2e`, and `architecture`.

The integration test requires a PostgreSQL database already migrated and seeded,
including the positive UI demo fixtures. Configure `DATABASE_URL`, `api/.env`,
or `api/env-variable.txt`, then run `pnpm --dir api test:integration`.
This command reads fixtures; it does not implicitly reseed or reset passwords.

See the root README for explicit full seed and UI-only account preparation.
`pnpm --dir api test` uses mocks and requires no PostgreSQL connection.

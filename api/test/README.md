# Backend tests

Organize tests by scope: `unit`, `integration`, `contract`, `e2e`, and `architecture`.

The TMC-006 integration test requires a PostgreSQL database already migrated
and seeded. Set `DATABASE_URL`, `DEMO_PASSWORD`, and
`DEMO_STATION_SECRET`, then run `pnpm --dir api test:integration`.
# Demo accounts and seed data

The current run commands, eight seeded usernames, demo password, role scopes,
and UI verification steps are maintained in the root [README](../README.md#7-tài-khoản-seed-để-test-trực-tiếp-trên-ui).
Six accounts can log in; `sup.demo` and `sec.demo` remain negative fixtures.
Use `pnpm.cmd --dir api seed:ui` to preview a targeted account preparation,
then `pnpm.cmd --dir api seed:ui --apply` with `DEMO_PASSWORD` set to apply it.
This targeted operation preserves station credentials and requires base fixtures.

The demo seed creates stable UUIDs for both factories, scoped employees, six
roles (`EMP`, `HR`, `SUP`, `SEC`, `ADM`, `EXE`), IN/OUT stations, and the TCS
integration endpoint. Employee access is granted independently of the
employee's primary assignment, so the first employee can be used to verify a
cross-factory grant.

Set secrets outside the repository before seeding:

```powershell
$env:DATABASE_URL = "postgres://localhost:5432/tmc"
$env:DEMO_PASSWORD = "<local-demo-password>"
$env:DEMO_STATION_SECRET = "<local-station-secret>"
pnpm.cmd --dir api seed:demo
```

The seed stores only scrypt hashes. It is idempotent by stable UUID and never
logs or stores the plaintext values. The `REVOKED` and `INACTIVE` employees,
the revoked grant, and the factory-scoped assignments are negative-test
fixtures.

To update a local database from the repository scripts, set the same two
variables and run:

```powershell
.\scripts\updatedb.ps1
```

Schema migration and demo seeding are intentionally separate. Running
`migrate.ps1` never requires demo secrets; `updatedb.ps1` requires them because
it performs both steps.

Run the TMC-006 PostgreSQL verification after seeding:

```powershell
pnpm.cmd --dir api test:integration
```

The test checks both factories, all six roles, active/revoked/inactive
fixtures, cross-factory access grants, IN/OUT stations, foreign-key metadata,
and that stored credentials are hashes rather than plaintext secrets.

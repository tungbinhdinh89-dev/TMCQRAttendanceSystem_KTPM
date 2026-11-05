# Shared wire contracts

`@tmc/contracts` contains framework-independent TypeScript types for data exchanged
between the client and API: identifiers, pagination, API problems, gate attempts,
attendance events and report/export responses.

This is a sibling workspace package because neither application owns the shared
wire format. The API currently imports its JSON types; the client can consume
the same contracts when its HTTP adapters are implemented. Consumers declare
`"@tmc/contracts": "workspace:*"` instead of importing another application's source.

Keep NestJS validation decorators, TypeORM entities, database access and UI code
out of this package. API presentation DTOs validate requests against these types.
TypeScript types do not validate incoming JSON at runtime.

Run `pnpm --dir contracts typecheck` from the repository root. This package is
currently types-only; use `import type` in backend runtime code.

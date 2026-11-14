# API checks

pnpm --dir api test builds and runs the auth, environment and workspace access unit tests.

pnpm --dir api test:integration requires a running API (TEST_API_URL, default http://127.0.0.1:3000/api), configured DATABASE_URL and LOCAL_ACCOUNT_PASSWORD, and six explicitly provisioned local accounts. It tests real login/session revocation and scope. It does not reset/seed the DB or simulate successful gate passage.

import { Client } from "pg"

const databaseUrl = process.env.DATABASE_URL
const databaseName = process.env.DATABASE_NAME || (databaseUrl && decodeURIComponent(new URL(databaseUrl).pathname.slice(1))) || "tmc"
const action = process.env.DB_ACTION || "status"

if (!databaseUrl) throw new Error("DATABASE_URL is not set.")

const targetUrl = new URL(databaseUrl)
targetUrl.pathname = `/${encodeURIComponent(databaseName)}`
const adminUrl = new URL(databaseUrl)
adminUrl.pathname = "/postgres"
const connect = (connectionString) => new Client({ connectionString: connectionString.toString(), connectionTimeoutMillis: 5000 })

async function ensureDatabase() {
  const admin = connect(adminUrl)
  await admin.connect()
  const result = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName])
  let created = false
  if (result.rowCount === 0) {
    const identifier = databaseName.replaceAll('"', '""')
    await admin.query(`CREATE DATABASE "${identifier}"`)
    created = true
  }
  await admin.end()

  const target = connect(targetUrl)
  await target.connect()
  const verification = await target.query("SELECT current_database() AS database, current_user AS username, version() AS version")
  await target.end()
  console.log(JSON.stringify({ action, created, database: verification.rows[0].database, username: verification.rows[0].username, server: verification.rows[0].version.split(" on ")[0] }))
}

async function printStatus() {
  const target = connect(targetUrl)
  await target.connect()
  const result = await target.query(`SELECT current_database() AS database, current_user AS username, (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS table_count`)
  await target.end()
  console.log(JSON.stringify({ action, ...result.rows[0] }))
}

async function printSchema() {
  const target = connect(targetUrl)
  await target.connect()
  const totals = await target.query(`
    SELECT
      count(DISTINCT table_name)::int AS table_count,
      count(*)::int AS column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `)
  const samples = await target.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('factories', 'employees', 'attendance_events')
    ORDER BY table_name, ordinal_position
  `)
  await target.end()
  console.log(JSON.stringify({ action, ...totals.rows[0], sample_columns: samples.rows }))
}

if (action === "ensure") await ensureDatabase()
else if (action === "schema") await printSchema()
else await printStatus()

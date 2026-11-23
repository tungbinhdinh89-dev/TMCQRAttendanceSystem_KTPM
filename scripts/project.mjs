import { spawn } from "node:child_process"
import { createServer, createConnection } from "node:net"
import { existsSync } from "node:fs"
import { writeFile, mkdir } from "node:fs/promises"
import { dirname, resolve, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createRequire } from "node:module"

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const api = join(root, "api")
const client = join(root, "client")
const migrationsPath = join(api, "src/platform/infrastructure/database/migrations")
export const help = `Usage (from any directory):
  run.ps1|run.sh                     Start frontend and backend
  run.ps1|run.sh --frontend          Frontend only
  run.ps1|run.sh --backend           Build/start backend only
  add.ps1|add.sh Name                Generate TypeORM migration from entity/DB diff
  add.ps1|add.sh Name --empty        Create empty migration without DB connection
  update.ps1|update.sh              Apply pending migrations; no seed/reset
  check.ps1|check.sh                Check DB connection and list migration status
Options: --database-name NAME (backend/database commands), --help
Environment: Node22+, pnpm dependencies installed; DATABASE_URL > api/.env > root env-variable.txt.
Run uses PORT (backend, default3000), VITE_PORT (frontend, default5173).
APPLIED = already applied; PENDING = not applied; MISSING_SOURCE = DB history absent from source.`

export function parseArgs(argv) {
  const [command, ...rawArgs] = argv
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs
  if (!command || command === "--help" || command === "help") return { help: true }
  if (!["run", "add", "update", "check"].includes(command)) throw new Error(`Unknown command: ${command}`)
  const options = { command, target: "all", empty: false }
  let targetSet = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--help" || arg === "-h") return { help: true }
    if (["--frontend", "--backend"].includes(arg)) {
      if (command !== "run" || targetSet) throw new Error("Use exactly one --frontend or --backend flag, only with run.")
      options.target = arg.slice(2); targetSet = true
    } else if (arg === "--empty") {
      if (command !== "add" || options.empty) throw new Error("--empty is only allowed once with add.")
      options.empty = true
    } else if (arg === "--database-name" || arg === "--name") {
      if (arg === "--name" && command !== "add") throw new Error("--name is only allowed with add.")
      const value = args[++i]
      if (!value || value.startsWith("-")) throw new Error(`Missing value for ${arg}.`)
      const key = arg === "--name" ? "name" : "database"
      if (options[key]) throw new Error(`Duplicate ${arg}.`)
      options[key] = value
    } else if (command === "add" && !arg.startsWith("-") && !options.name) options.name = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (command === "add" && !/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(options.name || "")) {
    throw new Error("Provide a migration name, e.g. add AddEmployeeEmail (letters, digits and underscores; no paths).")
  }
  if (command === "run" && options.target === "frontend" && options.database) throw new Error("Frontend-only mode does not use database options.")
  return options
}

/** Direct Node children, no shell interpolation. A failed service stops its peer. */
export class Processes {
  children = new Set()
  stopping = false
  spawn(args, cwd = root) {
    if (this.stopping) throw new Error("Startup interrupted.")
    const child = spawn(process.execPath, args, { cwd, stdio: "inherit", windowsHide: true, detached: process.platform !== "win32" })
    this.children.add(child)
    const done = new Promise((resolveDone, reject) => {
      child.once("error", error => { this.children.delete(child); reject(error) })
      child.once("exit", (code, signal) => { this.children.delete(child); resolveDone({ code: code ?? (signal ? 1 : 0), signal }) })
    })
    return { child, done }
  }
  async stop() {
    this.stopping = true
    const running = [...this.children]
    const kill = (child, signal) => {
      if (child.exitCode !== null || child.signalCode) return
      try { process.platform === "win32" ? child.kill(signal) : process.kill(-child.pid, signal) } catch { /* Already exited. */ }
    }
    const exits = running.map(child => new Promise(r => child.exitCode !== null || child.signalCode ? r() : child.once("exit", r)))
    for (const child of running) kill(child, "SIGTERM")
    let timer
    await Promise.race([Promise.all(exits), new Promise(r => { timer = setTimeout(r, 3000) })])
    clearTimeout(timer)
    for (const child of running) kill(child, "SIGKILL")
    await Promise.all(exits)
  }
  async run(args, cwd) {
    const result = await this.spawn(args, cwd).done
    if (result.code !== 0) throw new Error(`Command failed (exit ${result.code}).`)
  }
}

async function build(processes) {
  const cli = join(api, "node_modules/@nestjs/cli/bin/nest.js")
  if (!existsSync(cli)) throw new Error("API dependencies missing. Run pnpm install at repository root.")
  await processes.run([cli, "build"], api)
}
async function loadEnvironment(options) {
  if (options.database) process.env.TMC_DATABASE_OVERRIDE = options.database
  await import(pathToFileURL(join(api, "scripts/load-env.mjs")).href)
}
function port(value, fallback) {
  const result = Number(value || fallback)
  if (!Number.isInteger(result) || result < 1 || result > 65535) throw new Error("Port must be an integer from1 to65535.")
  return result
}
export function availablePort(number) {
  return new Promise((yes, no) => {
    const server = createServer()
    server.once("error", () => no(new Error(`Port ${number} is already in use or unavailable. Stop the existing service first.`)))
    server.listen(number, () => server.close(yes))
  })
}
/** Readiness applies to both PowerShell and Bash launchers. Never start FE against a dead API. */
export async function waitForBackend(number, service, timeoutMs = 30000) {
  let cancelled = false
  const probe = () => new Promise(resolveProbe => {
    const socket = createConnection({ host: "127.0.0.1", port: number })
    const done = ready => { socket.destroy(); resolveProbe(ready) }
    socket.once("connect", () => done(true))
    socket.once("error", () => done(false))
    socket.setTimeout(500, () => done(false))
  })
  const ready = async () => {
    const deadline = Date.now() + timeoutMs
    while (!cancelled && Date.now() < deadline) {
      if (await probe()) return
      await new Promise(r => setTimeout(r, 100))
    }
    if (!cancelled) throw new Error("API readiness timed out. Frontend was not started; inspect backend output above.")
  }
  try {
    await Promise.race([
      ready(),
      service.done.then(result => { throw new Error(`API exited before readiness (exit ${result.code}). Frontend was not started; inspect backend output above.`) }),
    ])
  } finally { cancelled = true }
}
async function runApp(options, processes) {
  const backend = options.target !== "frontend", frontend = options.target !== "backend"
  if (backend) await loadEnvironment(options)
  const apiPort = port(process.env.PORT, 3000), clientPort = port(process.env.VITE_PORT, 5173)
  if (backend && frontend && apiPort === clientPort) throw new Error("Frontend and backend need different ports.")
  if (backend) await availablePort(apiPort)
  if (frontend) await availablePort(clientPort)
  if (backend) await build(processes)
  const jobs = []
  if (backend) {
    process.env.PORT = String(apiPort)
    console.log(`Backend: http://localhost:${apiPort}/api`)
    const service = processes.spawn([join(api, "scripts/start.mjs")], api)
    jobs.push(service.done)
    if (frontend) { await waitForBackend(apiPort, service); console.log(`API ready on port ${apiPort}.`) }
  }
  if (frontend) {
    const vite = join(client, "node_modules/vite/bin/vite.js")
    if (!existsSync(vite)) throw new Error("Frontend dependencies missing. Run pnpm install at repository root.")
    console.log(`Frontend port: ${clientPort}; Vite prints the HTTP/HTTPS address below.`)
    jobs.push(processes.spawn([vite, "--port", String(clientPort), "--strictPort"], client).done)
  }
  const first = await Promise.race(jobs)
  await processes.stop()
  if (first.code !== 0) throw new Error(`A service exited with code ${first.code}; companion services were stopped.`)
}

/** Check only reads catalog/history. It never calls TypeORM's history-table creation helpers. */
export async function migrationStatus(ds, runner) {
  const schema = ds.options.schema || "public", table = ds.options.migrationsTableName || "migrations"
  const quote = value => '"' + value.replaceAll('"', '""') + '"'
  const history = await runner.hasTable(`${schema}.${table}`)
    ? await runner.query(`SELECT id, timestamp, name FROM ${quote(schema)}.${quote(table)} ORDER BY id`)
    : []
  const names = new Set(history.map(row => row.name))
  const source = ds.migrations.map(m => ({ name: m.name || m.constructor.name })).sort((a,b) => a.name.slice(-13).localeCompare(b.name.slice(-13)))
  const known = new Set(source.map(row => row.name))
  return { applied: source.filter(row => names.has(row.name)), pending: source.filter(row => !names.has(row.name)), missing: history.filter(row => !known.has(row.name)) }
}
function printStatus(state) {
  for (const row of state.applied) console.log(`[APPLIED] ${row.name}`)
  for (const row of state.pending) console.log(`[PENDING / NOT APPLIED] ${row.name}`)
  for (const row of state.missing) console.log(`[MISSING_SOURCE] ${row.name}`)
  console.log(`Summary: ${state.applied.length} applied, ${state.pending.length} pending (not applied), ${state.missing.length} missing from source.`)
}
export function migrationSource(name, timestamp, up = [], down = []) {
  if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(name)) throw new Error("Invalid migration name.")
  const statements = queries => queries.length ? queries.map(q => `    await queryRunner.query(${JSON.stringify(q.query)}${q.parameters?.length ? ', ' + JSON.stringify(q.parameters) : ''})`).join("\n") : "    // Add migration SQL here."
  return `import type { MigrationInterface, QueryRunner } from "typeorm"\n\nexport class ${name}${timestamp} implements MigrationInterface {\n  name = "${name}${timestamp}"\n  async up(queryRunner: QueryRunner): Promise<void> {\n${statements(up)}\n  }\n  async down(queryRunner: QueryRunner): Promise<void> {\n${statements([...down].reverse())}\n  }\n}\n`
}
async function writeMigration(options, up, down) {
  const timestamp = Date.now(), filename = join(migrationsPath, `${timestamp}-${options.name}.ts`)
  await mkdir(migrationsPath, { recursive: true })
  await writeFile(filename, migrationSource(options.name, timestamp, up, down), { flag: "wx" })
  console.log(`Created ${filename}. Review up/down before update.`)
}
async function database(options, processes) {
  if (options.command === "add" && options.empty) { await writeMigration(options, [], []); return }
  await loadEnvironment(options)
  await build(processes)
  const { appDataSource: ds } = await import(pathToFileURL(join(api, "dist/platform/infrastructure/database/data-source.js")).href)
  ds.setOptions({ installExtensions: false, migrations: [join(api, "dist/platform/infrastructure/database/migrations/*.js").replaceAll("\\", "/")] })
  let runner
  try {
    await ds.initialize()
    runner = ds.createQueryRunner(); await runner.connect()
    if (options.command === "check") {
      await runner.startTransaction()
      await runner.query("SET TRANSACTION READ ONLY")
    }
    const [target] = await runner.query("SELECT current_database() AS database")
    console.log(`Database connection: OK (${target.database})`)
    if (options.command === "update") {
      const [lock] = await runner.query("SELECT pg_try_advisory_lock(hashtext('tmc-project-migrations')) AS acquired")
      if (!lock.acquired) throw new Error("Another migration update is running; retry later.")
      try {
        const status = await migrationStatus(ds, runner)
        printStatus(status)
        if (status.missing.length) throw new Error("Restore missing migration source before update; history will not be rewritten.")
        if (!status.pending.length) { console.log("Database is up to date; nothing to apply."); return }
        const { MigrationExecutor } = createRequire(join(api, "package.json"))("typeorm")
        const executor = new MigrationExecutor(ds, runner); executor.transaction = "all"
        const applied = await executor.executePendingMigrations()
        console.log(`Applied ${applied.length} migration(s). No seed/reset performed.`)
        printStatus(await migrationStatus(ds, runner))
      } finally { await runner.query("SELECT pg_advisory_unlock(hashtext('tmc-project-migrations'))") }
    } else {
      const status = await migrationStatus(ds, runner)
      printStatus(status)
      if (options.command === "check") { if (status.missing.length) process.exitCode = 1; return }
      if (status.missing.length || status.pending.length) throw new Error("Apply pending migrations and restore missing source before generating a new migration.")
      const sql = await ds.driver.createSchemaBuilder().log()
      if (!sql.upQueries.length) { console.log("No schema changes found; no migration file created."); return }
      await writeMigration(options, sql.upQueries, sql.downQueries)
    }
  } catch (error) {
    if (error.code || error.driverError) {
      throw new Error(`Database operation failed (${error.code || error.driverError?.code || "QUERY_FAILED"}). Check api/.env, connectivity and migration constraints. No automatic reset or seed is performed.`)
    }
    throw error
  } finally {
    if (runner?.isTransactionActive) await runner.rollbackTransaction()
    if (runner && !runner.isReleased) await runner.release()
    if (ds.isInitialized) await ds.destroy()
  }
}
export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.help) { console.log(help); return }
  const processes = new Processes()
  let interrupted = false
  const interrupt = () => { interrupted = true; void processes.stop() }
  process.once("SIGINT", interrupt); process.once("SIGTERM", interrupt)
  try {
    if (options.command === "run") await runApp(options, processes)
    else await database(options, processes)
  } finally {
    await processes.stop()
    process.removeListener("SIGINT", interrupt); process.removeListener("SIGTERM", interrupt)
    if (interrupted) process.exitCode = 130
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode ||= 1 })
}

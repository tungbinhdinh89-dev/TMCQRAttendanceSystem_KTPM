import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const api = join(root, "api")
const args = process.argv.slice(2)
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  console.log("seed-data.ps1|seed-data.sh [--dry-run]\nSeed dữ liệu ban đầu cho database tmc-local trên localhost. --dry-run kiểm tra trong giao dịch rồi rollback. Không tự chạy migration/reset hoặc thay dữ liệu đã có.")
  process.exit(0)
}
if (args.length > 1 || args.some(a => a !== "--dry-run")) throw new Error("Chỉ hỗ trợ --dry-run hoặc --help.")
const dryRun = args.includes("--dry-run")
const roles = ["EMP", "HR", "SUP", "SEC", "ADM", "EXE"]
const usernames = ["emp.local", "hr.local", "sup.local", "sec.local", "adm.local", "exe.local"]
let ds, runner
try {
  await import(pathToFileURL(join(api, "scripts/load-env.mjs")).href)
  const target = new URL(process.env.DATABASE_URL)
  if (!["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) || decodeURIComponent(target.pathname) !== "/tmc-local") {
    throw new Error("Script này chỉ seed tmc-local trên localhost. Kiểm tra api/.env và DATABASE_URL của terminal.")
  }
  console.log(`Database đích: ${target.hostname}:${target.port || "5432"}/tmc-local`)
  process.env.DEMO_PASSWORD ||= "TmcLocal@123456"
  process.env.DEMO_STATION_SECRET ||= randomBytes(32).toString("base64url")
  const build = spawnSync(process.execPath, [join(api, "node_modules/@nestjs/cli/bin/nest.js"), "build"], { cwd: api, stdio: "inherit", windowsHide: true })
  if (build.error || build.status !== 0) throw new Error("Build API thất bại; chưa chạy seed.")
  const { appDataSource } = await import(pathToFileURL(join(api, "dist/platform/infrastructure/database/data-source.js")).href)
  const { seedDemoData, demoIds } = await import(pathToFileURL(join(api, "dist/platform/infrastructure/database/seeds/demo-seed-data.js")).href)
  const { AuthService, encodePassword } = await import(pathToFileURL(join(api, "dist/modules/iam/application/auth.service.js")).href)
  ds = appDataSource
  await ds.initialize()
  if (await ds.showMigrations()) throw new Error("Còn migration pending. Chạy scripts/update.ps1 hoặc scripts/update.sh trước.")
  runner = ds.createQueryRunner()
  await runner.connect()
  await runner.startTransaction()
  await runner.query("SELECT pg_advisory_xact_lock(hashtext('tmc-local-initial-seed'))")
  const [counts] = await runner.query("SELECT (SELECT count(*)::int FROM employees) AS employees,(SELECT count(*)::int FROM users) AS users")
  if (counts.employees || counts.users) {
    const existing = await runner.query("SELECT id,username FROM users WHERE username=ANY($1::text[])", [usernames])
    if (existing.length === 6 && existing.every(r => demoIds.users[usernames.indexOf(r.username)] === r.id)) {
      console.log("Bộ seed local đã tồn tại; giữ nguyên mật khẩu, quyền và dữ liệu hiện tại.")
      await runner.rollbackTransaction()
      process.exitCode = 0
    } else throw new Error("Database đã có nhân viên/tài khoản khác. Không ghi đè; script chỉ dành cho khởi tạo ban đầu.")
  } else {
    await seedDemoData(runner.manager)
    const passwordHash = encodePassword(process.env.DEMO_PASSWORD)
    // The test fixture deliberately disables SUP/SEC; local onboarding needs active operators.
    await runner.query("UPDATE employees SET status='ACTIVE',deactivated_at=NULL WHERE id=ANY($1::uuid[])", [demoIds.employees])
    for (let i = 0; i < usernames.length; i++) {
      await runner.query("UPDATE users SET username=$1,password_hash=$2,must_change_password=false WHERE id=$3", [usernames[i], passwordHash, demoIds.users[i]])
      const scope = i === 0 ? "SELF" : i === 2 ? "TEAM" : i === 3 ? "FACTORY" : "GLOBAL"
      await runner.query("UPDATE user_role_assignments SET scope_type=$1,factory_id=$2,department_id=$3,team_id=$4 WHERE user_id=$5 AND role_id=$6", [scope, [2, 3].includes(i) ? demoIds.factories.bd : null, i === 2 ? demoIds.departments.bdProd : null, i === 2 ? demoIds.teams.bdA : null, demoIds.users[i], demoIds.roles[i]])
    }
    // Keep factory-scoped assignments separate; the local scanner can operate at BD and LA.
    await runner.query("INSERT INTO user_role_assignments (id,user_id,role_id,scope_type,factory_id,valid_from) VALUES ($1,$2,$3,'FACTORY',$4,NOW())", ["00000000-0000-4000-8000-000000000706", demoIds.users[3], demoIds.roles[3], demoIds.factories.la])
    const checks = await runner.query("SELECT u.username,e.status FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.id=ANY($1::uuid[]) ORDER BY u.username", [demoIds.users])
    if (checks.length !== 6 || checks.some(r => r.status !== "ACTIVE")) throw new Error("Kiểm tra dữ liệu seed thất bại.")
    if (dryRun) {
      const auth = new AuthService({ getRepository: entity => runner.manager.getRepository(entity), transaction: fn => fn(runner.manager) }, { write: async () => {} })
      for (let i = 0; i < usernames.length; i++) {
        const result = await auth.login(usernames[i], process.env.DEMO_PASSWORD)
        if (!result.identity.roles.some(r => r.code === roles[i])) throw new Error("Role đăng nhập seed không khớp.")
      }
      await runner.rollbackTransaction()
      console.log("Dry-run thành công: đăng nhập được cả 6 role; đã rollback dữ liệu seed và session kiểm tra.")
    }
    else { await runner.commitTransaction(); console.log("Đã seed thành công: 2 nhà máy, 3 phòng ban, 2 tổ, 6 nhân viên/tài khoản, 6 role, 4 trạm IN/OUT.") }
    console.log(roles.map((r, i) => `${r}: ${usernames[i]}`).join("\n"))
    console.log("Mật khẩu dùng DEMO_PASSWORD trong cấu hình; nếu chưa đặt thì mặc định local: TmcLocal@123456.")
    console.log("Chưa cấp QR hoặc tạo công giả. HR cấp QR cho EMP trên giao diện; dùng SEC để quét.")
  }
} catch (error) {
  if (runner?.isTransactionActive) await runner.rollbackTransaction()
  // Do not log database URLs, credentials or driver SQL parameters.
  console.error(error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[DATABASE_URL]") : "Seed thất bại.")
  process.exitCode = 1
} finally {
  if (runner) await runner.release()
  if (ds?.isInitialized) await ds.destroy()
}

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  console.log("node scripts/setup-local-env.mjs\nTạo/cập nhật DATABASE_URL trong api/.env cho PostgreSQL Docker local. Giữ nguyên các cấu hình khác; không khởi động DB hay chạy migration.")
  process.exit(0)
}
if (args.length) throw new Error("Không nhận tham số. Sử dụng --help để xem hướng dẫn.")

const path = resolve(root, "api/.env")
const value = "postgresql://admin:123456@127.0.0.1:5432/tmc-local"
let contents = existsSync(path) ? readFileSync(path, "utf8").replace(/^\uFEFF/, "") : ""
const newline = contents.includes("\r\n") ? "\r\n" : "\n"
const setting = `DATABASE_URL=${JSON.stringify(value)}`
const pattern = /^(?:export\s+)?DATABASE_URL\s*=.*$/gm
// Replace all duplicate entries too, so the effective target cannot remain the old DB.
contents = pattern.test(contents)
  ? contents.replace(pattern, () => setting)
  : `${contents}${contents && !contents.endsWith("\n") ? newline : ""}${setting}${newline}`
mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, contents, { encoding: "utf8", mode: 0o600 })
console.log("Đã cập nhật api/.env: PostgreSQL 127.0.0.1:5432, database tmc-local, user admin.")
console.log("Các cấu hình khác (khóa ký QR, CORS...) được giữ nguyên. Khởi động lại backend để áp dụng.")
if (process.env.DATABASE_URL) console.log("Lưu ý: terminal đang có DATABASE_URL; xóa biến này hoặc mở terminal mới để api/.env có hiệu lực.")

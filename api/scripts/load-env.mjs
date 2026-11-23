import { existsSync } from "node:fs"
import { configureDatabaseEnvironment } from "./runtime-env.mjs"

const envPath = new URL("../.env", import.meta.url)
if (existsSync(envPath)) process.loadEnvFile(envPath)
configureDatabaseEnvironment()
if (process.env.TMC_DATABASE_OVERRIDE) {
  const target = new URL(process.env.DATABASE_URL)
  target.pathname = `/${process.env.TMC_DATABASE_OVERRIDE}`
  process.env.DATABASE_URL = target.toString()
}

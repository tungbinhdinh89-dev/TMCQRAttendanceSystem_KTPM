import { existsSync } from "node:fs"
import { configureDatabaseEnvironment } from "./runtime-env.mjs"

try {
  const envPath = new URL("../.env", import.meta.url)
  if (existsSync(envPath)) process.loadEnvFile(envPath)
  const source = configureDatabaseEnvironment()
  console.info(`Database configuration: ${source}`)
  await import("../dist/main.js")
} catch (error) {
  console.error(error instanceof Error ? error.message : "API startup failed")
  process.exitCode = 1
}

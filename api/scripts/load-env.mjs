import { existsSync } from "node:fs"
import { configureDatabaseEnvironment } from "./runtime-env.mjs"

const envPath = new URL("../.env", import.meta.url)
if (existsSync(envPath)) process.loadEnvFile(envPath)
configureDatabaseEnvironment()

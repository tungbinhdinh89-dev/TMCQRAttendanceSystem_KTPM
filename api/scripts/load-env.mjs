import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { configureDatabaseEnvironment } from './runtime-env.mjs'
const file = new URL('../.env', import.meta.url)
// Node's loader preserves variables already supplied by the host/deployment.
if (existsSync(file)) process.loadEnvFile(fileURLToPath(file))
configureDatabaseEnvironment()

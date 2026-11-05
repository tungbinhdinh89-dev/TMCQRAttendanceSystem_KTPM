import { readFileSync } from "node:fs"

export function configureDatabaseEnvironment({
  env = process.env,
  configPath = new URL("../env-variable.txt", import.meta.url),
} = {}) {
  if (env.DATABASE_URL?.trim()) {
    if (env.DATABASE_NAME?.trim()) {
      const target = new URL(env.DATABASE_URL)
      target.pathname = `/${encodeURIComponent(env.DATABASE_NAME.trim())}`
      env.DATABASE_URL = target.toString()
    }
    return "DATABASE_URL"
  }

  let config
  try {
    config = readFileSync(configPath, "utf8")
  } catch (error) {
    if (error.code !== "ENOENT") throw error
    throw new Error("DATABASE_URL is required. Set it in your environment or api/.env, or provide api/env-variable.txt.")
  }

  const host = config.match(/host:\s*([^:]+)/i)?.[1]?.trim()
  const port = config.match(/port\s+(\d+)/i)?.[1]
  const username = config.match(/username:\s*([^,\s]+)/i)?.[1]
  const password = config.match(/pass:\s*(\S+)/i)?.[1]
  if (!host || !port || !username || !password || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("api/env-variable.txt must contain a valid host, port, username, and pass.")
  }

  const databaseName = env.DATABASE_NAME?.trim() || "tmc"
  env.DATABASE_URL = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(databaseName)}`
  return "api/env-variable.txt"
}

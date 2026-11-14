export function configureDatabaseEnvironment({ env = process.env } = {}) {
  if (!env.DATABASE_URL?.trim()) throw new Error('DATABASE_URL is required in environment or api/.env.')
  let url
  try { url = new URL(env.DATABASE_URL) } catch { throw new Error('DATABASE_URL must be a PostgreSQL URL.') }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
    throw new Error('DATABASE_URL must include PostgreSQL host and database.')
  }
  if (env.DATABASE_NAME?.trim()) url.pathname = '/' + encodeURIComponent(env.DATABASE_NAME.trim())
  env.DATABASE_URL = url.toString()
  return 'DATABASE_URL'
}

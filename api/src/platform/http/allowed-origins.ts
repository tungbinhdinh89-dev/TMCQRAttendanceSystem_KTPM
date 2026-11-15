export function allowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS
  if (configured !== undefined) return configured.split(",").map(value => value.trim()).filter(Boolean)
  if (process.env.NODE_ENV === "production") return []
  return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8443", "http://127.0.0.1:8443"]
}

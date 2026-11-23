import "./load-env.mjs"
try {
  await import("../dist/main.js")
} catch {
  console.error("API startup failed. Verify configuration, schema and port availability.")
  process.exitCode = 1
}

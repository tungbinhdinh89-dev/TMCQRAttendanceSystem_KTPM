try {
  await import("./load-env.mjs")
  await import("../dist/main.js")
} catch (error) {
  console.error(error instanceof Error ? error.message : "API startup failed")
  process.exitCode = 1
}

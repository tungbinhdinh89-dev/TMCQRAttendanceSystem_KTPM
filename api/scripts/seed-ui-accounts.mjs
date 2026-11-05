import { demoUiUsers, seedDemoUiAccounts } from "../dist/platform/infrastructure/database/seeds/demo-ui-accounts.js"

if (!process.argv.includes("--apply")) {
  console.log(JSON.stringify({
    action: "preview", usernames: demoUiUsers.map(user => user.username),
    changes: "Set DEMO_PASSWORD hash for demo users; add active SUP/SEC fixtures; preserve inactive/revoked employees and station credentials.",
    apply: "Run again with --apply after setting DEMO_PASSWORD. Base demo fixtures must already exist.",
  }, null, 2))
} else {
  if (!process.env.DEMO_PASSWORD) throw new Error("Set DEMO_PASSWORD; no default password is applied.")
  const { appDataSource } = await import("../dist/platform/infrastructure/database/data-source.js")
  try {
    await appDataSource.initialize()
    await appDataSource.transaction(async manager => {
      const before = await manager.query("SELECT id, secret_hash, revoked_at FROM station_credentials ORDER BY id")
      await seedDemoUiAccounts(manager)
      const after = await manager.query("SELECT id, secret_hash, revoked_at FROM station_credentials ORDER BY id")
      if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Station credentials changed unexpectedly; rolling back.")
    })
    console.log(JSON.stringify({ action: "applied", usernames: demoUiUsers.map(user => user.username), stationCredentialsChanged: false }))
  } catch (error) {
    console.error(error?.name === "QueryFailedError"
      ? `Database rejected the demo fixture update (${error.driverError?.code ?? "unknown"}).`
      : error instanceof Error ? error.message : "Demo account setup failed.")
    process.exitCode = 1
  } finally {
    if (appDataSource.isInitialized) await appDataSource.destroy()
  }
}

import { appDataSource } from "../data-source"
import { seedDemoData } from "./demo-seed-data"

async function main() {
  await appDataSource.initialize()
  try {
    await appDataSource.runMigrations()
    await appDataSource.transaction((manager) => seedDemoData(manager))
  } finally {
    await appDataSource.destroy()
  }
}

void main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})

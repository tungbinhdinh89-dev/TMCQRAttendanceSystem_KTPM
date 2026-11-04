import { DataSource } from "typeorm"
import { databaseEntities } from "./entities"

export const appDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: databaseEntities,
  migrations: ["dist/platform/infrastructure/database/migrations/*.js"],
  synchronize: false,
  migrationsRun: false,
})
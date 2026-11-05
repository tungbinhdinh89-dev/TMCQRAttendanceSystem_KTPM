import { Module } from "@nestjs/common"
import { appDataSource } from "../../platform/infrastructure/database/data-source"

@Module({
  providers: [
    {
      provide: "APP_DATA_SOURCE",
      useFactory: async () => {
        if (!appDataSource.isInitialized) {
          await appDataSource.initialize()
        }
        return appDataSource
      },
    },
  ],
  exports: ["APP_DATA_SOURCE"],
})
export class DatabaseModule {}
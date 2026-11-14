import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { appDataSource } from "../../platform/infrastructure/database/data-source"

@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        if (!appDataSource.isInitialized) await appDataSource.initialize()
        return appDataSource
      },
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}

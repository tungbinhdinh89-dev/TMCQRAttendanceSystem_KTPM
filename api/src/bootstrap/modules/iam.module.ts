import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { AuthService } from "../../modules/iam/application/auth.service"
import { AuthController } from "../../modules/iam/presentation/auth.controller"

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: AuthService,
      useFactory: (dataSource: DataSource) => new AuthService(dataSource),
      inject: [DataSource],
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class IamModule {}

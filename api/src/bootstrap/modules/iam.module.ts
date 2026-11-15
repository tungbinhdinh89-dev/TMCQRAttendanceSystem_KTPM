import { AuditService } from "../../modules/iam/application/audit.service"
import { AuditController } from "../../modules/iam/presentation/audit.controller"
import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { AuthService } from "../../modules/iam/application/auth.service"
import { AuthController } from "../../modules/iam/presentation/auth.controller"

@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: AuditService, useFactory: (dataSource: DataSource) => new AuditService(dataSource), inject: [DataSource] },
    {
      provide: AuthService,
      useFactory: (dataSource: DataSource, audit: AuditService) => new AuthService(dataSource, audit),
      inject: [DataSource, AuditService],
    },
  ],
  controllers: [AuthController, AuditController],
})
export class IamModule {}

import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
import { AuditService } from "../../modules/iam/application/audit.service"
import { EmployeeService } from "../../modules/eqr/application/employee.service"
import { EmployeeController } from "../../modules/eqr/presentation/employee.controller"
import { QrService } from "../../modules/eqr/application/qr.service"
import { QrController } from "../../modules/eqr/presentation/qr.controller"
@Module({
  imports:[DatabaseModule,IamModule],
  providers:[{provide:EmployeeService,useFactory:(ds:DataSource,audit:AuditService)=>new EmployeeService(ds,audit),inject:[DataSource,AuditService]}, {provide:QrService,useFactory:(ds:DataSource,audit:AuditService)=>new QrService(ds,audit),inject:[DataSource,AuditService]}],
  controllers:[EmployeeController,QrController],
  exports:[QrService],
})
export class EqrModule {}

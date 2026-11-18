import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
import { AuditService } from "../../modules/iam/application/audit.service"
import { EmployeeService } from "../../modules/eqr/application/employee.service"
import { EmployeeController } from "../../modules/eqr/presentation/employee.controller"
@Module({
  imports:[DatabaseModule,IamModule],
  providers:[{provide:EmployeeService,useFactory:(ds:DataSource,audit:AuditService)=>new EmployeeService(ds,audit),inject:[DataSource,AuditService]}],
  controllers:[EmployeeController],
})
export class EqrModule {}

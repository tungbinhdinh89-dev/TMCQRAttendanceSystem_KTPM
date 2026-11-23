import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
import { AuditService } from "../../modules/iam/application/audit.service"
import { OrganizationController } from "../../modules/cfg/presentation/organization.controller"
import { OrganizationService } from "../../modules/cfg/application/organization.service"
@Module({imports:[DatabaseModule,IamModule],providers:[{provide:OrganizationService,useFactory:(ds:DataSource,audit:AuditService)=>new OrganizationService(ds,audit),inject:[DataSource,AuditService]}],controllers:[OrganizationController],exports:[OrganizationService]})
export class CfgModule{}

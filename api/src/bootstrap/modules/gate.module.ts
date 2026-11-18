import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
import { AuditService } from "../../modules/iam/application/audit.service"
import { StationConfigurationService } from "../../modules/gate/application/station-configuration.service"
import { StationConfigurationController,StationHeartbeatController } from "../../modules/gate/presentation/station-configuration.controller"
@Module({imports:[DatabaseModule,IamModule],providers:[{provide:StationConfigurationService,useFactory:(ds:DataSource,audit:AuditService)=>new StationConfigurationService(ds,audit),inject:[DataSource,AuditService]}],controllers:[StationConfigurationController,StationHeartbeatController]})
export class GateModule{}

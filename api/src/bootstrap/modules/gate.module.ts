import { Module } from "@nestjs/common"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
import { EqrModule } from "./eqr.module"
import { AttModule } from "./att.module"
import { AuditService } from "../../modules/iam/application/audit.service"
import { QrService } from "../../modules/eqr/application/qr.service"
import { DemoAttendanceRecorder } from "../../modules/att/application/demo-attendance-recorder"
import { StationConfigurationService } from "../../modules/gate/application/station-configuration.service"
import { StationConfigurationController, StationHeartbeatController } from "../../modules/gate/presentation/station-configuration.controller"
import { WebScannerService } from "../../modules/gate/application/web-scanner.service"
import { WebScannerController } from "../../modules/gate/presentation/web-scanner.controller"
import { GateHistoryService } from "../../modules/gate/application/gate-history.service"
import { GateHistoryController } from "../../modules/gate/presentation/gate-history.controller"
@Module({ imports: [DatabaseModule, IamModule, EqrModule, AttModule], providers: [
  { provide: StationConfigurationService, useFactory: (ds: DataSource, audit: AuditService) => new StationConfigurationService(ds, audit), inject: [DataSource, AuditService] },
  { provide: WebScannerService, useFactory: (ds: DataSource, qr: QrService, attendance: DemoAttendanceRecorder, audit: AuditService) => new WebScannerService(ds, qr, attendance, audit), inject: [DataSource, QrService, DemoAttendanceRecorder, AuditService] },
  { provide: GateHistoryService, useFactory: (ds: DataSource) => new GateHistoryService(ds), inject: [DataSource] },
], controllers: [StationConfigurationController, StationHeartbeatController, WebScannerController, GateHistoryController] })
export class GateModule {}

import { Module } from "@nestjs/common"
import { DemoAttendanceRecorder } from "../../modules/att/application/demo-attendance-recorder"
import { AttendanceHistoryService } from "../../modules/att/application/attendance-history.service"
import { AttendanceHistoryController } from "../../modules/att/presentation/attendance-history.controller"
import { DataSource } from "typeorm"
import { DatabaseModule } from "./database.module"
import { IamModule } from "./iam.module"
@Module({ imports: [DatabaseModule, IamModule], providers: [DemoAttendanceRecorder,
  { provide: AttendanceHistoryService, useFactory: (ds: DataSource) => new AttendanceHistoryService(ds), inject: [DataSource] },
], controllers: [AttendanceHistoryController], exports: [DemoAttendanceRecorder] })
export class AttModule {}

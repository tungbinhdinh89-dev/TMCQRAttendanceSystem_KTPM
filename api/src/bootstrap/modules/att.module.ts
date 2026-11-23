import { Module } from "@nestjs/common"
import { DemoAttendanceRecorder } from "../../modules/att/application/demo-attendance-recorder"
@Module({ providers: [DemoAttendanceRecorder], exports: [DemoAttendanceRecorder] })
export class AttModule {}

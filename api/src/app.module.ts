import { Module } from "@nestjs/common"
import { AttModule } from "./bootstrap/modules/att.module"
import { CfgModule } from "./bootstrap/modules/cfg.module"
import { DatabaseModule } from "./bootstrap/modules/database.module"
import { EqrModule } from "./bootstrap/modules/eqr.module"
import { GateModule } from "./bootstrap/modules/gate.module"
import { IamModule } from "./bootstrap/modules/iam.module"
import { RptModule } from "./bootstrap/modules/rpt.module"

@Module({
  imports: [DatabaseModule, IamModule, EqrModule, GateModule, AttModule, RptModule, CfgModule],
})
export class AppModule {}
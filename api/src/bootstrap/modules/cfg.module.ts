import { Module } from "@nestjs/common"
import { DatabaseModule } from "./database.module"
import { DemoBootstrapController } from "../../modules/cfg/presentation/demo-bootstrap.controller"

@Module({
  imports: [DatabaseModule],
  controllers: [DemoBootstrapController],
})
export class CfgModule {}
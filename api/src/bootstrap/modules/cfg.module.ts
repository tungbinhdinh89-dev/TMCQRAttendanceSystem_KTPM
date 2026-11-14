import { IamModule } from "./iam.module"
import { Module } from "@nestjs/common"
import { DatabaseModule } from "./database.module"
import { WorkspaceController } from "../../modules/cfg/presentation/workspace.controller"

@Module({
  imports: [DatabaseModule, IamModule],
  controllers: [WorkspaceController],
})
export class CfgModule {}
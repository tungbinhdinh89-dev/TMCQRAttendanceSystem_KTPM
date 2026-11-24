import { Controller, Get, Header, Param, Query, Req } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { GateHistoryService } from "../application/gate-history.service"
type Request = { headers: { cookie?: string } }
@Controller("gate/history")
export class GateHistoryController {
  constructor(private readonly historyService: GateHistoryService, private readonly auth: AuthService) {}
  @Get() @Header("Cache-Control", "no-store")
  async history(@Req() req: Request, @Query() query: Record<string, unknown>) { return this.historyService.history(await this.auth.me(readCookie(req, SESSION_COOKIE)), query) }
  @Get(":id") @Header("Cache-Control", "no-store")
  async detail(@Req() req: Request, @Param("id") id: string) { return this.historyService.detail(await this.auth.me(readCookie(req, SESSION_COOKIE)), id) }
}

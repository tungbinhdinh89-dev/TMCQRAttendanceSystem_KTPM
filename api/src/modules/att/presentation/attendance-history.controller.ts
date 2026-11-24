import { Controller, Get, Header, Param, Query, Req } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { AttendanceHistoryService } from "../application/attendance-history.service"
type Request = { headers: { cookie?: string } }
@Controller("attendance")
export class AttendanceHistoryController {
  constructor(private readonly historyService: AttendanceHistoryService, private readonly auth: AuthService) {}
  @Get("history") @Header("Cache-Control", "no-store")
  async history(@Req() req: Request, @Query() query: Record<string, unknown>) { return this.historyService.history(await this.auth.me(readCookie(req, SESSION_COOKIE)), query) }
  @Get("history/:id") @Header("Cache-Control", "no-store")
  async detail(@Req() req: Request, @Param("id") id: string) { return this.historyService.detail(await this.auth.me(readCookie(req, SESSION_COOKIE)), id) }
  @Get("summary") @Header("Cache-Control", "no-store")
  async summary(@Req() req: Request, @Query() query: Record<string, unknown>) { return this.historyService.summary(await this.auth.me(readCookie(req, SESSION_COOKIE)), query) }
}

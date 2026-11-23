import { Body, Controller, Get, Header, HttpCode, Param, Post, Req } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { WebScannerService } from "../application/web-scanner.service"
type Request = { headers: { cookie?: string; origin?: string } }
@Controller("scanner")
export class WebScannerController {
  constructor(private readonly scanner: WebScannerService, private readonly auth: AuthService) {}
  @Get("stations") @Header("Cache-Control", "no-store")
  async stations(@Req() request: Request) { return this.scanner.stations(await this.auth.me(readCookie(request, SESSION_COOKIE))) }
  @Post("stations/:id/scans") @HttpCode(200) @Header("Cache-Control", "no-store")
  async scan(@Req() request: Request, @Param("id") stationId: string, @Body() body: Record<string, unknown>) {
    await this.auth.verifyRequestOrigin(request.headers.origin, "WEB_DEMO_SCAN")
    return this.scanner.scan(await this.auth.me(readCookie(request, SESSION_COOKIE)), stationId, body)
  }
}

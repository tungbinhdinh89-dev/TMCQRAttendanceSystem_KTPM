import { Controller, Get, Header, Query, Req } from "@nestjs/common"
import { AuditService } from "../application/audit.service"
import { AuthService, SESSION_COOKIE } from "../application/auth.service"
import { readCookie } from "./auth.controller"
@Controller("audit-entries")
export class AuditController {
  constructor(private readonly audit: AuditService,private readonly auth: AuthService) {}
  @Get()
  @Header("Cache-Control", "no-store")
  async search(@Req() request: {headers:{cookie?: string}},@Query() query: Record<string,unknown>) {
    return this.audit.search(await this.auth.me(readCookie(request,SESSION_COOKIE)),query)
  }
}

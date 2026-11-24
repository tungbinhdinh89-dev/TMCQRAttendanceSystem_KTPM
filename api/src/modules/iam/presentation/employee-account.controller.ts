import { BadRequestException, Body, Controller, Get, Header, Param, Post, Req, Res } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../application/auth.service"
import { EmployeeAccountService } from "../application/employee-account.service"
import { readCookie } from "./auth.controller"

type RequestLike = { headers: { cookie?: string; origin?: string } }
@Controller()
export class EmployeeAccountController {
  constructor(private readonly accounts: EmployeeAccountService, private readonly auth: AuthService) {}
  @Get("employees/:id/account")
  @Header("Cache-Control", "no-store")
  async get(@Req() request: RequestLike, @Param("id") id: string, @Res() response: { json(value: unknown): unknown }) {
    // Nest sends an empty body for a bare null; clients need valid JSON for "no account".
    return response.json(await this.accounts.get(await this.auth.me(readCookie(request, SESSION_COOKIE)), id))
  }
  @Post("employees/:id/account")
  @Header("Cache-Control", "no-store")
  async provision(@Req() request: RequestLike, @Param("id") id: string, @Body() input: Record<string, unknown>) {
    await this.auth.verifyRequestOrigin(request.headers.origin, "EMPLOYEE_ACCOUNT_PROVISION")
    const identity = await this.auth.me(readCookie(request, SESSION_COOKIE))
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new BadRequestException("Account input required")
    return this.accounts.provision(identity, id, input)
  }
}

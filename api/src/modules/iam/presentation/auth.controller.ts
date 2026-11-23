import { BadRequestException, Body, Controller, Get, Header, HttpCode, Post, Req, Res } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../application/auth.service"

type RequestLike = { headers: { cookie?: string; origin?: string } }
type ResponseLike = { setHeader(name: string, value: string): void }

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/login")
  @Header("Cache-Control", "no-store")
  async login(
    @Body() body: { username?: string; password?: string },
    @Res({ passthrough: true }) response: ResponseLike,
    @Req() request: RequestLike,
  ) {
    await this.authService.verifyRequestOrigin(request.headers.origin,"AUTH_LOGIN")
    if (typeof body?.username !== "string" || typeof body?.password !== "string" || !body.username || !body.password || body.username.length > 150 || body.password.length > 1024) {
      throw new BadRequestException({ code: "AUTH_INVALID_REQUEST", message: "username and password are required" })
    }
    const result = await this.authService.login(body.username, body.password)
    setSessionCookie(response, result.token, result.expiresAt)
    return { user: result.identity, expiresAt: result.expiresAt }
  }

  @Post("auth/logout")
  @Header("Cache-Control", "no-store")
  @HttpCode(204)
  async logout(@Req() request: RequestLike, @Res({ passthrough: true }) response: ResponseLike) {
    await this.authService.verifyRequestOrigin(request.headers.origin,"AUTH_LOGOUT")
    await this.authService.logout(readCookie(request, SESSION_COOKIE))
    clearSessionCookie(response)
  }

  @Post("auth/change-password")
  @Header("Cache-Control", "no-store")
  @HttpCode(204)
  async changePassword(@Req() request: RequestLike, @Body() body: { currentPassword?: unknown; newPassword?: unknown }, @Res({ passthrough: true }) response: ResponseLike) {
    await this.authService.verifyRequestOrigin(request.headers.origin, "AUTH_PASSWORD_CHANGE")
    await this.authService.changePassword(readCookie(request, SESSION_COOKIE), body?.currentPassword, body?.newPassword)
    clearSessionCookie(response)
  }

  @Get("me")
  @Header("Cache-Control", "no-store")
  async me(@Req() request: RequestLike) {
    return this.authService.me(readCookie(request, SESSION_COOKIE), true)
  }
}

export function readCookie(request: RequestLike, name: string): string | undefined {
  const header = request.headers.cookie
  if (!header) return undefined
  return header.split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

function setSessionCookie(response: ResponseLike, token: string, expiresAt: Date): void {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}`)
}

function clearSessionCookie(response: ResponseLike): void {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; ${process.env.NODE_ENV === "production" ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`)
}

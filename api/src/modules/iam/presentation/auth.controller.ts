import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../application/auth.service"

type RequestLike = { headers: { cookie?: string } }
type ResponseLike = { setHeader(name: string, value: string): void }

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/login")
  async login(
    @Body() body: { username?: string; password?: string },
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    if (!body.username || !body.password) {
      throw new BadRequestException({ code: "AUTH_INVALID_REQUEST", message: "username and password are required" })
    }
    const result = await this.authService.login(body.username, body.password)
    setSessionCookie(response, result.token, result.expiresAt)
    return { user: result.identity, expiresAt: result.expiresAt }
  }

  @Post("auth/logout")
  @HttpCode(204)
  async logout(@Req() request: RequestLike, @Res({ passthrough: true }) response: ResponseLike) {
    await this.authService.logout(readCookie(request, SESSION_COOKIE))
    clearSessionCookie(response)
  }

  @Get("me")
  async me(@Req() request: RequestLike) {
    return this.authService.me(readCookie(request, SESSION_COOKIE))
  }
}

function readCookie(request: RequestLike, name: string): string | undefined {
  const header = request.headers.cookie
  if (!header) return undefined
  return header.split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

function setSessionCookie(response: ResponseLike, token: string, expiresAt: Date): void {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Expires=${expiresAt.toUTCString()}`)
}

function clearSessionCookie(response: ResponseLike): void {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`)
}

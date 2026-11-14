import { BadRequestException, Body, Controller, Get, HttpCode, ForbiddenException, Post, Req, Res } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../application/auth.service"

type RequestLike = { headers: { cookie?: string; origin?: string } }
type ResponseLike = { setHeader(name: string, value: string): void }

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("auth/login")
  async login(
    @Req() request: RequestLike,
    @Body() body: { username?: string; password?: string },
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    if (typeof body?.username !== "string" || typeof body.password !== "string" || !body.username.trim() || !body.password) {
      throw new BadRequestException({ code: "AUTH_INVALID_REQUEST", message: "username and password are required" })
    }
    checkOrigin(request)
    const result = await this.authService.login(body.username.trim(), body.password)
    setSessionCookie(response, result.token, result.expiresAt)
    return { user: result.identity, expiresAt: result.expiresAt }
  }

  @Post("auth/logout")
  @HttpCode(204)
  async logout(@Req() request: RequestLike, @Res({ passthrough: true }) response: ResponseLike) {
    checkOrigin(request)
    await this.authService.logout(readCookie(request, SESSION_COOKIE))
    clearSessionCookie(response)
  }

  @Get("me")
  async me(@Req() request: RequestLike) {
    return this.authService.me(readCookie(request, SESSION_COOKIE))
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

function checkOrigin(request: RequestLike) {
  const origin = request.headers.origin
  const allowed = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map(value => value.trim())
  if (origin && !allowed.includes(origin)) throw new ForbiddenException("Origin is not allowed")
}

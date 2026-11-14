import { z } from "zod"
import type { SessionIdentity } from "@tmc/contracts"

const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
const identitySchema = z.object({
  userId: z.string(), username: z.string(), employeeId: z.string(),
  employee: z.object({ employeeCode: z.string(), fullName: z.string(), status: z.string() }),
  roles: z.array(z.object({
    code: z.string(), scopeType: z.string(), factoryId: z.string().nullable(),
    departmentId: z.string().nullable(), teamId: z.string().nullable(), permissions: z.array(z.string()),
  })),
})

export const authApi = {
  async me(): Promise<SessionIdentity | null> {
    const response = await fetch(`${baseUrl}/me`, { credentials: "include", cache: "no-store" })
    if (response.status === 401) return null
    if (!response.ok) throw new Error(`Không thể kiểm tra phiên đăng nhập (${response.status}).`)
    return identitySchema.parse(await response.json())
  },
  async login(username: string, password: string): Promise<SessionIdentity> {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      if (body.code === "AUTH_EMPLOYEE_INACTIVE") throw new Error("Nhân viên đã ngừng hoạt động hoặc bị thu hồi quyền.")
      if (response.status === 401) throw new Error("Tài khoản hoặc mật khẩu chưa đúng.")
      throw new Error(`Không thể đăng nhập (${response.status}).`)
    }
    const body = await response.json()
    return identitySchema.parse(body.user)
  },
  async logout(): Promise<void> {
    const response = await fetch(`${baseUrl}/auth/logout`, { method: "POST", credentials: "include" })
    if (!response.ok) throw new Error("Không thể đăng xuất trên máy chủ. Vui lòng thử lại.")
  },
}

import { z } from "zod"
import type { AuditPage, AuditQuery } from "../../../contracts/src/audit"

const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
const identitySchema = z.object({
  userId: z.string(), username: z.string(),
  roles: z.array(z.object({ code: z.string(), scopeType: z.string(), permissions: z.array(z.string()) })),
})
export type AuditIdentity = z.infer<typeof identitySchema>
const entrySchema = z.object({
  id: z.string(), createdAt: z.string(), actorType: z.string(), actorUserId: z.string().nullable(),
  actorStationId: z.string().nullable(), factoryId: z.string().nullable(), action: z.string(),
  objectType: z.string(), objectId: z.string(), outcome: z.string(), reason: z.string().nullable(),
  beforeData: z.unknown().nullable(), afterData: z.unknown().nullable(), correlationId: z.string(),
})
const pageSchema = z.object({ items: z.array(entrySchema), page: z.number().int().positive(), pageSize: z.number().int().positive(), total: z.number().int().nonnegative() })

export class AuditApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, credentials: "include", cache: "no-store" })
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Bộ lọc không hợp lệ. Kiểm tra thời gian và mã định danh đã nhập.",
      401: "Phiên đăng nhập đã hết hạn hoặc tài khoản không hợp lệ. Vui lòng đăng nhập lại.",
      403: "Tài khoản không có quyền đọc nhật ký trong phạm vi này.",
      429: "Có quá nhiều yêu cầu. Vui lòng thử lại sau.",
    }
    throw new AuditApiError(response.status, messages[response.status] || "Không thể tải nhật ký từ máy chủ. Vui lòng thử lại.")
  }
  return response.status === 204 ? undefined : response.json()
}
export const auditApi = {
  async me(signal?: AbortSignal): Promise<AuditIdentity> { return identitySchema.parse(await request("/me", { signal })) },
  async login(username: string, password: string): Promise<AuditIdentity> {
    const result = await request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) })
    return identitySchema.parse(result.user)
  },
  async logout(): Promise<void> { await request("/auth/logout", { method: "POST" }) },
  async search(query: AuditQuery, signal?: AbortSignal): Promise<AuditPage> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") params.set(key, String(value))
    return pageSchema.parse(await request(`/audit-entries?${params}`, { signal })) as AuditPage
  },
}
export const canReadAudit = (identity: AuditIdentity) => identity.roles.some(role =>
  ["GLOBAL", "FACTORY"].includes(role.scopeType) && (
    (role.code === "ADM" && (role.permissions.includes("iam:manage") || role.permissions.includes("audit:read"))) ||
    (["HR", "SEC"].includes(role.code) && role.permissions.includes("audit:read"))
  ),
)

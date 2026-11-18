import { z } from "zod"

const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
const identitySchema = z.object({ userId: z.string(), username: z.string(), roles: z.array(z.object({ code: z.string(), scopeType: z.string(), factoryId: z.string().nullable().optional(), permissions: z.array(z.string()) })) })
export type ManagementIdentity = z.infer<typeof identitySchema>
export type RecordRow = { id: string; rowVersion?: number; [key: string]: unknown }
export interface Organization { factories: RecordRow[]; departments: RecordRow[]; teams: RecordRow[] }
export interface EmployeePage { items: RecordRow[]; total: number; page: number; pageSize: number }
export class ManagementError extends Error { constructor(public status: number, message: string) { super(message) } }
export async function managementRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, { method, credentials: "include", cache: "no-store", signal, ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) })
  if (!response.ok) {
    const messages: Record<number, string> = { 400: "Dữ liệu chưa hợp lệ. Kiểm tra mã, khoảng hiệu lực và quan hệ tổ chức.", 401: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", 403: "Bạn không có quyền thực hiện trong phạm vi này.", 404: "Không tìm thấy dữ liệu hoặc dữ liệu đã thay đổi.", 409: "Dữ liệu đã thay đổi hoặc mã bị trùng. Tải lại danh sách trước khi sửa tiếp." }
    throw new ManagementError(response.status, messages[response.status] || "Máy chủ chưa xử lý được yêu cầu. Không có thông báo lưu thành công; hãy tải lại để kiểm tra.")
  }
  return response.status === 204 ? undefined as T : response.json()
}
export const managementSession = {
  async me(signal?: AbortSignal) { return identitySchema.parse(await managementRequest("/me", "GET", undefined, signal)) },
  async login(username: string, password: string) { const response = await managementRequest<{ user: unknown }>("/auth/login", "POST", { username, password }); return identitySchema.parse(response.user) },
  async logout() { await managementRequest("/auth/logout", "POST") },
}
export const text = (row: RecordRow, key: string) => row[key] == null ? "" : String(row[key])

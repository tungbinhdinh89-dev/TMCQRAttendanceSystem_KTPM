import { apiBase } from "../lib/api-base"
import { z } from "zod"

const base = apiBase
const identitySchema = z.object({ userId: z.string(), username: z.string(), employee: z.object({ employeeCode: z.string(), fullName: z.string(), status: z.string() }).optional(), mustChangePassword: z.boolean().optional().default(false), roles: z.array(z.object({ code: z.string(), scopeType: z.string(), factoryId: z.string().nullable().optional(), departmentId: z.string().nullable().optional(), teamId: z.string().nullable().optional(), permissions: z.array(z.string()) })) })
export type ManagementIdentity = z.infer<typeof identitySchema>
export type RecordRow = { id: string; rowVersion?: number; [key: string]: unknown }
export interface Organization { factories: RecordRow[]; departments: RecordRow[]; teams: RecordRow[] }
export interface EmployeePage { items: RecordRow[]; total: number; page: number; pageSize: number }
export class ManagementError extends Error { constructor(public status: number, message: string, public field?: string, public code?: string) { super(message) } }
export async function managementRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, { method, credentials: "include", cache: "no-store", signal, ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) })
  if (!response.ok) {
    const messages: Record<number, string> = { 400: "Dữ liệu chưa hợp lệ. Kiểm tra mã, khoảng hiệu lực và quan hệ tổ chức.", 401: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", 403: "Bạn không có quyền thực hiện trong phạm vi này.", 404: "Không tìm thấy dữ liệu hoặc dữ liệu đã thay đổi.", 409: "Dữ liệu đã thay đổi hoặc mã bị trùng. Tải lại danh sách trước khi sửa tiếp." }
    const payload: { code?: string; field?: string; message?: string; row?: number; requestId?: string } = await response.json().catch(() => ({}))
    if (payload.code === "AUTH_PASSWORD_CHANGE_REQUIRED") throw new ManagementError(403, "Bạn cần đổi mật khẩu tạm trước khi sử dụng hệ thống.", payload.field, payload.code)
    if (response.status >= 500) throw new ManagementError(response.status, `Máy chủ chưa xử lý được yêu cầu. Tải lại danh sách để kiểm tra trước khi lưu lại.${payload.requestId ? ` Mã tham chiếu lỗi: ${payload.requestId}` : ""}`, payload.field, payload.code)
    const conflicts: Record<string, string> = { EMPLOYEE_CODE_EXISTS: "Mã nhân viên đã tồn tại. Dùng lại mã tự động hoặc nhập mã khác; nếu nhân viên quay lại hãy kích hoạt hồ sơ cũ.", HRS_CODE_EXISTS: "Mã HRS đã tồn tại. Kiểm tra mã trên hệ thống nhân sự gốc; không tự tạo mã thay thế." }
    const detail = payload.code && conflicts[payload.code]
    if (detail) throw new ManagementError(response.status, `${payload.row ? `Dòng ${payload.row}: ` : ""}${detail}`, payload.field, payload.code)
    if (payload.row) throw new ManagementError(response.status, `Dòng ${payload.row}: ${messages[response.status] || "Không thể nhập file."}`, payload.field, payload.code)
    throw new ManagementError(response.status, messages[response.status] || "Máy chủ chưa xử lý được yêu cầu. Không có thông báo lưu thành công; hãy tải lại để kiểm tra.")
  }
  return response.status === 204 ? undefined as T : response.json()
}
export const managementSession = {
  async me(signal?: AbortSignal) { return identitySchema.parse(await managementRequest("/me", "GET", undefined, signal)) },
  async login(username: string, password: string) { const response = await managementRequest<{ user: unknown }>("/auth/login", "POST", { username, password }); return identitySchema.parse(response.user) },
  async changePassword(currentPassword: string, newPassword: string) { await managementRequest("/auth/change-password", "POST", { currentPassword, newPassword }) },
  async logout() { await managementRequest("/auth/logout", "POST") },
}
export const text = (row: RecordRow, key: string) => row[key] == null ? "" : String(row[key])

import { z } from "zod"
const base = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
const credential = z.object({ id: z.string(), status: z.string(), credentialRef: z.string() })
const statusSchema = z.object({ credential: credential.nullable(), signingAvailable: z.boolean(), serverTime: z.string().datetime() })
const staticSchema = z.object({ token: z.string().min(1), credentialId: z.string(), issuedAt: z.string().datetime(), serverTime: z.string().datetime() })
export type SelfQrStatus = z.infer<typeof statusSchema>
export class QrError extends Error { constructor(public status: number, message: string) { super(message) } }
async function request(path: string, method = "GET", signal?: AbortSignal) {
  const response = await fetch(`${base}${path}`, { method, credentials: "include", cache: "no-store", signal, ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}) })
  if (!response.ok) {
    const messages: Record<number, string> = { 401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 403: "Tài khoản không được cấp QR hoặc quyền đã bị thu hồi.", 404: "Chưa có credential. Vui lòng liên hệ nhân sự.", 409: "Credential chưa sẵn sàng. Vui lòng kiểm tra lại với nhân sự.", 429: "Bạn cấp mã quá nhanh. Vui lòng đợi vài giây.", 503: "Máy chủ chưa sẵn sàng cấp mã bảo mật. Vui lòng thử lại sau." }
    throw new QrError(response.status, messages[response.status] || "Không thể kết nối để cấp mã. QR cũ đã được ẩn, không được gia hạn trên trình duyệt.")
  }
  return response.json()
}
export const qrApi = {
  async status(signal?: AbortSignal) { return statusSchema.parse(await request("/qr/self", "GET", signal)) },
  async code(signal?: AbortSignal) { return staticSchema.parse(await request("/qr/self/code", "GET", signal)) },
}

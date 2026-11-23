import { z } from "zod"
import { apiBase } from "../lib/api-base"
import type { WebScanRequest } from "../../../contracts/src/scanner"

const station = z.object({ id: z.string().uuid(), code: z.string(), factoryId: z.string().uuid(), factoryName: z.string(), direction: z.enum(["IN", "OUT"]) })
const result = z.object({ eventId: z.string().uuid(), attemptId: z.string().uuid(), mode: z.literal("CLASSROOM_DEMO"), direction: z.enum(["IN", "OUT"]), decision: z.enum(["ALLOW", "DENIED"]), reasonCode: z.string().nullable(), attendanceState: z.enum(["RECORDED", "NOT_RECORDED", "ALREADY_RECORDED"]), attendanceEventId: z.string().uuid().nullable(), occurredAt: z.string().datetime(), duplicate: z.boolean(), employee: z.object({ employeeCode: z.string(), fullName: z.string() }).nullable() })
export type ScanStation = z.infer<typeof station>
export type ScanResult = z.infer<typeof result>
export class ScannerError extends Error { constructor(public status: number, message: string) { super(message) } }
async function request(path: string, init: RequestInit = {}, signal?: AbortSignal) {
  const response = await fetch(`${apiBase}${path}`, { ...init, credentials: "include", cache: "no-store", signal })
  if (!response.ok) {
    const messages: Record<number, string> = { 400: "Mã QR hoặc dữ liệu quét chưa hợp lệ.", 401: "Phiên đăng nhập đã hết hạn. Đăng nhập lại bằng tài khoản SEC.", 403: "Bạn không có quyền quét tại trạm này.", 404: "Trạm không còn tồn tại hoặc không khả dụng.", 409: "Mã sự kiện xung đột hoặc trạng thái đã thay đổi. Không tự tạo lượt quét thay thế." }
    throw new ScannerError(response.status, messages[response.status] || "Máy chủ chưa xác nhận kết quả. Giữ nguyên lượt quét và thử lại để kiểm tra.")
  }
  return response.json()
}
export const scannerApi = {
  async stations(signal?: AbortSignal) { return z.object({ items: z.array(station) }).parse(await request("/scanner/stations", {}, signal)).items },
  async scan(stationId: string, body: WebScanRequest, signal?: AbortSignal) {
    return result.parse(await request(`/scanner/stations/${encodeURIComponent(stationId)}/scans`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, signal))
  },
}

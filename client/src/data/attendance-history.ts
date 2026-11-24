import { apiBase } from "../lib/api-base"
import { ManagementError } from "./management"
import type { AttendanceHistoryItem, AttendanceHistoryPage, AttendanceSummaryPage, GateHistoryItem, GateHistoryPage } from "../../../contracts/src/attendance"

export type HistoryMode = "attendance" | "gate" | "summary"
export type HistoryQuery = { from: string; to: string; page: number; pageSize: number; direction?: string; factoryId?: string; employeeId?: string; stationId?: string }
export type HistoryResult = AttendanceHistoryPage | AttendanceSummaryPage | GateHistoryPage
const endpoints = { attendance: "/attendance/history", gate: "/gate/history", summary: "/attendance/summary" }

export async function readHistory(mode: HistoryMode, query: HistoryQuery, signal: AbortSignal): Promise<HistoryResult> {
  const params = new URLSearchParams()
  const allowed = ["from", "to", "page", "pageSize", "direction", "factoryId", ...(mode === "attendance" ? ["employeeId", "stationId"] : mode === "gate" ? ["stationId"] : [])]
  for (const [key, value] of Object.entries(query)) if (allowed.includes(key) && value !== "" && value !== undefined) params.set(key, String(value))
  return historyRequest<HistoryResult>(`${endpoints[mode]}?${params}`, signal)
}

export function readHistoryDetail(mode: "attendance" | "gate", id: string, signal: AbortSignal) {
  return historyRequest<AttendanceHistoryItem | GateHistoryItem>(`${endpoints[mode]}/${encodeURIComponent(id)}`, signal)
}

async function historyRequest<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { credentials: "include", cache: "no-store", signal })
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: "Bộ lọc chưa hợp lệ. Chọn khoảng thời gian tối đa 93 ngày và kiểm tra mã định danh.",
      401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      403: "Bạn không có quyền xem dữ liệu trong phạm vi này.",
      404: "Không tìm thấy bản ghi trong phạm vi được cấp.",
    }
    throw new ManagementError(response.status, messages[response.status] || "Không thể tải lịch sử từ máy chủ. Vui lòng thử lại.")
  }
  return response.json()
}

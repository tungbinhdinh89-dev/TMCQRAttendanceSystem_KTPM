/** Nullable account lookup is the only legacy endpoint allowed to return an empty200 body. */
export async function readManagementResponse<T>(response: Response, allowEmptyAccount = false): Promise<T> {
  if (response.status === 204) return undefined as T
  const contents = await response.text()
  if (!contents.trim()) {
    if (allowEmptyAccount) return null as T
    throw new Error("Máy chủ trả về dữ liệu rỗng. Yêu cầu có thể đã được xử lý; kiểm tra lại trạng thái trước khi gửi lại.")
  }
  try { return JSON.parse(contents) as T }
  catch { throw new Error("Dữ liệu phản hồi từ máy chủ không hợp lệ. Kiểm tra lại trạng thái trước khi gửi lại yêu cầu.") }
}

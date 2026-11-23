import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common"
import { randomUUID } from "node:crypto"

/** Safe diagnostics: never log request bodies, SQL text, parameters or database error detail. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ApiError")
  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<{ method?: string; route?: { path?: string } }>()
    const response = http.getResponse<{ setHeader(name: string, value: string): void; status(code: number): { json(body: unknown): void } }>()
    const requestId = randomUUID()
    let status = 500
    let payload: Record<string, unknown> = { code: "INTERNAL_ERROR", message: "Không thể xử lý yêu cầu. Gửi mã tham chiếu lỗi để kiểm tra; tải lại danh sách trước khi thử lưu lại." }
    if (error instanceof HttpException) {
      status = error.getStatus()
      const body = error.getResponse()
      // Preserve validation/conflict fields so the form can identify the affected input.
      if (status < 500) payload = typeof body === "string" ? { message: body } : { ...body }
      else payload = { code: "SERVICE_UNAVAILABLE", message: "Dịch vụ chưa xử lý được yêu cầu. Kiểm tra trạng thái backend và thử lại sau." }
    } else {
      const database = error && typeof error === "object" ? (error as { driverError?: { code?: string } }).driverError : undefined
      if (database?.code === "23505") { status = 409; payload = { code: "DATA_CONFLICT", message: "Mã hoặc dữ liệu đã tồn tại. Kiểm tra lại trước khi lưu." } }
      else if (["23503", "22P02"].includes(database?.code ?? "")) { status = 400; payload = { code: "INVALID_REFERENCE", message: "Thông tin tổ chức hoặc mã định danh chưa hợp lệ. Tải lại và chọn lại dữ liệu." } }
      else if (["42P01", "42703"].includes(database?.code ?? "")) { status = 503; payload = { code: "DATABASE_SCHEMA_MISMATCH", message: "Schema database chưa khớp với phiên bản backend. Kiểm tra migration của đúng database." } }
      else if ((error as { status?: number } | null)?.status === 413) { status = 413; payload = { code: "PAYLOAD_TOO_LARGE", message: "File hoặc nội dung yêu cầu vượt giới hạn cho phép." } }
    }
    const details = error && typeof error === "object" ? error as { name?: string; driverError?: { code?: string; table?: string; column?: string; constraint?: string } } : {}
    const diagnostic = { requestId, status, method: request.method, route: request.route?.path, errorClass: details.name, databaseCode: details.driverError?.code, table: details.driverError?.table, column: details.driverError?.column, constraint: details.driverError?.constraint }
    if (status >= 500) this.logger.error(JSON.stringify(diagnostic))
    response.setHeader("X-Request-Id", requestId)
    response.setHeader("Cache-Control", "no-store")
    response.status(status).json({ ...payload, statusCode: status, requestId })
  }
}

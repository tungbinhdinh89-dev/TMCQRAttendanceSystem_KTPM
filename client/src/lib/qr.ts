export function makeQr(employeeId: string, expired = false) {
  const time = Date.now() - (expired ? 120000 : 0)
  return `tmc-access:v1:${employeeId}:${time}:${time + 60000}:${crypto.randomUUID().slice(0, 8)}`
}
export function parseQr(payload: string) {
  const parts = payload.trim().split(":")
  if (
    parts.length !== 6 ||
    parts[0] !== "tmc-access" ||
    parts[1] !== "v1" ||
    !parts[2] ||
    !parts[5]
  )
    throw new Error("Mã QR không hợp lệ")
  const issuedAt = Number(parts[3]),
    expiresAt = Number(parts[4])
  if (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > 60000 ||
    issuedAt > Date.now() + 5000
  )
    throw new Error("Thời hạn mã QR không hợp lệ")
  return { employeeId: parts[2], issuedAt, expiresAt, nonce: parts[5] }
}

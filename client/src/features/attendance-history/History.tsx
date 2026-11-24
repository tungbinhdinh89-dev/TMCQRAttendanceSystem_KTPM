import { useEffect, useState, type FormEvent } from "react"
import { Link, Navigate, useSearchParams } from "react-router-dom"
import { Alert, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material"
import { Card, PageHeader } from "../../components/ui"
import { managementSession, ManagementError, type ManagementIdentity } from "../../data/management"
import { readHistory, readHistoryDetail, type HistoryMode, type HistoryQuery, type HistoryResult } from "../../data/attendance-history"
import { canReadAttendance, canReadAttendanceSummary, canReadGateHistory } from "../../lib/server-access"
import type { AttendanceHistoryItem, GateHistoryItem } from "../../../../contracts/src/attendance"
import { AccessMessage } from "../auth/ServerAccess"
import "../audit/audit.css"
import "./history.css"

const vnDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
const initialFilters = () => ({ from: vnDay(new Date(Date.now() - 29 * 86400000)), to: vnDay(new Date()), direction: "", factoryId: "", employeeId: "", stationId: "" })
type Filters = ReturnType<typeof initialFilters>
const endOfDayExclusive = (day: string) => new Date(Date.parse(`${day}T00:00:00+07:00`) + 86400000).toISOString()
const queryFor = (filters: Filters, pageSize: number): HistoryQuery => ({ ...filters, from: `${filters.from}T00:00:00+07:00`, to: endOfDayExclusive(filters.to), page: 1, pageSize })
const timestamp = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
const source = (value: string) => value === "DEMO" || value === "WEB_DEMO" ? "Mô phỏng QR" : value === "GATE" ? "Thiết bị cổng" : value === "MANUAL" ? "Thủ công" : value
const heading = { attendance: "Lịch sử chấm công", gate: "Nhật ký cổng", summary: "Tổng hợp chấm công" }

export default function History({ mode }: { mode: HistoryMode }) {
  const [search, setSearch] = useSearchParams()
  const detailId = mode !== "summary" ? search.get("id") : null
  const [identity, setIdentity] = useState<ManagementIdentity | null>(null)
  const [checking, setChecking] = useState(true)
  const [filters, setFilters] = useState(initialFilters)
  const [query, setQuery] = useState(() => queryFor(initialFilters(), 25))
  const [result, setResult] = useState<HistoryResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)
  const [detail, setDetail] = useState<AttendanceHistoryItem | GateHistoryItem | null>(null)
  const [detailBusy, setDetailBusy] = useState(false)
  const [detailError, setDetailError] = useState("")
  const allowed = !!identity && (mode === "attendance" ? canReadAttendance(identity) : mode === "gate" ? canReadGateHistory(identity) : canReadAttendanceSummary(identity))
  const selfOnly = !!identity && !identity.roles.some(r => (r.code === "HR" || r.code === "SUP") && canReadAttendance({ roles: [r] }))

  useEffect(() => {
    const controller = new AbortController()
    setChecking(true); setIdentity(null); setResult(null); setDetail(null); setError("")
    managementSession.me(controller.signal).then(user => { if (!controller.signal.aborted) setIdentity(user) }).catch(e => { if (!controller.signal.aborted && !(e instanceof ManagementError && e.status === 401)) setError(e instanceof Error ? e.message : "Không thể kiểm tra phiên đăng nhập.") }).finally(() => { if (!controller.signal.aborted) setChecking(false) })
    return () => controller.abort()
  }, [mode])
  useEffect(() => {
    setResult(null)
    if (!identity || !allowed || identity.mustChangePassword) return
    const controller = new AbortController()
    setBusy(true); setError("")
    readHistory(mode, query, controller.signal).then(data => { if (!controller.signal.aborted) setResult(data) }).catch(e => {
      if (controller.signal.aborted) return
      setError(e instanceof Error ? e.message : "Không thể kết nối máy chủ. Kiểm tra mạng rồi thử lại.")
      if (e instanceof ManagementError && e.status === 401) setIdentity(null)
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [identity, allowed, mode, query, reload])

  useEffect(() => {
    setDetail(null); setDetailError("")
    if (!detailId || !identity || !allowed || mode === "summary") { setDetailBusy(false); return }
    const controller = new AbortController()
    setDetailBusy(true)
    readHistoryDetail(mode, detailId, controller.signal).then(row => {
      if (!controller.signal.aborted) setDetail(row)
    }).catch(e => {
      if (controller.signal.aborted) return
      setDetailError(e instanceof Error ? e.message : "Không thể tải chi tiết.")
      if (e instanceof ManagementError && e.status === 401) { setIdentity(null); setResult(null) }
    }).finally(() => { if (!controller.signal.aborted) setDetailBusy(false) })
    return () => controller.abort()
  }, [detailId, identity, allowed, mode, reload])

  function closeDetail() { const next = new URLSearchParams(search); next.delete("id"); setSearch(next) }
  function detailLink(id: string) { const next = new URLSearchParams(search); next.set("id", id); return `?${next}` }

  function apply(event: FormEvent) {
    event.preventDefault()
    const start = Date.parse(`${filters.from}T00:00:00+07:00`), end = Date.parse(`${filters.to}T00:00:00+07:00`) + 86400000
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 93 * 86400000) { setError("Chọn khoảng thời gian hợp lệ, tối đa 93 ngày."); return }
    setQuery(queryFor(filters, query.pageSize))
  }
  if (!checking && !identity && !error) return <Navigate to="/dang-nhap" replace />
  if (identity && !allowed) return <AccessMessage identity={identity} />
  return <main className="audit-page">
    <PageHeader title={heading[mode]} description={mode === "summary" ? "Số lượt vào/ra theo ngày và nhà máy trong phạm vi điều hành được cấp." : mode === "gate" ? "Theo dõi lượt quét và kết quả tại cổng trong nhà máy được giao." : "Tra cứu các sự kiện chấm công đã ghi nhận trong phạm vi của bạn."} />
    {error && <Alert severity="error" action={<Button onClick={() => identity ? setReload(n => n + 1) : window.location.assign("/dang-nhap")}>{identity ? "Thử lại" : "Đăng nhập"}</Button>}>{error}</Alert>}
    {allowed && <>
      <p className="history-scope">{mode === "summary" ? "Chỉ hiển thị số liệu tổng hợp; không cung cấp hồ sơ hoặc lịch sử từng nhân viên." : mode === "gate" ? "Nhật ký cổng không phải bảng công. Lượt bị từ chối hoặc chưa ghi nhận không được tính là đã chấm công." : selfOnly ? "Bạn đang xem lịch sử của chính mình. Bạn không có quyền tự sửa công." : "Chỉ hiển thị nhân viên trong phạm vi được giao. Trang này chỉ đọc, không thay đổi dữ liệu công."}</p>
      <Card><form onSubmit={apply} className="audit-filters" aria-label="Bộ lọc lịch sử">
        <TextField label="Từ ngày" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Đến ngày" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} required slotProps={{ inputLabel: { shrink: true } }} />
        <TextField select label="Hướng" value={filters.direction} onChange={e => setFilters({ ...filters, direction: e.target.value })}><MenuItem value="">Tất cả</MenuItem><MenuItem value="IN">Vào (IN)</MenuItem><MenuItem value="OUT">Ra (OUT)</MenuItem></TextField>
        <details className="history-advanced"><summary>Bộ lọc nâng cao</summary><p className="history-note">Dùng mã định danh từ phần chi tiết bản ghi để thu hẹp kết quả. Bộ lọc không cấp thêm quyền truy cập.</p><div className="history-advanced-fields">
        <TextField label="ID nhà máy" value={filters.factoryId} onChange={e => setFilters({ ...filters, factoryId: e.target.value.trim() })} />
        {mode === "attendance" && !selfOnly && <TextField label="Mã nhân viên (UUID)" value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value.trim() })} />}
        {mode !== "summary" && <TextField label="ID trạm" value={filters.stationId} onChange={e => setFilters({ ...filters, stationId: e.target.value.trim() })} />}
        </div></details>
        <div className="audit-actions"><Button type="submit" variant="contained" disabled={busy}>Áp dụng</Button><Button disabled={busy} onClick={() => { const next = initialFilters(); setFilters(next); setQuery(queryFor(next, query.pageSize)); setReload(n => n + 1) }}>Xóa bộ lọc</Button></div>
      </form><p className="history-note">Ngày và kết quả dùng múi giờ Việt Nam (UTC+7). Khoảng tra cứu tối đa 93 ngày. Bộ lọc không mở rộng phạm vi được cấp.</p></Card>
      <section aria-label="Kết quả lịch sử" aria-busy={busy}>
        {busy && <div className="audit-loading" role="status"><CircularProgress size={24} />Đang tải dữ liệu…</div>}
        {!busy && result && <Card><div className="audit-results-title" role="status">{result.total.toLocaleString("vi-VN")} {mode === "summary" ? "nhóm ngày / nhà máy" : "bản ghi"}</div>
          {!result.items.length ? <p className="audit-empty">Không có dữ liệu phù hợp trong khoảng thời gian và phạm vi của bạn.</p> : <TableContainer className="audit-table"><Table size="small" aria-label={heading[mode]}><TableHead><TableRow>{(mode === "summary" ? ["Ngày", "Nhà máy", "Lượt vào", "Lượt ra", "Tổng lượt", "Số nhân viên", "Lượt mô phỏng"] : mode === "gate" ? ["Thời điểm", "Trạm / nhà máy", "Hướng", "Nhân viên", "Kết quả quét", "Ghi công", "Chi tiết"] : ["Thời điểm", "Nhân viên", "Nhà máy / trạm", "Hướng", "Nguồn", "Trạng thái", "Chi tiết"]).map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
            {mode === "summary" ? (result as import("../../../../contracts/src/attendance").AttendanceSummaryPage).items.map(row => <TableRow key={`${row.day}:${row.factoryId}`}><TableCell>{row.day}</TableCell><TableCell>{row.factoryName}</TableCell><TableCell>{row.inCount}</TableCell><TableCell>{row.outCount}</TableCell><TableCell>{row.eventCount}</TableCell><TableCell>{row.employeeCount}</TableCell><TableCell>{row.demoCount}</TableCell></TableRow>) : mode === "gate" ? (result as import("../../../../contracts/src/attendance").GateHistoryPage).items.map(row => <TableRow key={row.id}><TableCell><time dateTime={row.occurredAt}>{timestamp(row.occurredAt)}</time></TableCell><TableCell>{row.stationCode}<div className="history-note">{row.factoryName}</div></TableCell><TableCell>{row.direction === "IN" ? "Vào" : "Ra"}</TableCell><TableCell>{row.employeeCode || "—"}<div>{row.fullName}</div></TableCell><TableCell>{row.decision}<div className="history-note">{row.reasonCode}</div></TableCell><TableCell><Chip size="small" color={row.attendanceState === "RECORDED" ? "success" : "default"} label={row.attendanceState === "RECORDED" ? "Đã ghi nhận" : "Chưa ghi nhận"} /><div className="history-note">{source(row.sourceKind)}</div></TableCell><TableCell><Button component={Link} to={detailLink(row.id)}>Chi tiết</Button></TableCell></TableRow>) : (result as import("../../../../contracts/src/attendance").AttendanceHistoryPage).items.map(row => <TableRow key={row.id}><TableCell><time dateTime={row.occurredAt}>{timestamp(row.occurredAt)}</time></TableCell><TableCell>{row.employeeCode}<div>{row.fullName}</div></TableCell><TableCell>{row.factoryName}<div className="history-note">{row.stationCode || "—"}</div></TableCell><TableCell>{row.direction === "IN" ? "Vào" : "Ra"}</TableCell><TableCell>{source(row.sourceType)}</TableCell><TableCell><Chip size="small" color={row.isVoided ? "default" : "success"} label={row.isVoided ? "Đã hủy" : "Đã ghi nhận"} /></TableCell><TableCell><Button component={Link} to={detailLink(row.id)}>Chi tiết</Button></TableCell></TableRow>)}
          </TableBody></Table></TableContainer>}
          <nav className="audit-pagination" aria-label="Phân trang lịch sử"><TextField select label="Số dòng" size="small" value={query.pageSize} onChange={e => setQuery({ ...query, page: 1, pageSize: Number(e.target.value) })}>{[10, 25, 50, 100].map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</TextField><span>Trang {result.page} / {Math.max(1, Math.ceil(result.total / result.pageSize))}</span><div className="audit-actions"><Button disabled={result.page <= 1} onClick={() => setQuery({ ...query, page: result.page - 1 })}>Trang trước</Button><Button disabled={result.page * result.pageSize >= result.total} onClick={() => setQuery({ ...query, page: result.page + 1 })}>Trang sau</Button></div></nav>
          {mode === "summary" && <p className="history-note">Đếm các sự kiện còn hiệu lực; không phải tổng giờ làm hoặc bảng lương. Số nhân viên là số người riêng biệt trong từng nhóm, không cộng giữa các ngày.</p>}
        </Card>}
      </section>
    </>}
    <Dialog open={!!detailId && allowed} onClose={closeDetail} fullWidth maxWidth="sm" aria-labelledby="history-detail-title"><DialogTitle id="history-detail-title">Chi tiết bản ghi</DialogTitle><DialogContent className="history-detail">{detailBusy && <CircularProgress aria-label="Đang tải chi tiết" />}{detailError && <Alert severity="error">{detailError}</Alert>}{detail && <dl>{[["Mã bản ghi", detail.id], ["Mã liên kết", detail.correlationId || "—"], ["Thời điểm (Việt Nam)", timestamp(detail.occurredAt)], ["Nhà máy", detail.factoryName], ["ID nhà máy", detail.factoryId], ["ID trạm", detail.stationId || "—"], ["Trạm", detail.stationCode || "—"], ["Bằng chứng", detail.evidenceType || "—"], ...("revisionNo" in detail ? [["Phiên bản", String(detail.revisionNo)], ["Mã lượt quét", detail.attemptId || "—"]] : [["Mã sự kiện", detail.eventId], ["Trạng thái lệnh cổng", detail.commandState || "Không có lệnh"], ["Kết quả", detail.reasonCode || detail.decision]])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}<Button onClick={closeDetail}>Đóng</Button></DialogContent></Dialog>
  </main>
}

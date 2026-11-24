import { useEffect, useState, type FormEvent } from "react"
import { Alert, Button, CircularProgress, Dialog, DialogContent, DialogTitle, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material"
import { Navigate } from "react-router-dom"
import { Card, PageHeader } from "../../components/ui"
import { AuditApiError, auditApi, canReadAudit, type AuditIdentity } from "../../data/audit"
import type { AuditEntry, AuditPage, AuditQuery } from "../../../../contracts/src/audit"
import MandatoryPasswordChange from "../auth/MandatoryPasswordChange"
import { AccessMessage } from "../auth/ServerAccess"
import "./audit.css"

const initialFilters = { action: "", outcome: "", objectType: "", objectId: "", correlationId: "", factoryId: "", from: "", to: "" }
const outcomeLabels: Record<string, string> = { SUCCESS: "Thành công", FAILURE: "Thất bại", DENIED: "Từ chối" }

export default function Audit() {
  const [identity, setIdentity] = useState<AuditIdentity | null>(null)
  const [sessionBusy, setSessionBusy] = useState(true)
  const [sessionError, setSessionError] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [filters, setFilters] = useState(initialFilters)
  const [query, setQuery] = useState<AuditQuery>({ page: 1, pageSize: 25 })
  const [page, setPage] = useState<AuditPage | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState<AuditEntry | null>(null)
  const [reload, setReload] = useState(0)
  const allowed = identity ? canReadAudit(identity) : false

  useEffect(() => {
    const controller = new AbortController()
    auditApi.me(controller.signal).then(setIdentity).catch(e => {
      if (!controller.signal.aborted && (!(e instanceof AuditApiError) || e.status !== 401)) setSessionError("Không thể kiểm tra phiên đăng nhập. Bạn có thể thử đăng nhập lại.")
    }).finally(() => { if (!controller.signal.aborted) setSessionBusy(false) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setPage(null)
    setDetail(null)
    setError("")
    if (!identity || identity.mustChangePassword || !allowed) return
    const controller = new AbortController()
    setBusy(true)
    auditApi.search(query, controller.signal).then(result => { if (!controller.signal.aborted) setPage(result) }).catch(e => {
      if (controller.signal.aborted) return
      setError(e instanceof AuditApiError ? e.message : "Không thể kết nối máy chủ. Kiểm tra kết nối rồi thử lại.")
      if (e instanceof AuditApiError && e.status === 401) { setIdentity(null); setSessionError(e.message) }
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [identity, allowed, query, reload])

  async function login(event: FormEvent) {
    event.preventDefault(); setSessionBusy(true); setSessionError("")
    try {
      const user = await auditApi.login(username.trim(), password)
      setPassword(""); setPage(null); setQuery({ page: 1, pageSize: 25 }); setIdentity(user)
    } catch (e) { setSessionError(e instanceof AuditApiError ? e.message : "Không thể đăng nhập. Kiểm tra kết nối máy chủ.") }
    finally { setSessionBusy(false) }
  }
  async function logout() {
    setSessionBusy(true); setPage(null); setDetail(null); setSessionError("")
    try { await auditApi.logout(); setIdentity(null); setPassword(""); setFilters(initialFilters); setQuery({ page: 1, pageSize: 25 }) }
    catch { setSessionError("Chưa đăng xuất được trên máy chủ. Vui lòng thử lại.") }
    finally { setSessionBusy(false) }
  }
  function applyFilters(event: FormEvent) {
    event.preventDefault()
    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) { setError("Thời gian bắt đầu phải trước thời gian kết thúc."); return }
    const next: AuditQuery = { page: 1, pageSize: query.pageSize }
    for (const [key, value] of Object.entries(filters)) if (value.trim()) Object.assign(next, { [key]: key === "from" || key === "to" ? new Date(value).toISOString() : value.trim() })
    setQuery(next)
  }
  if (!sessionBusy && !identity) return <Navigate to="/dang-nhap" replace />
  if (identity && !identity.mustChangePassword && !allowed) return <AccessMessage identity={identity} />
  return <main className="audit-page">
    <PageHeader title="Nhật ký hệ thống" description="Tra cứu hoạt động và kết quả xử lý trong phạm vi được cấp quyền." />
    {sessionError && <Alert severity="error" role="alert">{sessionError}</Alert>}
    {!identity ? <Card className="audit-login">
      <h2 className="text-heading">Đăng nhập để xem nhật ký</h2>
      <p className="text-text-secondary">Sử dụng tài khoản được cấp quyền xem nhật ký. Phiên đăng nhập được xác thực trên máy chủ.</p>
      <form onSubmit={login} className="audit-login-form">
        <TextField label="Tên đăng nhập" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required disabled={sessionBusy} />
        <TextField label="Mật khẩu" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={sessionBusy} />
        <Button type="submit" variant="contained" disabled={sessionBusy}>{sessionBusy ? "Đang kiểm tra…" : "Đăng nhập"}</Button>
      </form>
    </Card> : identity.mustChangePassword ? <MandatoryPasswordChange onChanged={() => { setIdentity(null); setSessionError("Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.") }} onLogout={logout} /> : <>
      {!allowed ? <Alert severity="warning" role="alert">Tài khoản không có quyền xem nhật ký. Vui lòng đăng xuất và sử dụng tài khoản được cấp quyền.</Alert> : <>
        <Card>
          <form onSubmit={applyFilters} className="audit-filters" aria-label="Bộ lọc nhật ký">
            <TextField label="Hành động" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} size="small" />
            <TextField select label="Kết quả" value={filters.outcome} onChange={e => setFilters({ ...filters, outcome: e.target.value })} size="small"><MenuItem value="">Tất cả</MenuItem>{Object.entries(outcomeLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
            {[["objectType", "Loại đối tượng"], ["objectId", "Mã đối tượng"], ["correlationId", "Mã liên kết"], ["factoryId", "Mã nhà máy"]].map(([key, label]) => <TextField key={key} label={label} value={filters[key as keyof typeof filters]} onChange={e => setFilters({ ...filters, [key]: e.target.value })} size="small" />)}
            <TextField label="Từ thời điểm" type="datetime-local" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} size="small" />
            <TextField label="Đến thời điểm" type="datetime-local" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} size="small" />
            <div className="audit-actions"><Button variant="contained" type="submit" disabled={busy || sessionBusy}>Áp dụng</Button><Button type="button" disabled={busy || sessionBusy} onClick={() => { setFilters(initialFilters); setQuery({ page: 1, pageSize: query.pageSize }); setReload(value => value + 1) }}>Xóa bộ lọc</Button></div>
          </form>
          <p className="text-video-title text-text-secondary">Thời gian nhập theo múi giờ của trình duyệt. Kết quả chỉ gồm dữ liệu thuộc phạm vi được cấp.</p>
        </Card>
        <section aria-label="Kết quả tra cứu" aria-busy={busy}>
          {error && <Alert severity="error" role="alert" action={<Button onClick={() => setReload(value => value + 1)}>Thử lại</Button>}>{error}</Alert>}
          {busy && <div className="audit-loading" role="status"><CircularProgress size={24} /><span>Đang tải nhật ký…</span></div>}
          {!busy && page && <Card>
            <div className="audit-results-title" role="status">{page.total.toLocaleString("vi-VN")} bản ghi phù hợp</div>
            {!page.items.length ? <p className="audit-empty">Không có nhật ký phù hợp với bộ lọc và phạm vi của bạn.</p> : <TableContainer className="audit-table"><Table size="small" aria-label="Nhật ký hệ thống"><TableHead><TableRow>{["Thời điểm", "Hành động", "Chủ thể", "Đối tượng", "Kết quả", "Chi tiết"].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{page.items.map(entry => <TableRow key={entry.id}>
              <TableCell><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString("vi-VN")}</time></TableCell><TableCell>{entry.action}</TableCell><TableCell>{entry.actorType}<div className="audit-id">{entry.actorUserId || entry.actorStationId || "—"}</div></TableCell><TableCell>{entry.objectType}<div className="audit-id">{entry.objectId}</div></TableCell><TableCell>{outcomeLabels[entry.outcome] || entry.outcome}</TableCell><TableCell><Button size="small" aria-label={`Xem chi tiết ${entry.action}`} onClick={() => setDetail(entry)}>Xem</Button></TableCell>
            </TableRow>)}</TableBody></Table></TableContainer>}
            <nav className="audit-pagination" aria-label="Phân trang nhật ký"><TextField select size="small" label="Số dòng" value={query.pageSize} onChange={e => setQuery({ ...query, page: 1, pageSize: Number(e.target.value) })}>{[10, 25, 50, 100].map(size => <MenuItem key={size} value={size}>{size}</MenuItem>)}</TextField><span>Trang {page.page} / {Math.max(1, Math.ceil(page.total / page.pageSize))}</span><div className="audit-actions"><Button disabled={page.page <= 1} onClick={() => setQuery({ ...query, page: page.page - 1 })}>Trang trước</Button><Button disabled={page.page * page.pageSize >= page.total} onClick={() => setQuery({ ...query, page: page.page + 1 })}>Trang sau</Button></div></nav>
          </Card>}
        </section>
      </>}
    </>}
    <Dialog open={!!detail} onClose={() => setDetail(null)} fullWidth maxWidth="md" aria-labelledby="audit-detail-title"><DialogTitle id="audit-detail-title">Chi tiết nhật ký</DialogTitle><DialogContent>{detail && <><dl className="audit-detail">{[["Mã bản ghi", detail.id], ["Mã liên kết", detail.correlationId], ["Nhà máy", detail.factoryId || "—"], ["Lý do", detail.reason || "—"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h3 className="text-label">Dữ liệu trước</h3><pre className="audit-json">{JSON.stringify(detail.beforeData, null, 2)}</pre><h3 className="text-label">Dữ liệu sau</h3><pre className="audit-json">{JSON.stringify(detail.afterData, null, 2)}</pre></>}<Button onClick={() => setDetail(null)}>Đóng</Button></DialogContent></Dialog>
  </main>
}

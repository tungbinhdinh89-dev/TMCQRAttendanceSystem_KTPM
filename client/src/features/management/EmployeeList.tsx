import { useState } from "react"
import { Link } from "react-router-dom"
import { Button, Chip, IconButton, InputAdornment, LinearProgress, Menu, MenuItem, Skeleton, TextField } from "@mui/material"
import { ArrowRight, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, UserRoundCheck, UserRoundX, Users, X } from "lucide-react"
import { initials } from "../../lib/date"
import { text, type EmployeePage, type Organization, type RecordRow } from "../../data/management"
import "./employee-list.css"

type Query = { q: string; factoryId: string; status: string; page: number }
type Props = {
  employees: EmployeePage; organization: Organization; query: Query; search: string; busy: boolean; hasError: boolean
  onSearch: (value: string) => void; onQuery: (patch: Partial<Query>) => void; onApply: () => void; onReset: () => void
  onCreate: () => void; onRefresh: () => void; onEdit: (employee: RecordRow) => void; onStatus: (employee: RecordRow) => void
}
export default function EmployeeList({ employees, organization, query, search, busy, hasError, onSearch, onQuery, onApply, onReset, onCreate, onRefresh, onEdit, onStatus }: Props) {
  const [menu, setMenu] = useState<{ anchor: HTMLElement; employee: RecordRow } | null>(null)
  const hasFilters = !!(query.q || query.factoryId || query.status)
  const totalPages = Math.max(1, Math.ceil(employees.total / employees.pageSize))
  const start = employees.items.length ? (query.page - 1) * employees.pageSize + 1 : 0
  const end = employees.items.length ? start + employees.items.length - 1 : 0
  const factory = organization.factories.find(row => row.id === query.factoryId)
  function actions(row: RecordRow) {
    return <div className="employee-row-actions"><Button component={Link} to={`/management/employees/${row.id}`} endIcon={<ArrowRight size={15} />} disabled={busy}>Chi tiết</Button><IconButton aria-label={`Thao tác cho ${text(row, "fullName")}`} aria-haspopup="menu" aria-expanded={menu?.employee.id === row.id} aria-controls={menu?.employee.id === row.id ? "employee-row-menu" : undefined} disabled={busy} onClick={event => setMenu({ anchor: event.currentTarget, employee: row })}><MoreHorizontal size={20} /></IconButton></div>
  }
  function person(row: RecordRow) {
    return <div className="employee-person"><span className="employee-list-avatar" aria-hidden="true">{initials(text(row, "fullName"))}</span><div><Link to={`/management/employees/${row.id}`} className="employee-name">{text(row, "fullName")}</Link>{!!row.email && <span className="employee-email">{text(row, "email")}</span>}</div></div>
  }
  const status = (row: RecordRow) => <span className={`employee-status ${row.status === "ACTIVE" ? "is-active" : "is-inactive"}`}><span aria-hidden="true" />{row.status === "ACTIVE" ? "Đang làm việc" : "Ngừng hoạt động"}</span>
  return <section className="employee-list-page" aria-labelledby="employee-list-title">
    <header className="employee-list-heading"><div><p className="employee-list-eyebrow">QUẢN LÝ NHÂN SỰ</p><h1 id="employee-list-title">Nhân viên <span className="employee-total">{employees.total.toLocaleString("vi-VN")}</span></h1><p>Quản lý hồ sơ và thông tin nhân viên trong phạm vi của bạn.</p></div><div className="employee-list-heading-actions"><Button variant="outlined" startIcon={<RefreshCw size={17} />} disabled={busy} onClick={onRefresh}>Tải lại</Button><Button variant="contained" startIcon={<Plus size={18} />} disabled={busy} onClick={onCreate}>Thêm nhân viên</Button></div></header>
    <div className="employee-list-panel">
      <form className="employee-list-filters" aria-label="Bộ lọc nhân viên" onSubmit={event => { event.preventDefault(); onApply() }}>
        <TextField className="employee-search" label="Tìm nhân viên" placeholder="Nhập họ tên hoặc mã nhân viên" value={search} onChange={event => onSearch(event.target.value)} size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>, endAdornment: search ? <InputAdornment position="end"><IconButton size="small" aria-label="Xóa nội dung tìm kiếm" onClick={() => { onSearch(""); onQuery({ q: "", page: 1 }) }}><X size={16} /></IconButton></InputAdornment> : undefined } }} />
        <TextField select label="Nhà máy" value={query.factoryId} size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} onChange={event => onQuery({ factoryId: event.target.value, page: 1 })}><MenuItem value="">Tất cả trong phạm vi</MenuItem>{organization.factories.map(row => <MenuItem key={row.id} value={row.id}>{text(row, "name") || text(row, "code")}</MenuItem>)}</TextField>
        <TextField select label="Trạng thái" value={query.status} size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} onChange={event => onQuery({ status: event.target.value, page: 1 })}><MenuItem value="">Tất cả trạng thái</MenuItem><MenuItem value="ACTIVE">Đang làm việc</MenuItem><MenuItem value="INACTIVE">Ngừng hoạt động</MenuItem></TextField>
        <Button type="submit" variant="outlined" startIcon={<SlidersHorizontal size={17} />} disabled={busy}>Áp dụng</Button>
      </form>
      {hasFilters && <div className="employee-filter-tags" aria-label="Bộ lọc đang áp dụng"><span>Đang lọc:</span>{query.q && <Chip size="small" label={`Tìm: ${query.q}`} onDelete={() => { onSearch(""); onQuery({ q: "", page: 1 }) }} />}{query.factoryId && <Chip size="small" label={factory ? text(factory, "name") : "Nhà máy đã chọn"} onDelete={() => onQuery({ factoryId: "", page: 1 })} />}{query.status && <Chip size="small" label={query.status === "ACTIVE" ? "Đang làm việc" : "Ngừng hoạt động"} onDelete={() => onQuery({ status: "", page: 1 })} />}<Button size="small" onClick={onReset} disabled={busy}>Xóa bộ lọc</Button></div>}
      <div className="employee-results-heading"><span>{hasFilters ? "Kết quả tìm kiếm" : "Danh sách nhân viên"}</span><small role="status" aria-live="polite">{busy ? "Đang xử lý…" : `${employees.total.toLocaleString("vi-VN")} hồ sơ${hasFilters ? " phù hợp" : ""}`}</small></div>
      <div className="employee-list-results" aria-busy={busy}>{busy && <LinearProgress aria-label="Đang xử lý danh sách" />}
        {busy && !employees.items.length ? <div className="employee-list-skeleton" aria-label="Đang tải nhân viên">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={54} />)}</div> : hasError && !employees.items.length ? <div className="employee-list-empty"><Users size={32} /><h2>Chưa tải được danh sách</h2><p>Kiểm tra thông báo lỗi và thử tải lại.</p><Button onClick={onRefresh}>Tải lại danh sách</Button></div> : !employees.items.length ? <div className="employee-list-empty"><span className="employee-empty-icon"><Users size={28} /></span><h2>{hasFilters ? "Không tìm thấy nhân viên phù hợp" : "Chưa có hồ sơ nhân viên"}</h2><p>{hasFilters ? "Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm hồ sơ." : "Thêm hồ sơ đầu tiên để bắt đầu cấp tài khoản và quản lý chấm công."}</p><Button variant="outlined" onClick={hasFilters ? onReset : onCreate}>{hasFilters ? "Xóa bộ lọc" : "Thêm nhân viên"}</Button></div> : <>
          <div className="employee-list-table"><table aria-label="Danh sách nhân viên"><thead><tr><th>Nhân viên</th><th>Mã nhân viên</th><th>Mã HRS</th><th>Trạng thái</th><th><span className="employee-action-label">Thao tác</span></th></tr></thead><tbody>{employees.items.map(row => <tr key={row.id}><td>{person(row)}</td><td><span className="employee-code">{text(row, "employeeCode")}</span></td><td className="employee-hrs">{text(row, "externalHrId") || "—"}</td><td>{status(row)}</td><td>{actions(row)}</td></tr>)}</tbody></table></div>
          <div className="employee-list-mobile">{employees.items.map(row => <article key={row.id} className="employee-mobile-row"><div className="employee-mobile-person">{person(row)}{status(row)}</div><dl><div><dt>Mã nhân viên</dt><dd>{text(row, "employeeCode")}</dd></div><div><dt>Mã HRS</dt><dd>{text(row, "externalHrId") || "—"}</dd></div></dl>{actions(row)}</article>)}</div>
        </>}
      </div>
      <footer className="employee-list-pagination"><span>Hiển thị <strong>{start}–{end}</strong> / {employees.total.toLocaleString("vi-VN")} hồ sơ</span><div><span>Trang {query.page} / {totalPages}</span><IconButton aria-label="Trang nhân viên trước" disabled={busy || query.page <= 1} onClick={() => onQuery({ page: query.page - 1 })}><ChevronLeft size={19} /></IconButton><IconButton aria-label="Trang nhân viên tiếp theo" disabled={busy || query.page * employees.pageSize >= employees.total} onClick={() => onQuery({ page: query.page + 1 })}><ChevronRight size={19} /></IconButton></div></footer>
    </div>
    <Menu id="employee-row-menu" anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}><MenuItem onClick={() => { if (menu) onEdit(menu.employee); setMenu(null) }}><Pencil size={17} /><span>Sửa hồ sơ</span></MenuItem><MenuItem onClick={() => { if (menu) onStatus(menu.employee); setMenu(null) }} sx={{ gap: 1.5, color: menu?.employee.status === "ACTIVE" ? "error.main" : "inherit" }}>{menu?.employee.status === "ACTIVE" ? <UserRoundX size={17} /> : <UserRoundCheck size={17} />}<span>{menu?.employee.status === "ACTIVE" ? "Ngừng hoạt động" : "Kích hoạt lại"}</span></MenuItem></Menu>
  </section>
}

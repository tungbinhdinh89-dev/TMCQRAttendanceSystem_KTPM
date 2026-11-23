import { useEffect, useRef, useState, type FormEvent } from "react"
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material"
import { managementRequest as request, text, type Organization } from "../../data/management"

export default function EmployeeCreateDialog({ org, onClose, onSaved }: { org: Organization; onClose: () => void; onSaved: (code: string) => void }) {
  const factories = org.factories.filter(f => f.status === "ACTIVE")
  const [form, setForm] = useState({ factoryId: factories.length === 1 ? factories[0].id : "", departmentId: "", teamId: "", employeeCode: "", externalHrId: "", fullName: "", email: "" })
  const [automatic, setAutomatic] = useState(true)
  const [loadingCode, setLoadingCode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [previewRevision, setPreviewRevision] = useState(0)
  const revision = useRef(0)
  const departments = org.departments.filter(d => d.factoryId === form.factoryId && d.isActive === true)
  const teams = org.teams.filter(t => t.departmentId === form.departmentId && t.isActive === true)
  useEffect(() => {
    if (!form.factoryId || !automatic) { setLoadingCode(false); return }
    const controller = new AbortController()
    setLoadingCode(true); setCodeError("")
    request<{ employeeCode: string }>(`/employees/next-code?factoryId=${encodeURIComponent(form.factoryId)}`, "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setForm(f => ({ ...f, employeeCode: result.employeeCode })) })
      .catch(e => { if (!controller.signal.aborted) { setCodeError(e instanceof Error ? e.message : "Không thể gợi ý mã."); setForm(f => ({ ...f, employeeCode: "" })) } })
      .finally(() => { if (!controller.signal.aborted) setLoadingCode(false) })
    return () => controller.abort()
  }, [form.factoryId, automatic, previewRevision])
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("")
    const current = ++revision.current
    try {
      const result = await request<{ employeeCode: string }>("/employees", "POST", { ...form, generateEmployeeCode: automatic, departmentId: form.departmentId || null, teamId: form.teamId || null, email: form.email.trim() || null })
      if (current === revision.current) onSaved(result.employeeCode)
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu hồ sơ. Dữ liệu nhập vẫn được giữ lại.") }
    finally { setSaving(false) }
  }
  const options = (rows: Organization["factories"]) => rows.map(row => <MenuItem key={row.id} value={row.id}>{text(row, "name")} ({text(row, "code")})</MenuItem>)
  return <Dialog open onClose={() => { if (!saving) onClose() }} fullWidth maxWidth="sm"><form onSubmit={save}>
    <DialogTitle>Thêm hồ sơ nhân viên</DialogTitle><DialogContent><div className="management-form">
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      {!factories.length && <Alert severity="warning">Không có nhà máy hoạt động trong phạm vi tài khoản. Nhờ ADM kiểm tra dữ liệu tổ chức và phạm vi HR; hệ thống không tự tạo dữ liệu mẫu.</Alert>}
      <TextField select label="Nhà máy" required value={form.factoryId} disabled={saving || !factories.length} onChange={e => { setForm(f => ({ ...f, factoryId: e.target.value, departmentId: "", teamId: "", employeeCode: "" })); setAutomatic(true) }} helperText="Chọn nhà máy trước để lấy mã và phòng ban."><MenuItem value="">Chọn nhà máy…</MenuItem>{options(factories)}</TextField>
      <TextField select label="Phòng ban" value={form.departmentId} disabled={saving || !form.factoryId || !departments.length} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, teamId: "" }))} helperText={form.factoryId && !departments.length ? "Nhà máy chưa có phòng ban hoạt động; có thể để trống." : "Chỉ hiển thị phòng ban thuộc nhà máy đã chọn."}><MenuItem value="">Chưa phân phòng ban</MenuItem>{options(departments)}</TextField>
      <TextField select label="Tổ" value={form.teamId} disabled={saving || !form.departmentId || !teams.length} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))} helperText={form.departmentId && !teams.length ? "Phòng ban chưa có tổ hoạt động; có thể để trống." : "Chỉ hiển thị tổ thuộc phòng ban đã chọn."}><MenuItem value="">Chưa phân tổ</MenuItem>{options(teams)}</TextField>
      <TextField label="Mã nhân viên" required value={form.employeeCode} disabled={saving || loadingCode || !form.factoryId} onChange={e => { setAutomatic(false); setForm(f => ({ ...f, employeeCode: e.target.value })) }} helperText={loadingCode ? "Đang lấy mã tiếp theo…" : automatic ? "Mã gợi ý. Máy chủ cấp mã cuối khi lưu; bạn có thể sửa để dùng mã đặc biệt." : "Đang dùng mã nhập tay. Mã đã tồn tại, kể cả nhân viên nghỉ việc, không được tái sử dụng."} />
      {codeError && <Alert severity="error">{codeError}</Alert>}
      <Button type="button" disabled={saving || !form.factoryId || loadingCode} onClick={() => { setAutomatic(true); setPreviewRevision(v => v + 1) }}>Dùng lại mã tự động</Button>
      <TextField label="Mã HRS" required value={form.externalHrId} disabled={saving} onChange={e => setForm(f => ({ ...f, externalHrId: e.target.value }))} helperText="Nhập đúng mã từ hệ thống nhân sự/tiền lương. Bắt buộc và không được trùng; không tự sinh." />
      <TextField label="Họ tên" required value={form.fullName} disabled={saving} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
      <TextField label="Email" type="email" value={form.email} disabled={saving} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
    </div></DialogContent><DialogActions><Button disabled={saving} onClick={onClose}>Hủy</Button><Button type="submit" variant="contained" disabled={saving || loadingCode || !form.factoryId || (automatic && !!codeError)}>{saving ? "Đang lưu…" : "Lưu hồ sơ"}</Button></DialogActions>
  </form></Dialog>
}

import { useEffect, useState, type ReactNode } from "react"
import { Alert, Button, Chip, CircularProgress } from "@mui/material"
import { Building2, KeyRound, Mail, Pencil, QrCode, ShieldCheck, Users } from "lucide-react"
import { Card } from "../../components/ui"
import { managementRequest, text, type Organization, type RecordRow } from "../../data/management"
import { initials } from "../../lib/date"

type Account = { userId: string; username: string; status: string; mustChangePassword: boolean }
type Props = {
  employee: RecordRow; organization: Organization; busy: boolean; accountRevision: number
  onAccount: () => void; onEdit: () => void; onIssueQr: (regenerate: boolean) => void; onRevokeQr: () => void
  onAssign: () => void; onGrant: () => void; assignmentHistory: ReactNode; grantHistory: ReactNode
}

export default function EmployeeDetailOverview({ employee, organization, busy, accountRevision, onAccount, onEdit, onIssueQr, onRevokeQr, onAssign, onGrant, assignmentHistory, grantHistory }: Props) {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setAccount(null); setError("")
    managementRequest<Account | null>(`/employees/${employee.id}/account`, "GET", undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setAccount(value) })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không thể kiểm tra tài khoản.") })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [employee.id, accountRevision, retry])
  const active = employee.status === "ACTIVE"
  const assignments = (Array.isArray(employee.assignments) ? employee.assignments as RecordRow[] : []).filter(row => Date.parse(text(row, "validFrom")) <= Date.now() && (!row.validTo || Date.parse(text(row, "validTo")) > Date.now()))
  function organizationName(key: string, records: RecordRow[]) {
    const names = [...new Set(assignments.map(row => records.find(record => record.id === row[key])).filter((row): row is RecordRow => !!row).map(row => text(row, "name") || text(row, "code")).filter(Boolean))]
    return names.join(", ") || "Chưa có thông tin phân công"
  }
  return <div className="employee-detail">
    <section className="employee-hero" aria-labelledby="employee-detail-title">
      <div className="employee-hero-identity"><span className="employee-avatar" aria-hidden="true">{initials(text(employee, "fullName"))}</span><div><p className="employee-eyebrow">HỒ SƠ NHÂN VIÊN · {text(employee, "employeeCode")}</p><h1 id="employee-detail-title">{text(employee, "fullName")}</h1><Chip size="small" color={active ? "success" : "default"} label={active ? "Đang làm việc" : "Ngừng hoạt động"} /></div></div>
      <Button startIcon={<Pencil size={16} />} variant="outlined" disabled={busy} onClick={onEdit}>Sửa hồ sơ</Button>
    </section>
    <div className="employee-detail-grid">
      <Card className="employee-info-card"><div className="employee-section-heading"><div><h2>Thông tin nhân viên</h2><p>Thông tin hồ sơ và đơn vị đang được phân công.</p></div></div>
        <dl className="employee-detail-profile">
          <div><dt>Mã nhân viên</dt><dd>{text(employee, "employeeCode") || "—"}</dd></div><div><dt>Mã HRS</dt><dd>{text(employee, "externalHrId") || "Chưa cập nhật"}</dd></div>
          <div className="employee-info-full"><dt><Mail size={15} aria-hidden="true" />Email</dt><dd>{text(employee, "email") || "Chưa cập nhật"}</dd></div>
          <div className="employee-info-full"><dt><Building2 size={15} aria-hidden="true" />Nhà máy</dt><dd>{organizationName("factoryId", organization.factories)}</dd></div>
          <div><dt>Phòng ban</dt><dd>{organizationName("departmentId", organization.departments)}</dd></div><div><dt><Users size={15} aria-hidden="true" />Tổ</dt><dd>{organizationName("teamId", organization.teams)}</dd></div>
        </dl>
      </Card>
      <div className="employee-access-stack">
        <Card><div className="employee-card-title"><span className="employee-card-icon"><KeyRound size={20} /></span><h2>Tài khoản đăng nhập</h2></div>
          {loading ? <div className="employee-account-loading" role="status"><CircularProgress size={18} />Đang kiểm tra tài khoản…</div> : error ? <Alert severity="error" action={<Button onClick={() => setRetry(value => value + 1)}>Thử lại</Button>}>{error}</Alert> : account ? <><Chip size="small" color={account.status === "ACTIVE" ? "success" : "default"} label={account.status === "ACTIVE" ? "Đã cấp tài khoản" : "Tài khoản đã bị khóa"} /><p>Tên đăng nhập: <strong>{account.username}</strong></p><p className="employee-card-description">{account.mustChangePassword ? "Nhân viên cần đổi mật khẩu tạm khi đăng nhập lần đầu." : "Nhân viên đã đặt mật khẩu riêng."}</p><Button variant="outlined" disabled={busy} onClick={onAccount}>Xem tài khoản</Button></> : <><Chip size="small" variant="outlined" label="Chưa cấp tài khoản" /><p className="employee-card-description">Cấp tài khoản EMP và mật khẩu tạm để nhân viên đăng nhập. Nhân viên sẽ đổi mật khẩu lần đầu.</p><Button variant="contained" disabled={busy || !active} onClick={onAccount}>Cấp tài khoản</Button></>}
          {!active && <p className="employee-card-description">Nhân viên ngừng hoạt động không thể được cấp tài khoản mới.</p>}
        </Card>
        <Card><div className="employee-card-title"><span className="employee-card-icon"><QrCode size={20} /></span><h2>QR chấm công</h2></div><p className="employee-card-description">Nhân viên xem QR tại trang cá nhân. Thu hồi hoặc cấp lại sẽ vô hiệu mã cũ.</p>
          <div className="employee-qr-actions"><Button variant="outlined" disabled={busy || !active} onClick={() => onIssueQr(false)}>Cấp QR</Button><Button variant="outlined" color="error" disabled={busy} onClick={onRevokeQr}>Thu hồi QR</Button><Button disabled={busy || !active} onClick={() => onIssueQr(true)}>Cấp lại QR</Button></div>
        </Card>
      </div>
    </div>
    <Card><div className="employee-section-heading"><div><h2>Phân công tổ chức</h2><p>Lịch sử làm việc tại nhà máy, phòng ban và tổ.</p></div><Button disabled={busy} onClick={onAssign} variant="outlined">Thêm phân công</Button></div>{assignmentHistory}</Card>
    <Card><div className="employee-section-heading"><div><h2><ShieldCheck size={20} aria-hidden="true" />Quyền ra/vào nhà máy</h2><p>Quản lý thời hạn và thu hồi quyền truy cập nhà máy.</p></div><Button disabled={busy || !active} onClick={onGrant} variant="outlined">Cấp quyền ra/vào</Button></div>{grantHistory}</Card>
  </div>
}

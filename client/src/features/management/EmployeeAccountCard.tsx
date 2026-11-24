import { useEffect, useState, type FormEvent } from "react"
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { Card } from "../../components/ui"
import { managementRequest as request } from "../../data/management"

type Account = { userId: string; username: string; status: string; mustChangePassword: boolean }
type IssuedAccount = { userId: string; username: string; temporaryPassword: string }
export default function EmployeeAccountCard({ employeeId, employeeCode, active, onProvisioned }: { employeeId: string; employeeCode: string; active: boolean; onProvisioned?: () => void }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [username, setUsername] = useState(employeeCode)
  const [issued, setIssued] = useState<IssuedAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setAccount(null); setError("")
    request<Account | null>(`/employees/${employeeId}/account`, "GET", undefined, controller.signal).then(value => { if (!controller.signal.aborted) setAccount(value) }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không thể kiểm tra tài khoản.") }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [employeeId, reload])
  useEffect(() => { setIssued(null) }, [active])
  async function provision(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("")
    try {
      const result = await request<IssuedAccount>(`/employees/${employeeId}/account`, "POST", { username: username.trim() })
      if (!result || typeof result.userId !== "string" || !result.userId || typeof result.username !== "string" || !result.username || typeof result.temporaryPassword !== "string" || !result.temporaryPassword) {
        throw new Error("Chưa nhận đủ thông tin cấp tài khoản. Kiểm tra lại trạng thái tài khoản trước khi gửi lại; hệ thống chưa xác nhận bàn giao mật khẩu tạm.")
      }
      setIssued(result); setAccount({ userId: result.userId, username: result.username, status: "ACTIVE", mustChangePassword: true })
      onProvisioned?.()
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể cấp tài khoản. Kiểm tra trạng thái trước khi thử lại.") }
    finally { setBusy(false) }
  }
  return <Card>
    <h2>Tài khoản đăng nhập nhân viên</h2>
    <p>Tài khoản chỉ có quyền nhân viên, xem QR cá nhân. Nhân viên phải đổi mật khẩu tạm trong lần đăng nhập đầu tiên.</p>
    {loading ? <CircularProgress size={24} aria-label="Kiểm tra tài khoản nhân viên" /> : error ? <Alert severity="error" action={<Button disabled={busy} onClick={() => setReload(v => v + 1)}>Kiểm tra lại</Button>}>{error}</Alert> : account ? <><p>Tên đăng nhập: <strong>{account.username}</strong></p><p>{account.status === "ACTIVE" ? "Tài khoản đang hoạt động" : "Tài khoản đã bị khóa"} · {account.mustChangePassword ? "Chờ đổi mật khẩu lần đầu" : "Đã đặt mật khẩu riêng"}</p></> : <form className="management-form" onSubmit={provision}>
      <TextField label="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} helperText="Tên duy nhất trong hệ thống; không sử dụng mã HRS làm mật khẩu." autoComplete="off" required disabled={busy || !active} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <Button type="submit" variant="contained" disabled={busy || !active}>{busy ? "Đang cấp…" : "Cấp tài khoản & mật khẩu tạm"}</Button>
    </form>}
    {!active && <Alert severity="warning">Nhân viên đã ngừng hoạt động. Không thể cấp tài khoản hoặc sử dụng QR.</Alert>}
    <Dialog open={!!issued} onClose={() => setIssued(null)} fullWidth maxWidth="sm" aria-labelledby="account-issued-title">
      <DialogTitle id="account-issued-title">Thông tin đăng nhập chỉ hiển thị một lần</DialogTitle>
      <DialogContent><Alert severity="warning">Giao trực tiếp cho đúng nhân viên. Đóng cửa sổ sẽ xóa mật khẩu khỏi giao diện; hệ thống không cho xem lại mật khẩu.</Alert><p>Tên đăng nhập: <strong>{issued?.username}</strong></p><TextField label="Mật khẩu tạm" value={issued?.temporaryPassword || ""} fullWidth margin="normal" slotProps={{ input: { readOnly: true } }} /><p>Nhân viên mở <strong>/qr</strong>, đăng nhập và đổi mật khẩu trước khi xem mã QR do HR cấp.</p></DialogContent>
      <DialogActions><Button onClick={() => setIssued(null)}>Đã bàn giao — đóng</Button></DialogActions>
    </Dialog>
  </Card>
}

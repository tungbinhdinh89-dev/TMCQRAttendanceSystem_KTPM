import { useState, type FormEvent } from "react"
import { Alert, Button, TextField } from "@mui/material"
import { Card } from "../../components/ui"
import { managementSession, ManagementError } from "../../data/management"

export default function MandatoryPasswordChange({ onChanged, onLogout }: { onChanged: () => void; onLogout: () => Promise<void> }) {
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function logout() {
    setBusy(true); setError("")
    try { await onLogout() }
    catch { setError("Chưa đăng xuất được. Kiểm tra kết nối rồi thử lại.") }
    finally { setBusy(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("")
    if (password.length < 12 || password.length > 128) { setError("Mật khẩu mới phải có từ 12 đến 128 ký tự."); return }
    if (password !== confirmation) { setError("Hai lần nhập mật khẩu mới chưa khớp."); return }
    if (password === current) { setError("Mật khẩu mới phải khác mật khẩu tạm."); return }
    setBusy(true)
    try { await managementSession.changePassword(current, password); setCurrent(""); setPassword(""); setConfirmation(""); onChanged() }
    catch (e) { setError(e instanceof ManagementError && e.status === 401 ? "Mật khẩu hiện tại chưa đúng hoặc phiên đã hết hạn. Kiểm tra lại hoặc đăng xuất để đăng nhập lại." : e instanceof Error ? e.message : "Không thể đổi mật khẩu. Vui lòng thử lại.") }
    finally { setBusy(false) }
  }
  return <Card className="management-login">
    <h2>Đổi mật khẩu lần đầu</h2>
    <p>Đặt mật khẩu riêng trước khi sử dụng tài khoản. Sau khi lưu thành công, bạn cần đăng nhập lại bằng mật khẩu mới.</p>
    <form onSubmit={submit} style={{ display: "grid", gap: 20, marginTop: 24 }}>
      {error && <Alert severity="error" role="alert">{error}</Alert>}
      <TextField label="Mật khẩu tạm / hiện tại" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required disabled={busy} />
      <TextField label="Mật khẩu mới" type="password" autoComplete="new-password" helperText="Từ 12 đến 128 ký tự, khác mật khẩu tạm." value={password} onChange={e => setPassword(e.target.value)} slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} required disabled={busy} />
      <TextField label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required disabled={busy} />
      <Button type="submit" variant="contained" disabled={busy}>{busy ? "Đang lưu…" : "Lưu mật khẩu mới"}</Button>
      <Button type="button" onClick={() => void logout()} disabled={busy}>Đăng xuất</Button>
    </form>
  </Card>
}

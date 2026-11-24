import HistoryLinks from "../attendance-history/HistoryLinks"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import { Alert, Button, CircularProgress, TextField } from "@mui/material"
import QRCode from "react-qr-code"
import { Brand, Card, PageHeader } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { managementSession, ManagementError, type ManagementIdentity } from "../../data/management"
import { qrApi, QrError } from "../../data/qr"
import MandatoryPasswordChange from "../auth/MandatoryPasswordChange"
import { AccessMessage } from "../auth/ServerAccess"
import "./qr.css"

type DisplayQr = Awaited<ReturnType<typeof qrApi.code>>
export default function Qr() {
  const [identity, setIdentity] = useState<ManagementIdentity | null>(null)
  const [qr, setQr] = useState<DisplayQr | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const generation = useRef(0)
  const pending = useRef(false)
  const displayedUser = useRef<string | null>(null)
  const employee = identity?.roles.some(r => r.code === "EMP") ?? false
  const check = useCallback(async () => {
    if (pending.current) return
    pending.current = true
    const epoch = generation.current
    try {
      const user = await managementSession.me()
      if (epoch !== generation.current) return
      if (displayedUser.current !== user.userId) setQr(null)
      displayedUser.current = user.userId
      setIdentity(user)
      if (user.mustChangePassword || !user.roles.some(r => r.code === "EMP")) { setQr(null); return }
      const status = await qrApi.status()
      if (epoch !== generation.current) return
      if (status.credential?.status !== "ACTIVE") { setQr(null); setError(""); return }
      const code = await qrApi.code()
      const after = await managementSession.me()
      if (epoch !== generation.current) return
      if (after.userId !== user.userId || after.mustChangePassword) { setQr(null); setIdentity(after); return }
      setQr(code); setError("")
    } catch (e) {
      if (epoch !== generation.current) return
      setQr(null)
      if ((e instanceof QrError || e instanceof ManagementError) && e.status === 401) { setIdentity(null); setError("") }
      else setError(e instanceof Error ? e.message : "Không thể kiểm tra mã QR. Vui lòng thử lại.")
    } finally { pending.current = false; if (epoch === generation.current) setChecking(false) }
  }, [])
  useEffect(() => {
    void check()
    const timer = window.setInterval(() => { if (!document.hidden) void check() }, 5000)
    const visibility = () => { setQr(null); generation.current++; if (!document.hidden) void check() }
    const offline = () => { generation.current++; setQr(null); setError("Mất kết nối. Kết nối lại để kiểm tra mã QR với máy chủ.") }
    const focus = () => { setQr(null); generation.current++; void check() }
    document.addEventListener("visibilitychange", visibility); window.addEventListener("offline", offline); window.addEventListener("focus", focus)
    return () => { generation.current++; clearInterval(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("offline", offline); window.removeEventListener("focus", focus) }
  }, [check])
  async function login(event: FormEvent) {
    event.preventDefault(); generation.current++; setQr(null); setBusy(true); setError(""); setNotice("")
    try { setIdentity(await managementSession.login(username.trim(), password)); await check() }
    catch (e) { setError(e instanceof Error ? e.message : "Không thể đăng nhập.") }
    finally { setPassword(""); setBusy(false) }
  }
  async function logout() {
    generation.current++; setQr(null); setBusy(true); setError("")
    try { await managementSession.logout(); setIdentity(null) }
    catch (e) { setError(e instanceof Error ? e.message : "Chưa đăng xuất được. Vui lòng thử lại.") }
    finally { setBusy(false) }
  }
  if (!checking && !identity) return <Navigate to="/dang-nhap" replace />
  if (identity && !identity.mustChangePassword && !employee) return <AccessMessage identity={identity} />
  return <main className="self-qr-page">
    <header><Brand /><div><Link to="/">Trang chủ</Link>{identity && <HistoryLinks identity={identity} />}<ThemeToggle /></div></header>
    <PageHeader title="Mã QR của tôi" description="Đăng nhập bằng tài khoản HR cấp để xem mã QR cá nhân." />
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    {notice && <Alert severity="success" role="status">{notice}</Alert>}
    {checking ? <CircularProgress aria-label="Kiểm tra phiên đăng nhập" /> : !identity ? <Card><h2>Đăng nhập nhân viên</h2><form onSubmit={login} className="self-qr-form"><TextField label="Tên đăng nhập" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required disabled={busy} /><TextField label="Mật khẩu" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /><Button type="submit" variant="contained" disabled={busy}>Đăng nhập</Button></form></Card> : identity.mustChangePassword ? <MandatoryPasswordChange onChanged={() => { generation.current++; setQr(null); setIdentity(null); setNotice("Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.") }} onLogout={logout} /> : <>
      <div className="self-qr-session"><span>Đã đăng nhập: <strong>{identity.username}</strong></span><Button disabled={busy} onClick={logout}>Đăng xuất / đổi tài khoản</Button></div>
      {!employee ? <Alert severity="warning">Chỉ tài khoản có quyền nhân viên được xem QR cá nhân.</Alert> : <Card className="self-qr-card">
        {qr ? <><div className="self-qr-code"><QRCode value={qr.token} size={360} bgColor="#ffffff" fgColor="#000000" title="Mã QR cá nhân do HR cấp" /></div><p role="status">QR đang hoạt động</p><p>Cấp ngày {new Date(qr.issuedAt).toLocaleString("vi-VN")}</p></> : <div className="self-qr-placeholder"><p>Chưa có QR hợp lệ để hiển thị.</p><p>Liên hệ nhân sự để được cấp QR hoặc kiểm tra trạng thái thu hồi.</p></div>}
        <Button onClick={() => { setQr(null); setError(""); void check() }} disabled={busy}>Kiểm tra trạng thái QR</Button>
        <p className="self-qr-help">Đây là mã cố định do HR cấp, dùng lại cho đến khi bị thu hồi hoặc cấp lại. Đăng nhập lại không tạo mã mới. Không chia sẻ mã cho người khác. Cổng phải xác minh trạng thái trực tuyến mỗi lần quét.</p>
      </Card>}
    </>}
  </main>
}

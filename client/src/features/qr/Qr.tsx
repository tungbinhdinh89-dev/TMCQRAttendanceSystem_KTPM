import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Alert, Button, CircularProgress, TextField } from "@mui/material"
import QRCode from "react-qr-code"
import { Brand, Card, PageHeader } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { managementSession, ManagementError, type ManagementIdentity } from "../../data/management"
import { qrApi, QrError, type SelfQrStatus } from "../../data/qr"
import "./qr.css"

type DisplayQr = { token: string; deadline: number; totalSeconds: number }
export default function Qr() {
  const [identity, setIdentity] = useState<ManagementIdentity | null>(null)
  const [status, setStatus] = useState<SelfQrStatus | null>(null)
  const [qr, setQr] = useState<DisplayQr | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remaining, setRemaining] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const refreshAt = useRef(0)
  const generation = useRef(0)
  const currentUser = useRef<string | null>(null)
  const currentCredential = useRef<string | null>(null)
  const pending = useRef(false)
  const employee = identity?.roles.some(r => r.code === "EMP") ?? false
  const clearQr = useCallback(() => { setQr(null); setRemaining(0) }, [])
  const failure = useCallback((e: unknown) => {
    clearQr(); setStatus(null)
    setError(e instanceof Error ? e.message : "Không thể kết nối máy chủ.")
    if ((e instanceof QrError || e instanceof ManagementError) && e.status === 401) { currentUser.current = null; setIdentity(null) }
  }, [clearQr])
  const check = useCallback(async () => {
    const epoch = generation.current
    try {
      const user = await managementSession.me()
      if (epoch !== generation.current) return
      if (currentUser.current !== user.userId) { clearQr(); currentCredential.current = null }
      currentUser.current = user.userId; setIdentity(user)
      if (!user.roles.some(r => r.code === "EMP")) { clearQr(); setStatus(null); return }
      const result = await qrApi.status()
      if (epoch !== generation.current) return
      if (currentCredential.current !== result.credential?.id || result.credential?.status !== "ACTIVE" || !result.signingAvailable) clearQr()
      currentCredential.current = result.credential?.id ?? null; setStatus(result)
    } catch (e) { if (epoch === generation.current) failure(e) }
    finally { if (epoch === generation.current) setChecking(false) }
  }, [clearQr, failure])
  useEffect(() => {
    void check()
    const timer = window.setInterval(() => { if (!document.hidden && !pending.current) void check() }, 5000)
    const visibility = () => { clearQr(); generation.current++; if (!document.hidden) void check() }
    const offline = () => { generation.current++; clearQr(); setStatus(null); setError("Mất kết nối. Mã đã được ẩn; kết nối lại để cấp mã mới.") }
    const focus = () => { clearQr(); generation.current++; void check() }
    document.addEventListener("visibilitychange", visibility); window.addEventListener("offline", offline); window.addEventListener("focus", focus)
    return () => { generation.current++; clearInterval(timer); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("offline", offline); window.removeEventListener("focus", focus) }
  }, [check, clearQr])
  useEffect(() => {
    const tick = () => {
      const left = qr ? Math.max(0, Math.ceil((qr.deadline - performance.now()) / 1000)) : 0
      setRemaining(left); setCooldown(Math.max(0, Math.ceil((refreshAt.current - performance.now()) / 1000)))
      if (qr && !left) clearQr()
    }
    tick(); const timer = window.setInterval(tick, 250); return () => clearInterval(timer)
  }, [qr, clearQr])
  async function login(event: FormEvent) {
    event.preventDefault(); generation.current++; clearQr(); setStatus(null); setBusy(true); setError("")
    try { const user = await managementSession.login(username.trim(), password); currentUser.current = user.userId; setIdentity(user); await check() }
    catch (e) { failure(e) } finally { setPassword(""); setBusy(false) }
  }
  async function logout() {
    generation.current++; clearQr(); currentCredential.current = null; setStatus(null); setBusy(true); setError("")
    try { await managementSession.logout(); currentUser.current = null; setIdentity(null) }
    catch (e) { failure(e) } finally { setBusy(false) }
  }
  async function issue() {
    if (pending.current || cooldown) return
    pending.current = true; setBusy(true); clearQr(); setError("")
    const epoch = ++generation.current
    // Count network transit against the server TTL instead of extending it on receipt.
    const started = performance.now()
    refreshAt.current = started + 5000
    try {
      const before = await managementSession.me()
      if (epoch !== generation.current || before.userId !== currentUser.current || !before.roles.some(r => r.code === "EMP")) { await check(); return }
      const token = await qrApi.issue()
      const after = await managementSession.me()
      if (epoch !== generation.current || after.userId !== before.userId) { clearQr(); await check(); return }
      const seconds = (Date.parse(token.expiresAt) - Date.parse(token.serverTime)) / 1000
      refreshAt.current = started + Math.max(5, token.refreshAfterSeconds) * 1000
      if (seconds <= 0 || started + seconds * 1000 <= performance.now()) throw new Error("Mã đã hết hạn khi nhận. Hãy cấp mã mới.")
      setQr({ token: token.token, deadline: started + seconds * 1000, totalSeconds: seconds })
    } catch (e) { if (epoch === generation.current) failure(e) }
    finally { pending.current = false; setBusy(false) }
  }
  return <main className="self-qr-page">
    <header><Brand /><div><Link to="/">Trang chủ</Link><ThemeToggle /></div></header>
    <PageHeader title="Mã QR của tôi" description="Mã bảo mật do máy chủ cấp, chỉ dành cho tài khoản đang đăng nhập." />
    {error && <Alert severity="error" role="alert">{error}</Alert>}
    {checking ? <CircularProgress aria-label="Kiểm tra phiên đăng nhập" /> : !identity ? <Card><h2>Đăng nhập nhân viên</h2><form onSubmit={login} className="self-qr-form"><TextField label="Tên đăng nhập" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required /><TextField label="Mật khẩu" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /><Button type="submit" variant="contained" disabled={busy}>Đăng nhập</Button></form></Card> : <>
      <div className="self-qr-session"><span>Đã đăng nhập: <strong>{identity.username}</strong></span><Button disabled={busy} onClick={logout}>Đăng xuất / đổi tài khoản</Button></div>
      {!employee ? <Alert severity="warning">Chỉ tài khoản nhân viên được cấp QR cá nhân. Bạn không thể chọn nhân viên khác để cấp mã.</Alert> : <Card className="self-qr-card">
        {qr && remaining > 0 ? <><div className="self-qr-code"><QRCode value={qr.token} size={236} bgColor="#ffffff" fgColor="#10283f" title="Mã QR cá nhân có thời hạn" /></div><p role="status">Còn hiệu lực trong <strong>{remaining} giây</strong></p><progress max={qr.totalSeconds} value={remaining} aria-label="Thời gian hiệu lực còn lại" /></> : <div className="self-qr-placeholder"><p>Chưa có mã đang hiển thị.</p><p>{!status?.credential || status.credential.status !== "ACTIVE" ? "Liên hệ nhân sự để được cấp hoặc kích hoạt lại credential." : !status.signingAvailable ? "Máy chủ chưa sẵn sàng ký QR." : "Chọn cấp mã mới khi chuẩn bị quét tại cổng."}</p></div>}
        <Button variant="contained" onClick={issue} disabled={busy || !!cooldown || status?.credential?.status !== "ACTIVE" || !status?.signingAvailable}>{busy ? "Đang xử lý…" : cooldown ? `Đợi ${cooldown} giây` : "Cấp mã QR mới"}</Button>
        <Button onClick={() => { clearQr(); generation.current++; setError(""); void check() }} disabled={busy}>Kiểm tra trạng thái</Button>
        <p className="self-qr-help">Không chia sẻ hoặc chụp lại mã. Mã hết hạn, mất mạng hay đổi tài khoản sẽ được ẩn. Thu hồi được kiểm tra lại với máy chủ định kỳ; cổng luôn phải xác minh trực tuyến.</p>
      </Card>}
    </>}
  </main>
}

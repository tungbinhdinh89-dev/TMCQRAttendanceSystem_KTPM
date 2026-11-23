import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Alert, Button, CircularProgress, TextField } from "@mui/material"
import { Brand, Card } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { managementSession, ManagementError, type ManagementIdentity } from "../../data/management"
import { canVisit, serverHome } from "../../lib/server-access"
import MandatoryPasswordChange from "./MandatoryPasswordChange"
import "../management/management.css"

export default function Login() {
  const navigate = useNavigate(), [params] = useSearchParams()
  const [identity, setIdentity] = useState<ManagementIdentity | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [changed, setChanged] = useState(params.get("changed") === "1")
  useEffect(() => {
    const controller = new AbortController()
    managementSession.me(controller.signal).then(setIdentity).catch(e => { if (!controller.signal.aborted && !(e instanceof ManagementError && e.status === 401)) setError(e instanceof Error ? e.message : "Không thể kiểm tra phiên.") }).finally(() => { if (!controller.signal.aborted) setChecking(false) })
    return () => controller.abort()
  }, [])
  useEffect(() => {
    if (!identity || identity.mustChangePassword) return
    const requested = params.get("returnTo") || ""
    if (requested.startsWith("/") && !requested.startsWith("//")) {
      const url = new URL(requested, window.location.origin)
      if (url.origin === window.location.origin && canVisit(identity, url.pathname, url.search)) { navigate(url.pathname + url.search, { replace: true }); return }
    }
    navigate(serverHome(identity), { replace: true })
  }, [identity, navigate, params])
  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("")
    try { setIdentity(await managementSession.login(username.trim(), password)) }
    catch (e) { setError(e instanceof Error ? e.message : "Không thể đăng nhập.") }
    finally { setPassword(""); setBusy(false) }
  }
  async function logout() { await managementSession.logout(); setIdentity(null) }
  return <main className="management-page"><header className="management-top"><Brand /><div><Link to="/">Trang chủ</Link><ThemeToggle /></div></header>
    {checking ? <CircularProgress aria-label="Kiểm tra phiên đăng nhập" /> : identity?.mustChangePassword ? <MandatoryPasswordChange onChanged={() => { setIdentity(null); setChanged(true) }} onLogout={logout} /> : <Card className="management-login"><h1>Đăng nhập TMC Access</h1><p>Sử dụng tài khoản đã được cấp. Hệ thống sẽ mở đúng không gian theo quyền của bạn.</p>{changed && <Alert severity="success">Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.</Alert>}{error && <Alert severity="error" role="alert">{error}</Alert>}<form className="management-form" onSubmit={login}><TextField label="Tên đăng nhập" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required disabled={busy} /><TextField label="Mật khẩu" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /><Button variant="contained" type="submit" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</Button></form></Card>}
  </main>
}

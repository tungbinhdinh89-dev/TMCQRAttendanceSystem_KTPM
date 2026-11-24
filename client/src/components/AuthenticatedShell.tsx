import { useCallback, useRef, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { Alert, Button, Drawer, IconButton, useMediaQuery } from "@mui/material"
import { Building2, ClipboardList, History, Home, LogOut, Menu, QrCode, ScanLine, ShieldCheck, Users, X, BarChart3, Plug, Activity } from "lucide-react"
import { Brand } from "./ui"
import { ThemeToggle } from "./layout"
import { managementSession, type ManagementIdentity } from "../data/management"
import { canVisit, managementTabs } from "../lib/server-access"
import { AuthenticatedNavigation, type NavigationGuard } from "../lib/authenticated-navigation"
import "./authenticated-shell.css"

const roles: Record<string, string> = { EMP: "Nhân viên", HR: "Nhân sự", SUP: "Giám sát tổ", SEC: "Bảo vệ", ADM: "Quản trị hệ thống", EXE: "Điều hành" }
const tabLabels = { employees: "Nhân viên", organization: "Cơ cấu tổ chức", stations: "Trạm cổng", integrations: "Tích hợp", readiness: "Vận hành" }
const tabIcons = { employees: Users, organization: Building2, stations: ShieldCheck, integrations: Plug, readiness: Activity }

export default function AuthenticatedShell({ identity, children }: { identity: ManagementIdentity; children: ReactNode }) {
  const location = useLocation()
  const mobile = useMediaQuery("(max-width: 900px)")
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const guard = useRef<NavigationGuard | null>(null)
  const register = useCallback((value: NavigationGuard) => { guard.current = value; return () => { if (guard.current === value) guard.current = null } }, [])
  const items = [
    { path: "/qr", label: "QR của tôi", icon: QrCode },
    { path: "/attendance", label: "Lịch sử chấm công", icon: ClipboardList },
    { path: "/scanner", label: "Quét QR chấm công", icon: ScanLine },
    { path: "/gate-history", label: "Nhật ký cổng", icon: History },
    { path: "/attendance-summary", label: "Báo cáo tổng hợp", icon: BarChart3 },
    ...managementTabs(identity).map(tab => ({ path: `/management?tab=${tab}`, label: tabLabels[tab], icon: tabIcons[tab] })),
    { path: "/audit", label: "Nhật ký hệ thống", icon: ShieldCheck },
  ].filter(item => { const [path, search = ""] = item.path.split("?"); return canVisit(identity, path, search) })
  const active = (path: string) => {
    const [pathname, search] = path.split("?")
    if (pathname === "/qr" && location.pathname === "/mobile/ma-qr") return true
    return pathname === location.pathname && (!search || new URLSearchParams(search).get("tab") === new URLSearchParams(location.search).get("tab"))
  }
  const current = items.find(item => active(item.path))?.label || "Không gian làm việc"
  function canLeave() { setOpen(false); return guard.current?.() !== false }
  async function logout() {
    if (!canLeave()) return
    setBusy(true); setError("")
    try { await managementSession.logout(); window.location.assign("/dang-nhap") }
    catch { setError("Chưa đăng xuất được. Vui lòng thử lại."); setBusy(false) }
  }
  const navigation = <>
    <div className="auth-sidebar-brand"><Brand />{mobile && <IconButton aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></IconButton>}</div>
    <div className="auth-sidebar-label">KHÔNG GIAN LÀM VIỆC</div>
    <nav aria-label="Điều hướng tài khoản" className="auth-sidebar-nav">
      {items.map(item => <Link key={item.path} to={item.path} aria-current={active(item.path) ? "page" : undefined} onClick={event => { if (!canLeave() || busy) event.preventDefault() }}><item.icon size={20} aria-hidden="true" /><span>{item.label}</span></Link>)}
      {!items.length && <p>Chưa có chức năng được cấp quyền.</p>}
    </nav>
    <div className="auth-sidebar-bottom"><div className="auth-sidebar-user"><strong>{identity.employee?.fullName || identity.username}</strong><small>{identity.username}</small></div><Link to="/" onClick={event => { if (!canLeave()) event.preventDefault() }}><Home size={18} aria-hidden="true" />Trang chủ</Link><Button startIcon={<LogOut size={18} />} onClick={() => void logout()} disabled={busy} fullWidth>Đăng xuất</Button></div>
  </>
  return <AuthenticatedNavigation.Provider value={register}><div className="auth-shell">
    <a className="auth-skip" href="#authenticated-content">Đến nội dung chính</a>
    {mobile ? <Drawer open={open} onClose={() => setOpen(false)} slotProps={{ paper: { className: "auth-sidebar", id: "authenticated-sidebar" } }}>{navigation}</Drawer> : <aside className="auth-sidebar" id="authenticated-sidebar">{navigation}</aside>}
    <div className="auth-shell-body"><header className="auth-topbar">
      <div className="auth-topbar-title">{mobile && <IconButton aria-label="Mở menu điều hướng" aria-expanded={open} aria-controls="authenticated-sidebar" onClick={() => setOpen(true)}><Menu size={22} /></IconButton>}<span>{current}</span></div>
      <div className="auth-topbar-account"><ThemeToggle /><span className="auth-avatar" aria-hidden="true">{(identity.employee?.fullName || identity.username).trim().split(/\s+/).slice(-2).map(part => part[0]).join("").toUpperCase()}</span><div><strong>{identity.employee?.fullName || identity.username}</strong><small>{[...new Set(identity.roles.map(r => roles[r.code] || r.code))].join(" · ")}</small></div></div>
    </header>{error && <Alert severity="error" className="auth-shell-error">{error}</Alert>}
    <div id="authenticated-content" tabIndex={-1} className="auth-shell-content">{children}</div></div>
  </div></AuthenticatedNavigation.Provider>
}

import HistoryLinks from "../attendance-history/HistoryLinks"
import { useEffect, useState, type ReactNode } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { Alert, Button, CircularProgress } from "@mui/material"
import { Brand, Card } from "../../components/ui"
import { managementSession, ManagementError, type ManagementIdentity } from "../../data/management"
import { canVisit, serverHome } from "../../lib/server-access"
import MandatoryPasswordChange from "./MandatoryPasswordChange"
import "../management/management.css"

export function AccessMessage({ identity, unavailable = false }: { identity: ManagementIdentity; unavailable?: boolean }) {
  const [error, setError] = useState("")
  return <main className="management-page"><Brand /><Card><h1>{unavailable ? "Không gian làm việc" : "403 · Không có quyền truy cập"}</h1><p>{unavailable ? "Các chức năng báo cáo, lịch sử và nghiệp vụ dành cho vai trò này chưa được triển khai. Hệ thống không hiển thị dữ liệu mô phỏng như dữ liệu thật." : "Tài khoản hiện tại không được cấp quyền vào trang này. Quyền quản lý không bao gồm quyền xem QR cá nhân của người khác."}</p><p>Đã đăng nhập: <strong>{identity.username}</strong></p>{error && <Alert severity="error">{error}</Alert>}<div className="management-actions"><Link to={serverHome(identity)}>Không gian của tôi</Link><Link to="/">Trang chủ</Link><Button onClick={() => { void managementSession.logout().then(() => window.location.assign("/dang-nhap")).catch(() => setError("Chưa đăng xuất được. Vui lòng thử lại.")) }}>Đăng xuất</Button></div></Card></main>
}

export default function ServerAccess({ children, workspace = false, legacy = false }: { children?: ReactNode; workspace?: boolean; legacy?: boolean }) {
  const location = useLocation()
  const [identity, setIdentity] = useState<ManagementIdentity | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setChecking(true); setIdentity(null); setError("")
    managementSession.me(controller.signal).then(u => { if (active) setIdentity(u) }).catch(e => { if (active && !(e instanceof ManagementError && e.status === 401)) setError(e instanceof Error ? e.message : "Không thể kiểm tra phiên đăng nhập.") }).finally(() => { if (active) setChecking(false) })
    return () => { active = false; controller.abort() }
  }, [location.pathname, location.search])
  if (checking) return <main className="management-page"><CircularProgress aria-label="Kiểm tra quyền truy cập" /></main>
  if (error) return <main className="management-page"><Alert severity="error">{error}</Alert><Button onClick={() => window.location.reload()}>Thử lại</Button></main>
  if (!identity) return <Navigate to={`/dang-nhap?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (identity.mustChangePassword) return <main className="management-page"><Brand /><MandatoryPasswordChange onChanged={() => window.location.assign("/dang-nhap?changed=1")} onLogout={async () => { await managementSession.logout(); window.location.assign("/dang-nhap") }} /></main>
  if (workspace) return <AccessMessage identity={identity} unavailable />
  if (legacy) {
    const aliases: Record<string, string> = { "/app/nhan-su": "/management?tab=employees", "/app/cai-dat": "/management?tab=organization", "/app/kiem-soat": "/management?tab=stations", "/app/audit": "/audit", "/app/cham-cong": "/attendance", "/mobile/lich-su": "/attendance", "/app/bao-cao": "/attendance-summary", "/mobile/ma-qr": "/qr" }
    const destination = aliases[location.pathname]
    if (destination) return <Navigate to={destination} replace />
    if (["/app", "/app/tong-quan", "/mobile", "/mobile/trang-chu"].includes(location.pathname)) return <Navigate to={serverHome(identity)} replace />
    return <AccessMessage identity={identity} />
  }
  if (!canVisit(identity, location.pathname, location.search)) return <AccessMessage identity={identity} />
  if (location.pathname === "/management" && !new URLSearchParams(location.search).has("tab")) return <Navigate to={serverHome(identity)} replace />
  return children
}

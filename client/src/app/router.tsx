import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"
import { lazy, Suspense, type ReactNode } from "react"
import { Button } from "@figma/astraui"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import { useApp } from "./context"
import { hasAccess, homeFor } from "../lib/rbac"
import DesktopLayout from "../components/layout"
import { Brand, Title } from "../components/ui"
import Landing from "../features/public/Landing"
import Login from "../features/auth/Login"
const Dashboard = lazy(() => import("../features/dashboard/Dashboard"))
const Employees = lazy(() => import("../features/employees/Employees"))
const Attendance = lazy(() => import("../features/attendance/Attendance"))
const Access = lazy(() => import("../features/access-control/Access"))
const Shifts = lazy(() => import("../features/shifts/Shifts"))
const Reports = lazy(() => import("../features/reports/Reports"))
const Settings = lazy(() => import("../features/settings/Settings"))
const Mobile = lazy(() => import("../features/employee-mobile/Mobile"))
const Kiosk = lazy(() => import("../features/kiosk/Kiosk"))
function Guard({
  module,
  children,
}: {
  module?: string
  children: ReactNode
}) {
  const { account } = useApp(),
    location = useLocation()
  if (!account)
    return (
      <Navigate
        to={`/dang-nhap?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  if (module && !hasAccess(account.role, module)) return <ErrorPage forbidden />
  return children
}
function AppIndex() {
  const { account } = useApp()
  return (
    <Navigate to={account ? homeFor(account.role) : "/dang-nhap"} replace />
  )
}
export function ErrorPage({ forbidden = false }: { forbidden?: boolean }) {
  const { account } = useApp(),
    navigate = useNavigate()
  return (
    <div className="error-page">
      <Brand />
      <div className="error-number">{forbidden ? "403" : "404"}</div>
      <ShieldCheck size={32} className="text-brand-primary" />
      <Title>
        {forbidden
          ? "Bạn không có quyền truy cập"
          : "Trang này chưa có trên bản đồ"}
      </Title>
      <div className="text-label-sm text-text-secondary">
        {forbidden
          ? "Không gian này dành cho vai trò khác. Quay lại để tiếp tục công việc của bạn."
          : "Đường dẫn có thể đã thay đổi. Cùng quay lại điểm bắt đầu nhé."}
      </div>
      <Button
        iconStart={<ArrowLeft size={16} />}
        onClick={() => navigate(account ? homeFor(account.role) : "/")}
      >
        Về không gian của tôi
      </Button>
    </div>
  )
}
export default function Router() {
  return (
    <Suspense
      fallback={
        <div className="app-loading">
          <Brand />
          <div className="text-label-sm text-text-secondary">
            Đang mở không gian của bạn…
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dang-nhap" element={<Login />} />
        <Route
          path="/app"
          element={
            <Guard>
              <DesktopLayout />
            </Guard>
          }
        >
          <Route index element={<AppIndex />} />
          {[
            ["tong-quan", <Dashboard />],
            ["nhan-su", <Employees />],
            ["cham-cong", <Attendance />],
            ["kiem-soat", <Access />],
            ["ca-lam", <Shifts />],
            ["bao-cao", <Reports />],
            ["cai-dat", <Settings />],
          ].map(([path, element]) => (
            <Route
              key={String(path)}
              path={String(path)}
              element={<Guard module={String(path)}>{element}</Guard>}
            />
          ))}
        </Route>
        <Route
          path="/mobile"
          element={<Navigate to="/mobile/trang-chu" replace />}
        />
        {["trang-chu", "ma-qr", "lich-su", "thong-bao", "tai-khoan"].map(
          (page) => (
            <Route
              key={page}
              path={`/mobile/${page}`}
              element={
                <Guard module="mobile">
                  <Mobile />
                </Guard>
              }
            />
          ),
        )}
        <Route
          path="/kiosk"
          element={
            <Guard module="kiosk">
              <Kiosk />
            </Guard>
          }
        />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  )
}

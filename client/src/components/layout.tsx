import { useState, type ReactNode } from "react"
import { useLocation, useNavigate, Outlet } from "react-router-dom"
import {
  SidebarNavigation,
  SidebarButton,
  SecondaryNav,
  SecondaryNavItem,
  IconButton,
  Button,
  Avatar,
  Badge,
  Tooltip,
  useTheme,
} from "@figma/astraui"
import {
  Home,
  Users,
  Clock,
  ShieldCheck,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  ScanLine,
  Smartphone,
  ArrowUpRight,
  Building2,
} from "lucide-react"
import { useAccount, useApp } from "../app/context"
import { Brand, Title } from "./ui"
import { hasAccess, roleLabels } from "../lib/rbac"
import { initials, formatDate, today } from "../lib/date"

export const navItems = [
  { id: "tong-quan", label: "Tổng quan", icon: Home },
  { id: "nhan-su", label: "Nhân sự", icon: Users },
  { id: "cham-cong", label: "Chấm công", icon: Clock },
  { id: "kiem-soat", label: "Kiểm soát ra vào", icon: ShieldCheck },
  { id: "ca-lam", label: "Ca làm việc", icon: Calendar },
  { id: "bao-cao", label: "Báo cáo & thống kê", icon: BarChart3 },
]
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <IconButton
      aria-label={
        theme === "light" ? "Bật giao diện tối" : "Bật giao diện sáng"
      }
      variant="subtle"
      icon={theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      onClick={toggleTheme}
    />
  )
}
export function PublicShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="public-shell">
      <div className="public-rail">
        <SidebarNavigation
          footer={
            <>
              <ThemeToggle />
              <Avatar type="initial" initials="TM" size="medium" />
            </>
          }
        >
          <Tooltip content="Trang chủ" position="right">
            <SidebarButton
              icon={<Home className="size-full" strokeWidth={1.5} />}
              active
              onClick={() => navigate("/")}
              aria-label="Trang chủ"
            />
          </Tooltip>
          <Tooltip content="Không gian doanh nghiệp" position="right">
            <SidebarButton
              icon={<Building2 className="size-full" strokeWidth={1.5} />}
              onClick={() => navigate("/dang-nhap")}
              aria-label="Không gian doanh nghiệp"
            />
          </Tooltip>
          <Tooltip content="Ứng dụng nhân viên" position="right">
            <SidebarButton
              icon={<Smartphone className="size-full" strokeWidth={1.5} />}
              onClick={() => navigate("/dang-nhap?role=employee")}
              aria-label="Ứng dụng nhân viên"
            />
          </Tooltip>
          <Tooltip content="Kiosk tại cổng" position="right">
            <SidebarButton
              icon={<ScanLine className="size-full" strokeWidth={1.5} />}
              onClick={() => navigate("/kiosk")}
              aria-label="Kiosk tại cổng"
            />
          </Tooltip>
        </SidebarNavigation>
      </div>
      <div className="public-main">{children}</div>
    </div>
  )
}
export default function DesktopLayout() {
  const account = useAccount(),
    { logout, db } = useApp()
  const navigate = useNavigate(),
    location = useLocation()
  const [menu, setMenu] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const current = location.pathname.split("/")[2] || "tong-quan"
  const items = navItems.filter((n) => hasAccess(account.role, n.id))
  const pending = db.adjustments.filter((a) => a.status === "pending").length
  return (
    <div className="desktop-app">
      <div className="app-rail">
        <SidebarNavigation
          footer={
            <>
              <SidebarButton
                icon={<Settings className="size-full" strokeWidth={1.5} />}
                aria-label="Cài đặt"
                onClick={() =>
                  navigate(
                    hasAccess(account.role, "cai-dat") ? "/app/cai-dat" : "/",
                  )
                }
              />
              <Avatar
                type="initial"
                initials={initials(account.name)}
                size="medium"
              />
            </>
          }
        >
          {items.slice(0, 4).map((item) => (
            <Tooltip key={item.id} content={item.label} position="right">
              <SidebarButton
                icon={<item.icon className="size-full" strokeWidth={1.5} />}
                active={current === item.id}
                aria-label={item.label}
                onClick={() => navigate(`/app/${item.id}`)}
              />
            </Tooltip>
          ))}
        </SidebarNavigation>
      </div>
      <aside className={`app-navigation ${menu ? "is-open" : ""}`}>
        <div className="nav-brand">
          <Brand />
        </div>
        <div className="workspace-label">
          <span className="workspace-icon">
            <Building2 size={16} />
          </span>
          <div>
            <div className="text-label-sm font-semibold">TMC Manufacturing</div>
            <div className="text-video-title text-text-secondary">
              Không gian doanh nghiệp
            </div>
          </div>
          <Badge label="Demo" variant="brand" />
        </div>
        <div className="text-video-title text-text-secondary nav-caption">
          QUẢN LÝ VẬN HÀNH
        </div>
        <SecondaryNav title="Điều hướng" className="business-nav">
          {items.map((item) => (
            <SecondaryNavItem
              key={item.id}
              label={
                item.label +
                (item.id === "cham-cong" && pending ? `  ·  ${pending}` : "")
              }
              icon={<item.icon className="size-full" strokeWidth={1.5} />}
              active={current === item.id}
              onClick={() => {
                navigate(`/app/${item.id}`)
                setMenu(false)
              }}
            />
          ))}
          {hasAccess(account.role, "cai-dat") && (
            <SecondaryNavItem
              label="Cài đặt hệ thống"
              icon={<Settings className="size-full" strokeWidth={1.5} />}
              active={current === "cai-dat"}
              onClick={() => navigate("/app/cai-dat")}
            />
          )}
        </SecondaryNav>
        <div className="nav-bottom">
          <div className="nav-demo">
            <ScanLine size={24} className="text-brand-primary" />
            <div className="text-label-sm font-semibold mt-lg">
              Trải nghiệm tại cổng
            </div>
            <div className="text-video-title text-text-secondary mt-xs mb-lg">
              Quét mã và xem dữ liệu cập nhật ngay.
            </div>
            {hasAccess(account.role, "kiosk") ? (
              <Button
                variant="neutral"
                size="small"
                iconEnd={<ArrowUpRight size={16} />}
                onClick={() => navigate("/kiosk")}
              >
                Mở kiosk
              </Button>
            ) : (
              <Button
                variant="neutral"
                size="small"
                onClick={() => navigate("/")}
              >
                Khám phá giải pháp
              </Button>
            )}
          </div>
          <div className="profile-row">
            <Avatar
              type="initial"
              initials={initials(account.name)}
              size="medium"
            />
            <div className="flex-1 min-w-0">
              <div className="text-label-sm truncate">{account.name}</div>
              <div className="text-video-title text-text-secondary">
                {roleLabels[account.role]}
              </div>
            </div>
            <IconButton
              variant="subtle"
              icon={<LogOut size={16} />}
              aria-label="Đăng xuất"
              onClick={async () => {
                if (await logout()) navigate("/dang-nhap")
              }}
            />
          </div>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="flex items-center gap-md">
            <span className="mobile-menu">
              <IconButton
                variant="subtle"
                aria-label="Mở điều hướng"
                icon={<Menu size={16} />}
                onClick={() => setMenu(!menu)}
              />
            </span>
            <span className="text-label-sm text-text-secondary">
              Không gian doanh nghiệp
            </span>
            <span className="text-text-tertiary">/</span>
            <span className="text-label-sm">
              {navItems.find((n) => n.id === current)?.label || "Cài đặt"}
            </span>
          </div>
          <div className="flex items-center gap-md">
            <span className="topbar-date text-video-title text-text-secondary">
              {formatDate(today())}
            </span>
            <span className="system-live">
              <span />
              Hệ thống ổn định
            </span>
            <ThemeToggle />
            <IconButton
              variant="subtle"
              aria-label="Thông báo hệ thống"
              icon={<Bell size={16} />}
              onClick={() => setNotifications(!notifications)}
            />
          </div>
        </header>
        {notifications && (
          <div className="notification-popover surface-card">
            <Title level={3}>Thông báo vận hành</Title>
            <div className="text-label-sm text-text-secondary mt-lg">
              {pending} đề nghị điều chỉnh đang chờ duyệt.
            </div>
            <div className="text-label-sm text-text-secondary mt-lg">
              {db.gates.filter((g) => !g.online).length} thiết bị đang ngoại
              tuyến.
            </div>
            <Button
              variant="subtle"
              size="small"
              onClick={() => setNotifications(false)}
            >
              Đóng thông báo
            </Button>
          </div>
        )}
        <main className="app-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>TMC Access · Không gian vận hành thông minh</span>
          <span>Dữ liệu mô phỏng · Chỉ lưu trên trình duyệt này</span>
        </footer>
      </div>
    </div>
  )
}

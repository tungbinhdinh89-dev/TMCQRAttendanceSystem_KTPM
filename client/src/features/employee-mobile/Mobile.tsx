import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, IconButton, Badge, Avatar, Tabs } from "@figma/astraui"
import {
  Home,
  QrCode,
  Clock,
  Bell,
  User,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Copy,
  LogOut,
  ShieldCheck,
  Calendar,
  MapPin,
  Check,
} from "lucide-react"
import QRCode from "react-qr-code"
import { useApp, useAccount } from "../../app/context"
import { Brand, Title, Card, Status, InfoRow, Empty } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { formatDate, formatTime, today, initials } from "../../lib/date"
import { makeQr } from "../../lib/qr"
import { api } from "../../data/api"
import { sites } from "../../data/types"
import { AdjustmentForm } from "../attendance/Attendance"
const pages = [
  { id: "trang-chu", label: "Trang chủ", icon: Home },
  { id: "ma-qr", label: "Mã QR", icon: QrCode },
  { id: "lich-su", label: "Lịch sử", icon: Clock },
  { id: "thong-bao", label: "Thông báo", icon: Bell },
  { id: "tai-khoan", label: "Tài khoản", icon: User },
]
export default function Mobile() {
  const { db, run, logout, notify } = useApp(),
    account = useAccount(),
    navigate = useNavigate(),
    location = useLocation()
  const employee = db.employees.find(
    (e) =>
      e.id === (account.role === "SYSTEM_ADMIN" ? "e1" : account.employeeId),
  )!
  const shift = db.shifts.find((s) => s.id === employee.shiftId)!
  const records = db.attendance
    .filter((a) => a.employeeId === employee.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const events = db.events
    .filter((e) => e.employeeId === employee.id)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const notifications = db.notifications.filter(
    (n) => n.employeeId === employee.id,
  )
  const current = records.find((a) => a.date === today())
  const page = location.pathname.split("/")[2] || "trang-chu"
  const [payload, setPayload] = useState(() => makeQr(employee.id)),
    [now, setNow] = useState(Date.now()),
    [request, setRequest] = useState(false)
  const expire = Number(payload.split(":")[4]),
    remaining = Math.max(0, Math.ceil((expire - now) / 1000))
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const refresh = () => {
    setPayload(makeQr(employee.id))
    setNow(Date.now())
  }
  const locked = employee.qrLocked || employee.status !== "active"
  return (
    <div className="mobile-preview">
      <div className="mobile-preview-note">
        <Brand />
        <div>
          <Title level={2}>
            Một ca làm liền mạch,
            <br />
            bắt đầu từ bạn.
          </Title>
          <div className="text-label-sm text-text-secondary mt-xl">
            Mã QR cá nhân, lịch ca và giờ công.
            <br />
            Luôn sẵn sàng trong tầm tay.
          </div>
        </div>
        <div className="mobile-preview-decoration">
          <QrCode size={80} strokeWidth={0.8} />
          <span className="text-video-title text-text-secondary">
            ỨNG DỤNG NHÂN VIÊN TMC ACCESS
          </span>
        </div>
        <Button
          variant="neutral"
          iconStart={<ArrowLeft size={16} />}
          onClick={() =>
            navigate(account.role === "SYSTEM_ADMIN" ? "/app/tong-quan" : "/")
          }
        >
          {account.role === "SYSTEM_ADMIN" ? "Về dashboard" : "Về website"}
        </Button>
      </div>
      <div className="mobile-device">
        <header className="mobile-header">
          <Brand />
          <ThemeToggle />
        </header>
        <main className="mobile-content">
          {page === "trang-chu" && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-label-sm text-text-secondary">
                    Chào ngày mới,
                  </div>
                  <Title className="mt-xs">
                    {employee.name.split(" ").slice(-2).join(" ")}!
                  </Title>
                </div>
                <Avatar
                  type="initial"
                  initials={initials(employee.name)}
                  size="large"
                />
              </div>
              <div className="text-video-title text-text-secondary mt-md mb-xl">
                {formatDate(today())} · {sites[employee.site]}
              </div>
              <Card className="mobile-today">
                <div className="flex justify-between items-center">
                  <Title level={3}>Ca làm hôm nay</Title>
                  <Status value={current?.status || "absent"} />
                </div>
                <div className="mobile-shift-time">
                  {shift.start}
                  <span>—</span>
                  {shift.end}
                </div>
                <div className="text-label-sm text-text-secondary">
                  {shift.name} · {employee.department}
                </div>
                <div className="mobile-checks">
                  <div>
                    <span className="text-video-title text-text-secondary">
                      GIỜ VÀO
                    </span>
                    <div className="text-heading mt-xs">
                      {current?.checkIn || "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-video-title text-text-secondary">
                      GIỜ RA
                    </span>
                    <div className="text-heading mt-xs">
                      {current?.checkOut || "—"}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  iconStart={<QrCode size={16} />}
                  onClick={() => {
                    refresh()
                    navigate("/mobile/ma-qr")
                  }}
                >
                  Mở mã QR của tôi
                </Button>
              </Card>
              <div className="mobile-shortcuts">
                <Button
                  variant="neutral"
                  iconStart={<Clock size={16} />}
                  onClick={() => navigate("/mobile/lich-su")}
                >
                  Lịch sử công
                </Button>
                <Button
                  variant="neutral"
                  iconStart={<Calendar size={16} />}
                  onClick={() => setRequest(true)}
                >
                  Điều chỉnh công
                </Button>
              </div>
              <Card className="mt-xl">
                <div className="card-heading">
                  <Title level={3}>Thông báo mới</Title>
                  <IconButton
                    variant="subtle"
                    size="small"
                    icon={<ArrowRight size={16} />}
                    aria-label="Xem thông báo"
                    onClick={() => navigate("/mobile/thong-bao")}
                  />
                </div>
                <div className="text-label-sm">
                  {notifications[0]?.title || "Bạn đã cập nhật tất cả"}
                </div>
                <div className="text-video-title text-text-secondary mt-md">
                  {notifications[0]?.body ||
                    "Thông báo mới sẽ xuất hiện ở đây."}
                </div>
              </Card>
              <div className="mobile-help">
                <ShieldCheck size={20} />
                <span>
                  Mã QR chỉ dành cho bạn. Không chia sẻ mã cho người khác.
                </span>
              </div>
            </>
          )}
          {page === "ma-qr" && (
            <>
              <Title>Mã QR của tôi</Title>
              <div className="text-label-sm text-text-secondary mt-md mb-xl">
                Đưa mã vào vùng quét tại cổng nhà máy.
              </div>
              <Card className="qr-card">
                <Avatar
                  type="initial"
                  initials={initials(employee.name)}
                  size="large"
                />
                <Title level={3} className="mt-lg">
                  {employee.name}
                </Title>
                <div className="text-video-title text-text-secondary mt-xs">
                  {employee.code} · {employee.department}
                </div>
                <div
                  className={`personal-qr ${
                    remaining === 0 || locked ? "qr-expired" : ""
                  }`}
                >
                  <QRCode
                    value={payload}
                    size={230}
                    bgColor="var(--on-brand)"
                    fgColor="var(--on-reverse)"
                    title="Mã QR ra vào cá nhân"
                  />
                  {(remaining === 0 || locked) && (
                    <div className="qr-expired-overlay">
                      <ShieldCheck size={32} />
                      <div className="text-label">
                        {locked ? "Mã QR bị khóa" : "Mã đã hết hạn"}
                      </div>
                    </div>
                  )}
                </div>
                <Badge
                  label={
                    locked
                      ? "Liên hệ nhân sự để hỗ trợ"
                      : remaining
                        ? `Có hiệu lực trong ${remaining} giây`
                        : "Vui lòng làm mới mã"
                  }
                  variant={locked ? "danger" : remaining ? "brand" : "warning"}
                />
                <progress className="qr-countdown" max={60} value={remaining} />
                <Button
                  variant={remaining ? "neutral" : "primary"}
                  iconStart={<RefreshCw size={16} />}
                  disabled={locked}
                  onClick={refresh}
                >
                  Làm mới mã QR
                </Button>
                <div className="text-video-title text-text-secondary flex gap-xs items-center mt-lg">
                  <MapPin size={16} />
                  Chỉ có hiệu lực tại {sites[employee.site]}
                </div>
              </Card>
              <div className="mobile-demo-box">
                <Title level={3}>Thử nghiệm luồng quét</Title>
                <div className="text-video-title text-text-secondary mt-md mb-lg">
                  Sao chép payload và dán vào kiosk trên cùng trình duyệt để xem
                  cập nhật.
                </div>
                <Button
                  variant="neutral"
                  size="small"
                  iconStart={<Copy size={16} />}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(payload)
                      notify("Đã sao chép payload QR demo")
                    } catch {
                      notify(
                        "Trình duyệt không cho phép sao chép. Dùng bộ mô phỏng kiosk.",
                        true,
                      )
                    }
                  }}
                >
                  Sao chép payload
                </Button>
              </div>
            </>
          )}
          {page === "lich-su" && (
            <>
              <PageHeaderMobile
                title="Lịch sử của tôi"
                description="Đối soát mỗi ngày làm việc."
              />
              <Tabs
                tabs={[
                  {
                    id: "attendance",
                    label: "Chấm công",
                    content: (
                      <div className="mobile-list">
                        {records.map((a) => (
                          <Card key={a.id}>
                            <div className="flex justify-between items-center">
                              <span className="text-label-sm font-semibold">
                                {formatDate(a.date)}
                              </span>
                              <Status value={a.status} />
                            </div>
                            <div className="mobile-checks">
                              <div>
                                <span className="text-video-title text-text-secondary">
                                  Giờ vào
                                </span>
                                <div className="text-label mt-xs">
                                  {a.checkIn || "—"}
                                </div>
                              </div>
                              <div>
                                <span className="text-video-title text-text-secondary">
                                  Giờ ra
                                </span>
                                <div className="text-label mt-xs">
                                  {a.checkOut || "—"}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="neutral"
                          onClick={() => setRequest(true)}
                        >
                          Đề nghị điều chỉnh
                        </Button>
                      </div>
                    ),
                  },
                  {
                    id: "access",
                    label: "Ra vào",
                    content: (
                      <div className="mobile-list">
                        {events.length ? events.slice(0, 30).map((e) => (
                            <Card key={e.id}>
                              <div className="flex justify-between">
                                <span className="text-label-sm">
                                  {e.direction === "ENTRY" ? "Vào" : "Ra"} nhà
                                  máy
                                </span>
                                <Badge
                                  label={e.allowed ? "Hợp lệ" : "Từ chối"}
                                  variant={e.allowed ? "success" : "danger"}
                                />
                              </div>
                              <div className="text-video-title text-text-secondary mt-lg">
                                {formatTime(e.time)} · {formatDate(e.time)} ·{" "}
                                {sites[e.site]}
                              </div>
                              {!e.allowed && (
                                <div className="text-video-title text-danger mt-md">
                                  {e.reason}
                                </div>
                              )}
                            </Card>
                          )) : <Empty />}
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}
          {page === "thong-bao" && (
            <>
              <PageHeaderMobile
                title="Thông báo"
                description={`${notifications.filter((n) => !n.read).length} thông báo chưa đọc`}
              />
              <Button
                variant="subtle"
                size="small"
                iconStart={<Check size={16} />}
                onClick={() =>
                  run(
                    () => api.markNotifications(employee.id),
                    "Đã đánh dấu tất cả là đã đọc",
                  )
                }
              >
                Đánh dấu tất cả đã đọc
              </Button>
              <div className="mobile-list">
                {notifications.map((n) => (
                  <Card
                    key={n.id}
                    className={!n.read ? "unread-notification" : ""}
                  >
                    <div className="flex items-center justify-between gap-md">
                      <Title level={3}>{n.title}</Title>
                      {!n.read && <span className="eyebrow-dot" />}
                    </div>
                    <div className="text-label-sm text-text-secondary mt-lg">
                      {n.body}
                    </div>
                    <div className="text-video-title text-text-secondary mt-lg">
                      {formatDate(n.time)}
                    </div>
                  </Card>
                ))}
                {!notifications.length && (
                  <Empty
                    title="Chưa có thông báo"
                    description="Thông tin mới về ca làm và bảng công sẽ xuất hiện ở đây."
                  />
                )}
              </div>
            </>
          )}
          {page === "tai-khoan" && (
            <>
              <PageHeaderMobile
                title="Tài khoản"
                description="Thông tin và không gian cá nhân."
              />
              <Card>
                <div className="flex flex-col items-center gap-lg py-xl">
                  <Avatar
                    type="initial"
                    initials={initials(employee.name)}
                    size="large"
                  />
                  <Title level={2}>{employee.name}</Title>
                  <Badge label={employee.code} variant="brand" />
                </div>
                <InfoRow label="Chức danh">{employee.title}</InfoRow>
                <InfoRow label="Phòng ban">{employee.department}</InfoRow>
                <InfoRow label="Nhà máy">{sites[employee.site]}</InfoRow>
                <InfoRow label="Ca làm việc">{shift.name}</InfoRow>
                <div className="text-video-title text-text-secondary mt-xl">
                  Liên hệ phòng Nhân sự nếu thông tin cần cập nhật.
                </div>
              </Card>
              <Card className="mt-xl">
                <div className="flex justify-between items-center">
                  <span className="text-label-sm">Giao diện sáng / tối</span>
                  <ThemeToggle />
                </div>
              </Card>
              <Button
                className="w-full mt-2xl"
                variant="neutral"
                iconStart={<LogOut size={16} />}
                onClick={async () => {
                  if (await logout()) navigate("/dang-nhap")
                }}
              >
                Đăng xuất
              </Button>
            </>
          )}
        </main>
        <nav className="mobile-bottom-nav" aria-label="Điều hướng nhân viên">
          {pages.map((p) => (
            <Button
              variant="subtle"
              className={`mobile-nav-item ${page === p.id ? "active" : ""}`}
              key={p.id}
              onClick={() => navigate(`/mobile/${p.id}`)}
            >
              <p.icon size={20} strokeWidth={1.6} />
              <span>{p.label}</span>
            </Button>
          ))}
        </nav>
      </div>
      {request && (
        <AdjustmentForm
          employees={[employee]}
          onClose={() => setRequest(false)}
        />
      )}
    </div>
  )
}
function PageHeaderMobile({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-xl">
      <Title>{title}</Title>
      <div className="text-label-sm text-text-secondary mt-md">
        {description}
      </div>
    </div>
  )
}

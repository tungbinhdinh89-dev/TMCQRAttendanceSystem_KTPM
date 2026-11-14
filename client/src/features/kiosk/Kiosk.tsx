import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Button,
  IconButton,
  SelectField,
  InputField,
  TextareaField,
  Badge,
  Modal,
} from "@figma/astraui"
import {
  ArrowLeft,
  ScanLine,
  Camera,
  QrCode,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Maximize,
} from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { useApp } from "../../app/context"
import { Brand, Title, Card, Person } from "../../components/ui"
import { ThemeToggle } from "../../components/layout"
import { api } from "../../data/api"
import { sites, type SiteId } from "../../data/types"
import { makeQr } from "../../lib/qr"
import { canManage, homeFor } from "../../lib/rbac"
import { formatTime, formatDate } from "../../lib/date"
type Result = Awaited<ReturnType<typeof api.scan>>
function ScanCamera({ onRead }: { onRead: (text: string) => void }) {
  const scanner = useRef<Html5Qrcode | null>(null),
    disposed = useRef(false)
  const [starting, setStarting] = useState(false),
    [active, setActive] = useState(false),
    [error, setError] = useState("")
  const onReadRef = useRef(onRead)
  onReadRef.current = onRead
  useEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      const current = scanner.current
      if (current?.isScanning) current.stop().catch(() => {})
    }
  }, [])
  const start = async () => {
    setStarting(true)
    setError("")
    try {
      const current = new Html5Qrcode("kiosk-camera")
      scanner.current = current
      await current.start(
        { facingMode: "environment" },
        {
          fps: 8,
          qrbox: (width, height) => ({
            width: Math.floor(Math.min(width, height) * 0.7),
            height: Math.floor(Math.min(width, height) * 0.7),
          }),
        },
        (text) => onReadRef.current(text),
        () => {},
      )
      if (disposed.current) {
        if (current.isScanning) await current.stop()
        return
      }
      setActive(true)
    } catch {
      if (!disposed.current)
        setError(
          "Không thể mở camera. Kiểm tra quyền truy cập thiết bị hoặc chuyển sang chế độ mô phỏng.",
        )
    } finally {
      if (!disposed.current) setStarting(false)
    }
  }
  return (
    <div className="camera-component">
      <div id="kiosk-camera" />
      <div className="scanner-placeholder">
        {!active && (
          <>
            <Camera size={48} strokeWidth={1} />
            <Title level={3}>Sẵn sàng quét mã QR</Title>
            <div className="text-label-sm text-text-secondary">
              Cho phép sử dụng camera để bắt đầu xác thực.
            </div>
            <Button
              iconStart={<Camera size={16} />}
              disabled={starting}
              onClick={start}
            >
              {starting ? "Đang kết nối camera…" : "Bật camera"}
            </Button>
          </>
        )}
        {error && (
          <div className="camera-error text-label-sm" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
export default function Kiosk() {
  const { db, account, run, notify } = useApp(),
    navigate = useNavigate()
  const [site, setSite] = useState<SiteId>(account?.site || "bd"),
    [gate, setGate] = useState(account?.site === "la" ? "la-1" : "bd-1")
  const [mode, setMode] = useState("demo"),
    [selected, setSelected] = useState("e1"),
    [payload, setPayload] = useState(""),
    [clock, setClock] = useState(new Date().toISOString())
  const [result, setResult] = useState<Result | null>(null),
    [manual, setManual] = useState(false),
    [reason, setReason] = useState(""),
    [scanning, setScanning] = useState(false)
  const inFlight = useRef(false),
    lastRead = useRef({ text: "", time: 0 }),
    lastPayload = useRef("")
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toISOString()), 1000)
    return () => clearInterval(timer)
  }, [])
  const device = db.gates.find((g) => g.id === gate)
  const scan = async (text: string, override?: string) => {
    if (
      inFlight.current ||
      (!override &&
        text === lastRead.current.text &&
        Date.now() - lastRead.current.time < 5000)
    )
      return
    inFlight.current = true
    setScanning(true)
    lastPayload.current = text
    lastRead.current = { text, time: Date.now() }
    await run(async () => {
      const response = await api.scan(text, site, gate, account?.name, override)
      setResult(response)
    }, "")
    inFlight.current = false
    setScanning(false)
  }
  const simulate = (kind: string) => {
    if (kind === "invalid") {
      scan("not-a-valid-qr")
      return
    }
    const id =
      kind === "locked"
        ? (db.employees.find((e) => e.qrLocked)?.id ?? "e7")
        : kind === "wrong"
          ? (db.employees.find((e) => e.site !== site && e.status === "active")
              ?.id ?? "e25")
          : selected
    scan(makeQr(id, kind === "expired"))
  }
  const events = db.events
    .filter((e) => e.gate === gate)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)
  const override =
    !!account &&
    canManage(account.role, "override") &&
    !result?.allowed &&
    !!result?.employee
  return (
    <div className="kiosk-page">
      <header className="kiosk-header">
        <div className="flex items-center gap-xl">
          <IconButton
            aria-label="Quay lại"
            variant="neutral"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(account ? homeFor(account.role) : "/")}
          />
          <Brand />
          <Badge label="KIOSK TẠI CỔNG" variant="brand" />
        </div>
        <div className="flex items-center gap-xl">
          <span className="system-live">
            <span />
            {device?.online ? "Kết nối ổn định" : "Thiết bị ngoại tuyến"}
          </span>
          <ThemeToggle />
          <IconButton
            variant="subtle"
            aria-label="Toàn màn hình"
            icon={<Maximize size={16} />}
            onClick={() => {
              document.documentElement
                .requestFullscreen?.()
                .catch(() =>
                  notify("Trình duyệt không cho phép toàn màn hình", true),
                )
            }}
          />
        </div>
      </header>
      <main className="kiosk-main">
        <div className="kiosk-intro">
          <div>
            <div className="eyebrow">CHÀO MỪNG ĐẾN TMC MANUFACTURING</div>
            <Title className="mt-lg">Một lần quét. Sẵn sàng vào ca.</Title>
            <div className="text-label-sm text-text-secondary mt-md">
              {account
                ? `Vận hành bởi ${account.name}`
                : "Chế độ trải nghiệm công khai · Dữ liệu mô phỏng"}
            </div>
          </div>
          <div className="kiosk-clock">
            {formatTime(clock)}
            <div className="text-label-sm text-text-secondary mt-xs">
              {formatDate(clock)} · Giờ Việt Nam
            </div>
          </div>
        </div>
        <div className="kiosk-grid">
          <Card className="kiosk-scanner-card">
            <div className="kiosk-controls">
              <SelectField
                label="Nhà máy"
                value={site}
                disabled={account?.role === "GATE_OPERATOR"}
                onChange={(v) => {
                  setSite(v as SiteId)
                  setGate(`${v}-1`)
                  setResult(null)
                }}
                options={Object.entries(sites).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <SelectField
                label="Cổng kiểm soát"
                value={gate}
                onChange={(v) => {
                  setGate(v)
                  setResult(null)
                }}
                options={db.gates
                  .filter((g) => g.site === site)
                  .map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div className="kiosk-mode">
              <Button
                variant={mode === "camera" ? "primary" : "neutral"}
                size="small"
                iconStart={<Camera size={16} />}
                onClick={() => {
                  setMode("camera")
                  setResult(null)
                }}
              >
                Camera
              </Button>
              <Button
                variant={mode === "demo" ? "primary" : "neutral"}
                size="small"
                iconStart={<QrCode size={16} />}
                onClick={() => {
                  setMode("demo")
                  setResult(null)
                }}
              >
                Mô phỏng quét
              </Button>
            </div>
            {mode === "camera" ? (
              <ScanCamera
                key={`${site}-${gate}`}
                onRead={(text) => scan(text)}
              />
            ) : (
              <div className="simulator">
                <div className="simulator-target">
                  <div className="scan-corners" />
                  <ScanLine
                    size={64}
                    strokeWidth={1}
                    className="text-brand-primary"
                  />
                  <div className="text-label-sm text-text-secondary mt-xl">
                    Mô phỏng lượt quét tại cổng
                  </div>
                  <div className="scanner-line" />
                </div>
                <SelectField
                  label="Nhân viên trải nghiệm"
                  value={selected}
                  onChange={setSelected}
                  options={db.employees.map((e) => ({
                    value: e.id,
                    label: `${e.code} · ${e.name} · ${sites[e.site]}`,
                  }))}
                />
                <Button
                  className="w-full mt-lg"
                  iconStart={<ScanLine size={16} />}
                  disabled={scanning}
                  onClick={() => simulate("valid")}
                >
                  {scanning ? "Đang xác thực…" : "Mô phỏng quét QR"}
                </Button>
                <div className="demo-scenarios">
                  <span className="text-video-title text-text-secondary">
                    THỬ CÁC TÌNH HUỐNG
                  </span>
                  <div className="flex flex-wrap gap-md mt-md">
                    {[
                      ["expired", "QR hết hạn"],
                      ["locked", "QR đã khóa"],
                      ["wrong", "Sai nhà máy"],
                      ["invalid", "Mã không hợp lệ"],
                    ].map(([id, label]) => (
                      <Button
                        key={id}
                        size="small"
                        variant="neutral"
                        disabled={scanning}
                        onClick={() => simulate(id)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="payload-input">
                  <InputField
                    value={payload}
                    onChange={setPayload}
                    label="Hoặc dán payload từ ứng dụng nhân viên"
                    placeholder="tmc-access:v1:…"
                  />
                  <Button
                    variant="neutral"
                    size="small"
                    disabled={!payload.trim() || scanning}
                    onClick={() => scan(payload)}
                  >
                    Xác thực payload
                  </Button>
                </div>
              </div>
            )}
            <div className="kiosk-security-note">
              <ShieldCheck size={16} />
              <span>
                Mã QR có hiệu lực 60 giây · Mỗi lượt quét cách nhau tối thiểu 30
                giây
              </span>
            </div>
          </Card>
          <div className="kiosk-side">
            <Card
              className={`kiosk-result ${
                result
                  ? result.allowed
                    ? "result-success"
                    : "result-error"
                  : ""
              }`}
              aria-live="polite"
            >
              {result ? (
                <>
                  <div className="result-symbol">
                    {result.allowed ? <Check size={32} /> : <X size={32} />}
                  </div>
                  <Title level={2}>
                    {result.allowed
                      ? result.event.direction === "ENTRY"
                        ? "Cho phép vào nhà máy"
                        : "Cho phép ra nhà máy"
                      : "Chưa thể xác thực"}
                  </Title>
                  <div className="text-label-sm text-text-secondary">
                    {result.reason}
                    {result.allowed && <p className="mt-lg">Kết quả mô phỏng cấp quyền, chưa xác nhận người đã qua cổng. Chỉ ghi công khi có bằng chứng qua cổng hợp lệ.</p>}
                  </div>
                  {result.employee && (
                    <Person
                      name={result.employee.name}
                      code={result.employee.code}
                    />
                  )}
                  <div className="text-video-title text-text-secondary">
                    {formatTime(result.event.time)} · {sites[result.event.site]}
                  </div>
                  <div className="flex gap-md flex-wrap justify-center">
                    <Button
                      size="small"
                      variant="neutral"
                      iconStart={<RefreshCw size={16} />}
                      onClick={() => setResult(null)}
                    >
                      Lượt tiếp theo
                    </Button>
                    {override && (
                      <Button
                        size="small"
                        variant="neutral"
                        onClick={() => {
                          setReason("")
                          setManual(true)
                        }}
                      >
                        Xác nhận thủ công
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="result-symbol">
                    <ShieldCheck size={32} />
                  </div>
                  <Title level={2}>Sẵn sàng đón bạn</Title>
                  <div className="text-label-sm text-text-secondary">
                    Kết quả xác thực sẽ hiển thị tại đây.
                    <br />
                    Vui lòng chuẩn bị mã QR cá nhân.
                  </div>
                  <Badge
                    label={
                      device?.online
                        ? "Cổng đang hoạt động"
                        : "Cổng đang ngoại tuyến"
                    }
                    variant={device?.online ? "success" : "warning"}
                  />
                </>
              )}
            </Card>
            <Card>
              <div className="card-heading">
                <Title level={3}>Lượt quét gần đây</Title>
                <Badge label={`${events.length} lượt`} />
              </div>
              <div className="kiosk-event-list">
                {events.map((e) => (
                  <div className="kiosk-event" key={e.id}>
                    <span
                      className={`event-dot ${e.allowed ? "" : "denied"}`}
                    />
                    <div className="flex-1">
                      <div className="text-label-sm">
                        {db.employees.find((p) => p.id === e.employeeId)
                          ?.name || "Không xác định"}
                      </div>
                      <div className="text-video-title text-text-secondary mt-xs">
                        {e.allowed
                          ? `${e.direction === "ENTRY" ? "Vào" : "Ra"} nhà máy`
                          : e.reason}
                      </div>
                    </div>
                    <span className="text-video-title text-text-secondary">
                      {formatTime(e.time)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        <div className="text-video-title text-text-secondary text-center mt-2xl">
          TMC Access · Hệ thống trình diễn, QR không có chữ ký bảo mật thực · Dữ
          liệu lưu cục bộ
        </div>
      </main>
      <Modal
        isOpen={manual}
        onClose={() => setManual(false)}
        title="Xác nhận thủ công tại cổng"
        footer={
          <>
            <Button variant="neutral" onClick={() => setManual(false)}>
              Hủy
            </Button>
            <Button
              disabled={reason.trim().length < 5 || scanning}
              onClick={async () => {
                await scan(lastPayload.current, reason.trim())
                setManual(false)
              }}
            >
              Xác nhận & ghi nhật ký
            </Button>
          </>
        }
      >
        <TextareaField
          label="Lý do xác nhận"
          placeholder="Nhập lý do xác thực thủ công (tối thiểu 5 ký tự)"
          value={reason}
          onChange={setReason}
        />
        <div className="text-video-title text-text-secondary mt-lg">
          Tên người vận hành và lý do được lưu vào nhật ký ra vào.
        </div>
      </Modal>
    </div>
  )
}

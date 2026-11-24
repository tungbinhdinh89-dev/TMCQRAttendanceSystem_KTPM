import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Alert, Button, Chip, CircularProgress, MenuItem, TextField } from "@mui/material"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Card, PageHeader } from "../../components/ui"
import { scannerApi, ScannerError, type ScanResult, type ScanStation } from "../../data/scanner"
import "./scanner.css"
import { useAuthenticatedNavigationGuard } from "../../lib/authenticated-navigation"

type Pending = { stationId: string; eventId: string; token: string }
const reasons: Record<string, string> = {
  QR_ACCESS_DENIED: "Nhân viên chưa có quyền ra/vào nhà máy này.", EMPLOYEE_ASSIGNMENT_REQUIRED: "Nhân viên chưa có phân công tổ chức đang hiệu lực.",
  QR_MALFORMED: "Không đọc được QR hợp lệ của hệ thống.", QR_SIGNATURE_INVALID: "Chữ ký QR không hợp lệ.", QR_CLAIMS_INVALID: "Nội dung QR không hợp lệ.", QR_CREDENTIAL_REVOKED: "QR đã bị thu hồi hoặc cấp lại.", QR_TOKEN_REVOKED: "QR đã bị thu hồi.", QR_EMPLOYEE_INACTIVE: "Nhân viên đã ngừng hoạt động.", QR_ACCESS_REVOKED: "Nhân viên chưa có quyền vào nhà máy này.", ACCESS_GRANT_REQUIRED: "Nhân viên chưa có quyền vào nhà máy này.", ACCESS_DENIED: "Nhân viên không có quyền tại nhà máy này.", DEMO_DUPLICATE_SCAN: "Lượt này đã được ghi nhận gần đây.",
}
export default function Scanner() {
  const navigate = useNavigate()
  const [stations, setStations] = useState<ScanStation[]>([])
  const [stationId, setStationId] = useState("")
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hasPending, setHasPending] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [manual, setManual] = useState("")
  const [revision, setRevision] = useState(0)
  const mounted = useRef(true)
  const camera = useRef<Html5Qrcode | null>(null)
  const startingPromise = useRef<Promise<unknown> | null>(null)
  const stoppingPromise = useRef<Promise<void> | null>(null)
  const requestController = useRef<AbortController | null>(null)
  const inFlight = useRef(false)
  const sourceBusy = useRef(false)
  const pending = useRef<Pending | null>(null)
  useAuthenticatedNavigationGuard(() => {
    if (!pending.current) return true
    setError("Còn lượt chưa rõ kết quả. Kiểm tra lại hoặc bỏ trạng thái chờ trước khi rời trang hay đăng xuất.")
    return false
  })
  const stationRef = useRef(stationId)
  stationRef.current = stationId
  const selected = stations.find(s => s.id === stationId)
  const blocked = loading || busy || starting || scanning || hasPending
  function reveal(selector: string) {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    document.querySelector(selector)?.scrollIntoView({ behavior, block: "center" })
  }
  useEffect(() => {
    if (result) reveal(".scanner-result")
    else if (hasPending) reveal(".scanner-pending")
  }, [result, hasPending])
  useEffect(() => {
    if (!scanning || hasPending) return
    const timer = window.setTimeout(() => setNotice("Chưa đọc được QR. Giữ toàn bộ mã và viền trắng trong khung hình, đưa điện thoại ra xa một chút, tăng sáng màn hình hoặc thử Chụp / chọn ảnh QR."), 8000)
    return () => clearTimeout(timer)
  }, [scanning, hasPending])
  async function stopCamera() {
    if (stoppingPromise.current) return stoppingPromise.current
    stoppingPromise.current = (async () => {
      try { await startingPromise.current } catch { /* Start permission may have failed. */ }
      const current = camera.current
      if (current) {
        try { if (current.isScanning) await current.stop() } catch { /* Track already stopped. */ }
        try { current.clear() } catch { /* Element may be unmounted. */ }
        if (camera.current === current) camera.current = null
      }
      if (mounted.current) { setScanning(false); setStarting(false) }
    })().finally(() => { stoppingPromise.current = null })
    return stoppingPromise.current
  }
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("")
    scannerApi.stations(controller.signal).then(items => { if (!controller.signal.aborted) { setStations(items); setStationId(id => items.some(s => s.id === id) ? id : items[0]?.id || "") } }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không thể tải trạm.") }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    mounted.current = true
    const hidden = () => { if (document.hidden) void stopCamera() }
    const leaving = (event: BeforeUnloadEvent) => { if (pending.current) { event.preventDefault(); event.returnValue = "" } }
    document.addEventListener("visibilitychange", hidden); window.addEventListener("beforeunload", leaving)
    return () => { mounted.current = false; document.removeEventListener("visibilitychange", hidden); window.removeEventListener("beforeunload", leaving); requestController.current?.abort(); pending.current = null; void stopCamera() }
  }, [])
  async function sendCurrent() {
    const attempt = pending.current
    if (!attempt || inFlight.current) return
    inFlight.current = true; setBusy(true); setError(""); setNotice("")
    const controller = new AbortController(); requestController.current = controller
    const timer = window.setTimeout(() => controller.abort(), 15000)
    try {
      const response = await scannerApi.scan(attempt.stationId, { eventId: attempt.eventId, token: attempt.token }, controller.signal)
      if (!mounted.current) return
      if (response.eventId !== attempt.eventId) throw new Error("Unexpected event response")
      setResult(response); pending.current = null; setHasPending(false)
    } catch (e) {
      if (!mounted.current) return
      setError(e instanceof ScannerError ? e.message : "Chưa xác định máy chủ đã ghi nhận hay chưa. Không quét lại; dùng Kiểm tra / gửi lại cùng lượt để tránh ghi trùng.")
    } finally { clearTimeout(timer); inFlight.current = false; if (mounted.current) setBusy(false) }
  }
  async function accept(token: string, targetStation = stationRef.current) {
    if (!mounted.current || pending.current || inFlight.current || !targetStation || !token.trim()) return
    if (!window.isSecureContext || typeof crypto.randomUUID !== "function") { setError("Cần mở scanner bằng HTTPS tin cậy trước khi gửi QR. Không dùng HTTP qua địa chỉ LAN."); return }
    pending.current = { stationId: targetStation, eventId: crypto.randomUUID(), token: token.trim() }
    setHasPending(true); setResult(null); setManual(""); setError("")
    await stopCamera()
    if (mounted.current) await sendCurrent()
  }
  async function startCamera() {
    if (!stationId || pending.current || inFlight.current || sourceBusy.current || startingPromise.current) return
    setError(""); setNotice(""); setResult(null)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setError("Camera trực tiếp cần HTTPS được iPhone tin cậy. Mở địa chỉ HTTPS của máy chủ và cho phép camera trong Safari; localhost chỉ dùng trên chính máy tính."); return }
    reveal("#web-scanner-camera")
    sourceBusy.current = true; setStarting(true)
    try {
      await stopCamera()
      if (!mounted.current || document.hidden) return
      setStarting(true)
      const current = new Html5Qrcode("web-scanner-camera", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false })
      camera.current = current
      const targetStation = stationRef.current
      const started = current.start({ facingMode: "environment" }, { fps: 8, videoConstraints: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } }, text => { void accept(text, targetStation) }, () => {})
      startingPromise.current = started
      await started
      if (!mounted.current || document.hidden || pending.current) { void stopCamera(); return }
      const video = document.querySelector<HTMLVideoElement>("#web-scanner-camera video"); video?.setAttribute("playsinline", "true")
      setScanning(true)
    } catch {
      if (mounted.current) setError("Chưa mở được camera. Kiểm tra quyền Camera của Safari, đóng ứng dụng đang dùng camera rồi thử lại. Có thể chọn ảnh QR bên dưới.")
      void stopCamera()
    } finally { sourceBusy.current = false; startingPromise.current = null; if (mounted.current) setStarting(false) }
  }
  async function fromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""
    if (!file || pending.current || inFlight.current || sourceBusy.current || !stationId) return
    if (file.size > 10 * 1024 * 1024) { setError("Ảnh cần nhỏ hơn 10 MB."); return }
    const targetStation = stationId
    sourceBusy.current = true; setError(""); setStarting(true)
    try {
      await stopCamera()
      if (!mounted.current) return
      setStarting(true)
      const reader = new Html5Qrcode("web-scanner-camera", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false })
      camera.current = reader
      const text = await reader.scanFile(file, false)
      if (mounted.current) await accept(text, targetStation)
    } catch { if (mounted.current) setError("Không đọc được QR trong ảnh. Chụp rõ toàn bộ mã, tránh chói màn hình và thử lại.") }
    finally { sourceBusy.current = false; if (mounted.current) setStarting(false) }
  }
  function next() { setResult(null); setError(""); setNotice(""); void startCamera() }
  function discardPending() {
    if (!window.confirm("Lượt quét có thể đã được máy chủ ghi nhận. Bỏ kiểm tra không huỷ bản ghi trên máy chủ. Vẫn bỏ lượt đang chờ?")) return
    pending.current = null; setHasPending(false); setResult(null); setError(""); setNotice("Đã bỏ trạng thái chờ trên điện thoại. Không coi đây là huỷ chấm công đã lưu; kiểm tra dữ liệu trước khi quét lại.")
  }
  function manualSubmit(event: FormEvent) { event.preventDefault(); void accept(manual) }
  const recorded = result?.decision === "ALLOW" && ["RECORDED", "ALREADY_RECORDED"].includes(result.attendanceState) && !!result.attendanceEventId
  return <main className="scanner-page">
    <PageHeader title="Quét QR chấm công" description="Dùng iPhone quét QR nhân viên hiển thị trên máy tính. Hướng vào/ra lấy từ trạm đã chọn." />
    <div className="scanner-stack">
      <Alert severity="info">Mô phỏng bài assignment. Dữ liệu được lưu với bằng chứng DEMO_QR_SCAN, không xác nhận đi qua cổng vật lý.</Alert>
      {error && <Alert severity="error" role="alert">{error}</Alert>}{notice && <Alert severity="warning" role="status">{notice}</Alert>}
      <Card><div className="scanner-stack">
        {loading ? <CircularProgress aria-label="Tải trạm quét" /> : !stations.length ? <Alert severity="warning" action={<Button onClick={() => setRevision(v => v + 1)}>Tải lại</Button>}>Chưa có trạm hoạt động trong phạm vi SEC. Nhờ ADM tạo trạm IN và OUT.</Alert> : <>
          <TextField select fullWidth label="Trạm quét" value={stationId} onChange={e => { setStationId(e.target.value); setResult(null); setError("") }} disabled={blocked}>{stations.map(s => <MenuItem key={s.id} value={s.id}>{s.code} · {s.direction === "IN" ? "VÀO" : "RA"} · {s.factoryName}</MenuItem>)}</TextField>
          {selected && <div className="scanner-station"><span>{selected.factoryName} · {selected.code}</span><Chip color={selected.direction === "IN" ? "primary" : "secondary"} label={selected.direction === "IN" ? "IN · Ghi nhận VÀO" : "OUT · Ghi nhận RA"} /></div>}
        </>}
        <div><div id="web-scanner-camera" className="scanner-camera" />{!scanning && !starting && <p className="scanner-camera-idle">Đưa QR trên màn hình máy tính vào camera sau. Camera dừng sau mỗi lượt để tránh quét liên tiếp.</p>}</div>
        {scanning && !hasPending && <Alert severity="info" role="status">Camera đang dò mã QR. Giữ toàn bộ mã và viền trắng trong khung hình.</Alert>}
        <div className="scanner-actions"><Button variant="contained" disabled={!selected || blocked || !!result} onClick={() => void startCamera()}>{starting ? "Đang mở camera…" : "Mở camera quét QR"}</Button><Button disabled={!scanning && !starting} onClick={() => void stopCamera()}>Dừng camera</Button></div>
        {hasPending && <Alert className="scanner-pending" severity="warning"><strong>{busy ? "Đang gửi lượt quét…" : "Chưa xác nhận kết quả lượt quét"}</strong><p>Giữ nguyên trạm và mã sự kiện. Gửi lại cùng lượt không tạo bản chấm công thứ hai.</p><div className="scanner-actions"><Button variant="contained" disabled={busy} onClick={() => void sendCurrent()}>Kiểm tra / gửi lại cùng lượt</Button><Button disabled={busy} onClick={discardPending}>Bỏ trạng thái chờ</Button></div></Alert>}
        {result && <div className="scanner-result" role="status" aria-live="polite"><Alert severity={recorded ? result.duplicate || result.attendanceState === "ALREADY_RECORDED" ? "info" : "success" : "error"}><strong>{recorded ? result.duplicate || result.attendanceState === "ALREADY_RECORDED" ? "Lượt đã được ghi nhận trước đó" : "Đã ghi chấm công mô phỏng" : "Từ chối · chưa ghi chấm công"}</strong></Alert><dl>{result.employee && <><dt>Nhân viên</dt><dd>{result.employee.fullName} · {result.employee.employeeCode}</dd></>}<dt>Hướng</dt><dd>{result.direction === "IN" ? "IN · Vào" : "OUT · Ra"}</dd><dt>Thời gian máy chủ</dt><dd>{new Date(result.occurredAt).toLocaleString("vi-VN")}</dd>{result.reasonCode && <><dt>Kết quả</dt><dd>{reasons[result.reasonCode] || "Mã hoặc quyền truy cập không hợp lệ. Kiểm tra trạng thái nhân viên, QR và quyền nhà máy."}</dd></>}</dl><Button variant="contained" onClick={next} disabled={busy}>Quét nhân viên tiếp theo</Button></div>}
        <details className="scanner-fallback"><summary>Quét từ ảnh hoặc kiểm tra bằng mã</summary><div className="scanner-stack"><Button component="label" variant="outlined" disabled={!selected || blocked || !!result}>Chụp / chọn ảnh QR<input hidden type="file" accept="image/*" capture="environment" onChange={e => void fromFile(e)} /></Button><form onSubmit={manualSubmit}><TextField type="password" label="Payload QR để kiểm tra" autoComplete="off" value={manual} onChange={e => setManual(e.target.value)} disabled={!selected || blocked || !!result} helperText="Chỉ giữ trong bộ nhớ của trang, không lưu vào trình duyệt." /><Button type="submit" disabled={!selected || blocked || !!result || !manual.trim()}>Gửi mã kiểm tra</Button></form></div></details>
      </div></Card>
      <p className="scanner-note">Không đổi hướng tự động theo lần quét trước. Muốn quét VÀO/RA hãy dừng camera, chọn trạm IN/OUT tương ứng. QR nhân viên mở tại /qr trên máy tính; iPhone dùng tài khoản SEC tại /scanner.</p>
    </div>
  </main>
}

import { Button } from "@figma/astraui"
import { useNavigate } from "react-router-dom"
import { useApp, useAccount } from "../../app/context"
import { Brand, Card, Title, InfoRow, Empty } from "../../components/ui"
import { formatTime, formatDate } from "../../lib/date"
export default function Mobile() {
 const { db, logout } = useApp(), account = useAccount(), navigate = useNavigate()
 return <main className="mobile-content"><Brand /><Card className="mt-xl"><Title>Xin chào, {account.name}</Title><InfoRow label="Tài khoản">{account.username}</InfoRow><p className="mt-xl">Mã QR: chưa có API cấp mã bảo mật. Ứng dụng không tự sinh mã thay thế.</p></Card>
 <Card className="mt-xl"><Title level={2}>Lịch sử lượt quét của tôi</Title>{db.events.length ? db.events.map(event => <div className="info-row" key={event.id}><span>{formatDate(event.time)} {formatTime(event.time)}</span><span>{event.allowed ? "Được cấp quyền" : "Chưa được cấp quyền"}</span></div>) : <Empty title="Chưa có lượt quét" description="Lịch sử được lấy từ máy chủ. Cấp quyền truy cập không đồng nghĩa đã qua cổng." />}</Card>
 <Button className="mt-xl" variant="neutral" onClick={async () => { if (await logout()) navigate("/dang-nhap") }}>Đăng xuất</Button></main>
}

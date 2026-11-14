import { Button } from "@figma/astraui"
import { useNavigate } from "react-router-dom"
import { Brand, Card, Title } from "../../components/ui"
export default function Kiosk() {
 const navigate = useNavigate()
 return <div className="app-loading"><Brand /><Card><Title>Trạm kiểm soát ra vào</Title><p className="mt-xl">Chưa kết nối API quét QR và điều khiển cổng.</p><p className="text-label-sm text-text-secondary mt-lg">Không tự sinh mã, không mở cổng và không ghi nhận chấm công trong trình duyệt. Chỉ vận hành khi tích hợp máy chủ và thiết bị đã sẵn sàng.</p><Button disabled className="mt-xl">Quét QR chưa khả dụng</Button><Button variant="neutral" onClick={() => navigate("/app/kiem-soat")}>Quay lại</Button></Card></div>
}

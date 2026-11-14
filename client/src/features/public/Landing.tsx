import { useNavigate } from "react-router-dom"
import { Button } from "@figma/astraui"
import { Brand, Card, Title } from "../../components/ui"
export default function Landing() {
 const navigate = useNavigate()
 return <div className="app-loading"><Brand /><Card><Title>TMC Access</Title><p className="mt-xl mb-xl">Quản lý truy cập và chấm công tại TMC Manufacturing.</p><p className="text-label-sm text-text-secondary mb-xl">Đăng nhập bằng tài khoản được cấp để xem dữ liệu trong phạm vi của bạn.</p><Button onClick={() => navigate("/dang-nhap")}>Đăng nhập</Button></Card></div>
}

import { useApp } from "../../app/context"
import { Card, PageHeader, DataTable } from "../../components/ui"
import { formatDate, formatTime } from "../../lib/date"
export default function Attendance() {
 const { db } = useApp()
 return <><PageHeader title="Sự kiện chấm công" description="Chỉ hiển thị sự kiện có bằng chứng hợp lệ từ máy chủ. Lượt quét được cho phép không tự tạo công." /><Card><DataTable rows={db.confirmedEvents ?? []} columns={[{label:"Nhân viên",render:r=>db.employees.find(e=>e.id===r.employeeId)?.name ?? r.employeeId},{label:"Thời điểm",render:r=>`${formatDate(r.time)} ${formatTime(r.time)}`},{label:"Chiều",render:r=>r.direction==='IN'?'Vào':'Ra'}]} /><p className="text-label-sm text-text-secondary mt-xl">Ghép ca, tính công theo ngày và hiệu chỉnh chưa có API. Không tạo dữ liệu thay thế trong trình duyệt.</p></Card></>
}

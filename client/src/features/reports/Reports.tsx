import { useApp } from "../../app/context"
import { Card, PageHeader, InfoRow } from "../../components/ui"
export default function Reports() {
 const { db } = useApp()
 return <><PageHeader title="Báo cáo" description="Số liệu thực trong phạm vi được phân quyền, không tự tính dữ liệu công từ lượt quét." /><Card><InfoRow label="Số hồ sơ trong phạm vi">{db.summary?.employees ?? db.employees.length}</InfoRow><InfoRow label="Sự kiện chấm công có bằng chứng">{db.summary?.confirmedAttendance ?? 0}</InfoRow><p className="mt-xl text-label-sm">Báo cáo công theo tháng và xuất HRS chưa có API. Không xuất file tính công giả.</p></Card></>
}

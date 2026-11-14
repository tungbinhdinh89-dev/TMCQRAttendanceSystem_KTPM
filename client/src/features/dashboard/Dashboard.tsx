import { useApp, useAccount } from "../../app/context"
import { Card, PageHeader, DataTable, Empty, InfoRow } from "../../components/ui"
import { roleLabels } from "../../lib/rbac"
import { sites } from "../../data/types"
export default function Dashboard() {
 const { db } = useApp(), account = useAccount()
 return <><PageHeader title="Tổng quan" description={`${account.name} · ${roleLabels[account.role]} · Dữ liệu từ máy chủ`} />
 <Card><InfoRow label="Hồ sơ trong phạm vi">{db.summary?.employees ?? db.employees.length}</InfoRow><InfoRow label="Sự kiện chấm công đã xác nhận">{db.summary?.confirmedAttendance ?? 0}</InfoRow><p className="text-label-sm text-text-secondary mt-xl">Số sự kiện không phải số ngày công hoặc số người có mặt. Chưa có API ghép ca và tính công theo ngày.</p></Card>
 <Card className="mt-xl">{account.role === "EXECUTIVE" ? <Empty title="Chế độ báo cáo tổng hợp" description="Phiên này chỉ nhận số liệu tổng hợp, không nhận hồ sơ nhân viên." /> : <DataTable rows={db.employees} columns={[{label:"Mã nhân viên",render:r=>r.code},{label:"Họ và tên",render:r=>r.name},{label:"Nhà máy",render:r=>sites[r.site]},{label:"Bộ phận",render:r=>r.department}]} />}</Card></>
}

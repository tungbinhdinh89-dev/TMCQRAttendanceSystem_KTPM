import { Users, ShieldCheck, Clock } from "lucide-react"
import { useAccount, useApp } from "../../app/context"
import { Card, PageHeader, StatCard, Title } from "../../components/ui"
import { scopeEmployees } from "../../lib/rbac"
import { sites } from "../../data/types"

export default function ExecutiveOverview() {
  const { db } = useApp()
  const account = useAccount()
  const employees = scopeEmployees(db, account)
  const ids = new Set(employees.map(employee => employee.id))
  const events = db.events.filter(event => ids.has(event.employeeId))
  const records = db.attendance.filter(record => ids.has(record.employeeId))
  return (
    <div>
      <PageHeader title="Tổng hợp điều hành" description={`Phạm vi: ${account.scopeType === "GLOBAL" ? "Toàn công ty" : sites[account.site]}. Chỉ hiển thị số liệu tổng hợp.`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <StatCard label="Nhân viên đang hoạt động" value={employees.filter(employee => employee.status === "active").length} note="Trong phạm vi được cấp" icon={<Users size={20} />} />
        <StatCard label="Lượt truy cập" value={events.length} note="Dữ liệu demo hiện có" icon={<ShieldCheck size={20} />} />
        <StatCard label="Bản ghi công" value={records.length} note="Không tính lương" icon={<Clock size={20} />} />
      </div>
      <Card className="mt-xl">
        <Title level={3}>Phạm vi báo cáo</Title>
        <p className="text-label-sm text-text-secondary mt-md">Vai trò EXE không có danh sách công cá nhân, nút hiệu chỉnh hoặc quyền điều khiển cổng. Dữ liệu công/cổng ghi từ UI vẫn là mô phỏng cho đến khi các API nghiệp vụ tương ứng được triển khai.</p>
      </Card>
    </div>
  )
}

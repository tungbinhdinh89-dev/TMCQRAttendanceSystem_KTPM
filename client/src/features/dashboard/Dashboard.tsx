import { Button, Badge } from "@figma/astraui"
import {
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  Download,
  AlertTriangle,
  ScanLine,
  Calendar,
  Building2,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useNavigate } from "react-router-dom"
import { useApp, useAccount } from "../../app/context"
import {
  Card,
  PageHeader,
  Title,
  StatCard,
  Person,
  Status,
  DataTable,
} from "../../components/ui"
import { scopeEmployees, hasAccess } from "../../lib/rbac"
import { formatDate, formatTime, today } from "../../lib/date"
import { sites, attendanceLabels } from "../../data/types"
import { exportCsv } from "../../lib/csv"
import ExecutiveOverview from "../reports/ExecutiveOverview"

interface ChartPoint {
  day: string
  present: number
  late: number
}
export function AttendanceChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 16, right: 12, left: -24, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border-secondary)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--text-secondary)",
              fontSize: "calc(var(--font-size) * .75)",
            }}
            dy={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--text-secondary)",
              fontSize: "calc(var(--font-size) * .75)",
            }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-bg)",
              borderColor: "var(--border-primary)",
              borderRadius: "var(--corner-md)",
              fontFamily: "inherit",
            }}
            labelStyle={{ color: "var(--text-primary)" }}
          />
          <Area
            type="monotone"
            dataKey="present"
            name="Có mặt"
            stroke="var(--brand-primary)"
            fill="var(--brand-primary)"
            fillOpacity={0.08}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="late"
            name="Đi muộn"
            stroke="var(--brand-muted)"
            fill="var(--brand-muted)"
            fillOpacity={0.04}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
export default function Dashboard() {
  const account = useAccount()
  return account.role === "EXECUTIVE" ? <ExecutiveOverview /> : <DetailedDashboard />
}
function DetailedDashboard() {
  const { db } = useApp(),
    account = useAccount(),
    navigate = useNavigate()
  const employees = scopeEmployees(db, account)
  const ids = new Set(employees.map((e) => e.id))
  const attendance = db.attendance.filter((a) => ids.has(a.employeeId))
  const current = attendance.filter((a) => a.date === today())
  const present = current.filter((a) => a.checkIn).length
  const late = current.filter((a) => a.status === "late").length
  const absent = current.filter((a) => a.status === "absent").length
  const active = current.filter((a) => a.checkIn && !a.checkOut).length
  const days = [...new Set(attendance.map((a) => a.date))].sort().slice(-7)
  const chart = days.map((date) => ({
    day: formatDate(date).slice(0, 5),
    present: attendance.filter((a) => a.date === date && a.checkIn).length,
    late: attendance.filter((a) => a.date === date && a.status === "late")
      .length,
  }))
  const events = db.events
    .filter((e) => ids.has(e.employeeId))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const download = () =>
    exportCsv(
      `tong-quan-${today()}.csv`,
      ["Nhân viên", "Ngày", "Giờ vào", "Giờ ra", "Trạng thái"],
      current.map((a) => [
        employees.find((e) => e.id === a.employeeId)?.name ?? "",
        a.date,
        a.checkIn,
        a.checkOut,
        attendanceLabels[a.status],
      ]),
    )
  return (
    <>
      <PageHeader
        title={`Chào ${account.name.split(" ").slice(-2).join(" ")}, một ngày tốt lành!`}
        description={`Đây là tình hình vận hành hôm nay, ${formatDate(today())}.`}
      >
        <Button
          variant="neutral"
          iconStart={<Download size={16} />}
          onClick={download}
        >
          Xuất báo cáo
        </Button>
      </PageHeader>
      <div className="dashboard-welcome">
        <div>
          <Badge label="KHÔNG GIAN VẬN HÀNH TMC" variant="brand" />
          <Title level={2} className="mt-lg">
            Mỗi kết nối đều được ghi nhận.
          </Title>
          <div className="text-label-sm text-text-secondary mt-md">
            Nắm bắt ca làm, theo dõi ra vào và đồng hành cùng đội ngũ của bạn.
          </div>
          <div className="text-video-title text-text-secondary mt-xl flex items-center gap-md">
            <Building2 size={16} />
            {account.role === "DEPARTMENT_MANAGER"
              ? `${account.department} · ${sites[account.site]}`
              : "Bình Dương & Long An"}
            <span className="tiny-dot" />
            {employees.length} hồ sơ mẫu · Quy mô thực tế 1.400 nhân viên
          </div>
        </div>
        <div className="welcome-graphic">
          <div className="graphic-circle">
            <ShieldCheck size={48} strokeWidth={1} />
          </div>
          <div className="graphic-tag">
            <span className="live-dot" />
            Tất cả trong tầm kiểm soát
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Nhân viên có mặt"
          value={present}
          note={`${Math.round((present / (employees.length || 1)) * 100)}% tổng nhân viên mẫu`}
          icon={<Users size={20} />}
          good
        />
        <StatCard
          label="Đang trong nhà máy"
          value={active}
          note="Đã vào, chưa ghi nhận ra"
          icon={<ShieldCheck size={20} />}
        />
        <StatCard
          label="Đi muộn hôm nay"
          value={late}
          note="Theo ngưỡng từng ca làm"
          icon={<Clock size={20} />}
        />
        <StatCard
          label="Vắng mặt"
          value={absent}
          note={`${current.filter((a) => a.status === "leave").length} nhân viên nghỉ phép`}
          icon={<Calendar size={20} />}
        />
      </div>
      <div className="dashboard-middle">
        <Card>
          <div className="card-heading">
            <div>
              <Title level={3}>Xu hướng chấm công</Title>
              <div className="text-video-title text-text-secondary mt-xs">
                Tình hình có mặt trong 7 ngày gần nhất
              </div>
            </div>
            <Badge label="7 ngày qua" variant="default" />
          </div>
          <AttendanceChart data={chart} />
          <div className="chart-legend">
            <span>
              <i className="legend-brand" />
              Có mặt
            </span>
            <span>
              <i className="legend-muted" />
              Đi muộn
            </span>
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <Title level={3}>Tình hình nhà máy</Title>
            <Building2 size={20} className="text-text-secondary" />
          </div>
          <div className="site-summary-list">
            {(["bd", "la"] as const).map((site) => {
              const siteEmployees = employees.filter((e) => e.site === site)
              const checked = current.filter(
                (a) =>
                  a.checkIn && siteEmployees.some((e) => e.id === a.employeeId),
              ).length
              return (
                <div key={site} className="site-summary">
                  <div className="flex justify-between gap-md">
                    <div>
                      <div className="text-label-sm font-semibold">
                        {sites[site]}
                      </div>
                      <div className="text-video-title text-text-secondary mt-xs">
                        {checked}/{siteEmployees.length} nhân viên có mặt
                      </div>
                    </div>
                    <Badge
                      label={`${Math.round((checked / (siteEmployees.length || 1)) * 100)}%`}
                      variant="brand"
                    />
                  </div>
                  <progress
                    className="site-progress"
                    value={checked}
                    max={siteEmployees.length || 1}
                  />
                  <div className="flex items-center gap-xs text-video-title text-text-secondary mt-md">
                    <span className="live-dot" />
                    {db.gates.filter((g) => g.site === site && g.online).length}
                    /2 cổng đang hoạt động
                  </div>
                </div>
              )
            })}
          </div>
          <div className="operating-note">
            <ShieldCheck size={20} />
            <div className="text-video-title">
              Dữ liệu cập nhật từ các lượt quét QR tại cổng và điều chỉnh đã
              duyệt.
            </div>
          </div>
        </Card>
      </div>
      <div className="dashboard-bottom">
        <Card>
          <div className="card-heading">
            <Title level={3}>Chấm công gần đây</Title>
            {hasAccess(account.role, "cham-cong") && (
              <Button
                variant="subtle"
                size="small"
                iconEnd={<ArrowRight size={16} />}
                onClick={() => navigate("/app/cham-cong")}
              >
                Xem tất cả
              </Button>
            )}
          </div>
          <DataTable
            rows={current.slice(0, 5)}
            pageSize={5}
            columns={[
              {
                label: "Nhân viên",
                render: (a) => {
                  const e = employees.find((e) => e.id === a.employeeId)!
                  return <Person name={e.name} code={e.code} />
                },
              },
              { label: "Giờ vào", render: (a) => a.checkIn || "—" },
              {
                label: "Trạng thái",
                render: (a) => <Status value={a.status} />,
              },
            ]}
          />
        </Card>
        <Card>
          <div className="card-heading">
            <Title level={3}>Điểm tin vận hành</Title>
            <Badge label="Hôm nay" />
          </div>
          <div className="activity-list">
            {events.slice(0, 4).map((e) => (
              <div className="activity-row" key={e.id}>
                <span
                  className={`activity-icon ${e.allowed ? "" : "is-warning"}`}
                >
                  {e.allowed ? (
                    <ScanLine size={16} />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                </span>
                <div>
                  <div className="text-label-sm">
                    {employees.find((p) => p.id === e.employeeId)?.name}
                  </div>
                  <div className="text-video-title text-text-secondary mt-xs">
                    {e.allowed
                      ? `Đã ${
                          e.direction === "ENTRY" ? "vào" : "ra"
                        } ${sites[e.site]}`
                      : e.reason}
                  </div>
                  <div className="text-video-title text-text-secondary mt-xs">
                    {formatTime(e.time)} · {formatDate(e.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

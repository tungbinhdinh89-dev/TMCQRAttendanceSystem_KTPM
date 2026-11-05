import { Button, SelectField, Badge } from "@figma/astraui"
import { Download, Users, Clock, ShieldCheck, BarChart3 } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { useApp, useAccount } from "../../app/context"
import {
  Card,
  PageHeader,
  Title,
  DateFilter,
  StatCard,
  DataTable,
} from "../../components/ui"
import { scopeEmployees } from "../../lib/rbac"
import { dayOf, formatDate, today } from "../../lib/date"
import { exportCsv } from "../../lib/csv"
import { departments, sites } from "../../data/types"
import ExecutiveOverview from "./ExecutiveOverview"
export default function Reports() {
  const account = useAccount()
  return account.role === "EXECUTIVE" ? <ExecutiveOverview /> : <DetailedReports />
}
function DetailedReports() {
  const { db, notify } = useApp(),
    account = useAccount(),
    [params, setParams] = useSearchParams()
  const days = [...new Set(db.attendance.map((a) => a.date))].sort()
  const start = params.get("start") || days[0] || today(),
    end = params.get("end") || today(),
    site = params.get("site") || "",
    department = params.get("department") || ""
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params)
    value ? p.set(key, value) : p.delete(key)
    setParams(p, { replace: true })
  }
  const employees = scopeEmployees(db, account).filter(
      (e) =>
        (!site || e.site === site) &&
        (!department || e.department === department),
    ),
    ids = new Set(employees.map((e) => e.id))
  const security = account.role === "SECURITY_MANAGER"
  const records = db.attendance.filter(
    (a) => ids.has(a.employeeId) && a.date >= start && a.date <= end,
  )
  const events = db.events.filter(
    (e) =>
      ids.has(e.employeeId) && dayOf(e.time) >= start && dayOf(e.time) <= end,
  )
  const chart = days
    .filter((date) => date >= start && date <= end)
    .map((date) => ({
      day: formatDate(date).slice(0, 5),
      total: security
        ? events.filter((e) => dayOf(e.time) === date && e.allowed).length
        : records.filter((a) => a.date === date && a.checkIn).length,
      attention: security
        ? events.filter((e) => dayOf(e.time) === date && !e.allowed).length
        : records.filter((a) => a.date === date && a.status === "late").length,
    }))
  const summary = departments
    .map((d, i) => {
      const team = new Set(
        employees.filter((e) => e.department === d).map((e) => e.id),
      )
      const data = records.filter((a) => team.has(a.employeeId))
      const log = events.filter((e) => team.has(e.employeeId))
      return {
        id: String(i),
        name: d,
        count: team.size,
        present: data.filter((a) => a.checkIn).length,
        late: data.filter((a) => a.status === "late").length,
        total: log.length,
        denied: log.filter((e) => !e.allowed).length,
      }
    })
    .filter((d) => d.count > 0)
  const download = () => {
    if (start > end) {
      notify("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.", true)
      return
    }
    if (security)
      exportCsv(
        `bao-cao-an-ninh-${start}-${end}.csv`,
        ["Phòng ban", "Nhân viên", "Lượt quét", "Từ chối"],
        summary.map((s) => [s.name, s.count, s.total, s.denied]),
      )
    else
      exportCsv(
        `bao-cao-cham-cong-${start}-${end}.csv`,
        ["Phòng ban", "Nhân viên", "Lượt có mặt", "Đi muộn"],
        summary.map((s) => [s.name, s.count, s.present, s.late]),
      )
    notify("Đã xuất báo cáo CSV theo bộ lọc.")
  }
  return (
    <>
      <PageHeader
        title="Báo cáo & thống kê"
        description={
          security
            ? "Góc nhìn tổng hợp về an ninh và luồng ra vào nhà máy."
            : "Biến dữ liệu vận hành thành những góc nhìn hữu ích."
        }
      >
        <Button iconStart={<Download size={16} />} onClick={download}>
          Xuất báo cáo CSV
        </Button>
      </PageHeader>
      <Card>
        <Title level={3} className="mb-xl">
          Phạm vi báo cáo
        </Title>
        <div className="filters-row">
          <DateFilter
            label="Từ ngày"
            value={start}
            onChange={(v) => set("start", v)}
          />
          <DateFilter
            label="Đến ngày"
            value={end}
            onChange={(v) => set("end", v)}
          />
          <SelectField
            value={site}
            onChange={(v) => set("site", v)}
            options={[
              { value: "", label: "Tất cả nhà máy" },
              ...Object.entries(sites).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <SelectField
            value={department}
            onChange={(v) => set("department", v)}
            options={[
              { value: "", label: "Tất cả phòng ban" },
              ...departments.map((d) => ({ value: d, label: d })),
            ]}
          />
        </div>
        {start > end && (
          <div className="text-label-sm text-danger" role="alert">
            Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
          </div>
        )}
      </Card>
      <div className="stats-grid mt-2xl">
        <StatCard
          label="Nhân viên trong phạm vi"
          value={employees.length}
          icon={<Users size={20} />}
          note="Hồ sơ mẫu theo phân quyền"
        />
        <StatCard
          label={security ? "Lượt xác thực" : "Lượt có mặt"}
          value={
            security ? events.length : records.filter((a) => a.checkIn).length
          }
          icon={<ShieldCheck size={20} />}
          note={`${formatDate(start)} – ${formatDate(end)}`}
        />
        <StatCard
          label={security ? "Lượt bị từ chối" : "Lượt đi muộn"}
          value={
            security
              ? events.filter((e) => !e.allowed).length
              : records.filter((a) => a.status === "late").length
          }
          icon={<Clock size={20} />}
          note="Cần theo dõi và đối soát"
        />
        <StatCard
          label={security ? "Tỷ lệ hợp lệ" : "Tỷ lệ có mặt"}
          value={`${Math.round((security ? events.filter((e) => e.allowed).length / (events.length || 1) : records.filter((a) => a.checkIn).length / (records.length || 1)) * 100)}%`}
          icon={<BarChart3 size={20} />}
          note="Tính trên dữ liệu đã ghi nhận"
          good
        />
      </div>
      <Card className="mt-2xl">
        <div className="card-heading">
          <Title level={3}>
            {security
              ? "Xu hướng xác thực tại cổng"
              : "Xu hướng có mặt theo ngày"}
          </Title>
          <Badge label="Theo bộ lọc" variant="brand" />
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ left: -24, top: 16, bottom: 12 }}>
              <CartesianGrid
                stroke="var(--border-secondary)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: "calc(var(--font-size) * .75)",
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{
                  fill: "var(--text-secondary)",
                  fontSize: "calc(var(--font-size) * .75)",
                }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-bg)",
                  borderColor: "var(--border-primary)",
                  borderRadius: "var(--corner-md)",
                }}
              />
              <Bar
                dataKey="total"
                name={security ? "Hợp lệ" : "Có mặt"}
                fill="var(--brand-primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
              <Bar
                dataKey="attention"
                name={security ? "Từ chối" : "Đi muộn"}
                fill="var(--brand-muted)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="mt-2xl">
        <Title level={3} className="mb-xl">
          Tổng hợp theo phòng ban
        </Title>
        <DataTable
          rows={summary}
          columns={
            security
              ? [
                  { label: "Phòng ban", render: (s) => s.name },
                  { label: "Nhân viên", render: (s) => s.count },
                  { label: "Lượt quét", render: (s) => s.total },
                  { label: "Từ chối", render: (s) => s.denied },
                ]
              : [
                  { label: "Phòng ban", render: (s) => s.name },
                  { label: "Nhân viên", render: (s) => s.count },
                  { label: "Lượt có mặt", render: (s) => s.present },
                  { label: "Đi muộn", render: (s) => s.late },
                ]
          }
        />
      </Card>
    </>
  )
}

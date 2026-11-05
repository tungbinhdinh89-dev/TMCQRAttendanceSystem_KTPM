import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Button,
  Badge,
  InputField,
  SelectField,
  IconButton,
  Tabs,
  SwitchField,
} from "@figma/astraui"
import {
  ScanLine,
  Search,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
} from "lucide-react"
import { useApp, useAccount } from "../../app/context"
import { scopeEmployees, hasAccess, canManage } from "../../lib/rbac"
import {
  Card,
  PageHeader,
  DataTable,
  Person,
  DetailDrawer,
  InfoRow,
  DateFilter,
  Title,
} from "../../components/ui"
import { sites } from "../../data/types"
import { formatDate, formatTime, today, dayOf } from "../../lib/date"
import { exportCsv } from "../../lib/csv"
import { api } from "../../data/api"
export default function Access() {
  const { db, run } = useApp(),
    account = useAccount(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams()
  const [detail, setDetail] = useState<string | null>(null)
  const date = params.get("date") || today(),
    query = params.get("q") || "",
    gate = params.get("gate") || "",
    state = params.get("state") || ""
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params)
    value ? p.set(key, value) : p.delete(key)
    setParams(p, { replace: true })
  }
  const employees = scopeEmployees(db, account),
    ids = new Set(employees.map((e) => e.id))
  const events = db.events
    .filter(
      (e) =>
        (ids.has(e.employeeId) ||
          (!e.employeeId && account.role !== "GATE_OPERATOR")) &&
        dayOf(e.time) === date &&
        (!gate || e.gate === gate) &&
        (!state || String(e.allowed) === state) &&
        (!query ||
          employees
            .find((p) => p.id === e.employeeId)
            ?.name.toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  const event = db.events.find((e) => e.id === detail),
    person = employees.find((e) => e.id === event?.employeeId)
  const gates = db.gates.filter(
    (g) => account.role !== "GATE_OPERATOR" || g.site === account.site,
  )
  return (
    <>
      <PageHeader
        title="Kiểm soát ra vào"
        description="Theo dõi từng lượt xác thực và giữ mọi điểm chạm trong tầm kiểm soát."
      >
        <Button
          variant="neutral"
          iconStart={<Download size={16} />}
          onClick={() =>
            exportCsv(
              `ra-vao-${date}.csv`,
              [
                "Nhân viên",
                "Thời gian",
                "Nhà máy",
                "Cổng",
                "Hướng",
                "Kết quả",
                "Lý do",
              ],
              events.map((e) => [
                employees.find((p) => p.id === e.employeeId)?.name ||
                  "Không xác định",
                e.time,
                sites[e.site],
                e.gate,
                e.direction === "ENTRY" ? "Vào" : "Ra",
                e.allowed ? "Cho phép" : "Từ chối",
                e.reason,
              ]),
            )
          }
        >
          Xuất nhật ký
        </Button>
        {hasAccess(account.role, "kiosk") && (
          <Button
            iconStart={<ScanLine size={16} />}
            onClick={() => navigate("/kiosk")}
          >
            Mở kiosk quét QR
          </Button>
        )}
      </PageHeader>
      <div className="access-totals">
        <Card>
          <span className="activity-icon">
            <ArrowDownLeft size={20} />
          </span>
          <div>
            <div className="text-title">
              {
                events.filter((e) => e.allowed && e.direction === "ENTRY")
                  .length
              }
            </div>
            <div className="text-label-sm text-text-secondary">
              Lượt vào hợp lệ
            </div>
          </div>
        </Card>
        <Card>
          <span className="activity-icon">
            <ArrowUpRight size={20} />
          </span>
          <div>
            <div className="text-title">
              {events.filter((e) => e.allowed && e.direction === "EXIT").length}
            </div>
            <div className="text-label-sm text-text-secondary">
              Lượt ra hợp lệ
            </div>
          </div>
        </Card>
        <Card>
          <span className="activity-icon is-warning">
            <ScanLine size={20} />
          </span>
          <div>
            <div className="text-title">
              {events.filter((e) => !e.allowed).length}
            </div>
            <div className="text-label-sm text-text-secondary">
              Lượt cần chú ý
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <Tabs
          tabs={[
            {
              id: "events",
              label: "Nhật ký ra vào",
              content: (
                <>
                  <div className="filters-row mt-xl">
                    <InputField
                      value={query}
                      onChange={(v) => set("q", v)}
                      placeholder="Tìm nhân viên…"
                      prefix={<Search size={16} />}
                    />
                    <DateFilter value={date} onChange={(v) => set("date", v)} />
                    <SelectField
                      value={gate}
                      onChange={(v) => set("gate", v)}
                      options={[
                        { value: "", label: "Tất cả cổng" },
                        ...gates.map((g) => ({ value: g.id, label: g.name })),
                      ]}
                    />
                    <SelectField
                      value={state}
                      onChange={(v) => set("state", v)}
                      options={[
                        { value: "", label: "Mọi kết quả" },
                        { value: "true", label: "Cho phép" },
                        { value: "false", label: "Từ chối" },
                      ]}
                    />
                    {params.size > 0 && (
                      <Button
                        variant="subtle"
                        size="small"
                        onClick={() => setParams({})}
                      >
                        Xóa lọc
                      </Button>
                    )}
                  </div>
                  <DataTable
                    rows={events}
                    columns={[
                      {
                        label: "Nhân viên",
                        render: (e) => {
                          const p = employees.find((p) => p.id === e.employeeId)
                          return p ? (
                            <Person name={p.name} code={p.code} />
                          ) : (
                            "Không xác định"
                          )
                        },
                      },
                      {
                        label: "Thời gian",
                        render: (e) => (
                          <div>
                            {formatTime(e.time)}
                            <div className="text-video-title text-text-secondary mt-xs">
                              {formatDate(e.time)}
                            </div>
                          </div>
                        ),
                      },
                      {
                        label: "Cổng",
                        render: (e) => (
                          <div>
                            {db.gates.find((g) => g.id === e.gate)?.name}
                            <div className="text-video-title text-text-secondary mt-xs">
                              {sites[e.site]}
                            </div>
                          </div>
                        ),
                      },
                      {
                        label: "Hướng",
                        render: (e) => (
                          <span className="flex gap-xs items-center">
                            {e.direction === "ENTRY" ? (
                              <ArrowDownLeft size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                            {e.direction === "ENTRY" ? "Vào" : "Ra"}
                          </span>
                        ),
                      },
                      {
                        label: "Kết quả",
                        render: (e) => (
                          <Badge
                            label={e.allowed ? "Cho phép" : "Từ chối"}
                            variant={e.allowed ? "success" : "danger"}
                          />
                        ),
                      },
                      {
                        label: "Chi tiết",
                        render: (e) => (
                          <IconButton
                            size="small"
                            variant="subtle"
                            icon={<Eye size={16} />}
                            aria-label="Xem chi tiết lượt quét"
                            onClick={() => setDetail(e.id)}
                          />
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              id: "gates",
              label: "Cổng & thiết bị",
              content: (
                <div className="gates-grid mt-xl">
                  {gates.map((g) => (
                    <div className="gate-card" key={g.id}>
                      <div className="flex justify-between gap-md">
                        <ScanLine size={24} className="text-brand-primary" />
                        <Badge
                          label={g.online ? "Trực tuyến" : "Ngoại tuyến"}
                          variant={g.online ? "success" : "warning"}
                        />
                      </div>
                      <Title level={3} className="mt-xl">
                        {g.name}
                      </Title>
                      <div className="text-label-sm text-text-secondary mt-md">
                        Nhà máy {sites[g.site]}
                      </div>
                      <div className="text-video-title text-text-secondary mt-xl">
                        Thiết bị QR · {g.id.toUpperCase()} · Trạng thái demo
                      </div>
                      {canManage(account.role, "gates") && (
                        <div className="mt-xl">
                          <SwitchField
                            key={String(g.online)}
                            label="Thiết bị hoạt động"
                            description="Mô phỏng bật/tắt kết nối tại cổng"
                            defaultSelected={g.online}
                            onChange={(v) =>
                              run(
                                () => api.setGate(g.id, v),
                                "Đã cập nhật thiết bị",
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>
      <DetailDrawer
        open={!!event}
        onClose={() => setDetail(null)}
        title="Chi tiết lượt quét"
      >
        {event && (
          <>
            {person && (
              <div className="profile-detail">
                <Person name={person.name} code={person.code} />
                <Badge
                  label={event.allowed ? "Cho phép" : "Từ chối"}
                  variant={event.allowed ? "success" : "danger"}
                />
              </div>
            )}
            <InfoRow label="Thời gian">
              {formatTime(event.time)} · {formatDate(event.time)}
            </InfoRow>
            <InfoRow label="Nhà máy">{sites[event.site]}</InfoRow>
            <InfoRow label="Cổng">
              {db.gates.find((g) => g.id === event.gate)?.name}
            </InfoRow>
            <InfoRow label="Hướng di chuyển">
              {event.direction === "ENTRY" ? "Vào nhà máy" : "Ra nhà máy"}
            </InfoRow>
            <InfoRow label="Lý do">{event.reason}</InfoRow>
            <InfoRow label="Người xác nhận">
              {event.operator || "Tự động qua QR"}
            </InfoRow>
          </>
        )}
      </DetailDrawer>
    </>
  )
}

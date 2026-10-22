import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Button,
  InputField,
  SelectField,
  TextareaField,
  Modal,
  Tabs,
} from "@figma/astraui"
import { Plus, Download, Check, X, Clock } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Card,
  DataTable,
  DateFilter,
  PageHeader,
  Person,
  Status,
  ErrorText,
} from "../../components/ui"
import { useApp, useAccount } from "../../app/context"
import { api } from "../../data/api"
import { scopeEmployees, canManage } from "../../lib/rbac"
import { formatDate, today } from "../../lib/date"
import { exportCsv } from "../../lib/csv"
import { sites, attendanceLabels, type Employee } from "../../data/types"
const adjustmentSchema = z.object({
  employeeId: z.string().min(1, "Chọn nhân viên"),
  date: z.string().min(1, "Chọn ngày"),
  checkIn: z.string().regex(/^\d{2}:\d{2}$/, "Nhập giờ vào hợp lệ"),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/, "Nhập giờ ra hợp lệ"),
  reason: z.string().trim().min(10, "Vui lòng nhập lý do ít nhất 10 ký tự"),
})
export function AdjustmentForm({
  employees,
  onClose,
}: {
  employees: Employee[]
  onClose: () => void
}) {
  const { run, busy } = useApp()
  const form = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      employeeId: employees[0]?.id ?? "",
      date: today(),
      checkIn: "07:30",
      checkOut: "16:30",
      reason: "",
    },
  })
  return (
    <Modal isOpen onClose={onClose} title="Đề nghị điều chỉnh chấm công">
      <form
        className="flex flex-col gap-lg"
        onSubmit={form.handleSubmit(async (values) => {
          if (
            await run(
              () => api.requestAdjustment(values),
              "Đã gửi đề nghị điều chỉnh",
            )
          )
            onClose()
        })}
      >
        <Controller
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <SelectField
              label="Nhân viên"
              value={field.value}
              onChange={field.onChange}
              options={employees.map((e) => ({
                value: e.id,
                label: `${e.name} · ${e.code}`,
              }))}
            />
          )}
        />
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <DateFilter
              label="Ngày cần điều chỉnh"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div className="form-grid">
          <Controller
            control={form.control}
            name="checkIn"
            render={({ field }) => (
              <InputField
                label="Giờ vào"
                type="time"
                value={field.value}
                onChange={field.onChange}
                required
              />
            )}
          />
          <Controller
            control={form.control}
            name="checkOut"
            render={({ field }) => (
              <InputField
                label="Giờ ra"
                type="time"
                value={field.value}
                onChange={field.onChange}
                required
              />
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="reason"
          render={({ field }) => (
            <TextareaField
              label="Lý do điều chỉnh"
              value={field.value}
              onChange={field.onChange}
              placeholder="Mô tả lý do cần bổ sung hoặc điều chỉnh giờ công…"
            />
          )}
        />
        <ErrorText>{form.formState.errors.reason?.message}</ErrorText>
        <div className="flex justify-end gap-md mt-lg">
          <Button variant="neutral" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Gửi đề nghị
          </Button>
        </div>
      </form>
    </Modal>
  )
}
export default function Attendance() {
  const { db, run, busy } = useApp(),
    account = useAccount()
  const [params, setParams] = useSearchParams(),
    [request, setRequest] = useState(false)
  const [decision, setDecision] = useState<{
    id: string
    status: "approved" | "rejected"
  } | null>(null)
  const date = params.get("date") || today(),
    status = params.get("status") || "",
    site = params.get("site") || ""
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next, { replace: true })
  }
  const scoped = scopeEmployees(db, account)
  const employees = scoped.filter((e) => !site || e.site === site),
    ids = new Set(employees.map((e) => e.id))
  const records = db.attendance.filter(
    (a) =>
      ids.has(a.employeeId) &&
      a.date === date &&
      (!status || a.status === status),
  )
  const adjustments = db.adjustments
    .filter((a) => ids.has(a.employeeId))
    .slice()
    .reverse()
  const manage = canManage(account.role, "attendance")
  return (
    <>
      <PageHeader
        title="Chấm công"
        description="Mỗi giờ làm đều được ghi nhận rõ ràng và minh bạch."
      >
        <Button
          variant="neutral"
          iconStart={<Download size={16} />}
          onClick={() =>
            exportCsv(
              `cham-cong-${date}.csv`,
              ["Nhân viên", "Ngày", "Giờ vào", "Giờ ra", "Trạng thái"],
              records.map((a) => [
                employees.find((e) => e.id === a.employeeId)?.name || "",
                a.date,
                a.checkIn,
                a.checkOut,
                attendanceLabels[a.status],
              ]),
            )
          }
        >
          Xuất bảng công
        </Button>
        {manage && (
          <Button
            iconStart={<Plus size={16} />}
            onClick={() => setRequest(true)}
          >
            Tạo đề nghị
          </Button>
        )}
      </PageHeader>
      <Card>
        <Tabs
          defaultTab="daily"
          tabs={[
            {
              id: "daily",
              label: "Bảng công theo ngày",
              content: (
                <>
                  <div className="filters-row mt-xl">
                    <DateFilter value={date} onChange={(v) => set("date", v)} />
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
                      value={status}
                      onChange={(v) => set("status", v)}
                      options={[
                        { value: "", label: "Mọi trạng thái" },
                        { value: "on-time", label: "Đúng giờ" },
                        { value: "late", label: "Đi muộn" },
                        { value: "absent", label: "Vắng mặt" },
                        { value: "leave", label: "Nghỉ phép" },
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
                  <div className="attendance-summary">
                    <Clock size={16} />
                    <span>
                      {formatDate(date)} · {records.length} bản ghi ·{" "}
                      {records.filter((a) => !!a.checkIn).length} có mặt
                    </span>
                  </div>
                  <DataTable
                    rows={records}
                    columns={[
                      {
                        label: "Nhân viên",
                        render: (a) => {
                          const e = employees.find(
                            (e) => e.id === a.employeeId,
                          )!
                          return <Person name={e.name} code={e.code} />
                        },
                      },
                      {
                        label: "Ca làm",
                        render: (a) =>
                          db.shifts.find(
                            (s) =>
                              s.id ===
                              employees.find((e) => e.id === a.employeeId)
                                ?.shiftId,
                          )?.name,
                      },
                      { label: "Giờ vào", render: (a) => a.checkIn || "—" },
                      { label: "Giờ ra", render: (a) => a.checkOut || "—" },
                      {
                        label: "Trạng thái",
                        render: (a) => <Status value={a.status} />,
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              id: "requests",
              label: `Đề nghị điều chỉnh (${adjustments.filter((a) => a.status === "pending").length})`,
              content: (
                <div className="mt-xl">
                  <DataTable
                    rows={adjustments}
                    columns={[
                      {
                        label: "Nhân viên",
                        render: (a) => {
                          const e = employees.find(
                            (e) => e.id === a.employeeId,
                          )!
                          return <Person name={e.name} code={e.code} />
                        },
                      },
                      {
                        label: "Ngày / giờ đề nghị",
                        render: (a) => (
                          <div>
                            {formatDate(a.date)}
                            <div className="text-video-title text-text-secondary mt-xs">
                              {a.checkIn} – {a.checkOut}
                            </div>
                          </div>
                        ),
                      },
                      {
                        label: "Lý do",
                        render: (a) => (
                          <div className="reason-cell">{a.reason}</div>
                        ),
                      },
                      {
                        label: "Trạng thái",
                        render: (a) => <Status value={a.status} />,
                      },
                      {
                        label: "Xử lý",
                        render: (a) =>
                          manage && a.status === "pending" ? (
                            <div className="flex gap-md">
                              <Button
                                variant="neutral"
                                size="small"
                                iconStart={<X size={16} />}
                                onClick={() =>
                                  setDecision({ id: a.id, status: "rejected" })
                                }
                              >
                                Từ chối
                              </Button>
                              <Button
                                size="small"
                                iconStart={<Check size={16} />}
                                onClick={() =>
                                  setDecision({ id: a.id, status: "approved" })
                                }
                              >
                                Duyệt
                              </Button>
                            </div>
                          ) : (
                            "—"
                          ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
      {request && (
        <AdjustmentForm employees={scoped} onClose={() => setRequest(false)} />
      )}
      <Modal
        isOpen={!!decision}
        onClose={() => setDecision(null)}
        title={
          decision?.status === "approved"
            ? "Duyệt điều chỉnh?"
            : "Từ chối điều chỉnh?"
        }
        footer={
          <>
            <Button variant="neutral" onClick={() => setDecision(null)}>
              Hủy
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  decision &&
                  (await run(
                    () => api.decideAdjustment(decision.id, decision.status),
                    "Đã xử lý đề nghị",
                  ))
                )
                  setDecision(null)
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="text-label-sm text-text-secondary">
          Đề nghị đã duyệt sẽ cập nhật trực tiếp vào bảng công và thông báo cho
          nhân viên.
        </div>
      </Modal>
    </>
  )
}

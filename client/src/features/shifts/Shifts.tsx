import { useState } from "react"
import { Button, InputField, SelectField, Modal, Badge } from "@figma/astraui"
import { Calendar, Plus, Clock, Pencil, Users } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useApp, useAccount } from "../../app/context"
import { api } from "../../data/api"
import { departments, type Shift } from "../../data/types"
import { canManage, scopeEmployees } from "../../lib/rbac"
import {
  Card,
  PageHeader,
  Title,
  ErrorText,
  Person,
  DataTable,
} from "../../components/ui"
const schema = z
  .object({
    name: z.string().trim().min(3, "Tên ca cần ít nhất 3 ký tự"),
    start: z.string().min(1),
    end: z.string().min(1),
    grace: z.number().min(0).max(60, "Tối đa 60 phút"),
  })
  .refine((s) => s.start !== s.end, {
    path: ["end"],
    message: "Giờ kết thúc phải khác giờ bắt đầu",
  })
interface ShiftFormProps {
  shift?: Shift
  onClose: () => void
}
function ShiftForm({ shift, onClose }: ShiftFormProps) {
  const { run, busy } = useApp()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: shift?.name ?? "",
      start: shift?.start ?? "07:30",
      end: shift?.end ?? "16:30",
      grace: shift?.grace ?? 5,
    },
  })
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={shift ? "Chỉnh sửa ca làm" : "Tạo ca làm mới"}
    >
      <form
        className="flex flex-col gap-lg"
        onSubmit={form.handleSubmit(async (values) => {
          if (
            await run(
              () =>
                api.saveShift({
                  ...values,
                  id: shift?.id ?? crypto.randomUUID(),
                }),
              "Đã lưu ca làm việc",
            )
          )
            onClose()
        })}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field }) => (
            <InputField
              label="Tên ca làm"
              placeholder="Ví dụ: Ca hành chính"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <ErrorText>{form.formState.errors.name?.message}</ErrorText>
        <div className="form-grid">
          {(["start", "end"] as const).map((name) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <InputField
                  type="time"
                  label={name === "start" ? "Bắt đầu" : "Kết thúc"}
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
          ))}
        </div>
        <ErrorText>{form.formState.errors.end?.message}</ErrorText>
        <Controller
          control={form.control}
          name="grace"
          render={({ field }) => (
            <InputField
              label="Ngưỡng đi muộn (phút)"
              type="number"
              min="0"
              max="60"
              value={String(field.value)}
              onChange={(v) => field.onChange(Number(v))}
              description="Thời gian linh hoạt sau giờ bắt đầu ca."
            />
          )}
        />
        <ErrorText>{form.formState.errors.grace?.message}</ErrorText>
        <div className="flex justify-end gap-md mt-lg">
          <Button variant="neutral" type="button" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            Lưu ca làm
          </Button>
        </div>
      </form>
    </Modal>
  )
}
export default function Shifts() {
  const { db, run, busy } = useApp(),
    account = useAccount()
  const [editing, setEditing] = useState<Shift | "new" | null>(null),
    [department, setDepartment] = useState("Sản xuất"),
    [shiftId, setShiftId] = useState("day"),
    [confirm, setConfirm] = useState(false)
  const manage = canManage(account.role, "shifts"),
    employees = scopeEmployees(db, account)
  const team = employees.filter(
    (e) => e.department === department && e.status === "active",
  )
  return (
    <>
      <PageHeader
        title="Ca làm việc"
        description="Sắp xếp một nhịp làm việc rõ ràng cho từng đội ngũ."
      >
        {manage && (
          <Button
            iconStart={<Plus size={16} />}
            onClick={() => setEditing("new")}
          >
            Thêm ca làm
          </Button>
        )}
      </PageHeader>
      <div className="shift-grid">
        {db.shifts.map((s) => (
          <Card key={s.id}>
            <div className="flex justify-between items-center">
              <span className="feature-icon">
                <Clock size={24} />
              </span>
              <Badge
                label={s.end < s.start ? "Qua đêm" : "Trong ngày"}
                variant="brand"
              />
            </div>
            <Title level={2} className="mt-xl">
              {s.name}
            </Title>
            <div className="shift-time">
              {s.start}
              <span>—</span>
              {s.end}
            </div>
            <div className="text-label-sm text-text-secondary">
              Linh hoạt {s.grace} phút sau giờ bắt đầu
            </div>
            <div className="shift-footer">
              <span className="text-label-sm flex gap-md items-center">
                <Users size={16} />
                {employees.filter((e) => e.shiftId === s.id).length} nhân viên
              </span>
              {manage && (
                <Button
                  size="small"
                  variant="neutral"
                  iconStart={<Pencil size={16} />}
                  onClick={() => setEditing(s)}
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {manage && (
        <Card className="mt-2xl">
          <div className="card-heading">
            <div>
              <Title level={3}>Phân ca theo phòng ban</Title>
              <div className="text-label-sm text-text-secondary mt-xs">
                Áp dụng ca làm cho toàn bộ nhân viên đang hoạt động trong phòng
                ban.
              </div>
            </div>
            <Calendar size={24} className="text-brand-primary" />
          </div>
          <div className="filters-row">
            <SelectField
              label="Phòng ban"
              value={department}
              onChange={setDepartment}
              options={departments.map((d) => ({ value: d, label: d }))}
            />
            <SelectField
              label="Ca được phân"
              value={shiftId}
              onChange={setShiftId}
              options={db.shifts.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.start}–${s.end})`,
              }))}
            />
            <Button disabled={!team.length} onClick={() => setConfirm(true)}>
              Phân ca cho {team.length} nhân viên
            </Button>
          </div>
        </Card>
      )}
      <Card className="mt-2xl">
        <div className="card-heading">
          <Title level={3}>Lịch ca đội ngũ</Title>
          <Badge label="Lịch phân công hiện tại" />
        </div>
        <DataTable
          rows={employees}
          columns={[
            {
              label: "Nhân viên",
              render: (e) => <Person name={e.name} code={e.code} />,
            },
            { label: "Phòng ban", render: (e) => e.department },
            {
              label: "Ca làm việc",
              render: (e) => db.shifts.find((s) => s.id === e.shiftId)?.name,
            },
            {
              label: "Thời gian",
              render: (e) => {
                const s = db.shifts.find((s) => s.id === e.shiftId)
                return `${s?.start} – ${s?.end}`
              },
            },
            {
              label: "Lịch tuần",
              render: () => (
                <span className="text-video-title text-text-secondary">
                  Thứ 2 – Thứ 7
                </span>
              ),
            },
          ]}
        />
      </Card>
      {editing && (
        <ShiftForm
          shift={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <Modal
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        title="Xác nhận phân ca"
        footer={
          <>
            <Button variant="neutral" onClick={() => setConfirm(false)}>
              Hủy
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    () =>
                      api.assignShift(
                        team.map((e) => e.id),
                        shiftId,
                      ),
                    "Đã cập nhật lịch ca của đội ngũ",
                  )
                )
                  setConfirm(false)
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="text-label-sm text-text-secondary">
          Phân {db.shifts.find((s) => s.id === shiftId)?.name} cho {team.length}{" "}
          nhân viên thuộc {department}. Thao tác này không thay đổi bảng công
          trước đây.
        </div>
      </Modal>
    </>
  )
}

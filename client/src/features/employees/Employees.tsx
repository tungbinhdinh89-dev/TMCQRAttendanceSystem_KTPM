import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Button,
  IconButton,
  InputField,
  SelectField,
  Modal,
  Badge,
} from "@figma/astraui"
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Lock,
  Unlock,
  Download,
  Users,
  QrCode,
} from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useApp, useAccount } from "../../app/context"
import { api } from "../../data/api"
import { departments, sites, type Employee } from "../../data/types"
import { canManage, scopeEmployees } from "../../lib/rbac"
import {
  Card,
  PageHeader,
  DataTable,
  Person,
  Status,
  DetailDrawer,
  InfoRow,
  Title,
  ErrorText,
} from "../../components/ui"
import { exportCsv } from "../../lib/csv"
import { today } from "../../lib/date"
const schema = z.object({
  name: z.string().trim().min(3, "Họ tên cần ít nhất 3 ký tự"),
  code: z.string().regex(/^TMC\d{4,6}$/, "Mã theo định dạng TMC0001"),
  title: z.string().trim().min(2, "Nhập chức danh"),
  department: z.string().min(1),
  site: z.enum(["bd", "la", "unknown"]),
  shiftId: z.string().min(1),
  status: z.enum(["active", "inactive"]),
})
function EmployeeForm({
  employee,
  onClose,
}: {
  employee?: Employee
  onClose: () => void
}) {
  const { db, run, busy } = useApp()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: employee?.name ?? "",
      code:
        employee?.code ??
        `TMC${String(db.employees.length + 1).padStart(4, "0")}`,
      title: employee?.title ?? "",
      department: employee?.department ?? "Sản xuất",
      site: employee?.site ?? "bd",
      shiftId: employee?.shiftId ?? "day",
      status: employee?.status ?? "active",
    },
  })
  const submit = form.handleSubmit(async (values) => {
    if (
      await run(
        () =>
          api.saveEmployee({
            ...values,
            id: employee?.id ?? crypto.randomUUID(),
            qrLocked: employee?.qrLocked ?? false,
          }),
        employee ? "Đã cập nhật hồ sơ nhân viên" : "Đã thêm nhân viên mới",
      )
    )
      onClose()
  })
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={employee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}
      size="large"
    >
      <form onSubmit={submit} className="flex flex-col gap-lg">
        {(["name", "code", "title"] as const).map((name) => (
          <div key={name}>
            <Controller
              name={name}
              control={form.control}
              render={({ field }) => (
                <InputField
                  label={
                    {
                      name: "Họ và tên",
                      code: "Mã nhân viên",
                      title: "Chức danh",
                    }[name]
                  }
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={
                    {
                      name: "Nguyễn Văn An",
                      code: "TMC0041",
                      title: "Nhân viên sản xuất",
                    }[name]
                  }
                />
              )}
            />
            <ErrorText>{form.formState.errors[name]?.message}</ErrorText>
          </div>
        ))}
        <div className="form-grid">
          <Controller
            control={form.control}
            name="department"
            render={({ field }) => (
              <SelectField
                label="Phòng ban"
                value={field.value}
                onChange={field.onChange}
                options={departments.map((d) => ({ value: d, label: d }))}
              />
            )}
          />
          <Controller
            control={form.control}
            name="site"
            render={({ field }) => (
              <SelectField
                label="Nhà máy"
                value={field.value}
                onChange={field.onChange}
                options={Object.entries(sites).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            )}
          />
          <Controller
            control={form.control}
            name="shiftId"
            render={({ field }) => (
              <SelectField
                label="Ca làm việc"
                value={field.value}
                onChange={field.onChange}
                options={db.shifts.map((s) => ({ value: s.id, label: s.name }))}
              />
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <SelectField
                label="Trạng thái"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "active", label: "Đang làm việc" },
                  { value: "inactive", label: "Ngừng hoạt động" },
                ]}
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-md mt-lg">
          <Button type="button" variant="neutral" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu nhân viên"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
export default function Employees() {
  const { db, run, busy } = useApp(),
    account = useAccount(),
    [params, setParams] = useSearchParams()
  const [detail, setDetail] = useState<string | null>(null),
    [editing, setEditing] = useState<Employee | "new" | null>(null),
    [locking, setLocking] = useState<Employee | null>(null)
  const query = params.get("q") || "",
    site = params.get("site") || "",
    department = params.get("department") || "",
    status = params.get("status") || ""
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params)
    value ? p.set(key, value) : p.delete(key)
    setParams(p, { replace: true })
  }
  const scoped = scopeEmployees(db, account)
  const employees = scoped.filter(
    (e) =>
      `${e.name} ${e.code}`
        .toLocaleLowerCase("vi")
        .includes(query.toLocaleLowerCase("vi")) &&
      (!site || e.site === site) &&
      (!department || e.department === department) &&
      (!status || e.status === status),
  )
  const selected = db.employees.find((e) => e.id === detail),
    manage = canManage(account.role, "employees")
  return (
    <>
      <PageHeader
        title="Quản lý nhân sự"
        description="Kết nối hồ sơ nhân viên, ca làm và quyền ra vào tại từng nhà máy."
      >
        <Button
          variant="neutral"
          iconStart={<Download size={16} />}
          onClick={() =>
            exportCsv(
              `nhan-su-${today()}.csv`,
              ["Mã nhân viên", "Họ tên", "Phòng ban", "Nhà máy", "Chức danh"],
              employees.map((e) => [
                e.code,
                e.name,
                e.department,
                sites[e.site],
                e.title,
              ]),
            )
          }
        >
          Xuất danh sách
        </Button>
        {manage && (
          <Button
            iconStart={<Plus size={16} />}
            onClick={() => setEditing("new")}
          >
            Thêm nhân viên
          </Button>
        )}
      </PageHeader>
      <div className="mini-stat-grid">
        <Card>
          <Users size={20} className="text-brand-primary" />
          <span className="text-title">{scoped.length}</span>
          <span className="text-label-sm text-text-secondary">
            Hồ sơ nhân viên
          </span>
        </Card>
        <Card>
          <span className="live-dot" />
          <span className="text-title">
            {scoped.filter((e) => e.status === "active").length}
          </span>
          <span className="text-label-sm text-text-secondary">
            Đang làm việc
          </span>
        </Card>
        <Card>
          <QrCode size={20} className="text-text-secondary" />
          <span className="text-title">
            {scoped.filter((e) => e.qrLocked).length}
          </span>
          <span className="text-label-sm text-text-secondary">
            Mã QR đã khóa
          </span>
        </Card>
      </div>
      <Card>
        <div className="card-heading">
          <Title level={3}>
            Danh sách nhân viên{" "}
            <span className="text-text-secondary">({employees.length})</span>
          </Title>
          <Badge label="Dữ liệu mẫu" variant="brand" />
        </div>
        <div className="filters-row">
          <InputField
            value={query}
            onChange={(v) => set("q", v)}
            placeholder="Tìm tên hoặc mã nhân viên…"
            prefix={<Search size={16} />}
            aria-label="Tìm nhân viên"
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
          <SelectField
            value={status}
            onChange={(v) => set("status", v)}
            options={[
              { value: "", label: "Mọi trạng thái" },
              { value: "active", label: "Đang làm việc" },
              { value: "inactive", label: "Ngừng hoạt động" },
            ]}
          />
          {params.size > 0 && (
            <Button variant="subtle" size="small" onClick={() => setParams({})}>
              Xóa lọc
            </Button>
          )}
        </div>
        <DataTable
          rows={employees}
          columns={[
            {
              label: "Nhân viên",
              render: (e) => <Person name={e.name} code={e.code} />,
            },
            {
              label: "Phòng ban",
              render: (e) => (
                <div>
                  <span>{e.department}</span>
                  <div className="text-video-title text-text-secondary mt-xs">
                    {e.title}
                  </div>
                </div>
              ),
            },
            { label: "Nhà máy", render: (e) => sites[e.site] },
            { label: "Trạng thái", render: (e) => <Status value={e.status} /> },
            {
              label: "Mã QR",
              render: (e) => (
                <Badge
                  label={e.qrLocked ? "Đã khóa" : "Có hiệu lực"}
                  variant={e.qrLocked ? "danger" : "default"}
                />
              ),
            },
            {
              label: "Thao tác",
              render: (e) => (
                <div className="flex gap-xs">
                  <IconButton
                    variant="subtle"
                    size="small"
                    icon={<Eye size={16} />}
                    aria-label={`Xem ${e.name}`}
                    onClick={() => setDetail(e.id)}
                  />
                  {manage && (
                    <IconButton
                      variant="subtle"
                      size="small"
                      icon={<Pencil size={16} />}
                      aria-label={`Sửa ${e.name}`}
                      onClick={() => setEditing(e)}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
      <DetailDrawer
        open={!!selected}
        onClose={() => setDetail(null)}
        title="Hồ sơ nhân viên"
      >
        {selected && (
          <>
            <div className="profile-detail">
              <Person name={selected.name} code={selected.code} />
              <Status value={selected.status} />
            </div>
            <InfoRow label="Chức danh">{selected.title}</InfoRow>
            <InfoRow label="Phòng ban">{selected.department}</InfoRow>
            <InfoRow label="Nhà máy">{sites[selected.site]}</InfoRow>
            <InfoRow label="Ca làm">
              {db.shifts.find((s) => s.id === selected.shiftId)?.name}
            </InfoRow>
            <InfoRow label="Trạng thái QR">
              {selected.qrLocked ? "Đã khóa" : "Đang có hiệu lực"}
            </InfoRow>
            {manage && (
              <div className="flex flex-col gap-lg mt-2xl">
                <Button
                  variant="neutral"
                  iconStart={<Pencil size={16} />}
                  onClick={() => {
                    setDetail(null)
                    setEditing(selected)
                  }}
                >
                  Chỉnh sửa hồ sơ
                </Button>
                <Button
                  variant="neutral"
                  iconStart={
                    selected.qrLocked ? (
                      <Unlock size={16} />
                    ) : (
                      <Lock size={16} />
                    )
                  }
                  onClick={() => {
                    setDetail(null)
                    setLocking(selected)
                  }}
                >
                  {selected.qrLocked ? "Mở khóa mã QR" : "Khóa mã QR"}
                </Button>
              </div>
            )}
          </>
        )}
      </DetailDrawer>
      {editing && (
        <EmployeeForm
          employee={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <Modal
        isOpen={!!locking}
        onClose={() => setLocking(null)}
        title={locking?.qrLocked ? "Mở khóa mã QR?" : "Khóa mã QR?"}
        footer={
          <>
            <Button variant="neutral" onClick={() => setLocking(null)}>
              Hủy
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (
                  locking &&
                  (await run(
                    () =>
                      api.saveEmployee({
                        ...locking,
                        qrLocked: !locking.qrLocked,
                      }),
                    "Đã cập nhật quyền sử dụng QR",
                  ))
                )
                  setLocking(null)
              }}
            >
              Xác nhận
            </Button>
          </>
        }
      >
        <div className="text-label-sm text-text-secondary">
          Thay đổi này áp dụng ngay cho mã QR của {locking?.name}. Nhật ký ra
          vào trước đó không bị thay đổi.
        </div>
      </Modal>
    </>
  )
}

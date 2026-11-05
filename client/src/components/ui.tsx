import { useState, type ReactNode } from "react"
import { IconButton, Avatar, Badge } from "@figma/astraui"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Drawer,
} from "@mui/material"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { vi } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react"
import { initials } from "../lib/date"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ShieldCheck size={24} strokeWidth={1.8} />
      </span>
      {!compact && (
        <span className="brand-word">
          TMC<span className="brand-word-light">Access</span>
          <span className="brand-tagline">KẾT NỐI · AN TOÀN · HIỆU QUẢ</span>
        </span>
      )}
    </div>
  )
}
export function Title({
  children,
  level = 1,
  className = "",
}: {
  children: ReactNode
  level?: 1 | 2 | 3
  className?: string
}) {
  return (
    <div
      role="heading"
      aria-level={level}
      className={`${
        level === 1
          ? "text-title"
          : level === 2
            ? "text-heading"
            : "text-label font-semibold"
      } ${className}`}
    >
      {children}
    </div>
  )
}
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <Title>{title}</Title>
        <div className="text-label-sm text-text-secondary mt-xs">
          {description}
        </div>
      </div>
      <div className="flex items-center gap-md flex-wrap">{children}</div>
    </div>
  )
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`surface-card ${className}`}>{children}</section>
}
export function Empty({
  title = "Chưa có dữ liệu phù hợp",
  description = "Thử thay đổi hoặc xóa bộ lọc để xem thêm kết quả.",
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <Search size={32} className="text-text-secondary" />
      <Title level={3}>{title}</Title>
      <div className="text-label-sm text-text-secondary">{description}</div>
      {action}
    </div>
  )
}
interface PersonProps {
  name: string
  code?: string
}
export function Person({ name, code }: PersonProps) {
  return (
    <div className="flex items-center gap-lg">
      <Avatar type="initial" initials={initials(name)} size="medium" />
      <div>
        <div className="text-label-sm text-text-primary font-medium">
          {name}
        </div>
        {code && (
          <div className="text-video-title text-text-secondary mt-xs">
            {code}
          </div>
        )}
      </div>
    </div>
  )
}
const statuses: Record<string, [string, "success" | "warning" | "danger" | "brand" | "default"]> =
  {
    "on-time": ["Đúng giờ", "success"],
    late: ["Đi muộn", "warning"],
    absent: ["Vắng mặt", "danger"],
    leave: ["Nghỉ phép", "brand"],
    active: ["Đang làm việc", "success"],
    inactive: ["Ngừng hoạt động", "default"],
    pending: ["Chờ duyệt", "warning"],
    approved: ["Đã duyệt", "success"],
    rejected: ["Từ chối", "danger"],
  }
export function Status({ value }: { value: string }) {
  const s = statuses[value] ?? [value, "default"]
  return <Badge label={s[0]} variant={s[1]} />
}
export function StatCard({
  label,
  value,
  note,
  icon,
  good = false,
}: {
  label: string
  value: string | number
  note: string
  icon: ReactNode
  good?: boolean
}) {
  return (
    <Card className="stat-card">
      <div className="flex items-center justify-between gap-lg">
        <div className="text-label-sm text-text-secondary">{label}</div>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div
        className={`text-video-title flex items-center gap-xs ${
          good ? "positive-text" : "text-text-secondary"
        }`}
      >
        {good && <ArrowUpRight size={16} />}
        {note}
      </div>
    </Card>
  )
}
export interface Column<T> {
  label: string
  render: (row: T) => ReactNode
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 8,
}: {
  rows: T[]
  columns: Column<T>[]
  pageSize?: number
}) {
  const [page, setPage] = useState(0)
  const safePage = Math.min(
    page,
    Math.max(0, Math.ceil(rows.length / pageSize) - 1),
  )
  const visible = rows.slice(safePage * pageSize, (safePage + 1) * pageSize)
  if (!rows.length) return <Empty />
  return (
    <>
      <TableContainer className="data-table">
        <Table size="small" aria-label="Bảng dữ liệu">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((c) => (
                  <TableCell key={c.label}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="table-footer">
        <span className="text-video-title text-text-secondary">
          Hiển thị {safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, rows.length)} trong {rows.length}{" "}
          kết quả
        </span>
        <div className="flex items-center gap-md">
          <IconButton
            aria-label="Trang trước"
            variant="neutral"
            size="small"
            icon={<ChevronLeft size={16} />}
            disabled={!safePage}
            onClick={() => setPage(safePage - 1)}
          />
          <span className="text-label-sm">{safePage + 1}</span>
          <IconButton
            aria-label="Trang tiếp"
            variant="neutral"
            size="small"
            icon={<ChevronRight size={16} />}
            disabled={(safePage + 1) * pageSize >= rows.length}
            onClick={() => setPage(safePage + 1)}
          />
        </div>
      </div>
    </>
  )
}
export function DetailDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { className: "detail-drawer" } }}
    >
      <div className="flex items-center justify-between gap-xl mb-xl">
        <Title level={2}>{title}</Title>
        <IconButton
          icon={<X size={16} />}
          variant="subtle"
          aria-label="Đóng chi tiết"
          onClick={onClose}
        />
      </div>
      {children}
    </Drawer>
  )
}
export function DateFilter({
  value,
  onChange,
  label = "Ngày",
}: {
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
      <DatePicker
        label={label}
        value={value ? new Date(`${value}T12:00:00`) : null}
        onChange={(date) => {
          if (date && !isNaN(date.getTime()))
            onChange(
              `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
            )
        }}
        format="dd/MM/yyyy"
        slotProps={{
          textField: {
            size: "small",
            className: "date-filter",
            fullWidth: true,
          },
          openPickerButton: { "aria-label": "Chọn ngày" },
        }}
      />
    </LocalizationProvider>
  )
}
export function InfoRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="info-row">
      <span className="text-label-sm text-text-secondary">{label}</span>
      <span className="text-label-sm text-right">{children}</span>
    </div>
  )
}
export function ErrorText({ children }: { children?: string }) {
  return children ? (
    <div className="text-video-title text-danger mt-xs" role="alert">
      {children}
    </div>
  ) : null
}

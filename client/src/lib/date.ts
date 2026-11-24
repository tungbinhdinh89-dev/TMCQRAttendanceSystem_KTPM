import { isValid, parseISO } from "date-fns"

const vietnamDateTime = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
})
/** Parse ISO with date-fns; render Vietnam wall time independently of the browser timezone. */
export function formatVietnamDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  const parts = Object.fromEntries(vietnamDateTime.formatToParts(date).map(part => [part.type, part.value]))
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  )
export const dayOf = (date: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(date),
  )
export const formatDate = (date: string) =>
  date
    ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(
        new Date(date.length === 10 ? `${date}T12:00:00+07:00` : date),
      )
    : "—"
export const formatTime = (date: string) =>
  !date
    ? "—"
    : date.includes("T")
      ? new Intl.DateTimeFormat("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date(date))
      : date
export const minutes = (time: string) =>
  Number(time.split(":")[0]) * 60 + Number(time.split(":")[1])
export const initials = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")

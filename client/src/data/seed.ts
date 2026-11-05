import type { Database, Employee, Role } from "./types"
import { dayOf, today } from "../lib/date"
import { departments } from "./types"
const names = [
  "Nguyễn Minh Anh",
  "Trần Hoàng Nam",
  "Lê Thị Ngọc",
  "Phạm Quốc Huy",
  "Võ Thanh Hà",
  "Đặng Tuấn Kiệt",
  "Bùi Thu Hương",
  "Ngô Văn Phúc",
  "Đỗ Bảo Trâm",
  "Hồ Đức Minh",
  "Dương Ngọc Mai",
  "Lý Thành Đạt",
  "Nguyễn Thanh Tâm",
  "Trần Khánh Linh",
  "Lê Quốc Bảo",
  "Phạm Thảo Vy",
  "Võ Minh Khang",
  "Đặng Anh Thư",
  "Bùi Hải Đăng",
  "Ngô Quỳnh Chi",
  "Đỗ Công Thành",
  "Hồ Ngọc Ánh",
  "Dương Văn Sơn",
  "Lý Phương Anh",
  "Nguyễn Gia Hân",
  "Trần Bảo Long",
  "Lê Ngọc Diệp",
  "Phạm Tuấn Anh",
  "Võ Thùy Dung",
  "Đặng Hữu Phát",
  "Bùi Minh Châu",
  "Ngô Đức Hùng",
  "Đỗ Hà My",
  "Hồ Quang Vinh",
  "Dương Khánh An",
  "Lý Hoàng Yến",
  "Nguyễn Hồng Nhung",
  "Trần Trung Hiếu",
  "Lê Bảo Ngọc",
  "Phạm Văn Lâm",
]
export function seedDatabase(): Database {
  const employees: Employee[] = names.map((name, i) => ({
    id: `e${i + 1}`,
    code: `TMC${String(i + 1).padStart(4, "0")}`,
    name,
    department: departments[i % 5],
    site: i < 24 ? "bd" : "la",
    title:
      i % 5 === 4
        ? "Chuyên viên nhân sự"
        : i % 5 === 0
          ? "Nhân viên sản xuất"
          : "Nhân viên vận hành",
    status: i === 8 ? "inactive" : "active",
    qrLocked: i === 6,
    shiftId: i % 7 === 6 ? "night" : "day",
  }))
  const roles: Role[] = [
    "SYSTEM_ADMIN",
    "HR_MANAGER",
    "SECURITY_MANAGER",
    "GATE_OPERATOR",
    "DEPARTMENT_MANAGER",
    "EMPLOYEE",
  ]
  const db: Database = {
    version: 1,
    employees,
    accounts: roles.map((role, i) => ({
      id: `u${i}`,
      role,
      name: [
        "Trần Minh Quân",
        "Lê Thu Hà",
        "Nguyễn Hoàng Sơn",
        "Phạm Văn Bình",
        "Trần Quốc Dũng",
        names[0],
      ][i],
      username: ["admin", "hr", "security", "guard", "manager", "employee"][i],
      employeeId: role === "EMPLOYEE" ? "e1" : `e${i + 2}`,
      site: "bd",
      department: "Sản xuất",
    })),
    shifts: [
      {
        id: "day",
        name: "Ca hành chính",
        start: "07:30",
        end: "16:30",
        grace: 5,
      },
      { id: "night", name: "Ca đêm", start: "19:30", end: "04:30", grace: 5 },
    ],
    attendance: [],
    events: [],
    adjustments: [],
    notifications: [],
    gates: [
      { id: "bd-1", name: "Cổng chính · BD01", site: "bd", online: true },
      {
        id: "bd-2",
        name: "Cổng khu sản xuất · BD02",
        site: "bd",
        online: true,
      },
      { id: "la-1", name: "Cổng chính · LA01", site: "la", online: true },
      { id: "la-2", name: "Cổng kho vận · LA02", site: "la", online: false },
    ],
  }
  for (let d = 6; d >= 0; d--) {
    const date = dayOf(new Date(Date.now() - d * 86400000).toISOString())
    employees.forEach((e, i) => {
      const status =
        e.status === "inactive" || (i + d) % 17 === 0
          ? "absent"
          : (i + d) % 13 === 0
            ? "leave"
            : (i + d) % 9 === 0
              ? "late"
              : "on-time"
      const present = status === "late" || status === "on-time"
      const checkIn = present
        ? `${e.shiftId === "night" ? "19" : "07"}:${
            status === "late" ? "42" : String(20 + (i % 14)).padStart(2, "0")
          }`
        : ""
      const checkOut =
        present && d > 0 ? (e.shiftId === "night" ? "04:35" : "16:35") : ""
      db.attendance.push({
        id: `a-${date}-${e.id}`,
        date,
        employeeId: e.id,
        checkIn,
        checkOut,
        status,
      })
      if (present)
        db.events.push({
          id: `ev-${date}-${e.id}`,
          employeeId: e.id,
          time: `${date}T${checkIn}:00+07:00`,
          site: e.site,
          gate: e.site === "bd" ? "bd-1" : "la-1",
          direction: "ENTRY",
          allowed: true,
          reason: "Mã QR hợp lệ",
        })
      const exitDate =
        e.shiftId === "night"
          ? dayOf(
              new Date(
                new Date(`${date}T12:00:00+07:00`).getTime() + 86400000,
              ).toISOString(),
            )
          : date
      if (checkOut)
        db.events.push({
          id: `out-${date}-${e.id}`,
          employeeId: e.id,
          time: `${exitDate}T${checkOut}:00+07:00`,
          site: e.site,
          gate: e.site === "bd" ? "bd-1" : "la-1",
          direction: "EXIT",
          allowed: true,
          reason: "Mã QR hợp lệ",
        })
    })
  }
  db.events.push({
    id: "denied-1",
    employeeId: "e7",
    time: `${today()}T07:43:00+07:00`,
    site: "bd",
    gate: "bd-1",
    direction: "ENTRY",
    allowed: false,
    reason: "Mã QR đã bị khóa",
  })
  db.adjustments.push({
    id: "adj1",
    employeeId: "e1",
    date: today(),
    checkIn: "07:25",
    checkOut: "16:30",
    reason: "Bổ sung giờ ra do thiết bị tại cổng bảo trì.",
    status: "pending",
  })
  db.notifications = [
    {
      id: "n1",
      employeeId: "e1",
      title: "Lịch làm việc tuần mới",
      body: "Bạn được phân ca hành chính 07:30–16:30 tại nhà máy Bình Dương. Vui lòng có mặt trước giờ bắt đầu ca.",
      time: new Date().toISOString(),
      read: false,
    },
    {
      id: "n2",
      employeeId: "e1",
      title: "Chào mừng đến với TMC Access",
      body: "Sử dụng mã QR cá nhân để ra vào nhà máy. Mỗi mã có hiệu lực trong 60 giây.",
      time: new Date(Date.now() - 86400000).toISOString(),
      read: true,
    },
  ]
  return db
}

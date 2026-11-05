import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { DataSource } from "typeorm"

type DemoRole = "SYSTEM_ADMIN" | "HR_MANAGER" | "SECURITY_MANAGER" | "GATE_OPERATOR" | "DEPARTMENT_MANAGER" | "EMPLOYEE"

const roleMap: Record<string, DemoRole> = {
  ADM: "SYSTEM_ADMIN",
  HR: "HR_MANAGER",
  SEC: "SECURITY_MANAGER",
  SUP: "DEPARTMENT_MANAGER",
  EXE: "GATE_OPERATOR",
  EMP: "EMPLOYEE",
}

@Controller("demo")
export class DemoBootstrapController {
  constructor(private readonly dataSource: DataSource) {}

  @Get("bootstrap")
  async bootstrap() {
    try {
      const [employees, users, assignments, stations] = await Promise.all([
        this.dataSource.query(`
          SELECT DISTINCT ON (e.id) e.id, e.employee_code AS code, e.full_name AS name, e.status,
                 COALESCE(d.name, 'Chưa phân bộ phận') AS department,
                 f.code AS factory_code
          FROM employees e
          LEFT JOIN employee_assignments a ON a.employee_id = e.id AND a.valid_to IS NULL
          LEFT JOIN departments d ON d.id = a.department_id
          LEFT JOIN factories f ON f.id = a.factory_id
          ORDER BY e.id, a.valid_from DESC NULLS LAST
        `),
        this.dataSource.query(`
          SELECT u.id, u.username, u.employee_id, r.code AS role_code,
                 ura.factory_id, f.code AS factory_code
          FROM users u
          JOIN user_role_assignments ura ON ura.user_id = u.id
            AND ura.revoked_at IS NULL
            AND ura.valid_to IS NULL
          JOIN roles r ON r.id = ura.role_id
          LEFT JOIN factories f ON f.id = ura.factory_id
          ORDER BY u.username
        `),
        this.dataSource.query(`
          SELECT employee_id, factory_id
          FROM access_grants
          WHERE revoked_at IS NULL AND (valid_to IS NULL OR valid_to > now())
        `),
        this.dataSource.query(`
          SELECT id, code, factory_id, direction, status
          FROM gate_stations
          ORDER BY code
        `),
      ])

      const employeeById = new Map<string, (typeof employees)[number]>(
        employees.map((employee: (typeof employees)[number]) => [employee.id, employee]),
      )
      const accountRows = users.map((user: (typeof users)[number]) => {
        const employee = employeeById.get(user.employee_id)
        if (!employee) throw new Error(`User ${user.id} has no employee projection`)
        return {
          id: user.id,
          name: employee.name,
          username: user.username,
          role: roleMap[user.role_code] ?? "EMPLOYEE",
          employeeId: user.employee_id,
          site: user.factory_code === "LA" ? "la" : "bd",
          department: employee.department,
        }
      })

      return {
        data: {
          version: 1,
          employees: employees.map((employee: (typeof employees)[number]) => ({
            id: employee.id,
            code: employee.code,
            name: employee.name,
            department: employee.department,
            site: employee.factory_code === "LA" ? "la" : "bd",
            title: "Nhân viên",
            status: employee.status === "ACTIVE" ? "active" : "inactive",
            qrLocked: employee.status !== "ACTIVE",
            shiftId: "day",
          })),
          accounts: accountRows,
          shifts: [
            { id: "day", name: "Ca hành chính", start: "07:30", end: "16:30", grace: 5 },
            { id: "night", name: "Ca đêm", start: "19:30", end: "04:30", grace: 5 },
          ],
          attendance: [],
          events: [],
          adjustments: [],
          notifications: [],
          gates: stations.map((station: (typeof stations)[number]) => ({
            id: station.id,
            name: `${station.code} · ${station.direction}`,
            site: station.factory_id === "00000000-0000-4000-8000-000000000002" ? "la" : "bd",
            online: station.status === "ACTIVE",
          })),
          accessGrants: assignments,
        },
        traceId: crypto.randomUUID(),
      }
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? `Demo database unavailable: ${error.message}` : "Demo database unavailable",
      )
    }
  }
}

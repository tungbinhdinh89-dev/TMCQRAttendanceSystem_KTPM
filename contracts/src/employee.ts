import type { Uuid } from "./common"

export type EmployeeSummary = {
  id: Uuid
  employeeCode: string
  fullName: string
  status: "ACTIVE" | "INACTIVE" | string
}

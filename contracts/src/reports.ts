import type { LocalDate, IsoDateTime, Uuid } from "./common"

export type MonthlyReportQuery = {
  periodStart: LocalDate
  scopeType: "COMPANY" | "FACTORY"
  factoryId?: Uuid
}

export type ExportBatchResponse = {
  id: Uuid
  periodStart: LocalDate
  scopeType: "COMPANY" | "FACTORY"
  factoryId: Uuid | null
  batchVersion: number
  status: string
  recordCount: number
  payloadChecksum: string
  createdAt: IsoDateTime
}

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject {
  [key: string]: JsonValue
}

export type IsoDateTime = string
export type LocalDate = string
export type Uuid = string

export type ApiProblem = {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: Record<string, string[]>
}

export type ApiResponse<T> = {
  data: T
  traceId: string
}

export type PageRequest = {
  page: number
  pageSize: number
}

export type PageResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

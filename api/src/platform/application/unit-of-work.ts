import type { TransactionContext } from "./transaction-context"

export interface UnitOfWork {
  execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>
}
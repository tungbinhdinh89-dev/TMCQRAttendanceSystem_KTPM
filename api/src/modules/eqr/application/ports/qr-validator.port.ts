import type { EntityManager } from "typeorm"
import type { QrValidationResult } from "@tmc/contracts"
export interface QrValidator { validate(token: unknown, manager?: EntityManager): Promise<QrValidationResult> }

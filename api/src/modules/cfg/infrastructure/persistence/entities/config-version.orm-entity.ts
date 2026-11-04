import { Column, Entity, Index } from "typeorm"
import type { JsonValue } from "@tmc/contracts"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "config_versions" })
@Index("uq_config_versions_key_version", ["configKey", "version"], { unique: true })
export class ConfigVersionOrmEntity extends CreatedOrmEntity {
  @Column({ name: "config_key", type: "varchar", length: 150 }) configKey!: string
  @Column({ type: "integer" }) version!: number
  @Column({ type: "jsonb" }) payload!: JsonValue
  @Column({ name: "supersedes_id", type: "uuid", nullable: true }) supersedesId!: string | null
  @Column({ name: "effective_from", type: "timestamptz", nullable: true }) effectiveFrom!: Date | null
  @Column({ name: "created_by_user_id", type: "uuid", nullable: true }) createdByUserId!: string | null
}

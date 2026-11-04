import { Column, Entity, Index } from "typeorm"
import { VersionedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "integration_endpoints" })
@Index("uq_integration_endpoints_code", ["code"], { unique: true })
export class IntegrationEndpointOrmEntity extends VersionedOrmEntity {
  @Column({ type: "varchar", length: 64 }) code!: string
  @Column({ name: "provider_type", type: "varchar", length: 16 }) providerType!: string
  @Column({ name: "factory_id", type: "uuid", nullable: true }) factoryId!: string | null
  @Column({ name: "base_url", type: "text" }) baseUrl!: string
  @Column({ name: "auth_secret_ref", type: "text" }) authSecretRef!: string
  @Column({ name: "request_timeout_ms", type: "integer" }) requestTimeoutMs!: number
  @Column({ name: "contract_version", type: "varchar", length: 50 }) contractVersion!: string
  @Column({ name: "config_version_id", type: "uuid" }) configVersionId!: string
  @Column({ name: "is_enabled", type: "boolean", default: true }) isEnabled!: boolean
}

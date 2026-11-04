import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm"
import type { JsonValue } from "@tmc/contracts"

@Entity({ name: "qr_signing_keys" })
export class QrSigningKeyOrmEntity {
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date
  @PrimaryColumn({ name: "key_id", type: "varchar", length: 64 }) keyId!: string
  @Column({ type: "varchar", length: 20 }) algorithm!: string
  @Column({ name: "public_jwk", type: "jsonb" }) publicJwk!: JsonValue
  @Column({ name: "private_secret_ref", type: "text" }) privateSecretRef!: string
  @Column({ type: "varchar", length: 20 }) status!: string
  @Column({ name: "valid_from", type: "timestamptz" }) validFrom!: Date
  @Column({ name: "valid_to", type: "timestamptz", nullable: true }) validTo!: Date | null
}

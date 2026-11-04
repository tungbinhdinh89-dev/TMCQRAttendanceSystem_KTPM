import { CreateDateColumn, Entity, Index, PrimaryColumn, Column } from "typeorm"

@Entity({ name: "qr_redemptions" })
@Index("uq_qr_redemptions_access_attempt", ["accessAttemptId"], { unique: true })
export class QrRedemptionOrmEntity {
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date
  @PrimaryColumn({ name: "token_id", type: "uuid" }) tokenId!: string
  @Column({ name: "access_attempt_id", type: "uuid" }) accessAttemptId!: string
}

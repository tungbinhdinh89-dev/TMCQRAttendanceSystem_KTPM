import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm"

@Entity({ name: "export_item_sources" })
@Index("pk_export_item_sources", ["exportItemId", "eventId"], { unique: true })
export class ExportItemSourceOrmEntity {
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt!: Date
  @PrimaryColumn({ name: "export_item_id", type: "uuid" }) exportItemId!: string
  @PrimaryColumn({ name: "event_id", type: "uuid" }) eventId!: string
  @Column({ name: "revision_no", type: "integer" }) revisionNo!: number
  @Column({ name: "source_role", type: "varchar", length: 20 }) sourceRole!: string
}

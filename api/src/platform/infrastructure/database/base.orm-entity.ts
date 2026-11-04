import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm"

export abstract class CreatedOrmEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date
}

export abstract class VersionedOrmEntity extends CreatedOrmEntity {
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date

  @Column({ name: "row_version", type: "integer", default: 1 })
  rowVersion!: number
}

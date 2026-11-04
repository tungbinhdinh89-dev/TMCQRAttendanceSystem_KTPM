import { Column, Entity } from "typeorm"
import { CreatedOrmEntity } from "../../../../../platform/infrastructure/database/base.orm-entity"

@Entity({ name: "gate_command_history" })
export class GateCommandHistoryOrmEntity extends CreatedOrmEntity {
  @Column({ name: "command_id", type: "uuid" }) commandId!: string
  @Column({ name: "from_state", type: "varchar", length: 20, nullable: true }) fromState!: string | null
  @Column({ name: "to_state", type: "varchar", length: 20 }) toState!: string
  @Column({ name: "reason_code", type: "varchar", length: 64 }) reasonCode!: string
  @Column({ name: "actor_type", type: "varchar", length: 10 }) actorType!: string
  @Column({ name: "actor_user_id", type: "uuid", nullable: true }) actorUserId!: string | null
  @Column({ name: "device_event_id", type: "uuid", nullable: true }) deviceEventId!: string | null
  @Column({ name: "correlation_id", type: "uuid" }) correlationId!: string
}

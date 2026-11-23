import type { MigrationInterface, QueryRunner } from "typeorm"

export class TemporaryAccountPassword1795500000000 implements MigrationInterface {
  name = "TemporaryAccountPassword1795500000000"
  async up(queryRunner: QueryRunner): Promise<void> {
    // Existing accounts remain usable; only newly HR-provisioned accounts require first change.
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN "must_change_password" boolean NOT NULL DEFAULT false')
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    // Application rollback must be coordinated: this removes the pending-change enforcement flag.
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN "must_change_password"')
  }
}

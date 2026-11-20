import type { MigrationInterface, QueryRunner } from "typeorm"
export class ActiveQrCredential1794960000000 implements MigrationInterface {
  name="ActiveQrCredential1794960000000"
  async up(queryRunner:QueryRunner):Promise<void>{
    // Existing duplicates must be reconciled explicitly; never delete business history.
    await queryRunner.query("CREATE UNIQUE INDEX uq_qr_credentials_active_employee ON qr_credentials (employee_id) WHERE status = 'ACTIVE' AND revoked_at IS NULL")
  }
  async down(queryRunner:QueryRunner):Promise<void>{await queryRunner.query("DROP INDEX uq_qr_credentials_active_employee")}
}

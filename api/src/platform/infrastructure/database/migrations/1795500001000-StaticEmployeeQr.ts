import type { MigrationInterface, QueryRunner } from "typeorm"

export class StaticEmployeeQr1795500001000 implements MigrationInterface {
  name = "StaticEmployeeQr1795500001000"
  async up(queryRunner: QueryRunner): Promise<void> {
    // Existing credentials remain intact but HR must reissue before static QR display.
    await queryRunner.query("ALTER TABLE qr_credentials ADD COLUMN signed_payload text")
    await queryRunner.query("ALTER TABLE qr_tokens ALTER COLUMN expires_at DROP NOT NULL")
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    // Preserve history while making static tokens unusable for the previous short-lived model.
    await queryRunner.query("UPDATE qr_tokens SET revoked_at=COALESCE(revoked_at,NOW()), expires_at=NOW() WHERE expires_at IS NULL")
    await queryRunner.query("ALTER TABLE qr_tokens ALTER COLUMN expires_at SET NOT NULL")
    await queryRunner.query("ALTER TABLE qr_credentials DROP COLUMN signed_payload")
  }
}

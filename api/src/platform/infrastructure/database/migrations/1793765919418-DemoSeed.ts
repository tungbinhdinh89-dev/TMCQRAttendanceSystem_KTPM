import type { MigrationInterface, QueryRunner } from "typeorm"

export class DemoSeed1793765919418 implements MigrationInterface {
  name = "DemoSeed1793765919418"

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Demo data is loaded explicitly by the seed command, not during schema migration.
  }

  public async down(): Promise<void> {
    // Demo data is intentionally retained when rolling back schema migrations.
  }
}

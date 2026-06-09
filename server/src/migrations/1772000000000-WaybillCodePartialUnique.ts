import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soft-deleted waybills kept their waybill_code, but the table had a full UNIQUE
 * constraint — so reusing a code after delete failed with "Waybill code already exists".
 */
export class WaybillCodePartialUnique1772000000000 implements MigrationInterface {
  name = 'WaybillCodePartialUnique1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "waybills" DROP CONSTRAINT IF EXISTS "UQ_waybills_waybill_code"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_waybills_waybill_code"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_waybills_waybill_code_active" ON "waybills" ("waybill_code") WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_waybills_waybill_code_active"`);
    await queryRunner.query(
      `ALTER TABLE "waybills" ADD CONSTRAINT "UQ_waybills_waybill_code" UNIQUE ("waybill_code")`,
    );
  }
}

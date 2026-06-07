import { MigrationInterface, QueryRunner } from 'typeorm';

export class WaybillSplitsLoadStatus1716680000016 implements MigrationInterface {
  name = 'WaybillSplitsLoadStatus1716680000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "waybill_splits"
      ADD COLUMN IF NOT EXISTS "load_status" character varying(32) NOT NULL DEFAULT 'WAITING_LOAD'
    `);
    await queryRunner.query(`
      UPDATE "waybill_splits"
      SET "load_status" = 'WAITING_LOAD'
      WHERE "load_status" IS NULL OR "load_status" = ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "waybill_splits" DROP COLUMN IF EXISTS "load_status"`);
  }
}

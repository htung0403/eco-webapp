import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrucksVendorColumns1716680000006 implements MigrationInterface {
  name = 'AddTrucksVendorColumns1716680000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "ten_lai_xe" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "nha_xe" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "bks" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "loai_xe" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "khu_vuc" character varying`);
    await queryRunner.query(`COMMENT ON COLUMN "trucks"."ten_lai_xe" IS 'Tên lái xe'`);
    await queryRunner.query(`COMMENT ON COLUMN "trucks"."nha_xe" IS 'Nhà xe'`);
    await queryRunner.query(`COMMENT ON COLUMN "trucks"."bks" IS 'BKS (biển kiểm soát)'`);
    await queryRunner.query(`COMMENT ON COLUMN "trucks"."loai_xe" IS 'Loại xe'`);
    await queryRunner.query(`COMMENT ON COLUMN "trucks"."khu_vuc" IS 'Khu vực'`);
    await queryRunner.query(
      `UPDATE "trucks" SET "bks" = "license_plate" WHERE "bks" IS NULL AND "license_plate" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "khu_vuc"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "loai_xe"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "bks"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "nha_xe"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "ten_lai_xe"`);
  }
}

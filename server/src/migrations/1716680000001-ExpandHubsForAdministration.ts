import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandHubsForAdministration1716680000001 implements MigrationInterface {
  name = 'ExpandHubsForAdministration1716680000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."hubs_type_enum" AS ENUM('WAREHOUSE', 'HUB', 'POST_OFFICE'); EXCEPTION WHEN duplicate_object THEN null; END $$`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "type" "public"."hubs_type_enum" NOT NULL DEFAULT 'HUB'`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "province" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "district" character varying NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "ward" character varying`);
    await queryRunner.query(`ALTER TABLE "hubs" ALTER COLUMN "coordinates" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "phone" character varying`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "manager_name" character varying`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "manager_phone" character varying`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "latitude" double precision`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "longitude" double precision`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "hubs" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`);
    await queryRunner.query(`UPDATE "hubs" SET "province" = COALESCE(NULLIF("province", ''), CASE WHEN "code" = 'HAN' THEN 'Hà Nội' WHEN "code" = 'HCM' THEN 'TP.HCM' ELSE '' END), "district" = COALESCE(NULLIF("district", ''), '')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "longitude"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "manager_phone"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "manager_name"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "phone"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "ward"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "district"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "province"`);
    await queryRunner.query(`ALTER TABLE "hubs" DROP COLUMN IF EXISTS "type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."hubs_type_enum"`);
  }
}

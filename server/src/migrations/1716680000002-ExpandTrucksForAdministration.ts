import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandTrucksForAdministration1716680000002 implements MigrationInterface {
  name = 'ExpandTrucksForAdministration1716680000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "plate_number" character varying`);
    await queryRunner.query(`UPDATE "trucks" SET "plate_number" = "license_plate" WHERE "plate_number" IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_trucks_plate_number" ON "trucks" ("plate_number") WHERE "plate_number" IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "truck_type" character varying NOT NULL DEFAULT 'INTERNAL'`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "ownership_type" character varying NOT NULL DEFAULT 'INTERNAL'`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "capacity_kg" double precision`);
    await queryRunner.query(`UPDATE "trucks" SET "capacity_kg" = "payload" WHERE "capacity_kg" IS NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "volume_m3" double precision`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "hub_id" bigint`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "assigned_driver_id" bigint`);
    await queryRunner.query(`UPDATE "trucks" SET "assigned_driver_id" = "driver_id" WHERE "assigned_driver_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "brand" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "model" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "year" integer`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "registration_expired_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "maintenance_due_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "last_maintenance_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "note" character varying`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "created_by" bigint`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "updated_by" bigint`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trucks_plate_number"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "updated_by"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "created_by"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "note"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "last_maintenance_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "maintenance_due_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "registration_expired_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "year"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "model"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "brand"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "assigned_driver_id"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "hub_id"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "volume_m3"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "capacity_kg"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "ownership_type"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "truck_type"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "plate_number"`);
  }
}

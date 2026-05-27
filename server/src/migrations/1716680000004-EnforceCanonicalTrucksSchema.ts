import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceCanonicalTrucksSchema1716680000004 implements MigrationInterface {
  name = 'EnforceCanonicalTrucksSchema1716680000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'plate_number') THEN EXECUTE 'UPDATE "trucks" SET "license_plate" = COALESCE("license_plate", "plate_number") WHERE "license_plate" IS NULL'; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'capacity_kg') THEN EXECUTE 'UPDATE "trucks" SET "payload" = COALESCE("payload", "capacity_kg") WHERE "payload" IS NULL'; END IF; END $$;`);
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trucks' AND column_name = 'assigned_driver_id') THEN EXECUTE 'UPDATE "trucks" SET "driver_id" = COALESCE("driver_id", "assigned_driver_id") WHERE "driver_id" IS NULL'; END IF; END $$;`);
    await queryRunner.query(`UPDATE "trucks" SET "fuel_consumption_limit" = 0 WHERE "fuel_consumption_limit" IS NULL`);
    await queryRunner.query(`UPDATE "trucks" SET "status" = 'AVAILABLE' WHERE "status" IS NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "license_plate" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "payload" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "fuel_consumption_limit" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "trucks" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trucks_plate_number"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "plate_number"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "truck_type"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "ownership_type"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "capacity_kg"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "volume_m3"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "hub_id"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "assigned_driver_id"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "brand"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "model"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "year"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "registration_expired_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "maintenance_due_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "last_maintenance_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "note"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "created_by"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "updated_by"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "created_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN IF EXISTS "deleted_at"`);
  }

  public async down(): Promise<void> {
    // Canonical schema is mandatory; rollback intentionally does not recreate removed columns.
  }
}

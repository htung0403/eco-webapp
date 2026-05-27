import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandWaybillsForInventory1716680000003 implements MigrationInterface {
  name = 'ExpandWaybillsForInventory1716680000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."waybills_current_state_enum" ADD VALUE IF NOT EXISTS 'CANCELLED'`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "current_hub_id" bigint`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "priority" character varying NOT NULL DEFAULT 'NORMAL'`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "priority_reason" character varying`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "route_code" character varying`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "cod_amount" numeric NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "package_count" integer NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "note" character varying`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "received_by" bigint`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "returned_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "cancel_reason" character varying`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "last_audit_action" character varying`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "last_audit_user_id" bigint`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "last_audit_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "created_by" bigint`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "updated_by" bigint`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`);
    await queryRunner.query(`UPDATE "waybills" SET "current_hub_id" = COALESCE("current_hub_id", "origin_hub_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_waybills_inventory_state" ON "waybills" ("current_state", "current_hub_id", "deleted_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_waybills_inventory_state"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "updated_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "updated_by"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "created_by"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "last_audit_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "last_audit_user_id"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "last_audit_action"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "cancel_reason"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "cancelled_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "returned_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "delivered_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "received_by"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "received_at"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "note"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "package_count"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "cod_amount"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "route_code"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "priority_reason"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "priority"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "current_hub_id"`);
  }
}

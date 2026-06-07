import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1716680000015 implements MigrationInterface {
  name = 'CreateOrdersTable1716680000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" BIGSERIAL NOT NULL,
        "order_code" character varying(64) NOT NULL,
        "ma_kh" character varying(128),
        "sender_name" character varying(255),
        "sender_phone" character varying(32),
        "sender_address" character varying(500),
        "receiver_name" character varying(255),
        "receiver_phone" character varying(32),
        "receiver_address" character varying(500),
        "origin_hub_id" BIGINT NOT NULL,
        "dest_hub_id" BIGINT NOT NULL,
        "package_count" integer NOT NULL DEFAULT 1,
        "weight" double precision NOT NULL DEFAULT 0,
        "payment_type" character varying(16) NOT NULL DEFAULT 'PP',
        "freight_amount" numeric(18,2) NOT NULL DEFAULT 0,
        "cod_amount" numeric(18,2) NOT NULL DEFAULT 0,
        "cc_amount" numeric(18,2) NOT NULL DEFAULT 0,
        "status" character varying(32) NOT NULL DEFAULT 'CONFIRMED',
        "note" character varying(500),
        "created_by" BIGINT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP,
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_order_code" UNIQUE ("order_code"),
        CONSTRAINT "FK_orders_origin_hub" FOREIGN KEY ("origin_hub_id") REFERENCES "hubs"("id"),
        CONSTRAINT "FK_orders_dest_hub" FOREIGN KEY ("dest_hub_id") REFERENCES "hubs"("id"),
        CONSTRAINT "FK_orders_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_orders_package_count" CHECK ("package_count" > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_order_code" ON "orders" ("order_code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_ma_kh" ON "orders" ("ma_kh")`);
    await queryRunner.query(`ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "order_id" BIGINT`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_waybills_order') THEN
          ALTER TABLE "waybills" ADD CONSTRAINT "FK_waybills_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_waybills_order_id" ON "waybills" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "waybills" DROP CONSTRAINT IF EXISTS "FK_waybills_order"`);
    await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "order_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
  }
}

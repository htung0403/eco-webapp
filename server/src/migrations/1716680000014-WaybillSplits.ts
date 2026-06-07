import { MigrationInterface, QueryRunner } from 'typeorm';

export class WaybillSplits1716680000014 implements MigrationInterface {
  name = 'WaybillSplits1716680000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "waybill_splits" (
        "id" BIGSERIAL NOT NULL,
        "waybill_id" BIGINT NOT NULL,
        "trip_id" BIGINT,
        "truck_id" BIGINT,
        "package_count" integer NOT NULL,
        "loading_position" integer,
        "carrier_label" character varying,
        "note" character varying,
        "created_by" BIGINT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP,
        CONSTRAINT "PK_waybill_splits_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_waybill_splits_waybill" FOREIGN KEY ("waybill_id") REFERENCES "waybills"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_waybill_splits_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_waybill_splits_truck" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_waybill_splits_package_count" CHECK ("package_count" > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_waybill_splits_waybill" ON "waybill_splits" ("waybill_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_waybill_splits_trip" ON "waybill_splits" ("trip_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "waybill_splits"`);
  }
}

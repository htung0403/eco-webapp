import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716680000000 implements MigrationInterface {
  name = 'InitialSchema1716680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const queries = [
      `CREATE TYPE "public"."waybills_payment_type_enum" AS ENUM('PP', 'CC', 'COD')`,
      `CREATE TYPE "public"."waybills_current_state_enum" AS ENUM('RECEIVED', 'IN_WAREHOUSE', 'MANIFEST_CLOSED', 'IN_TRANSIT', 'AT_DEST_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED')`,
      `CREATE TYPE "public"."trips_status_enum" AS ENUM('PLANNED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED')`,
      `CREATE TYPE "public"."reconciliations_remittance_status_enum" AS ENUM('PENDING', 'REMITTED', 'OVERDUE')`,
      `CREATE TABLE "hubs" ("id" BIGSERIAL NOT NULL, "code" character varying NOT NULL, "name" character varying NOT NULL, "address" character varying NOT NULL, "coordinates" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_hubs_code" UNIQUE ("code"), CONSTRAINT "PK_hubs_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "users" ("id" BIGSERIAL NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "full_name" character varying NOT NULL, "phone" character varying NOT NULL, "password_hash" character varying NOT NULL, "role_mask" integer NOT NULL, "hub_id" bigint, "is_active" boolean NOT NULL DEFAULT true, "refresh_token" character varying, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "UQ_users_username" UNIQUE ("username"), CONSTRAINT "PK_users_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "user_hubs" ("user_id" bigint NOT NULL, "hub_id" bigint NOT NULL, CONSTRAINT "PK_user_hubs" PRIMARY KEY ("user_id", "hub_id"))`,
      `CREATE TABLE "waybills" ("id" BIGSERIAL NOT NULL, "waybill_code" character varying NOT NULL, "sender_info" character varying NOT NULL, "receiver_info" character varying NOT NULL, "weight" double precision NOT NULL, "length" double precision NOT NULL, "width" double precision NOT NULL, "height" double precision NOT NULL, "volumetric_weight" double precision NOT NULL, "payment_type" "public"."waybills_payment_type_enum" NOT NULL, "cost_amount" numeric NOT NULL, "current_state" "public"."waybills_current_state_enum" NOT NULL DEFAULT 'RECEIVED', "origin_hub_id" bigint NOT NULL, "dest_hub_id" bigint NOT NULL, "last_mile_driver_id" bigint, "delivery_photo_url" character varying, "delivery_time" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_waybills_waybill_code" UNIQUE ("waybill_code"), CONSTRAINT "PK_waybills_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "manifests" ("id" BIGSERIAL NOT NULL, "manifest_code" character varying NOT NULL, "seal_code" character varying NOT NULL, "origin_hub_id" bigint NOT NULL, "dest_hub_id" bigint NOT NULL, "status" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_manifests_manifest_code" UNIQUE ("manifest_code"), CONSTRAINT "PK_manifests_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "manifest_waybills" ("manifest_id" bigint NOT NULL, "waybill_id" bigint NOT NULL, CONSTRAINT "PK_manifest_waybills" PRIMARY KEY ("manifest_id", "waybill_id"))`,
      `CREATE TABLE "trucks" ("id" BIGSERIAL NOT NULL, "license_plate" character varying NOT NULL, "payload" double precision NOT NULL, "driver_id" bigint, "fuel_consumption_limit" double precision NOT NULL, "status" character varying NOT NULL, CONSTRAINT "UQ_trucks_license_plate" UNIQUE ("license_plate"), CONSTRAINT "PK_trucks_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "trips" ("id" BIGSERIAL NOT NULL, "truck_id" bigint, "manifest_id" bigint NOT NULL, "start_hub_id" bigint NOT NULL, "end_hub_id" bigint NOT NULL, "departure_time" TIMESTAMP NOT NULL, "arrival_time" TIMESTAMP, "status" "public"."trips_status_enum" NOT NULL DEFAULT 'PLANNED', "fuel_actual" double precision, "fuel_cost" numeric, "other_costs" numeric, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_trips_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "expenses" ("id" BIGSERIAL NOT NULL, "trip_id" bigint NOT NULL, CONSTRAINT "PK_expenses_id" PRIMARY KEY ("id"))`,
      `CREATE TABLE "reconciliations" ("id" BIGSERIAL NOT NULL, "hub_id" bigint NOT NULL, "reconciliation_date" date NOT NULL, "cod_cash_held" numeric NOT NULL, "cc_cash_held" numeric NOT NULL, "total_remitted" numeric NOT NULL, "remittance_status" "public"."reconciliations_remittance_status_enum" NOT NULL DEFAULT 'PENDING', "remitted_at" TIMESTAMP, CONSTRAINT "PK_reconciliations_id" PRIMARY KEY ("id"))`,
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_hub" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "user_hubs" ADD CONSTRAINT "FK_user_hubs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE "user_hubs" ADD CONSTRAINT "FK_user_hubs_hub" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE "waybills" ADD CONSTRAINT "FK_waybills_origin_hub" FOREIGN KEY ("origin_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "waybills" ADD CONSTRAINT "FK_waybills_dest_hub" FOREIGN KEY ("dest_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "waybills" ADD CONSTRAINT "FK_waybills_last_mile_driver" FOREIGN KEY ("last_mile_driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "manifests" ADD CONSTRAINT "FK_manifests_origin_hub" FOREIGN KEY ("origin_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "manifests" ADD CONSTRAINT "FK_manifests_dest_hub" FOREIGN KEY ("dest_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "manifest_waybills" ADD CONSTRAINT "FK_manifest_waybills_manifest" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE "manifest_waybills" ADD CONSTRAINT "FK_manifest_waybills_waybill" FOREIGN KEY ("waybill_id") REFERENCES "waybills"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE "trucks" ADD CONSTRAINT "FK_trucks_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_trips_truck" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_trips_manifest" FOREIGN KEY ("manifest_id") REFERENCES "manifests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_trips_start_hub" FOREIGN KEY ("start_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "trips" ADD CONSTRAINT "FK_trips_end_hub" FOREIGN KEY ("end_hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_trip" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE "reconciliations" ADD CONSTRAINT "FK_reconciliations_hub" FOREIGN KEY ("hub_id") REFERENCES "hubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    ];

    for (const query of queries) {
      await queryRunner.query(query);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const queries = [
      `ALTER TABLE "reconciliations" DROP CONSTRAINT "FK_reconciliations_hub"`,
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_expenses_trip"`,
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_trips_end_hub"`,
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_trips_start_hub"`,
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_trips_manifest"`,
      `ALTER TABLE "trips" DROP CONSTRAINT "FK_trips_truck"`,
      `ALTER TABLE "trucks" DROP CONSTRAINT "FK_trucks_driver"`,
      `ALTER TABLE "manifest_waybills" DROP CONSTRAINT "FK_manifest_waybills_waybill"`,
      `ALTER TABLE "manifest_waybills" DROP CONSTRAINT "FK_manifest_waybills_manifest"`,
      `ALTER TABLE "manifests" DROP CONSTRAINT "FK_manifests_dest_hub"`,
      `ALTER TABLE "manifests" DROP CONSTRAINT "FK_manifests_origin_hub"`,
      `ALTER TABLE "waybills" DROP CONSTRAINT "FK_waybills_last_mile_driver"`,
      `ALTER TABLE "waybills" DROP CONSTRAINT "FK_waybills_dest_hub"`,
      `ALTER TABLE "waybills" DROP CONSTRAINT "FK_waybills_origin_hub"`,
      `ALTER TABLE "user_hubs" DROP CONSTRAINT "FK_user_hubs_hub"`,
      `ALTER TABLE "user_hubs" DROP CONSTRAINT "FK_user_hubs_user"`,
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_hub"`,
      `DROP TABLE "reconciliations"`,
      `DROP TABLE "expenses"`,
      `DROP TABLE "trips"`,
      `DROP TABLE "trucks"`,
      `DROP TABLE "manifest_waybills"`,
      `DROP TABLE "manifests"`,
      `DROP TABLE "waybills"`,
      `DROP TABLE "user_hubs"`,
      `DROP TABLE "users"`,
      `DROP TABLE "hubs"`,
      `DROP TYPE "public"."reconciliations_remittance_status_enum"`,
      `DROP TYPE "public"."trips_status_enum"`,
      `DROP TYPE "public"."waybills_current_state_enum"`,
      `DROP TYPE "public"."waybills_payment_type_enum"`,
    ];

    for (const query of queries) {
      await queryRunner.query(query);
    }
  }
}


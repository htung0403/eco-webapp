import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersTable1716680000008 implements MigrationInterface {
  name = 'CreateCustomersTable1716680000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" BIGSERIAL NOT NULL,
        "customer_type" character varying(32) NOT NULL DEFAULT 'KHACH_HANG',
        "is_suspended" boolean NOT NULL DEFAULT false,
        "code" character varying(64) NOT NULL,
        "name" character varying(255) NOT NULL,
        "short_name" character varying(255),
        "english_name" character varying(255),
        "address" character varying(500),
        "tax_id" character varying(32),
        "phone_landline" character varying(32),
        "id_number" character varying(64),
        "mobile" character varying(32),
        "email" character varying(255),
        "bank_name" character varying(255),
        "bank_account" character varying(64),
        "bank_account_holder" character varying(255),
        "manager_name" character varying(128),
        "delivery_handler" character varying(128),
        "contact_person" character varying(255),
        "region" character varying(128),
        "mechanism" character varying(64),
        "portal_password" character varying(255),
        "credit_type" character varying(16),
        "contract_code" character varying(64),
        "price_table" character varying(128),
        "contact_address" character varying(500),
        "receiver_hcm" character varying(255),
        "address_hcm" character varying(500),
        "phone_hcm" character varying(32),
        "receiver_dng" character varying(255),
        "address_dng" character varying(500),
        "phone_dng" character varying(32),
        "destination_province" character varying(128),
        "discount_percent" numeric(8,2) NOT NULL DEFAULT 0,
        "status" character varying(32) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_customers_code" UNIQUE ("code"),
        CONSTRAINT "PK_customers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customers_name" ON "customers" ("name")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customers_mobile" ON "customers" ("mobile")`);

    await queryRunner.query(`
      CREATE OR REPLACE VIEW "v_customer_list" AS
      SELECT
        c.id,
        c.customer_type,
        c.is_suspended,
        c.status,
        c.code,
        c.name,
        c.short_name,
        c.english_name,
        c.address,
        c.tax_id,
        c.phone_landline,
        c.id_number,
        c.mobile,
        c.email,
        c.bank_name,
        c.bank_account,
        c.bank_account_holder,
        c.manager_name,
        c.delivery_handler,
        c.contact_person,
        c.region,
        c.destination_province,
        c.mechanism,
        c.credit_type,
        c.contract_code,
        c.price_table,
        c.discount_percent,
        c.contact_address,
        c.receiver_hcm,
        c.address_hcm,
        c.phone_hcm,
        c.receiver_dng,
        c.address_dng,
        c.phone_dng,
        c.created_at,
        c.updated_at,
        0::integer AS waybill_count
      FROM customers c
      WHERE c.deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS "v_customer_list"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "customers"`);
  }
}

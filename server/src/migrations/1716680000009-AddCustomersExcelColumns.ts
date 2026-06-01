import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomersExcelColumns1716680000009 implements MigrationInterface {
  name = 'AddCustomersExcelColumns1716680000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "destination_province" character varying(128)`);
    await queryRunner.query(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "discount_percent" numeric(8,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "status" character varying(32) NOT NULL DEFAULT 'ACTIVE'`);

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
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "destination_province"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "discount_percent"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "status"`);
  }
}

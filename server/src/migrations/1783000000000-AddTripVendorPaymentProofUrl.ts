import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTripVendorPaymentProofUrl1783000000000 implements MigrationInterface {
  name = 'AddTripVendorPaymentProofUrl1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trips"
      ADD COLUMN IF NOT EXISTS "vendor_payment_proof_url" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "trips" DROP COLUMN IF EXISTS "vendor_payment_proof_url"`);
  }
}

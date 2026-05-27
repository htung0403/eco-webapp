import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorsConfiguration1716680000005 implements MigrationInterface {
  name = 'AddVendorsConfiguration1716680000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id BIGSERIAL PRIMARY KEY,
        code VARCHAR UNIQUE,
        name VARCHAR,
        service_type VARCHAR,
        contact_name VARCHAR,
        phone VARCHAR,
        email VARCHAR,
        province VARCHAR,
        contract_type VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'ACTIVE',
        routes JSONB,
        pricing JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_vendors_service_type ON vendors(service_type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_vendors_province ON vendors(province)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_vendors_contract_type ON vendors(contract_type)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_contract_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_province`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_service_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_vendors_status`);
    await queryRunner.query(`DROP TABLE IF EXISTS vendors`);
  }
}

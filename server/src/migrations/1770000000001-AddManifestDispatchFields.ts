import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManifestDispatchFields1770000000001 implements MigrationInterface {
  name = 'AddManifestDispatchFields1770000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "manifest_waybills" ADD COLUMN IF NOT EXISTS "dispatch_fields" jsonb');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "manifest_waybills" DROP COLUMN IF EXISTS "dispatch_fields"');
  }
}

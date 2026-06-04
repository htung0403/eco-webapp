import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowTripWithoutManifest1770000000000 implements MigrationInterface {
  name = 'AllowTripWithoutManifest1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trips" ALTER COLUMN "manifest_id" DROP NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "trips" ALTER COLUMN "manifest_id" SET NOT NULL');
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaybillLoadedStatus1773000000000 implements MigrationInterface {
  name = 'AddWaybillLoadedStatus1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "waybills_current_state_enum" ADD VALUE IF NOT EXISTS 'LOADED'`);
  }

  public async down(): Promise<void> {
    // PostgreSQL không hỗ trợ xóa giá trị enum an toàn — giữ LOADED nếu rollback.
  }
}

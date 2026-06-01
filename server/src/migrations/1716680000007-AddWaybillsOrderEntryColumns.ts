import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaybillsOrderEntryColumns1716680000007 implements MigrationInterface {
  name = 'AddWaybillsOrderEntryColumns1716680000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "sender_name" character varying(255);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "sender_phone" character varying(32);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "sender_address" character varying(500);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "receiver_name" character varying(255);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "receiver_phone" character varying(32);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "receiver_address" character varying(500);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "ma_kh" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "huyen" character varying(255);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "noi_den" character varying(64);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "loai_bp" character varying(32);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "dich_vu" character varying(64);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "gio_hang" character varying(16);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "loai_giao_hang" character varying(64);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "nvgn" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "the_tich_m3" double precision;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "don_gia" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "don_gia_don_vi" character varying(16) DEFAULT 'Kg';
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "dich_vu_gia_tang" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "so_khoang" character varying(64);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "noi_dung" character varying(500);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "xe_lay" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "buu_ta_lay" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "xe_phat" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "buu_ta_phat" character varying(128);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "dvdb" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "ngay_di" date;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "cuoc_chinh" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "tong_cuoc" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "giam_gia" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "thanh_toan" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "thue_suat" character varying(16);
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "vat_amount" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "co_vat" boolean DEFAULT false;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "freight_amount" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "cc_amount" numeric(18,2) DEFAULT 0;
      ALTER TABLE "waybills" ADD COLUMN IF NOT EXISTS "expected_delivery_at" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      'expected_delivery_at',
      'cc_amount',
      'freight_amount',
      'co_vat',
      'vat_amount',
      'thue_suat',
      'thanh_toan',
      'giam_gia',
      'tong_cuoc',
      'cuoc_chinh',
      'ngay_di',
      'dvdb',
      'buu_ta_phat',
      'xe_phat',
      'buu_ta_lay',
      'xe_lay',
      'noi_dung',
      'so_khoang',
      'dich_vu_gia_tang',
      'don_gia_don_vi',
      'don_gia',
      'the_tich_m3',
      'nvgn',
      'loai_giao_hang',
      'gio_hang',
      'dich_vu',
      'loai_bp',
      'noi_den',
      'huyen',
      'ma_kh',
      'receiver_address',
      'receiver_phone',
      'receiver_name',
      'sender_address',
      'sender_phone',
      'sender_name',
    ];
    for (const column of columns) {
      await queryRunner.query(`ALTER TABLE "waybills" DROP COLUMN IF EXISTS "${column}"`);
    }
  }
}

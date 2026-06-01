-- Bổ sung cột bảng waybills cho màn Nhập đơn mới (/warehouse/orders/new)
-- Chạy trên Supabase SQL Editor hoặc psql. An toàn chạy lại: IF NOT EXISTS.

-- =============================================================================
-- 1. Liên hệ tách cột (backend đang gán nhưng DB có thể chưa có)
-- =============================================================================
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(32);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS sender_address VARCHAR(500);

ALTER TABLE waybills ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(32);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS receiver_address VARCHAR(500);

-- =============================================================================
-- 2. Khách hàng / địa điểm (form: Mã KH, Huyện, Nơi đến)
-- =============================================================================
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS ma_kh VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS huyen VARCHAR(255);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS noi_den VARCHAR(64);

-- =============================================================================
-- 3. Hàng hóa & dịch vụ (form: Loại BP, Dịch vụ, Giờ, Giao hàng, NVGN...)
-- =============================================================================
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS loai_bp VARCHAR(32);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS dich_vu VARCHAR(64);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS gio_hang VARCHAR(16);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS loai_giao_hang VARCHAR(64);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS nvgn VARCHAR(128);

ALTER TABLE waybills ADD COLUMN IF NOT EXISTS the_tich_m3 DOUBLE PRECISION;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS don_gia NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS don_gia_don_vi VARCHAR(16) DEFAULT 'Kg';
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS dich_vu_gia_tang VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS so_khoang VARCHAR(64);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS noi_dung VARCHAR(500);

ALTER TABLE waybills ADD COLUMN IF NOT EXISTS xe_lay VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS buu_ta_lay VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS xe_phat VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS buu_ta_phat VARCHAR(128);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS dvdb NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS ngay_di DATE;

-- =============================================================================
-- 4. Thanh toán (form: Cước chính, Tổng cước, Giảm giá, VAT...)
-- =============================================================================
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS cuoc_chinh NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS tong_cuoc NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS giam_gia NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS thanh_toan NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS thue_suat VARCHAR(16);
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS co_vat BOOLEAN DEFAULT FALSE;

-- Cước tách PP/CC/COD (service NestJS đã dùng, có thể chưa có cột)
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS freight_amount NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS cc_amount NUMERIC(18, 2) DEFAULT 0;
ALTER TABLE waybills ADD COLUMN IF NOT EXISTS expected_delivery_at TIMESTAMP;

-- =============================================================================
-- Ghi chú cột
-- =============================================================================
COMMENT ON COLUMN waybills.ma_kh IS 'Mã khách hàng (Mã KH)';
COMMENT ON COLUMN waybills.loai_bp IS 'Loại bưu phẩm (CPN, ...)';
COMMENT ON COLUMN waybills.dich_vu IS 'Dịch vụ vận chuyển (Đường bộ, ...)';
COMMENT ON COLUMN waybills.gio_hang IS 'Khung giờ hẹn (8h, 16h, ...)';
COMMENT ON COLUMN waybills.loai_giao_hang IS 'Hình thức giao (Văn phòng, Tận nơi, ...)';
COMMENT ON COLUMN waybills.nvgn IS 'Nhân viên giao nhận / người nhập';
COMMENT ON COLUMN waybills.the_tich_m3 IS 'Thể tích m3';
COMMENT ON COLUMN waybills.noi_dung IS 'Nội dung hàng hóa';
COMMENT ON COLUMN waybills.cuoc_chinh IS 'Cước chính';
COMMENT ON COLUMN waybills.tong_cuoc IS 'Tổng cước';
COMMENT ON COLUMN waybills.thanh_toan IS 'Số tiền thanh toán';

-- =============================================================================
-- Backfill nhẹ từ cột hiện có (tùy chọn, không bắt buộc)
-- =============================================================================
UPDATE waybills
SET
  cuoc_chinh = COALESCE(cuoc_chinh, cost_amount::numeric, 0),
  tong_cuoc = COALESCE(tong_cuoc, cost_amount::numeric, 0),
  thanh_toan = COALESCE(thanh_toan, cost_amount::numeric, 0),
  freight_amount = COALESCE(freight_amount, cost_amount::numeric, 0)
WHERE deleted_at IS NULL;

-- Tách sender_info / receiver_info dạng "name | phone | address" nếu cột mới đang trống
UPDATE waybills
SET
  sender_name = COALESCE(NULLIF(sender_name, ''), NULLIF(split_part(sender_info, ' | ', 1), '')),
  sender_phone = COALESCE(NULLIF(sender_phone, ''), NULLIF(split_part(sender_info, ' | ', 2), '')),
  sender_address = COALESCE(NULLIF(sender_address, ''), NULLIF(split_part(sender_info, ' | ', 3), ''))
WHERE sender_info IS NOT NULL
  AND (sender_name IS NULL OR sender_name = '');

UPDATE waybills
SET
  receiver_name = COALESCE(NULLIF(receiver_name, ''), NULLIF(split_part(receiver_info, ' | ', 1), '')),
  receiver_phone = COALESCE(NULLIF(receiver_phone, ''), NULLIF(split_part(receiver_info, ' | ', 2), '')),
  receiver_address = COALESCE(NULLIF(receiver_address, ''), NULLIF(split_part(receiver_info, ' | ', 3), ''))
WHERE receiver_info IS NOT NULL
  AND (receiver_name IS NULL OR receiver_name = '');

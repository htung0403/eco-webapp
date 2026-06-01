-- Kiểm tra bảng waybills trên Supabase đã đủ cột cho Nhập đơn mới chưa
-- Chạy trong Supabase → SQL Editor. Kết quả: thiếu = 0 dòng → đủ cột mới.

WITH required AS (
  SELECT unnest(ARRAY[
    -- Có sẵn từ schema gốc + migration inventory (không cần add script)
  -- 'waybill_code', 'sender_info', 'receiver_info', 'weight', 'length', 'width', 'height',
  -- 'volumetric_weight', 'payment_type', 'cost_amount', 'current_state',
  -- 'origin_hub_id', 'dest_hub_id', 'package_count', 'note', 'cod_amount', 'deleted_at',
    -- Cột cần từ add_waybills_nhap_don_columns.sql
    'sender_name', 'sender_phone', 'sender_address',
    'receiver_name', 'receiver_phone', 'receiver_address',
    'ma_kh', 'huyen', 'noi_den',
    'loai_bp', 'dich_vu', 'gio_hang', 'loai_giao_hang', 'nvgn',
    'the_tich_m3', 'don_gia', 'don_gia_don_vi', 'dich_vu_gia_tang', 'so_khoang', 'noi_dung',
    'xe_lay', 'buu_ta_lay', 'xe_phat', 'buu_ta_phat', 'dvdb', 'ngay_di',
    'cuoc_chinh', 'tong_cuoc', 'giam_gia', 'thanh_toan', 'thue_suat', 'vat_amount', 'co_vat',
    'freight_amount', 'cc_amount', 'expected_delivery_at'
  ]) AS column_name
)
SELECT r.column_name AS thieu_cot
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'waybills'
  AND c.column_name = r.column_name
WHERE c.column_name IS NULL
ORDER BY 1;

-- Xem toàn bộ cột waybills hiện có:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'waybills'
-- ORDER BY ordinal_position;

-- Tùy chọn: cập nhật view đếm số vận đơn theo ma_kh
-- Chạy SAU add_waybills_nhap_don_columns.sql (phải có cột waybills.ma_kh)

CREATE OR REPLACE VIEW v_customer_list AS
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
  COALESCE(w.waybill_count, 0)::INTEGER AS waybill_count
FROM customers c
LEFT JOIN (
  SELECT
    UPPER(TRIM(ma_kh)) AS ma_kh_key,
    COUNT(*)::BIGINT AS waybill_count
  FROM waybills
  WHERE deleted_at IS NULL
    AND ma_kh IS NOT NULL
    AND TRIM(ma_kh) <> ''
  GROUP BY UPPER(TRIM(ma_kh))
) w ON w.ma_kh_key = UPPER(TRIM(c.code))
WHERE c.deleted_at IS NULL;

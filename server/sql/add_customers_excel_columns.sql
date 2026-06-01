-- Bổ sung cột customers theo file Excel danh sách KH
-- Chạy SAU create_customers_table_and_view.sql. An toàn chạy lại: IF NOT EXISTS.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS destination_province VARCHAR(128);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(8, 2) NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';

COMMENT ON COLUMN customers.destination_province IS 'Tỉnh đến (Excel: TỈNH ĐẾN)';
COMMENT ON COLUMN customers.discount_percent IS 'Chiết khấu % (Excel: CHIẾT KHẤU)';
COMMENT ON COLUMN customers.status IS 'Trạng thái: ACTIVE | SUSPENDED | INACTIVE';

-- Đồng bộ is_suspended từ status (nếu đã có dữ liệu cũ)
UPDATE customers
SET status = CASE WHEN is_suspended THEN 'SUSPENDED' ELSE 'ACTIVE' END
WHERE status IS NULL OR TRIM(status) = '';

-- View danh sách (không JOIN waybills — tránh lỗi thiếu cột ma_kh)
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
  0::INTEGER AS waybill_count
FROM customers c
WHERE c.deleted_at IS NULL;

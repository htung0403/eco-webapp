-- Bảng khách hàng (form legacy KHÁCH HÀNG) + view danh sách KH
-- Chạy trên Supabase SQL Editor. An toàn chạy lại: IF NOT EXISTS / OR REPLACE.

-- =============================================================================
-- 1. Bảng customers
-- =============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  customer_type VARCHAR(32) NOT NULL DEFAULT 'KHACH_HANG',
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(255),
  english_name VARCHAR(255),
  address VARCHAR(500),
  tax_id VARCHAR(32),
  phone_landline VARCHAR(32),
  id_number VARCHAR(64),
  mobile VARCHAR(32),
  email VARCHAR(255),
  bank_name VARCHAR(255),
  bank_account VARCHAR(64),
  bank_account_holder VARCHAR(255),
  manager_name VARCHAR(128),
  delivery_handler VARCHAR(128),
  contact_person VARCHAR(255),
  region VARCHAR(128),
  mechanism VARCHAR(64),
  portal_password VARCHAR(255),
  credit_type VARCHAR(16),
  contract_code VARCHAR(64),
  price_table VARCHAR(128),
  contact_address VARCHAR(500),
  receiver_hcm VARCHAR(255),
  address_hcm VARCHAR(500),
  phone_hcm VARCHAR(32),
  receiver_dng VARCHAR(255),
  address_dng VARCHAR(500),
  phone_dng VARCHAR(32),
  destination_province VARCHAR(128),
  discount_percent NUMERIC(8, 2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  CONSTRAINT uq_customers_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers (mobile);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers (deleted_at);

COMMENT ON TABLE customers IS 'Danh mục khách hàng (form KHÁCH HÀNG legacy)';
COMMENT ON COLUMN customers.customer_type IS 'Loại: KHACH_HANG, ...';
COMMENT ON COLUMN customers.is_suspended IS 'Tạm dừng';
COMMENT ON COLUMN customers.code IS 'Mã KH (Mã)';
COMMENT ON COLUMN customers.name IS 'Tên';
COMMENT ON COLUMN customers.short_name IS 'Tên tắt';
COMMENT ON COLUMN customers.english_name IS 'Tiếng Anh';
COMMENT ON COLUMN customers.address IS 'Địa chỉ';
COMMENT ON COLUMN customers.tax_id IS 'MST';
COMMENT ON COLUMN customers.phone_landline IS 'Số ĐT';
COMMENT ON COLUMN customers.id_number IS 'Số CMT';
COMMENT ON COLUMN customers.mobile IS 'Di động';
COMMENT ON COLUMN customers.bank_name IS 'Ngân hàng';
COMMENT ON COLUMN customers.bank_account IS 'Tài khoản';
COMMENT ON COLUMN customers.bank_account_holder IS 'Chủ t.khoản';
COMMENT ON COLUMN customers.manager_name IS 'Quản lý';
COMMENT ON COLUMN customers.delivery_handler IS 'Giao nhận';
COMMENT ON COLUMN customers.contact_person IS 'Liên hệ';
COMMENT ON COLUMN customers.region IS 'Khu vực';
COMMENT ON COLUMN customers.mechanism IS 'Cơ chế';
COMMENT ON COLUMN customers.portal_password IS 'Mật khẩu cổng KH (lưu tạm, nên hash ở app)';
COMMENT ON COLUMN customers.credit_type IS 'Công nợ (vd: K)';
COMMENT ON COLUMN customers.contract_code IS 'Mã CT';
COMMENT ON COLUMN customers.price_table IS 'Bảng cước';
COMMENT ON COLUMN customers.contact_address IS 'Đchi LH';
COMMENT ON COLUMN customers.receiver_hcm IS 'Nhận HCM';
COMMENT ON COLUMN customers.address_hcm IS 'ĐC HCM';
COMMENT ON COLUMN customers.phone_hcm IS 'ĐT HCM';
COMMENT ON COLUMN customers.receiver_dng IS 'Nhận DNG';
COMMENT ON COLUMN customers.address_dng IS 'ĐC DNG';
COMMENT ON COLUMN customers.phone_dng IS 'ĐT DNG';
COMMENT ON COLUMN customers.destination_province IS 'Tỉnh đến (Excel: TỈNH ĐẾN)';
COMMENT ON COLUMN customers.discount_percent IS 'Chiết khấu % (Excel: CHIẾT KHẤU)';
COMMENT ON COLUMN customers.status IS 'Trạng thái (Excel: ACTIVE/SUSPENDED)';

-- =============================================================================
-- 2. View danh sách KH (không cần waybills.ma_kh — số đơn tính ở API NestJS)
-- Sau khi có cột ma_kh: chạy recreate_v_customer_list_with_waybill_count.sql (tùy chọn)
-- =============================================================================
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

COMMENT ON VIEW v_customer_list IS 'Danh sách KH; waybill_count=0 tại view — API đếm đơn khi có ma_kh';

-- Mẫu dữ liệu (tùy chọn, theo form legacy):
-- INSERT INTO customers (
--   code, name, short_name, delivery_handler, mechanism, credit_type, contract_code, price_table, address_hcm, phone_hcm
-- ) VALUES (
--   'AQUAN48', 'A Quân', 'A Quân -CPN48h', 'ADMIN', 'n', 'K', 'AQUAN48', 'Cước cpn 48h', '137 Hoàng Hoa Thám, P.', '0983 668 309'
-- ) ON CONFLICT (code) DO NOTHING;

-- Bảng Đơn hàng (orders) — tách khỏi vận đơn (waybills)
-- 1 đơn hàng có thể có nhiều kiện, chia lên nhiều xe/chuyến qua waybill_splits
-- Chạy trên Supabase SQL Editor. An toàn chạy lại: IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_code VARCHAR(64) NOT NULL UNIQUE,
  ma_kh VARCHAR(128),
  sender_name VARCHAR(255),
  sender_phone VARCHAR(32),
  sender_address VARCHAR(500),
  receiver_name VARCHAR(255),
  receiver_phone VARCHAR(32),
  receiver_address VARCHAR(500),
  origin_hub_id BIGINT NOT NULL REFERENCES hubs(id),
  dest_hub_id BIGINT NOT NULL REFERENCES hubs(id),
  package_count INT NOT NULL DEFAULT 1 CHECK (package_count > 0),
  weight DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_type VARCHAR(16) NOT NULL DEFAULT 'PP',
  freight_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  cod_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  cc_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED',
  note VARCHAR(500),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders (order_code);
CREATE INDEX IF NOT EXISTS idx_orders_ma_kh ON orders (ma_kh);
CREATE INDEX IF NOT EXISTS idx_orders_origin_hub ON orders (origin_hub_id);
CREATE INDEX IF NOT EXISTS idx_orders_dest_hub ON orders (dest_hub_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

COMMENT ON TABLE orders IS 'Đơn hàng gốc — hạch toán và truy vết trước khi chia kiện lên xe/chuyến';
COMMENT ON COLUMN orders.order_code IS 'Mã đơn hàng (DH...) — khác mã vận đơn ECO...';

ALTER TABLE waybills ADD COLUMN IF NOT EXISTS order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_waybills_order_id ON waybills (order_id);

-- Backfill: tạo đơn hàng cho vận đơn cũ chưa có order_id
INSERT INTO orders (
  order_code,
  ma_kh,
  sender_name,
  sender_phone,
  sender_address,
  receiver_name,
  receiver_phone,
  receiver_address,
  origin_hub_id,
  dest_hub_id,
  package_count,
  weight,
  payment_type,
  freight_amount,
  cod_amount,
  cc_amount,
  status,
  note,
  created_at
)
SELECT
  'DH-' || w.waybill_code,
  w.ma_kh,
  w.sender_name,
  w.sender_phone,
  w.sender_address,
  w.receiver_name,
  w.receiver_phone,
  w.receiver_address,
  w.origin_hub_id,
  w.dest_hub_id,
  GREATEST(1, COALESCE(w.package_count, 1)),
  COALESCE(w.weight, 0),
  COALESCE(w.payment_type::text, 'PP'),
  COALESCE(w.freight_amount, w.cost_amount, 0),
  COALESCE(w.cod_amount, 0),
  COALESCE(w.cc_amount, 0),
  'CONFIRMED',
  w.note,
  COALESCE(w.created_at, NOW())
FROM waybills w
WHERE w.deleted_at IS NULL
  AND w.order_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.order_code = 'DH-' || w.waybill_code);

UPDATE waybills w
SET order_id = o.id
FROM orders o
WHERE w.deleted_at IS NULL
  AND w.order_id IS NULL
  AND o.order_code = 'DH-' || w.waybill_code;

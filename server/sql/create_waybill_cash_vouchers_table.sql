-- Phiếu thu/chi gắn vận đơn (Số bill) — chạy trên Supabase

CREATE TABLE IF NOT EXISTS waybill_cash_vouchers (
  id BIGSERIAL PRIMARY KEY,
  waybill_id BIGINT NOT NULL REFERENCES waybills(id) ON DELETE CASCADE,
  waybill_code VARCHAR(64) NOT NULL,
  voucher_type VARCHAR(8) NOT NULL,
  amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  note VARCHAR(1024),
  image_url TEXT,
  created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waybill_cash_vouchers_waybill_id ON waybill_cash_vouchers (waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_cash_vouchers_waybill_code ON waybill_cash_vouchers (waybill_code);

COMMENT ON TABLE waybill_cash_vouchers IS 'Phiếu thu/chi theo số bill vận đơn';

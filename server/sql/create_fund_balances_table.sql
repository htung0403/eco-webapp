-- Số quỹ — chạy trên Supabase (an toàn chạy lại nhiều lần)

CREATE TABLE IF NOT EXISTS fund_balances (
  id BIGSERIAL PRIMARY KEY,
  record_date DATE NOT NULL,
  fund_code VARCHAR(64) NOT NULL,
  fund_name VARCHAR(255) NOT NULL,
  hub_name VARCHAR(255),
  balance_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  note VARCHAR(512),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_balances_record_date ON fund_balances (record_date);
CREATE INDEX IF NOT EXISTS idx_fund_balances_fund_code ON fund_balances (fund_code);

COMMENT ON TABLE fund_balances IS 'Số quỹ tiền mặt theo mã quỹ / bưu cục';

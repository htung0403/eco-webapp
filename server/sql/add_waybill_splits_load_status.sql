-- Trạng thái bốc hàng theo dòng phân xe
ALTER TABLE waybill_splits
  ADD COLUMN IF NOT EXISTS load_status VARCHAR(32) NOT NULL DEFAULT 'WAITING_LOAD';

UPDATE waybill_splits
SET load_status = 'WAITING_LOAD'
WHERE load_status IS NULL OR load_status = '';

COMMENT ON COLUMN waybill_splits.load_status IS 'WAITING_LOAD=Chờ bốc, LOADED=Đã bốc, DEPARTED=Đã di chuyển, ARRIVED=Đã tới';

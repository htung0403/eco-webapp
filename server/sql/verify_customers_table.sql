-- Kiểm tra bảng customers + view v_customer_list trên Supabase
-- Kết quả thieu_cot: 0 dòng → đủ cột. view_ok: 1 dòng → view tồn tại.

WITH required AS (
  SELECT unnest(ARRAY[
    'customer_type', 'is_suspended', 'code', 'name', 'short_name', 'english_name',
    'address', 'tax_id', 'phone_landline', 'id_number', 'mobile', 'email',
    'bank_name', 'bank_account', 'bank_account_holder', 'manager_name', 'delivery_handler',
    'contact_person', 'region', 'mechanism', 'portal_password', 'credit_type',
    'contract_code', 'price_table', 'contact_address',
    'receiver_hcm', 'address_hcm', 'phone_hcm',
    'receiver_dng', 'address_dng', 'phone_dng',
    'destination_province', 'discount_percent', 'status',
    'created_at', 'updated_at', 'deleted_at'
  ]) AS column_name
)
SELECT r.column_name AS thieu_cot
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'customers'
  AND c.column_name = r.column_name
WHERE c.column_name IS NULL
ORDER BY 1;

SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_customer_list'
  ) THEN 'v_customer_list OK' ELSE 'THIEU VIEW v_customer_list' END AS view_ok;

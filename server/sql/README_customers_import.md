# Import danh sách KH (Excel → Supabase)

## So khớp cột Excel ↔ `customers`

| Excel | Cột DB | Ghi chú |
|-------|--------|---------|
| TÊN KH | `name` | Có sẵn |
| TÊN TẮT | `short_name` | Có sẵn |
| TỈNH ĐẾN | `destination_province` | **Thêm mới** |
| ĐỊA CHỈ KHO NHẬN HCM | `address_hcm` | Có sẵn |
| ĐIỆN THOẠI NHẬN | `phone_hcm` | Có sẵn |
| Email | `email` | Có sẵn (Excel trống) |
| LIÊN HỆ | `contact_person` | Có sẵn |
| NV QL | `manager_name` | Có sẵn |
| BẢNG GIÁ | `price_table` | Có sẵn |
| CHIẾT KHẤU | `discount_percent` | **Thêm mới** |
| GIAO NHẬN | `delivery_handler` | Có sẵn |
| Trạng thái | `status` | **Thêm mới** (`ACTIVE`, không dùng `#NAME?`) |
| (không có trên Excel) | `code` | Mã KH sinh từ tên tắt (unique) |

## Thứ tự chạy trên Supabase SQL Editor

1. `create_customers_table_and_view.sql` (bảng + view, **không** cần `waybills.ma_kh`)
2. `add_customers_excel_columns.sql` (nếu bảng cũ thiếu 3 cột Excel)
3. `seed_customers_from_excel.sql` (51 khách hàng)
4. `verify_customers_table.sql` (kiểm tra)

**Tùy chọn** (sau khi có cột vận đơn):

- `add_waybills_nhap_don_columns.sql` → rồi `recreate_v_customer_list_with_waybill_count.sql`
- API NestJS vẫn đếm số đơn theo `ma_kh` khi cột đã có, không bắt buộc chạy view nâng cao.

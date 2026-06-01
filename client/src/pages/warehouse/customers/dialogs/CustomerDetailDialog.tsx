import { createPortal } from 'react-dom';
import { Building2, Edit, Loader2, X } from 'lucide-react';
import type { CustomerRecord } from '../customerFormTypes';

interface Props {
  customer: CustomerRecord | null;
  loading?: boolean;
  onClose: () => void;
  onEdit: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-border/60 py-2 text-[13px] last:border-0">
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value?.trim() || '—'}</span>
    </div>
  );
}

export default function CustomerDetailDialog({ customer, loading, onClose, onEdit }: Props) {
  if (!customer) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-[#f8fafc] shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-foreground">Chi tiết khách hàng</h2>
              <p className="text-[12px] font-bold text-primary">{customer.code}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <Row label="Mã KH" value={customer.code} />
              <Row label="Tên KH" value={customer.name} />
              <Row label="Tên tắt" value={customer.short_name} />
              <Row label="Tỉnh đến" value={customer.destination_province} />
              <Row label="ĐC kho HCM" value={customer.address_hcm} />
              <Row label="ĐT nhận HCM" value={customer.phone_hcm} />
              <Row label="Di động" value={customer.mobile} />
              <Row label="Email" value={customer.email} />
              <Row label="Liên hệ" value={customer.contact_person} />
              <Row label="NV quản lý" value={customer.manager_name} />
              <Row label="Bảng giá" value={customer.price_table} />
              <Row label="Chiết khấu %" value={String(customer.discount_percent ?? 0)} />
              <Row label="Giao nhận" value={customer.delivery_handler} />
              <Row label="Công nợ" value={customer.credit_type} />
              <Row label="Khu vực" value={customer.region} />
              <Row label="Địa chỉ" value={customer.address} />
              <Row label="Trạng thái" value={customer.is_suspended ? 'Tạm dừng' : customer.status || 'ACTIVE'} />
              <Row label="Số đơn" value={String(customer.waybill_count ?? 0)} />
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-white p-4">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">
            Đóng
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90"
          >
            <Edit size={15} />
            Sửa
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { createPortal } from 'react-dom';
import { Building2, CalendarDays, DollarSign, X } from 'lucide-react';
import type { HubReconciliation } from '../types';

interface Props {
  item: HubReconciliation | null;
  onClose: () => void;
}

const money = (value?: string | number | null) => Number(value || 0).toLocaleString('vi-VN');
const remaining = (item: HubReconciliation) => Number(item.cod_cash_held || 0) + Number(item.cc_cash_held || 0) - Number(item.total_remitted || 0);
const hubLabel = (item: HubReconciliation) => item.hub?.code || item.hub?.name || `Hub #${item.hub_id}`;

export default function HubReconciliationDetailDialog({ item, onClose }: Props) {
  if (!item) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <button type="button" aria-label="Đóng" className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex h-screen w-full max-w-[640px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl dialog-slide-in">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Chi tiết đối soát tiền mặt</p>
            <h2 className="truncate text-lg font-black text-foreground">{hubLabel(item)} · {item.reconciliation_date}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-muted/5 px-5 py-3">
              <DollarSign size={16} className="text-primary" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-primary">Số liệu đối soát</span>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
              <Info icon={<Building2 size={14} />} label="Bưu cục/kho" value={hubLabel(item)} />
              <Info icon={<CalendarDays size={14} />} label="Ngày đối soát" value={item.reconciliation_date} />
              <Info label="Tiền COD giữ" value={money(item.cod_cash_held)} />
              <Info label="Tiền CC giữ" value={money(item.cc_cash_held)} />
              <Info label="Tổng đã nộp" value={money(item.total_remitted)} />
              <Info label="Còn phải nộp" value={money(remaining(item))} />
              <Info label="Trạng thái" value={item.remittance_status} />
            </div>
          </section>
        </div>

        <div className="flex shrink-0 justify-start border-t border-border bg-card p-5">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-muted-foreground hover:bg-muted">Đóng</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Info({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-muted/5 p-3"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{icon}{label}</div><p className="mt-1 font-bold text-foreground">{value ?? '—'}</p></div>;
}

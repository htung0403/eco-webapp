import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { HubDropoffWaybillDetail } from '../types';

export default function HubDropoffWaybillDetailDialog({ waybill, onClose, formatHub, renderStatus, renderPayment }: { waybill: HubDropoffWaybillDetail | null; onClose: () => void; formatHub: (id?: string | number | null) => string; renderStatus: (status?: string | null) => ReactNode; renderPayment: (payment?: string | null) => ReactNode }) {
  if (!waybill) return null;
  const info = [
    ['Mã vận đơn', waybill.waybill_code],
    ['Người gửi', waybill.sender_info || '—'],
    ['Người nhận', waybill.receiver_info || '—'],
    ['Hub đi', formatHub(waybill.origin_hub_id)],
    ['Hub đến', formatHub(waybill.dest_hub_id)],
    ['Cân nặng', waybill.weight == null ? '—' : `${waybill.weight} kg`],
    ['Kích thước', `${waybill.length ?? '—'} × ${waybill.width ?? '—'} × ${waybill.height ?? '—'}`],
    ['Trọng lượng quy đổi', waybill.volumetric_weight == null ? '—' : `${waybill.volumetric_weight} kg`],
    ['Cước phí', waybill.cost_amount ?? '—'],
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-base font-black text-foreground">Chi tiết vận đơn</h2><div className="mt-1 flex gap-2">{renderStatus(waybill.current_state)}{renderPayment(waybill.payment_type)}</div></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {info.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/20 p-3"><div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 break-words text-[13px] font-bold text-foreground">{value}</div></div>)}
        </div>
      </section>
    </div>,
    document.body,
  );
}

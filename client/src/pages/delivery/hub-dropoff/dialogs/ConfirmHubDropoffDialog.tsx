import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { HubDropoffWaybill } from '../types';

export default function ConfirmHubDropoffDialog({ waybill, isSubmitting, error, onClose, onConfirm }: { waybill: HubDropoffWaybill | null; isSubmitting: boolean; error: string; onClose: () => void; onConfirm: () => void }) {
  if (!waybill) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-base font-black text-foreground"><AlertTriangle size={18} className="text-primary" />Xác nhận hàng đến hub đích</div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><X size={18} /></button>
        </div>
        <div className="space-y-3 p-5 text-[13px] text-muted-foreground">
          <p>Chuyển vận đơn <b className="text-foreground">{waybill.waybill_code}</b> từ <b className="text-foreground">IN_TRANSIT</b> sang <b className="text-foreground">AT_DEST_HUB</b>.</p>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-600">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-foreground hover:bg-muted disabled:opacity-50">Hủy</button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-black text-white hover:bg-primary/90 disabled:opacity-60">{isSubmitting && <Loader2 size={15} className="animate-spin" />}Xác nhận</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

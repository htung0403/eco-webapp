import { Loader2, X } from 'lucide-react';
import type { EnRouteWaybill } from '../types';

interface Props {
  waybill: EnRouteWaybill | null;
  isSubmitting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function UpdateEnRouteStatusDialog({ waybill, isSubmitting, error, onClose, onConfirm }: Props) {
  if (!waybill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-primary">Cập nhật trạng thái</p>
            <h2 className="text-base font-black text-foreground">{waybill.waybill_code}</h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><X size={18} /></button>
        </div>
        <div className="space-y-3 p-4 text-[13px] text-muted-foreground">
          <p>Xác nhận cập nhật vận đơn đang giao dọc đường sang trạng thái <b className="text-foreground">AT_DEST_HUB</b>.</p>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border p-3">
          <button onClick={onClose} disabled={isSubmitting} className="h-9 rounded-lg border border-border px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">Hủy</button>
          <button onClick={onConfirm} disabled={isSubmitting} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-black text-white hover:bg-primary/90 disabled:opacity-50">{isSubmitting && <Loader2 size={15} className="animate-spin" />}Cập nhật</button>
        </div>
      </div>
    </div>
  );
}

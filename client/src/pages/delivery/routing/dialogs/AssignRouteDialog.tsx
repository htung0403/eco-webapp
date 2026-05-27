import { Loader2, X } from 'lucide-react';
import type { AssignRouteFormState, WaybillRoutingItem } from '../types';

interface Props {
  isOpen: boolean;
  waybill: WaybillRoutingItem | null;
  formState: AssignRouteFormState;
  error: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function AssignRouteDialog({ isOpen, waybill, formState, error, isSubmitting, onChange, onSubmit, onClose }: Props) {
  if (!isOpen || !waybill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-primary">Gán tuyến giao</p>
            <h2 className="text-lg font-black text-foreground">{waybill.waybill_code}</h2>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{error}</div>}
          <label>
            <span className="mb-2 block text-[12px] font-bold text-foreground">Mã tuyến giao</span>
            <input value={formState.route_code} onChange={event => onChange(event.target.value)} placeholder="Nhập mã tuyến backend hỗ trợ" className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-primary/10" />
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="h-10 rounded-lg border border-border px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">Hủy</button>
            <button onClick={onSubmit} disabled={isSubmitting || !formState.route_code.trim()} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} Áp dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

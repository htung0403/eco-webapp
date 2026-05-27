import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import type { RemittanceStatus } from '../types';

interface Props {
  isOpen: boolean;
  isSubmitting: boolean;
  status: RemittanceStatus;
  error: string;
  onChange: (status: RemittanceStatus) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const statuses: RemittanceStatus[] = ['PENDING', 'REMITTED', 'OVERDUE'];

export default function UpdateRemittanceStatusDialog({ isOpen, isSubmitting, status, error, onChange, onClose, onSubmit }: Props) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button type="button" aria-label="Đóng" className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Nộp tiền</p>
            <h2 className="text-lg font-black text-foreground">Cập nhật trạng thái</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</div>}
          <select value={status} onChange={event => onChange(event.target.value as RemittanceStatus)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary">
            {statuses.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 border-t border-border bg-card p-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-60">Đóng</button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex min-w-24 items-center justify-center rounded-xl bg-primary px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Cập nhật'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

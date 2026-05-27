import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { RemittanceStatus } from '../types';

interface Props { isOpen: boolean; isSubmitting: boolean; status: RemittanceStatus; error: string; onChange: (status: RemittanceStatus) => void; onClose: () => void; onSubmit: () => void }
const statuses: RemittanceStatus[] = ['PENDING', 'REMITTED', 'OVERDUE'];
export default function UpdateRemittanceStatusDialog({ isOpen, isSubmitting, status, error, onChange, onClose, onSubmit }: Props) {
  if (!isOpen) return null;
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/><div className="relative w-full max-w-md rounded-2xl border border-border bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Nộp tiền</p><h2 className="text-lg font-black">Cập nhật trạng thái</h2></div><button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18}/></button></div><div className="p-5 space-y-4">{error && <div className="rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</div>}<select value={status} onChange={e => onChange(e.target.value as RemittanceStatus)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none">{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div className="flex justify-end gap-3 border-t border-border bg-card p-5"><button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-muted-foreground">Đóng</button><button disabled={isSubmitting} onClick={onSubmit} className="rounded-xl bg-primary px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">Cập nhật</button></div></div></div>, document.body);
}

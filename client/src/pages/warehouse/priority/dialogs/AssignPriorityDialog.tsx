import { createPortal } from 'react-dom';
import { Flag, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BadgeConfig, PriorityFormState, WaybillPriorityItem } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isSubmitting: boolean;
  waybill: WaybillPriorityItem | null;
  formState: PriorityFormState;
  priorityConfig: Record<string, BadgeConfig>;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const priorityOptions = ['HIGH', 'NORMAL', 'LOW'];
const displayCode = (waybill: WaybillPriorityItem | null) => waybill?.waybill_code || `#${waybill?.id || ''}`;

export default function AssignPriorityDialog({ isOpen, isClosing, isSubmitting, waybill, formState, priorityConfig, onChange, onClose, onSubmit }: Props) {
  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className={clsx('fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300 ease-out', isClosing ? 'opacity-0' : 'animate-in fade-in duration-200')} onClick={onClose} />
      <div className={clsx('relative flex h-screen w-full max-w-[520px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl', isClosing ? 'dialog-slide-out' : 'dialog-slide-in')} onClick={event => event.stopPropagation()}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Cập nhật ưu tiên</p><h2 className="text-lg font-black text-foreground">{displayCode(waybill)}</h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X size={20} /></button></div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5 custom-scrollbar">
          {priorityOptions.map(option => {
            const badge = priorityConfig[option];
            return <button key={option} onClick={() => onChange(option)} className={clsx('flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left transition-all', formState.priority === option ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40')}><span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-black', badge.className)}>{badge.label}</span>{formState.priority === option && <Flag size={18} className="text-primary" />}</button>;
          })}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card p-5"><button onClick={onClose} className="rounded-xl border border-border bg-white px-5 py-3 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Đóng</button><button disabled={isSubmitting} onClick={onSubmit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 size={16} className="animate-spin" />}Áp dụng</button></div>
      </div>
    </div>,
    document.body,
  );
}

import { createPortal } from 'react-dom';
import { Flag, Loader2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BadgeConfig, PriorityFormState, WaybillInventoryItem } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isSubmitting: boolean;
  waybill: WaybillInventoryItem | null;
  formState: PriorityFormState;
  priorityConfig: Record<string, BadgeConfig>;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const priorityOptions = ['HIGH', 'NORMAL', 'LOW'];
const displayCode = (waybill: WaybillInventoryItem | null) => waybill?.waybill_code || waybill?.code || `#${waybill?.id || ''}`;

export default function AssignPriorityDialog({ isOpen, isClosing, isSubmitting, waybill, formState, priorityConfig, onChange, onClose, onSubmit }: Props) {
  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className={clsx('absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity', isClosing ? 'opacity-0' : 'opacity-100')} onClick={onClose} />
      <div className={clsx('relative z-10 w-full max-w-md rounded-t-[28px] border border-border bg-background shadow-2xl transition-all duration-200 sm:rounded-[28px]', isClosing ? 'translate-y-6 opacity-0 sm:scale-95' : 'translate-y-0 opacity-100 sm:scale-100')}>
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Phân loại ưu tiên</p>
            <h2 className="mt-1 text-lg font-black text-foreground">{displayCode(waybill)}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="space-y-3 p-5">
          {priorityOptions.map(option => {
            const badge = priorityConfig[option];
            return (
              <button key={option} onClick={() => onChange(option)} className={clsx('flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all', formState.priority === option ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-white hover:border-primary/40')}>
                <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-black', badge.className)}>{badge.label}</span>
                {formState.priority === option && <Flag size={18} className="text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border bg-card p-5">
          <button disabled={isSubmitting} onClick={onSubmit} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-sm shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 size={16} className="animate-spin" />}Áp dụng ưu tiên</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

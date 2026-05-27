import { createPortal } from 'react-dom';
import { Edit, Info, X } from 'lucide-react';
import type { VendorRecord } from '../types';

interface Props {
  vendor: VendorRecord | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (vendor: VendorRecord) => void;
}

const hiddenKeys = new Set(['password_hash', 'refresh_token', 'profit', 'profit_amount', 'internal_cost', 'internal_notes']);
const formatValue = (value: unknown): string => {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default function VendorDetailDialog({ vendor, canManage, onClose, onEdit }: Props) {
  if (!vendor) return null;
  const entries = Object.entries(vendor).filter(([key]) => !hiddenKeys.has(key.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 text-[15px] font-extrabold text-foreground"><Info size={18} className="text-primary" />Chi tiết NCC</div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => <div key={key} className="rounded-xl border border-border bg-muted/5 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{key}</div><div className="mt-1 break-words text-[13px] font-bold leading-6 text-foreground">{formatValue(value)}</div></div>)}
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-card p-5">
          <button onClick={onClose} className="rounded-xl border border-border bg-white px-5 py-3 text-[13px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground">Đóng</button>
          {canManage && <button onClick={() => onEdit(vendor)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white hover:bg-primary/90"><Edit size={16} />Sửa</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

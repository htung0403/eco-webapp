import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import WaybillPackageSplitEditor, { type WaybillSplitTarget } from '../WaybillPackageSplitEditor';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  waybill: WaybillSplitTarget;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WaybillPackageSplitDialog({ isOpen, isClosing, waybill, onClose, onSaved }: Props) {
  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className={clsx('absolute inset-0 bg-slate-900/50 backdrop-blur-sm', isClosing ? 'opacity-0' : 'opacity-100')} onClick={onClose} />
      <div className={clsx(
        'relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl sm:rounded-[28px]',
        isClosing ? 'translate-y-6 opacity-0 sm:scale-95' : 'translate-y-0 opacity-100',
      )}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
          <p className="text-[13px] font-black text-foreground">Chia đơn theo xe</p>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar p-4">
          <WaybillPackageSplitEditor waybill={waybill} onSaved={onSaved} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

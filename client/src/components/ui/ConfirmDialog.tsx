import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
} | null;

type Props = {
  dialog: ConfirmDialogState;
  isSubmitting?: boolean;
  onClose: () => void;
};

export function ConfirmDialog({ dialog, isSubmitting = false, onClose }: Props) {
  if (!dialog) return null;

  const handleConfirm = async () => {
    const action = dialog.onConfirm;
    onClose();
    await action();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-border bg-card px-5 py-4">
          <div className={clsx('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', dialog.danger ? 'border-red-200 bg-red-50 text-red-500' : 'border-blue-200 bg-blue-50 text-primary')}>
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-foreground">{dialog.title}</h2>
            <p className="mt-1 text-[13px] font-medium leading-6 text-muted-foreground">{dialog.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 bg-white px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-border bg-white px-4 py-2 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Hủy
          </button>
          <button disabled={isSubmitting} onClick={() => void handleConfirm()} className={clsx('rounded-xl px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-colors disabled:opacity-60', dialog.danger ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-primary shadow-primary/20 hover:bg-primary/90')}>
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

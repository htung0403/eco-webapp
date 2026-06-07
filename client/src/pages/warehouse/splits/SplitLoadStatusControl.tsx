import { clsx } from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { SPLIT_LOAD_STATUSES, splitLoadStatusClass, splitLoadStatusLabel, type SplitLoadStatus } from './splitLoadStatus';

interface Props {
  splitId?: string | number | null;
  value?: string | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated?: (status: SplitLoadStatus) => void;
}

export default function SplitLoadStatusControl({ splitId, value, disabled, compact, onUpdated }: Props) {
  const [current, setCurrent] = useState<SplitLoadStatus>((value as SplitLoadStatus) || 'WAITING_LOAD');
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrent((value as SplitLoadStatus) || 'WAITING_LOAD');
  }, [value]);

  async function selectStatus(next: SplitLoadStatus) {
    setOpen(false);
    if (!splitId || next === current) return;
    setIsSaving(true);
    setError('');
    try {
      await apiRequest(`/waybills/splits/${splitId}/load-status`, {
        method: 'PATCH',
        body: { load_status: next },
      });
      setCurrent(next);
      onUpdated?.(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đổi được trạng thái.');
    } finally {
      setIsSaving(false);
    }
  }

  const canChange = Boolean(splitId) && !disabled;

  const triggerButton = (
    <button
      type="button"
      disabled={!canChange || isSaving}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        splitLoadStatusClass(current),
        canChange && 'hover:brightness-95',
        !canChange && 'cursor-default',
        compact && 'px-2 py-0.5 text-[10px]',
      )}
    >
      {isSaving ? <Loader2 size={12} className="animate-spin" /> : null}
      {splitLoadStatusLabel(current)}
      {canChange && <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} />}
    </button>
  );

  return (
    <div className="inline-flex flex-col items-start gap-1">
      {canChange ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="z-[10000] w-auto min-w-[148px] p-1 shadow-lg">
            {SPLIT_LOAD_STATUSES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => void selectStatus(item.value)}
                className={clsx(
                  'flex w-full rounded-lg px-3 py-2 text-left text-[12px] font-bold hover:bg-muted/60',
                  current === item.value && 'bg-primary/5 text-primary',
                )}
              >
                {item.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ) : (
        triggerButton
      )}

      {error && <span className="text-[10px] font-bold text-red-600">{error}</span>}
    </div>
  );
}

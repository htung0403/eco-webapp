import { clsx } from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

export const WAYBILL_PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'Cao', className: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'NORMAL', label: 'Tiêu chuẩn', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'LOW', label: 'Thấp', className: 'bg-muted text-muted-foreground border-border' },
] as const;

export type WaybillPriorityValue = (typeof WAYBILL_PRIORITY_OPTIONS)[number]['value'];

interface Props {
  waybillId: string | number;
  value?: string | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated?: (priority: WaybillPriorityValue) => void;
}

function normalizePriority(value?: string | null): WaybillPriorityValue {
  const upper = String(value || 'NORMAL').toUpperCase();
  if (upper === 'HIGH' || upper === 'LOW') return upper;
  return 'NORMAL';
}

function priorityMeta(value: WaybillPriorityValue) {
  return WAYBILL_PRIORITY_OPTIONS.find((item) => item.value === value) ?? WAYBILL_PRIORITY_OPTIONS[1];
}

export default function WaybillPriorityControl({ waybillId, value, disabled, compact, onUpdated }: Props) {
  const [current, setCurrent] = useState<WaybillPriorityValue>(normalizePriority(value));
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrent(normalizePriority(value));
  }, [value]);

  async function selectPriority(next: WaybillPriorityValue) {
    setOpen(false);
    if (next === current) return;
    setIsSaving(true);
    setError('');
    try {
      await apiRequest(`/waybills/${waybillId}/priority`, {
        method: 'PATCH',
        body: { priority: next },
      });
      setCurrent(next);
      onUpdated?.(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không cập nhật được ưu tiên.');
    } finally {
      setIsSaving(false);
    }
  }

  const meta = priorityMeta(current);
  const canChange = !disabled;

  const triggerButton = (
    <button
      type="button"
      disabled={!canChange || isSaving}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black whitespace-nowrap',
        meta.className,
        canChange && 'hover:brightness-95',
        !canChange && 'cursor-default',
        compact && 'px-2 py-0.5 text-[10px]',
      )}
    >
      {isSaving ? <Loader2 size={12} className="animate-spin" /> : null}
      {meta.label}
      {canChange && <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} />}
    </button>
  );

  return (
    <div className="inline-flex flex-col items-start gap-1" onClick={(event) => event.stopPropagation()}>
      {canChange ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="z-[10000] w-auto min-w-[148px] p-1 shadow-lg">
            {WAYBILL_PRIORITY_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => void selectPriority(item.value)}
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

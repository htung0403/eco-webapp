import { clsx } from 'clsx';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError, apiRequest } from '../../../lib/api';
import {
  getNextSplitLoadStatus,
  normalizeSplitLoadStatus,
  splitLoadStatusClass,
  splitLoadStatusLabel,
  type SplitLoadStatus,
} from './splitLoadStatus';

interface Props {
  splitIds: Array<string | number>;
  value?: string | null;
  disabled?: boolean;
  onUpdated?: (status: SplitLoadStatus) => void;
}

export default function BulkSplitLoadStatusControl({ splitIds, value, disabled, onUpdated }: Props) {
  const ids = useMemo(() => splitIds.map((id) => String(id)).filter(Boolean), [splitIds]);
  const [current, setCurrent] = useState(() => normalizeSplitLoadStatus(value));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrent(normalizeSplitLoadStatus(value));
  }, [value]);

  const nextStatus = getNextSplitLoadStatus(current === 'ARRIVED' ? 'ARRIVED' : current);
  const canChange = ids.length > 0 && !disabled && Boolean(nextStatus);

  async function advanceStatus() {
    if (!nextStatus || !ids.length) return;
    setIsSaving(true);
    setError('');
    try {
      await Promise.all(
        ids.map((splitId) =>
          apiRequest(`/waybills/splits/${splitId}/load-status`, {
            method: 'PATCH',
            body: { load_status: nextStatus },
          }),
        ),
      );
      setCurrent(nextStatus);
      onUpdated?.(nextStatus);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đổi được trạng thái.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={clsx(
            'inline-flex h-10 items-center rounded-xl border px-3 text-[12px] font-extrabold uppercase tracking-wide',
            splitLoadStatusClass(current === 'ARRIVED' ? 'ARRIVED' : current),
          )}
        >
          {splitLoadStatusLabel(current === 'ARRIVED' ? 'ARRIVED' : current)}
        </span>
        {canChange && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void advanceStatus()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 text-[12px] font-extrabold text-primary hover:bg-primary/15 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {splitLoadStatusLabel(nextStatus)}
          </button>
        )}
      </div>
      {error && <span className="text-[10px] font-bold text-red-600">{error}</span>}
    </div>
  );
}

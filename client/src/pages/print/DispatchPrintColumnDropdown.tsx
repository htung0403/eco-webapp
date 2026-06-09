import { clsx } from 'clsx';
import { ChevronDown, Columns3 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DispatchPrintColumnId } from './dispatchPrintColumns';
import {
  getDispatchColumnDef,
  getSelectableDispatchColumns,
  toggleDispatchColumnId,
} from './dispatchPrintColumns';

interface Props {
  value: DispatchPrintColumnId[];
  canViewPricing: boolean;
  onChange: (ids: DispatchPrintColumnId[]) => void;
  className?: string;
}

export default function DispatchPrintColumnDropdown({
  value,
  canViewPricing,
  onChange,
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => getSelectableDispatchColumns(canViewPricing), [canViewPricing]);

  const summary = useMemo(() => {
    if (!value.length) return 'Chọn cột in';
    if (value.length === options.length) return 'Tất cả cột';
    return `${value.length} cột`;
  }, [options.length, value.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={clsx('relative min-w-0', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-full min-w-[148px] items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-[13px] font-bold text-foreground hover:bg-muted/40"
        title="Chọn cột hiển thị khi in phiếu kê"
      >
        <Columns3 size={16} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown size={16} className={clsx('shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,280px)] rounded-xl border border-border bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Cột in phiếu kê
          </p>
          <div className="max-h-64 space-y-0.5 overflow-y-auto custom-scrollbar">
            {options.map((col) => {
              const checked = value.includes(col.id);
              return (
                <label
                  key={col.id}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[12px] font-bold transition-colors',
                    checked ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/40',
                    col.required && 'opacity-80',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={col.required}
                    onChange={(event) => onChange(toggleDispatchColumnId(value, col.id, event.target.checked, canViewPricing))}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{col.label}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => onChange(options.map((col) => col.id))}
              className="h-8 flex-1 rounded-lg border border-border bg-white text-[11px] font-bold text-muted-foreground hover:bg-muted"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => onChange([getDispatchColumnDef('viTriHang').id])}
              className="h-8 flex-1 rounded-lg border border-border bg-white text-[11px] font-bold text-muted-foreground hover:bg-muted"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

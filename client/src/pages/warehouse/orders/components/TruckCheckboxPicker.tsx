import { clsx } from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { parseSelectedTruckPlates, toggleTruckPlateSelection } from '../truckSelectionUtils';

export interface OrderTruckOption {
  id: string;
  plate: string;
  label: string;
}

interface Props {
  options: OrderTruckOption[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function TruckCheckboxPicker({
  options,
  value,
  onChange,
  isLoading,
  placeholder = 'Chọn xe...',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = parseSelectedTruckPlates(value);

  const summary = useMemo(() => {
    if (!selected.length) return placeholder;
    if (selected.length === 1) return selected[0];
    return `${selected.length} xe · ${selected.join(', ')}`;
  }, [placeholder, selected]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="flex h-7 items-center justify-center rounded border border-slate-300 bg-white">
        <Loader2 size={14} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!options.length) {
    return (
      <div className="flex h-7 items-center rounded border border-dashed border-slate-300 bg-slate-50 px-2 text-[11px] font-medium text-muted-foreground">
        Chưa có xe
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={clsx(
          'flex h-7 w-full min-w-0 items-center gap-1 rounded border border-slate-300 bg-white px-2 text-left text-[12px] font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
          selected.length ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span className="min-w-0 flex-1 truncate" title={summary}>
          {summary}
        </span>
        <ChevronDown size={14} className={clsx('shrink-0 text-slate-500 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto rounded border border-slate-300 bg-white p-1.5 shadow-lg custom-scrollbar">
          <div className="space-y-0.5">
            {options.map((truck) => {
              const checked = selected.includes(truck.plate);
              return (
                <label
                  key={truck.id}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11px] font-bold transition-colors',
                    checked ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(toggleTruckPlateSelection(value, truck.plate, e.target.checked))}
                    className="h-3.5 w-3.5 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 truncate" title={truck.label}>
                    {truck.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

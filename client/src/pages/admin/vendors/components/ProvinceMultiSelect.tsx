import { clsx } from 'clsx';
import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { joinListValues, parseListValues } from '../data';
import type { FilterOption } from '../types';

interface ProvinceMultiSelectProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function ProvinceMultiSelect({ options, value, onChange }: ProvinceMultiSelectProps) {
  const selected = useMemo(() => new Set(parseListValues(value)), [value]);
  const [customInput, setCustomInput] = useState('');

  const toggle = (optionValue: string) => {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    onChange(joinListValues(Array.from(next)));
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const next = new Set(selected);
    next.add(trimmed);
    onChange(joinListValues(Array.from(next)));
    setCustomInput('');
  };

  const removeCustom = (item: string) => {
    const next = new Set(selected);
    next.delete(item);
    onChange(joinListValues(Array.from(next)));
  };

  const presetValues = new Set(options.map(option => option.value));
  const customSelected = Array.from(selected).filter(item => !presetValues.has(item));

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/5 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map(option => {
          const checked = selected.has(option.value);
          return (
            <label
              key={option.value}
              className={clsx(
                'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors',
                checked ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-white hover:bg-muted/40',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.value)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>

      {customSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customSelected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800"
            >
              {item}
              <button type="button" onClick={() => removeCustom(item)} className="text-amber-600 hover:text-red-500">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={customInput}
          onChange={event => setCustomInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Thêm khu vực khác..."
          className="h-10 flex-1 rounded-xl border border-border bg-white px-3 text-[13px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-white px-3 text-[12px] font-bold text-foreground hover:bg-muted disabled:opacity-40"
        >
          <Plus size={14} />
          Thêm
        </button>
      </div>
    </div>
  );
}

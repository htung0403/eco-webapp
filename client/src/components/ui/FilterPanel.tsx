import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentType } from 'react';
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface FilterPanelOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterPanelGroup {
  id: string;
  title: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  options: FilterPanelOption[];
  value: string[];
  searchPlaceholder?: string;
  onChange: (value: string[]) => void;
}

interface FilterPanelProps {
  open: boolean;
  title?: string;
  activeCount: number;
  groups: FilterPanelGroup[];
  onClose: () => void;
  onApply: () => void;
  onClear?: () => void;
}

export function FilterPanel({ open, title = 'Bộ lọc', activeCount, groups, onClose, onApply, onClear }: FilterPanelProps) {
  const [expanded, setExpanded] = useState<string[]>(() => groups.slice(0, 1).map(group => group.id));
  const [keywords, setKeywords] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, [open]);

  useEffect(() => {
    const ids = new Set(groups.map(group => group.id));
    setExpanded(current => current.filter(id => ids.has(id)).length ? current.filter(id => ids.has(id)) : groups.slice(0, 1).map(group => group.id));
  }, [groups]);

  const content = (
    <div className={clsx('fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200 md:hidden', open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}>
      <button type="button" aria-label="Đóng bộ lọc" onClick={onClose} className="absolute inset-0 bg-slate-900/45" />
      <section className={clsx('absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-32px)] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl transition-transform duration-300', open ? 'translate-y-0' : 'translate-y-full')}>
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-[18px] font-extrabold text-foreground">
            <Filter size={18} className="text-primary" />
            <span>{title}</span>
            {activeCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[12px] font-bold text-white">{activeCount}</span>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {groups.map(group => (
            <FilterPanelAccordion
              key={group.id}
              group={group}
              expanded={expanded.includes(group.id)}
              keyword={keywords[group.id] || ''}
              onKeywordChange={value => setKeywords(current => ({ ...current, [group.id]: value }))}
              onToggle={() => setExpanded(current => current.includes(group.id) ? current.filter(id => id !== group.id) : [...current, group.id])}
            />
          ))}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 border-t border-border bg-white p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
          <button type="button" onClick={onClear} disabled={!onClear || activeCount === 0} className="h-12 rounded-2xl border border-red-200 bg-white text-[14px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50">× Xóa bộ lọc</button>
          <button type="button" onClick={onApply} className="h-12 rounded-2xl bg-primary text-[15px] font-extrabold text-white shadow-sm shadow-primary/25 transition-colors hover:bg-primary/90">Áp dụng {activeCount > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[12px]">{activeCount}</span>}</button>
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}

function FilterPanelAccordion({ group, expanded, keyword, onKeywordChange, onToggle }: { group: FilterPanelGroup; expanded: boolean; keyword: string; onKeywordChange: (value: string) => void; onToggle: () => void }) {
  const Icon = group.icon || Filter;
  const selectableOptions = useMemo(() => group.options.filter(option => option.value), [group.options]);
  const filteredOptions = useMemo(() => selectableOptions.filter(option => option.label.toLowerCase().includes(keyword.trim().toLowerCase())), [keyword, selectableOptions]);
  const allSelected = selectableOptions.length > 0 && selectableOptions.every(option => group.value.includes(option.value));

  const toggleValue = (value: string) => {
    group.onChange(group.value.includes(value) ? group.value.filter(item => item !== value) : [...group.value, value]);
  };

  return (
    <div className="border-b border-border">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between px-5 py-4 text-left text-[14px] font-extrabold text-foreground">
        <span className="flex items-center gap-2">
          <Icon size={17} className="text-primary" />
          {group.title}
          {group.value.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{group.value.length}</span>}
        </span>
        <ChevronDown size={16} className={clsx('text-muted-foreground transition-transform', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="space-y-3 px-5 pb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={keyword} onChange={event => onKeywordChange(event.target.value)} placeholder={group.searchPlaceholder || `Tìm ${group.title.toLowerCase()}...`} className="h-10 w-full rounded-2xl border border-border bg-muted/10 pl-9 pr-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="flex items-center justify-between px-2 text-[13px] font-semibold">
            <button type="button" onClick={() => group.onChange(selectableOptions.map(option => option.value))} className="flex items-center gap-3 text-muted-foreground hover:text-foreground">
              <Checkbox checked={allSelected} />
              Chọn tất cả
            </button>
            <button type="button" onClick={() => group.onChange([])} className="text-primary hover:underline">Xóa chọn</button>
          </div>
          <div className="space-y-2">
            {filteredOptions.map(option => {
              const selected = group.value.includes(option.value);
              return (
                <button key={option.value} type="button" onClick={() => toggleValue(option.value)} className={clsx('flex h-11 w-full items-center justify-between rounded-lg px-2 text-left text-[14px] font-bold transition-colors', selected ? 'bg-slate-100 text-primary' : 'bg-white text-foreground hover:bg-muted/60')}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Checkbox checked={selected} />
                    <span className="truncate">{option.label}</span>
                  </span>
                  {option.count !== undefined && <span className="text-[12px] font-medium text-primary">{option.count}</span>}
                </button>
              );
            })}
            {!filteredOptions.length && <div className="rounded-xl bg-muted/30 px-3 py-6 text-center text-[13px] text-muted-foreground">Không có kết quả.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', checked ? 'border-primary bg-primary text-white' : 'border-border bg-white text-transparent')}>{checked && <Check size={14} />}</span>;
}




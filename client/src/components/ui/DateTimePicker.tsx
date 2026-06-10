import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { vi } from 'date-fns/locale';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const parseValue = (value: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const formatLabel = (date?: Date, placeholder = 'Chọn ngày giờ') => date ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date) : placeholder;

export function DateTimePicker({ value, onChange, disabled, placeholder, className = '' }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseValue(value), [value]);
  const hour = selected ? selected.getHours() : 7;
  const minute = selected ? selected.getMinutes() : 0;

  const update = (patch: { date?: Date; hour?: number; minute?: number }) => {
    const next = patch.date ?? selected ?? new Date();
    const normalized = new Date(next);
    normalized.setHours(patch.hour ?? hour, patch.minute ?? minute, 0, 0);
    onChange(toLocalValue(normalized));
  };

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" disabled={disabled} className={`inline-flex h-9 min-w-[12rem] max-w-full items-center gap-2 rounded-lg border border-border bg-white px-2 text-left text-[12px] font-bold text-foreground shadow-sm transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>
        <CalendarDays size={14} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{formatLabel(selected, placeholder)}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" sideOffset={8} className="z-[10000] w-auto overflow-hidden rounded-xl border border-border bg-white p-0 shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-2 p-2 sm:flex-row">
        <Calendar mode="single" selected={selected} onSelect={date => date && update({ date })} locale={vi} className="border-0 p-1 shadow-none" />
        <div className="grid grid-cols-2 gap-2 border-t border-border p-2 sm:w-32 sm:border-l sm:border-t-0">
          <label className="space-y-1 text-[11px] font-black uppercase tracking-wide text-muted-foreground"><span>Giờ</span><select value={hour} onChange={event => update({ hour: Number(event.target.value) })} className="h-9 w-full rounded-lg border border-border bg-white px-2 text-[13px] font-bold text-foreground outline-none">{Array.from({ length: 24 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, '0')}</option>)}</select></label>
          <label className="space-y-1 text-[11px] font-black uppercase tracking-wide text-muted-foreground"><span>Phút</span><select value={minute} onChange={event => update({ minute: Number(event.target.value) })} className="h-9 w-full rounded-lg border border-border bg-white px-2 text-[13px] font-bold text-foreground outline-none">{[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(item => <option key={item} value={item}>{String(item).padStart(2, '0')}</option>)}</select></label>
          <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="col-span-1 h-8 rounded-lg border border-border bg-white px-2 text-[12px] font-black text-muted-foreground hover:bg-muted">Xóa</button>
          <button type="button" onClick={() => setOpen(false)} className="col-span-1 h-8 rounded-lg bg-primary px-2 text-[12px] font-black text-white hover:bg-primary/90">Xong</button>
        </div>
      </div>
    </PopoverContent>
  </Popover>;
}

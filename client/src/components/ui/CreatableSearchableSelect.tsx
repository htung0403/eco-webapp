import * as React from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command';
import { Popover, PopoverAnchor, PopoverContent } from './popover';

export interface CreatableOption {
  value: string;
  label: string;
}

interface CreatableSearchableSelectProps {
  options: Array<string | CreatableOption>;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  createLabel?: (query: string) => string;
  className?: string;
  disabled?: boolean;
}

function normalizeOptions(options: Array<string | CreatableOption>): CreatableOption[] {
  const map = new Map<string, CreatableOption>();
  for (const item of options) {
    const label = (typeof item === 'string' ? item : item.label).trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (!map.has(key)) map.set(key, { value: typeof item === 'string' ? label : item.value || label, label });
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

export function CreatableSearchableSelect({
  options,
  value = '',
  onValueChange,
  placeholder = 'Chọn hoặc nhập mới...',
  emptyMessage = 'Gõ để tìm hoặc thêm mới',
  createLabel = (query) => `Thêm "${query}"`,
  className,
  disabled = false,
}: CreatableSearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionList = React.useMemo(() => normalizeOptions(options), [options]);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return optionList;
    return optionList.filter((option) => option.label.toLowerCase().includes(q));
  }, [inputValue, optionList]);

  const trimmedQuery = inputValue.trim();
  const hasExactMatch = optionList.some((option) => option.label.toLowerCase() === trimmedQuery.toLowerCase());
  const showCreate = trimmedQuery.length > 0 && !hasExactMatch;

  function commitValue(next: string) {
    const trimmed = next.trim();
    setInputValue(trimmed);
    onValueChange(trimmed);
    setOpen(false);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setInputValue(next);
    onValueChange(next);
    setOpen(true);
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) return;
      setOpen(false);
      if (trimmedQuery && trimmedQuery !== inputValue) commitValue(trimmedQuery);
    }, 160);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef} className="relative flex w-full items-center">
          <input
            type="text"
            disabled={disabled}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && trimmedQuery) {
                event.preventDefault();
                commitValue(trimmedQuery);
              }
              if (event.key === 'Escape') setOpen(false);
            }}
            placeholder={placeholder}
            className={cn(
              'h-10 w-full rounded-xl border border-border bg-white pr-9 text-[13px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60',
              className,
            )}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="z-[10000] w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/60"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false} className="rounded-xl overflow-hidden">
          <CommandList className="max-h-56 p-1">
            {filtered.length === 0 && !showCreate ? (
              <CommandEmpty className="py-5 text-[12px] text-muted-foreground">{emptyMessage}</CommandEmpty>
            ) : null}
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => commitValue(option.label)}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium cursor-pointer',
                      value === option.label && 'bg-primary/10 text-primary',
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.label && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${trimmedQuery}`}
                  onSelect={() => commitValue(trimmedQuery)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-primary cursor-pointer"
                >
                  <Plus size={14} />
                  {createLabel(trimmedQuery)}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

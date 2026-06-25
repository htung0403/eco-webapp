import * as React from 'react';
import { Check, ChevronDown, Loader2, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface VendorCreatableOption {
  value: string;
  label: string;
  code?: string | null;
}

interface VendorCreatableSelectProps {
  options: VendorCreatableOption[];
  value?: string;
  onValueChange: (value: string) => void;
  onCreate: (name: string) => Promise<string | void> | string | void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createLabel?: string;
  className?: string;
  disabled?: boolean;
  isCreating?: boolean;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function VendorCreatableSelect({
  options,
  value,
  onValueChange,
  onCreate,
  placeholder = 'Chọn NCC...',
  searchPlaceholder = 'Tìm hoặc thêm NCC...',
  emptyMessage = 'Không tìm thấy NCC phù hợp.',
  createLabel = 'Thêm NCC mới',
  className,
  disabled = false,
  isCreating = false,
}: VendorCreatableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const selectedOption = options.find((option) => option.value === value);
  const trimmedSearch = search.trim();
  const normalizedSearch = normalize(trimmedSearch);
  const hasExactMatch =
    normalizedSearch.length > 0 &&
    options.some((option) => {
      const label = normalize(option.label);
      const code = normalize(option.code || '');
      return label === normalizedSearch || code === normalizedSearch;
    });
  const canCreate = trimmedSearch.length > 0 && !hasExactMatch && !disabled;

  const closeAndReset = () => {
    setSearch('');
    setOpen(false);
  };

  const selectValue = (nextValue: string) => {
    onValueChange(nextValue);
    closeAndReset();
  };

  const createOption = async () => {
    if (!canCreate || isCreating) return;
    const createdValue = await onCreate(trimmedSearch);
    if (createdValue) onValueChange(createdValue);
    closeAndReset();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-[14px] font-bold outline-none transition-colors hover:bg-slate-50 focus:border-primary disabled:bg-slate-100 disabled:opacity-60',
            open && 'border-primary ring-2 ring-primary/10',
            !selectedOption && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selectedOption?.label || placeholder}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {value && !disabled && (
              <X
                size={14}
                className="text-muted-foreground transition-colors hover:text-red-500"
                onClick={(event) => {
                  event.stopPropagation();
                  onValueChange('');
                }}
              />
            )}
            <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[10000] w-[min(100vw-2rem,var(--radix-popover-trigger-width))] min-w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-lg shadow-slate-200/60" sideOffset={4}>
        <Command shouldFilter className="overflow-hidden rounded-xl border-0 bg-white">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            className="h-11 border-b border-slate-100 text-[13px]"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canCreate) {
                event.preventDefault();
                void createOption();
              }
            }}
          />
          <CommandList className="max-h-64 bg-white p-1 custom-scrollbar">
            <CommandEmpty className="py-4 text-[12px] text-muted-foreground">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={[option.label, option.code, option.value].filter(Boolean).join(' ')}
                  onSelect={() => selectValue(option.value)}
                  className={cn(
                    'cursor-pointer rounded-lg px-3 py-2 text-[13px] font-bold text-slate-900 hover:bg-slate-50 aria-selected:bg-slate-100',
                    value === option.value && 'bg-slate-100 text-slate-950',
                  )}
                >
                  <Check size={14} className={cn('mr-2 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </CommandItem>
              ))}
              {canCreate && (
                <CommandItem
                  value={`__create__ ${trimmedSearch}`}
                  onSelect={() => void createOption()}
                  className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-black text-primary hover:bg-slate-50 aria-selected:bg-slate-100"
                >
                  {isCreating ? <Loader2 size={14} className="mr-2 shrink-0 animate-spin" /> : <Plus size={14} className="mr-2 shrink-0" />}
                  {createLabel}: “{trimmedSearch}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

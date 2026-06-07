import * as React from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface Option {
  value: string;
  label: string;
}

interface CreatableSearchableSelectProps {
  options: Option[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function CreatableSearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Chọn hoặc nhập mới...',
  searchPlaceholder = 'Tìm hoặc gõ giá trị mới...',
  emptyMessage = 'Không có kết quả.',
  createLabel = 'Dùng giá trị',
  className,
  disabled = false,
}: CreatableSearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedOption = options.find(option => option.value === value);
  const displayLabel = selectedOption?.label || value?.trim() || '';
  const trimmedSearch = search.trim();
  const hasExactMatch =
    trimmedSearch.length > 0 &&
    options.some(
      option =>
        option.value.toLowerCase() === trimmedSearch.toLowerCase() ||
        option.label.toLowerCase() === trimmedSearch.toLowerCase(),
    );

  const applyValue = (nextValue: string) => {
    onValueChange(nextValue);
    setSearch('');
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border border-border/80 bg-muted/10 px-4 py-2 text-[13px] font-medium transition-all hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/10',
            open && 'border-primary ring-2 ring-primary/5',
            !displayLabel && 'text-muted-foreground/60',
            className,
          )}
        >
          <span className="truncate">{displayLabel || placeholder}</span>
          <div className="ml-2 flex items-center gap-1.5">
            {value && !disabled && (
              <X
                size={14}
                className="cursor-pointer text-muted-foreground/40 transition-colors hover:text-red-500"
                onClick={event => {
                  event.stopPropagation();
                  onValueChange('');
                }}
              />
            )}
            <ChevronDown
              size={16}
              className={cn('text-muted-foreground/40 transition-transform duration-200', open && 'rotate-180')}
            />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[10000] w-full min-w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/60">
        <Command shouldFilter className="rounded-xl overflow-hidden">
          <div className="border-b border-border/40 bg-muted/5">
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
              className="h-10 border-none text-[13px] focus:ring-0"
              onKeyDown={event => {
                if (event.key === 'Enter' && trimmedSearch && !hasExactMatch) {
                  event.preventDefault();
                  applyValue(trimmedSearch);
                }
              }}
            />
          </div>
          <CommandList className="max-h-60 p-1">
            <CommandEmpty className="py-4 text-[12px] text-muted-foreground">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => applyValue(option.value)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium',
                    value === option.value && 'bg-primary/10 text-primary',
                  )}
                >
                  {option.label}
                  {value === option.value && <Check className="h-4 w-4 text-primary" />}
                </CommandItem>
              ))}
              {trimmedSearch && !hasExactMatch && (
                <CommandItem
                  value={`__create__ ${trimmedSearch}`}
                  onSelect={() => applyValue(trimmedSearch)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold text-primary"
                >
                  <Plus size={14} />
                  {createLabel}: &quot;{trimmedSearch}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

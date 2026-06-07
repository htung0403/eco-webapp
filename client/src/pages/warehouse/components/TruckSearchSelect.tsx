import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

export interface TruckSearchOption {
  id: string;
  label: string;
  bks?: string | null;
  license_plate?: string | null;
  nha_xe?: string | null;
  ten_lai_xe?: string | null;
}

interface Props {
  options: TruckSearchOption[];
  value: string;
  onChange: (truckId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

const searchValue = (truck: TruckSearchOption) =>
  [truck.bks, truck.license_plate, truck.nha_xe, truck.ten_lai_xe, truck.label]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export default function TruckSearchSelect({
  options,
  value,
  onChange,
  disabled,
  placeholder = 'Chọn xe...',
  searchPlaceholder = 'Tìm biển số, nhà xe, tài xế...',
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={clsx(
            'flex h-9 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-input bg-white px-2 text-left text-[12px] font-bold outline-none focus:border-primary disabled:opacity-50',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected?.label || placeholder}</span>
          <ChevronDown size={14} className={clsx('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[10000] w-[min(100vw-2rem,320px)] p-0 shadow-lg" sideOffset={4}>
        <Command
          filter={(itemValue, search) => {
            const keyword = search.trim().toLowerCase();
            if (!keyword) return 1;
            return itemValue.includes(keyword) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} className="h-10 text-[13px]" />
          <CommandList className="max-h-56 custom-scrollbar">
            <CommandEmpty className="py-4 text-[12px]">Không tìm thấy xe phù hợp.</CommandEmpty>
            <CommandGroup>
              {options.map((truck) => (
                <CommandItem
                  key={truck.id}
                  value={searchValue(truck)}
                  onSelect={() => {
                    onChange(truck.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer text-[12px] font-bold"
                >
                  <Check size={14} className={clsx('mr-2 shrink-0', value === truck.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0 truncate">{truck.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

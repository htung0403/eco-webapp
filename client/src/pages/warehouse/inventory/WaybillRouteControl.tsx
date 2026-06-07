import { clsx } from 'clsx';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../lib/api';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { useDeliveryRoutes } from '../../../hooks/useDeliveryRoutes';

interface Props {
  waybillId: string | number;
  value?: string | null;
  hubId?: string | number | null;
  disabled?: boolean;
  compact?: boolean;
  onUpdated?: (routeCode: string) => void;
}

function displayRoute(value?: string | null) {
  const route = value?.trim();
  return route || 'Chưa gán';
}

export default function WaybillRouteControl({ waybillId, value, hubId, disabled, compact, onUpdated }: Props) {
  const [current, setCurrent] = useState(displayRoute(value));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { routes, isLoading } = useDeliveryRoutes(open, hubId ? String(hubId) : null);

  useEffect(() => {
    setCurrent(displayRoute(value));
  }, [value]);

  async function applyRoute(routeCode: string) {
    const next = routeCode.trim();
    if (!next || next === current) {
      setOpen(false);
      return;
    }
    setOpen(false);
    setIsSaving(true);
    setError('');
    try {
      await apiRequest(`/waybills/${waybillId}/route`, {
        method: 'PATCH',
        body: { route_code: next },
      });
      setCurrent(next);
      onUpdated?.(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gán được tuyến.');
    } finally {
      setIsSaving(false);
    }
  }

  const canChange = !disabled;
  const customOption = search.trim();
  const hasCustomOption =
    customOption &&
    !routes.some((route) => route.code.toLowerCase() === customOption.toLowerCase());

  return (
    <div className="inline-flex min-w-0 flex-col items-start gap-1" onClick={(event) => event.stopPropagation()}>
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
            disabled={!canChange || isSaving}
            className={clsx(
              'inline-flex max-w-full items-center gap-1 rounded-lg border border-input bg-white px-2 py-1 text-left text-[12px] font-bold',
              current === 'Chưa gán' ? 'text-muted-foreground' : 'text-foreground',
              canChange && 'hover:border-primary/40',
              !canChange && 'cursor-default',
              compact && 'text-[11px]',
            )}
          >
            {isSaving ? <Loader2 size={12} className="shrink-0 animate-spin" /> : null}
            <span className="min-w-0 truncate">{current}</span>
            {canChange && <ChevronDown size={12} className={clsx('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="z-[10000] w-[min(100vw-2rem,280px)] p-0 shadow-lg">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm hoặc nhập mã tuyến..."
              value={search}
              onValueChange={setSearch}
              className="h-10 text-[13px]"
            />
            <CommandList className="max-h-52 custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải danh mục tuyến…
                </div>
              ) : (
                <>
                  <CommandEmpty className="py-3 text-[12px]">Không có tuyến khớp.</CommandEmpty>
                  <CommandGroup>
                    {routes
                      .filter((route) => {
                        const keyword = search.trim().toLowerCase();
                        if (!keyword) return true;
                        return (
                          route.code.toLowerCase().includes(keyword) ||
                          route.name.toLowerCase().includes(keyword) ||
                          (route.province || '').toLowerCase().includes(keyword)
                        );
                      })
                      .map((route) => (
                        <CommandItem
                          key={String(route.id)}
                          value={route.code}
                          onSelect={() => void applyRoute(route.code)}
                          className="cursor-pointer text-[12px] font-bold"
                        >
                          <Check size={14} className={clsx('mr-2 shrink-0', current === route.code ? 'opacity-100' : 'opacity-0')} />
                          <span className="min-w-0 truncate">{route.code}</span>
                          {route.name ? <span className="ml-1 truncate text-muted-foreground">· {route.name}</span> : null}
                        </CommandItem>
                      ))}
                    {hasCustomOption && (
                      <CommandItem
                        value={`custom-${customOption}`}
                        onSelect={() => void applyRoute(customOption)}
                        className="cursor-pointer border-t border-border text-[12px] font-bold text-primary"
                      >
                        Áp dụng mã «{customOption}»
                      </CommandItem>
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <span className="text-[10px] font-bold text-red-600">{error}</span>}
    </div>
  );
}

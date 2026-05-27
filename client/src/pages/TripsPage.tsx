import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Eye, Filter, Loader2, MapPin, Package, Play, Search, SquareCheckBig, Tag, Truck as TruckIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import TripDetailDialog from './trips/dialogs/TripDetailDialog';
import TripStatusActionDialog from './trips/dialogs/TripStatusActionDialog';
import type { FilterOption, HubSummary, ListResponse, Trip, TripAction, TripFilters } from './trips/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const DRIVER = 4;
const DISPATCHER = 8;
const ACCOUNTANT = 16;
const MANAGER = 32;
const DIRECTOR = 64;

type TripColumnId = 'id' | 'truck_id' | 'manifest_id' | 'start_hub_id' | 'end_hub_id' | 'status' | 'departure_time' | 'arrival_time' | 'fuel_actual' | 'fuel_cost' | 'other_costs' | 'actions';

const statusOptions: FilterOption[] = [
  { value: 'PLANNED', label: 'Đang lập kế hoạch' },
  { value: 'IN_TRANSIT', label: 'Đang chạy' },
  { value: 'ARRIVED', label: 'Đã đến hub đích' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const headers: Array<{ id: TripColumnId; label: string; className?: string }> = [
  { id: 'id', label: 'Mã chuyến/id' },
  { id: 'truck_id', label: 'Xe truck_id' },
  { id: 'manifest_id', label: 'Bảng kê manifest_id' },
  { id: 'start_hub_id', label: 'Bưu cục đi' },
  { id: 'end_hub_id', label: 'Bưu cục đến' },
  { id: 'status', label: 'Trạng thái' },
  { id: 'departure_time', label: 'Khởi hành' },
  { id: 'arrival_time', label: 'Đến nơi' },
  { id: 'fuel_actual', label: 'Nhiên liệu' },
  { id: 'fuel_cost', label: 'Chi phí dầu' },
  { id: 'other_costs', label: 'Chi phí khác' },
  { id: 'actions', label: 'Thao tác', className: 'w-[180px] min-w-[180px]' },
];

const statusConfig: Record<string, string> = {
  PLANNED: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED: 'bg-purple-50 text-purple-700 border-purple-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabel = (status?: string | null) => statusOptions.find(option => option.value === status)?.label || status || '—';
const normalizeId = (value?: string | number | null) => value == null ? '' : String(value);
const normalizeList = <T,>(response: ListResponse<T> | T[], key: 'trips' | 'hubs' | 'trucks' | 'manifests') => Array.isArray(response) ? response : response[key] || response.data || response.items || [];
const normalizeTotal = <T,>(response: ListResponse<T> | T[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatMoney = (value?: number | string | null) => value == null || value === '' ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))} đ`;
const formatNumber = (value?: number | null, suffix = '') => value == null ? '—' : `${new Intl.NumberFormat('vi-VN').format(value)}${suffix}`;

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};

const hasAnyRole = (roleMask: number, roles: number[]) => roles.some(role => (roleMask & role) !== 0);

export default function TripsPage() {
  const [filters, setFilters] = useState<TripFilters>({ keyword: '', status: [], start_hub_id: [], end_hub_id: [], departure_from: '', departure_to: '', page: 1, limit: 10 });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null);
  const [actionTrip, setActionTrip] = useState<Trip | null>(null);
  const [action, setAction] = useState<TripAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [mobileDatePreset, setMobileDatePreset] = useState<string[]>([]);

  const user = useMemo(getStoredUser, []);
  const roleMask = user?.role_mask ?? 0;
  const canView = hasAnyRole(roleMask, [DISPATCHER, ACCOUNTANT, MANAGER, DIRECTOR]);
  const canDispatch = hasAnyRole(roleMask, [DISPATCHER, MANAGER, DIRECTOR]);
  const canArrive = hasAnyRole(roleMask, [DISPATCHER, DRIVER, MANAGER, DIRECTOR]);
  const canCost = hasAnyRole(roleMask, [ACCOUNTANT, MANAGER, DIRECTOR]);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const hubOptions = useMemo(() => hubs.map(hub => ({ value: normalizeId(hub.id), label: [hub.code, hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}` })), [hubs]);
  const activeFilterCount = filters.status.length + filters.start_hub_id.length + filters.end_hub_id.length + (filters.departure_from ? 1 : 0) + (filters.departure_to ? 1 : 0);

  useEffect(() => {
    void apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active')
      .then(response => setHubs(normalizeList(response, 'hubs')))
      .catch(() => setHubs([]));
  }, []);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      setError('Bạn không có quyền xem danh sách chuyến xe.');
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    apiRequest<ListResponse<Trip> | Trip[]>(`/trips${buildQuery(filters)}`, { signal: controller.signal })
      .then(response => {
        const list = normalizeList(response, 'trips');
        setTrips(list);
        setTotal(normalizeTotal(response, list.length));
      })
      .catch(err => {
        if ((err as Error).name === 'AbortError') return;
        setTrips([]);
        setTotal(0);
        setError(err instanceof ApiError ? err.message : 'Không tải được danh sách chuyến xe.');
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [filters, canView]);

  const updateFilter = <K extends keyof TripFilters>(key: K, value: TripFilters[K]) => setFilters(current => ({ ...current, [key]: value, page: key === 'page' ? Number(value) : 1 }));
  const clearFilters = () => {
    setMobileDatePreset([]);
    setFilters(current => ({ ...current, keyword: '', status: [], start_hub_id: [], end_hub_id: [], departure_from: '', departure_to: '', page: 1 }));
  };

  const openDetail = async (trip: Trip) => {
    setActionError('');
    setDetailTrip(trip);
    try { setDetailTrip(await apiRequest<Trip>(`/trips/${trip.id}`)); } catch { /* keep row data */ }
  };

  const openAction = (trip: Trip, nextAction: TripAction) => { setActionTrip(trip); setAction(nextAction); setActionError(''); };
  const closeAction = () => { if (!isSubmitting) { setActionTrip(null); setAction(null); setActionError(''); } };

  const submitAction = async () => {
    if (!actionTrip || !action) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      const updated = await apiRequest<Trip>(`/trips/${actionTrip.id}/${action}`, { method: 'PATCH' });
      setTrips(current => current.map(trip => trip.id === actionTrip.id ? { ...trip, ...updated } : trip));
      closeAction();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Backend chưa hỗ trợ thao tác này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterPanelGroups = [
    { id: 'status', title: 'Trạng thái chuyến', icon: Tag, options: statusOptions, value: filters.status, onChange: (value: string[]) => updateFilter('status', value), searchPlaceholder: 'Tìm trạng thái...' },
    { id: 'start_hub_id', title: 'Bưu cục đi', icon: MapPin, options: hubOptions, value: filters.start_hub_id, onChange: (value: string[]) => updateFilter('start_hub_id', value), searchPlaceholder: 'Tìm bưu cục đi...' },
    { id: 'end_hub_id', title: 'Bưu cục đến', icon: MapPin, options: hubOptions, value: filters.end_hub_id, onChange: (value: string[]) => updateFilter('end_hub_id', value), searchPlaceholder: 'Tìm bưu cục đến...' },
    { id: 'departure', title: 'Ngày khởi hành', icon: CalendarClock, options: dateFilterOptions(), value: mobileDatePreset, onChange: applyMobileDatePreset, searchPlaceholder: 'Tìm ngày...' },
  ];


  function applyMobileDatePreset(value: string[]) {
    const preset = value.slice(-1);
    setMobileDatePreset(preset);
    const now = new Date();
    if (!preset.length) {
      setFilters(current => ({ ...current, departure_from: '', departure_to: '', page: 1 }));
      return;
    }
    if (preset[0] === 'TODAY') {
      const today = toDateInput(now);
      setFilters(current => ({ ...current, departure_from: today, departure_to: today, page: 1 }));
      return;
    }
    if (preset[0] === 'NEXT_7_DAYS') {
      const end = new Date(now);
      end.setDate(now.getDate() + 7);
      setFilters(current => ({ ...current, departure_from: toDateInput(now), departure_to: toDateInput(end), page: 1 }));
      return;
    }
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFilters(current => ({ ...current, departure_from: toDateInput(firstDay), departure_to: toDateInput(lastDay), page: 1 }));
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {actionError && !actionTrip && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 flex items-center gap-2 shrink-0"><AlertTriangle size={16} />{actionError}</div>}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border bg-card shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.history.back()} className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted/10 text-[13px] font-medium text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 md:w-auto md:px-3"><ArrowLeft size={15} /><span className="hidden md:inline">Quay lại</span></button>
            <div className="relative min-w-0 flex-1 md:max-w-[460px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="Tìm chuyến, xe, bảng kê..." className="w-full h-10 rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10" /></div>
            <button title="Mở bộ lọc" onClick={() => setIsFilterPanelOpen(true)} className="relative h-10 w-10 rounded-lg border border-primary/30 bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center md:hidden"><Filter size={16} />{activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>}</button>
            {activeFilterCount > 0 && <div className="order-last basis-full md:order-none md:basis-auto"><button onClick={clearFilters} className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-100 md:h-10">× Xóa {activeFilterCount} bộ lọc</button></div>}
            <div className="hidden flex-1 md:block" />
            <button disabled className="h-10 w-12 shrink-0 rounded-lg bg-primary text-white text-[14px] font-bold shadow-sm shadow-primary/20 flex items-center justify-center gap-2 opacity-50 md:w-auto md:px-4"><span className="text-lg leading-none">+</span><span className="hidden md:inline">Thêm</span></button>
          </div>
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect multiple value={filters.status} options={statusOptions} onValueChange={value => updateFilter('status', value)} placeholder="Trạng thái" icon={Tag} className="w-[180px]" />
            <FilterSelect multiple value={filters.start_hub_id} options={hubOptions} onValueChange={value => updateFilter('start_hub_id', value)} placeholder="Bưu cục đi" icon={MapPin} className="w-[180px]" />
            <FilterSelect multiple value={filters.end_hub_id} options={hubOptions} onValueChange={value => updateFilter('end_hub_id', value)} placeholder="Bưu cục đến" icon={MapPin} className="w-[180px]" />
            <input type="date" value={filters.departure_from} onChange={event => { setMobileDatePreset([]); updateFilter('departure_from', event.target.value); }} className="h-9 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground focus:outline-none" />
            <input type="date" value={filters.departure_to} onChange={event => { setMobileDatePreset([]); updateFilter('departure_to', event.target.value); }} className="h-9 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground focus:outline-none" />
          </div>
        </div>

        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={24} />} title="Đang tải danh sách chuyến xe" description="Hệ thống đang gọi API /trips." /> : error ? <StateBlock icon={<AlertTriangle size={24} />} title="Không tải được dữ liệu" description={error} /> : trips.length === 0 ? <StateBlock icon={<TruckIcon size={24} />} title="Chưa có chuyến xe phù hợp" description="Thử đổi bộ lọc hoặc kiểm tra phạm vi hub của tài khoản." /> : (
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            <table className="hidden md:table w-full min-w-[1280px] text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{headers.map(header => <th key={header.id} className={clsx('px-4 py-2.5 font-bold border-r border-border last:border-r-0', header.className)}>{header.label}</th>)}</tr></thead>
              <tbody>{trips.map(trip => <tr key={trip.id} onClick={() => void openDetail(trip)} className="cursor-pointer border-b border-border hover:bg-muted/10 transition-colors">{headers.map(header => renderCell(header.id, trip, { openDetail, openAction, canDispatch, canArrive, canCost }))}</tr>)}</tbody>
            </table>
            <div className="grid gap-3 p-3 md:hidden">{trips.map(trip => <TripMobileCard key={trip.id} trip={trip} openDetail={openDetail} openAction={openAction} canDispatch={canDispatch} canArrive={canArrive} canCost={canCost} />)}</div>
          </div>
        )}

        <div className="border-t border-border bg-card flex flex-col items-center justify-between gap-1 px-2 py-1 text-[11px] text-muted-foreground shrink-0 sm:flex-row sm:gap-3 sm:px-4 sm:py-2 sm:text-[12px]"><span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (trips.length ? 1 : 0)}–{(filters.page - 1) * filters.limit + trips.length}</b>/Tổng:{total}</span><div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilter('limit', Number(event.target.value))} className="h-7 rounded border border-border bg-card px-1.5 text-[11px] focus:outline-none sm:h-8 sm:px-2 sm:text-[12px]">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="rounded-lg border border-border bg-card p-1.5 disabled:opacity-40 hover:bg-muted sm:p-2"><ChevronLeft size={15} /></button><button disabled={filters.page >= totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="rounded-lg border border-border bg-card p-1.5 disabled:opacity-40 hover:bg-muted sm:p-2"><ChevronRight size={15} /></button><span className="h-7 px-2 rounded bg-primary text-white text-[11px] font-bold flex items-center sm:h-8 sm:text-[12px]">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div></div>
      </div>
      <TripDetailDialog trip={detailTrip} onClose={() => setDetailTrip(null)} />
      <TripStatusActionDialog trip={actionTrip} action={action} isSubmitting={isSubmitting} error={actionError} onClose={closeAction} onConfirm={() => void submitAction()} />
      <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterPanelGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
    </div>
  );
}

function buildQuery(filters: TripFilters) {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.start_hub_id.length) params.set('start_hub_id', filters.start_hub_id.join(','));
  if (filters.end_hub_id.length) params.set('end_hub_id', filters.end_hub_id.join(','));
  if (filters.departure_from) params.set('departure_from', filters.departure_from);
  if (filters.departure_to) params.set('departure_to', filters.departure_to);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return `?${params.toString()}`;
}

function dateFilterOptions(): FilterOption[] {
  return [
    { value: 'TODAY', label: 'Hôm nay' },
    { value: 'NEXT_7_DAYS', label: '7 ngày tới' },
    { value: 'THIS_MONTH', label: 'Tháng này' },
  ];
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function renderCell(column: TripColumnId, trip: Trip, handlers: { openDetail: (trip: Trip) => void; openAction: (trip: Trip, action: TripAction) => void; canDispatch: boolean; canArrive: boolean; canCost: boolean }) {
  const base = 'px-4 py-3 border-r border-border last:border-r-0 text-[13px] align-top';
  const content: Record<TripColumnId, ReactNode> = {
    id: <span className="font-extrabold text-primary">#{trip.id}</span>,
    truck_id: <TruckBadge trip={trip} />,
    manifest_id: <ManifestBadge trip={trip} />,
    start_hub_id: <HubBadge hub={trip.start_hub} id={trip.start_hub_id} />,
    end_hub_id: <HubBadge hub={trip.end_hub} id={trip.end_hub_id} />,
    status: <StatusBadge status={trip.status} />,
    departure_time: formatDate(trip.departure_time),
    arrival_time: formatDate(trip.arrival_time),
    fuel_actual: formatNumber(trip.fuel_actual, ' L'),
    fuel_cost: handlers.canCost ? formatMoney(trip.fuel_cost) : 'Ẩn theo quyền',
    other_costs: handlers.canCost ? formatMoney(trip.other_costs) : 'Ẩn theo quyền',
    actions: <Actions trip={trip} {...handlers} />,
  };
  return <td key={column} className={base}>{content[column]}</td>;
}

function TripMobileCard(props: { trip: Trip; openDetail: (trip: Trip) => void; openAction: (trip: Trip, action: TripAction) => void; canDispatch: boolean; canArrive: boolean; canCost: boolean }) {
  const { trip, canCost } = props;
  return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chuyến xe</p><h3 className="text-base font-extrabold text-primary">#{trip.id}</h3></div><StatusBadge status={trip.status} /></div><div className="mt-4 grid gap-2 text-[13px]"><Line label="Xe truck_id" value={<TruckBadge trip={trip} />} /><Line label="Bảng kê manifest_id" value={<ManifestBadge trip={trip} />} /><Line label="Bưu cục đi" value={<HubBadge hub={trip.start_hub} id={trip.start_hub_id} />} /><Line label="Bưu cục đến" value={<HubBadge hub={trip.end_hub} id={trip.end_hub_id} />} /><Line label="Khởi hành" value={formatDate(trip.departure_time)} /><Line label="Đến nơi" value={formatDate(trip.arrival_time)} /><Line label="Nhiên liệu thực tế" value={formatNumber(trip.fuel_actual, ' L')} /><Line label="Chi phí nhiên liệu" value={canCost ? formatMoney(trip.fuel_cost) : 'Ẩn theo quyền'} /><Line label="Chi phí khác" value={canCost ? formatMoney(trip.other_costs) : 'Ẩn theo quyền'} /></div><div className="mt-4"><Actions {...props} /></div></article>;
}

function Actions({ trip, openDetail, openAction, canDispatch, canArrive }: { trip: Trip; openDetail: (trip: Trip) => void; openAction: (trip: Trip, action: TripAction) => void; canDispatch: boolean; canArrive: boolean; canCost: boolean }) {
  const status = String(trip.status || '');
  return <div className="flex flex-wrap items-center gap-1" onClick={event => event.stopPropagation()}><IconButton title="Xem chi tiết" onClick={() => void openDetail(trip)} icon={<Eye size={15} />} />{canDispatch && status === 'PLANNED' && <IconButton title="Bắt đầu" onClick={() => openAction(trip, 'start')} icon={<Play size={15} />} />}{canArrive && status === 'IN_TRANSIT' && <IconButton title="Xác nhận đến" onClick={() => openAction(trip, 'arrive')} icon={<MapPin size={15} />} />}{canDispatch && ['ARRIVED', 'IN_TRANSIT'].includes(status) && <IconButton title="Hoàn tất" onClick={() => openAction(trip, 'complete')} icon={<SquareCheckBig size={15} />} />}{canDispatch && !['COMPLETED', 'CANCELLED'].includes(status) && <IconButton title="Hủy" onClick={() => openAction(trip, 'cancel')} icon={<X size={15} />} danger />}</div>;
}

function IconButton({ title, icon, danger, onClick }: { title: string; icon: ReactNode; danger?: boolean; onClick: () => void }) { return <button title={title} onClick={onClick} className={clsx('h-8 w-8 rounded-lg border flex items-center justify-center transition-colors', danger ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary')}>{icon}</button>; }
function StatusBadge({ status }: { status?: string | null }) { return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold', statusConfig[String(status || '')] || 'border-border bg-muted text-muted-foreground')}>{statusLabel(status)}</span>; }
function HubBadge({ hub, id }: { hub?: HubSummary | null; id?: string | number | null }) { return <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[12px] font-bold text-blue-700">{hub?.code || hub?.name || `Hub #${normalizeId(id) || '—'}`}</span>; }
function TruckBadge({ trip }: { trip: Trip }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-bold text-slate-700"><TruckIcon size={13} />{trip.truck?.license_plate || `Truck #${normalizeId(trip.truck_id) || '—'}`}</span>; }
function ManifestBadge({ trip }: { trip: Trip }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[12px] font-bold text-emerald-700"><Package size={13} />{trip.manifest?.manifest_code || `Manifest #${normalizeId(trip.manifest_id) || '—'}`}</span>; }
function Line({ label, value }: { label: string; value: ReactNode }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/5 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground"><div className="mb-3 text-primary">{icon}</div><h3 className="text-[14px] font-bold text-foreground">{title}</h3><p className="mt-1 text-[13px] max-w-md">{description}</p></div>; }


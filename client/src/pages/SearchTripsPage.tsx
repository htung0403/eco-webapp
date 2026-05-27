import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Eye, Filter, Loader2, MapPin, PackageSearch, Search, Truck, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel, type FilterPanelGroup } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import SearchTripDetailDialog from './search/dialogs/SearchTripDetailDialog';
import type { FilterOption, HubSummary, ListResponse, SearchTripRow, TripDetail } from './search/types';

const SEARCH_DEBOUNCE_MS = 350;
const statusOptions: FilterOption[] = [
  { value: 'PLANNED', label: 'Đã lên kế hoạch' }, { value: 'IN_TRANSIT', label: 'Đang vận chuyển' }, { value: 'DEPARTED', label: 'Đã khởi hành' },
  { value: 'ARRIVED', label: 'Đã đến' }, { value: 'COMPLETED', label: 'Hoàn tất' }, { value: 'CANCELLED', label: 'Đã hủy' },
];

type Filters = { keyword: string; status: string; truck_id: string; manifest_id: string; start_hub_id: string; end_hub_id: string; departure_from: string; departure_to: string; page: number; limit: number };
const defaultFilters: Filters = { keyword: '', status: '', truck_id: '', manifest_id: '', start_hub_id: '', end_hub_id: '', departure_from: '', departure_to: '', page: 1, limit: 10 };

const normalizeList = <T,>(response: ListResponse<T> | T[]) => Array.isArray(response) ? response : response.data || response.items || response.results || [];
const normalizeTotal = <T,>(response: ListResponse<T> | T[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const formatValue = (value?: string | number | null) => value == null || value === '' ? '—' : String(value);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatNumber = (value?: string | number | null, suffix = '') => value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')}${suffix}`;
const getErrorMessage = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Không thể tải dữ liệu.';
const hubLabel = (hub?: HubSummary | null, fallback?: string | number | null) => hub?.code || hub?.name || formatValue(fallback);
const billCount = (item: SearchTripRow) => formatValue(item.bill_count ?? item.waybill_count);
const tripCost = (item: SearchTripRow) => {
  const fuel = Number(item.fuel_cost || 0);
  const other = Number(item.other_costs || 0);
  if (!item.fuel_cost && !item.other_costs) return '—';
  return (fuel + other).toLocaleString('vi-VN');
};

const buildQuery = (filters: Filters) => {
  const params = new URLSearchParams();
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.truck_id) params.set('truck_id', filters.truck_id);
  if (filters.manifest_id) params.set('manifest_id', filters.manifest_id);
  if (filters.start_hub_id) params.set('start_hub_id', filters.start_hub_id);
  if (filters.end_hub_id) params.set('end_hub_id', filters.end_hub_id);
  if (filters.departure_from) params.set('departure_from', filters.departure_from);
  if (filters.departure_to) params.set('departure_to', filters.departure_to);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
};

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'blue' | 'green' | 'amber' | 'slate' }) {
  const cls = tone === 'blue' ? 'bg-blue-50 text-blue-700' : tone === 'green' ? 'bg-emerald-50 text-emerald-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-extrabold ${cls}`}>{children}</span>;
}

function StateBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="flex flex-1 min-h-[360px] items-center justify-center p-6"><div className="max-w-md text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">{icon}</div><p className="text-[15px] font-extrabold text-foreground">{title}</p><p className="mt-1 text-[13px] text-muted-foreground">{description}</p></div></div>;
}

export default function SearchTripsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters, keyword: searchParams.get('keyword') || '' });
  const [debouncedKeyword, setDebouncedKeyword] = useState(filters.keyword);
  const [items, setItems] = useState<SearchTripRow[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const activeFilterCount = [filters.status, filters.truck_id, filters.manifest_id, filters.start_hub_id, filters.end_hub_id, filters.departure_from, filters.departure_to].filter(Boolean).length;
  const hasSearchIntent = debouncedKeyword.trim().length >= 2 || activeFilterCount > 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const hubOptions = useMemo(() => hubs.map(hub => ({ value: String(hub.id), label: `${hub.code || hub.id} — ${hub.name || 'Bưu cục'}` })), [hubs]);
  const updateFilters = (patch: Partial<Filters>) => setFilters(current => ({ ...current, ...patch, page: patch.page ?? 1 }));
  const clearFilters = () => setFilters(current => ({ ...defaultFilters, keyword: current.keyword, limit: current.limit }));

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedKeyword(filters.keyword), SEARCH_DEBOUNCE_MS); return () => window.clearTimeout(timer); }, [filters.keyword]);
  useEffect(() => { let active = true; apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active').then(r => { if (active) setHubs(normalizeList(r)); }).catch(() => { if (active) setHubs([]); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!hasSearchIntent) { setItems([]); setTotal(0); setError(''); setIsLoading(false); return; }
    let active = true; setIsLoading(true); setError('');
    apiRequest<ListResponse<SearchTripRow> | SearchTripRow[]>(`/search/trips?${buildQuery({ ...filters, keyword: debouncedKeyword })}`)
      .then(response => { if (!active) return; const list = normalizeList(response); setItems(list); setTotal(normalizeTotal(response, list.length)); })
      .catch(error => { if (!active) return; setItems([]); setTotal(0); setError(getErrorMessage(error)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [debouncedKeyword, filters, hasSearchIntent]);

  const openDetail = async (item: SearchTripRow) => {
    setDetail({ id: item.id }); setIsDetailLoading(true); setDetailError('');
    try { setDetail(await apiRequest<TripDetail>(`/trips/${item.id}`)); } catch (error) { setDetailError(getErrorMessage(error)); } finally { setIsDetailLoading(false); }
  };

  const groups: FilterPanelGroup[] = [
    { id: 'status', title: 'Trạng thái', icon: PackageSearch, options: statusOptions, value: filters.status ? [filters.status] : [], onChange: value => updateFilters({ status: value.at(-1) || '' }) },
    { id: 'start', title: 'Bưu cục đi', icon: MapPin, options: hubOptions, value: filters.start_hub_id ? [filters.start_hub_id] : [], onChange: value => updateFilters({ start_hub_id: value.at(-1) || '' }) },
    { id: 'end', title: 'Bưu cục đến', icon: MapPin, options: hubOptions, value: filters.end_hub_id ? [filters.end_hub_id] : [], onChange: value => updateFilters({ end_hub_id: value.at(-1) || '' }) },
  ];

  return <div className="h-full min-h-0 flex flex-col gap-2">
    {error && <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600"><AlertTriangle size={16} />{error}</div>}
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b border-border shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-[13px] font-bold hover:bg-muted"><ArrowLeft size={16}/>Quay lại</button>
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={filters.keyword} onChange={e => updateFilters({ keyword: e.target.value })} placeholder="Tìm xe, chuyến, manifest, mã đơn hàng..." className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/10"/></div>
          <button onClick={() => setIsFilterPanelOpen(true)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"><Filter size={17}/></button>
          {activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 text-[13px] font-bold text-red-500"><X size={15}/>Xóa {activeFilterCount} bộ lọc</button>}
          <div className="hidden md:block flex-1"/>
        </div>
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <FilterSelect icon={PackageSearch} placeholder="Trạng thái" options={[{ value: '', label: 'Tất cả trạng thái' }, ...statusOptions]} value={filters.status} onValueChange={value => updateFilters({ status: value })}/>
          <FilterSelect icon={MapPin} placeholder="Bưu cục đi" options={[{ value: '', label: 'Tất cả bưu cục đi' }, ...hubOptions]} value={filters.start_hub_id} onValueChange={value => updateFilters({ start_hub_id: value })}/>
          <FilterSelect icon={MapPin} placeholder="Bưu cục đến" options={[{ value: '', label: 'Tất cả bưu cục đến' }, ...hubOptions]} value={filters.end_hub_id} onValueChange={value => updateFilters({ end_hub_id: value })}/>
          <div className="relative"><Truck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={filters.truck_id} onChange={e => updateFilters({ truck_id: e.target.value })} placeholder="ID xe" className="h-9 w-[120px] rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none"/></div>
          <div className="relative"><PackageSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={filters.manifest_id} onChange={e => updateFilters({ manifest_id: e.target.value })} placeholder="Manifest ID" className="h-9 w-[140px] rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none"/></div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5"><CalendarDays size={15} className="text-muted-foreground"/><input type="date" value={filters.departure_from} onChange={e => updateFilters({ departure_from: e.target.value })} className="text-[12px] outline-none"/><span className="text-muted-foreground">→</span><input type="date" value={filters.departure_to} onChange={e => updateFilters({ departure_to: e.target.value })} className="text-[12px] outline-none"/></div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-slate-50/40">
        {isLoading ? <StateBlock icon={<Loader2 size={22} className="animate-spin"/>} title="Đang tải chuyến xe" description="Đang tổng hợp xe, chuyến, manifest và chi phí chuyến."/> : !items.length ? <StateBlock icon={<Search size={22}/>} title={hasSearchIntent ? 'Không có chuyến xe phù hợp' : 'Kết quả chuyến xe'} description={hasSearchIntent ? 'Thử đổi xe, manifest, trạng thái hoặc tuyến.' : 'Nhập tối thiểu 2 ký tự hoặc chọn bộ lọc để xem bảng tổng hợp chuyến xe.'}/> : <><table className="hidden w-full min-w-[1280px] border-collapse text-left md:table"><thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{['Chuyến/Xe','Mã đơn/Manifest','Ngày tạo','Số lượng bill','Khối lượng','Tình trạng','Chi phí chuyến','Đích đến','Thao tác'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-border bg-white text-[13px]">{items.map(item => <tr key={item.id} className="hover:bg-muted/20"><td className="px-4 py-3"><p className="font-black text-foreground">Trip #{item.id}</p><p className="text-[12px] text-muted-foreground">{item.truck?.license_plate || `Xe #${formatValue(item.truck_id)}`}</p></td><td className="px-4 py-3 font-bold">{item.manifest?.manifest_code || `Manifest #${formatValue(item.manifest_id)}`}</td><td className="px-4 py-3">{formatDate(item.created_at || item.departure_time)}</td><td className="px-4 py-3 font-bold">{billCount(item)}</td><td className="px-4 py-3 text-muted-foreground">Theo manifest</td><td className="px-4 py-3"><Badge tone="green">{formatValue(item.status)}</Badge></td><td className="px-4 py-3"><p className="font-black">{tripCost(item)}</p><p className="text-[11px] text-muted-foreground">Dầu {formatNumber(item.fuel_cost)} · Khác {formatNumber(item.other_costs)}</p></td><td className="px-4 py-3"><Badge tone="blue">{hubLabel(item.end_hub, item.end_hub_id)}</Badge></td><td className="px-4 py-3"><button onClick={() => openDetail(item)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-primary"><Eye size={14}/>Mở</button></td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{items.map(item => <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><Badge tone="blue">TRIP</Badge><p className="mt-2 text-[15px] font-black">Trip #{item.id}</p><p className="text-[12px] text-muted-foreground">{item.truck?.license_plate || `Xe #${formatValue(item.truck_id)}`}</p></div><button onClick={() => openDetail(item)} className="rounded-xl border border-border p-2 text-primary"><Eye size={16}/></button></div><div className="mt-3 grid gap-2 text-[13px]"><p><b>Manifest:</b> {item.manifest?.manifest_code || formatValue(item.manifest_id)}</p><p><b>Tình trạng:</b> {formatValue(item.status)}</p><p><b>Chi phí chuyến:</b> {tripCost(item)}</p><p><b>Đích đến:</b> {hubLabel(item.end_hub, item.end_hub_id)}</p><p><b>Số bill:</b> {billCount(item)}</p></div></article>)}</div></>}
      </div>
      {hasSearchIntent && <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0"><span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (items.length ? 1 : 0)}-{(filters.page - 1) * filters.limit + items.length}</b>/Tổng:{total}</span><div className="flex items-center gap-2"><select value={filters.limit} onChange={e => updateFilters({ limit: Number(e.target.value), page: 1 })} className="h-8 rounded border border-border bg-card px-2 text-[12px]">{[10,20,50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40"><ChevronLeft size={15}/></button><button disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40"><ChevronRight size={15}/></button><span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div></div>}
    </div>
    <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={groups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters}/>
    <SearchTripDetailDialog item={detail} isLoading={isDetailLoading} error={detailError} onClose={() => { setDetail(null); setDetailError(''); }}/>
  </div>;
}

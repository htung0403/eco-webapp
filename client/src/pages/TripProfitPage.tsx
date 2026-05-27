import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Eye, Filter, Fuel, Loader2, Package, ReceiptText, Search, Tag, Truck as TruckIcon, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import type { HubSummary, ListResponse, ManifestDetail, Trip, WaybillSummary } from './trips/types';
import type { TripProfitBreakdownItem, TripProfitFilters, TripProfitPayload, TripProfitRow } from './trips/profit/types';
import TripProfitDetailDialog from './trips/profit/dialogs/TripProfitDetailDialog';

const USER_PROFILE_KEY = 'eco_user_profile';
const MANAGER = 32;
const DIRECTOR = 64;

type ColumnId = 'type' | 'label' | 'status' | 'payment_type' | 'amount' | 'actions';

const headers: Array<{ id: ColumnId; label: string; className?: string }> = [
  { id: 'type', label: 'Loại breakdown' },
  { id: 'label', label: 'Thông tin' },
  { id: 'status', label: 'Trạng thái' },
  { id: 'payment_type', label: 'Thanh toán' },
  { id: 'amount', label: 'Giá trị' },
  { id: 'actions', label: 'Thao tác', className: 'w-[96px] min-w-[96px]' },
];

const breakdownOptions = [
  { value: 'trip', label: 'Chi phí chuyến' },
  { value: 'waybill', label: 'Vận đơn' },
  { value: 'expense', label: 'Expenses' },
  { value: 'revenue', label: 'Doanh thu API' },
  { value: 'profit', label: 'Lãi/lỗ API' },
];
const waybillStatusOptions = ['RECEIVED', 'IN_WAREHOUSE', 'MANIFEST_CLOSED', 'IN_TRANSIT', 'AT_DEST_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].map(value => ({ value, label: value }));
const paymentOptions = ['PP', 'CC', 'COD'].map(value => ({ value, label: value }));
const statusConfig: Record<string, string> = { PLANNED: 'bg-amber-50 text-amber-700 border-amber-200', IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200', ARRIVED: 'bg-purple-50 text-purple-700 border-purple-200', COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200', CANCELLED: 'bg-red-50 text-red-700 border-red-200', DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200', RETURNED: 'bg-red-50 text-red-700 border-red-200' };

const getStoredUser = (): AuthUserProfile | null => { const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY); if (!raw) return null; try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; } };
const canSeeProfit = (roleMask: number) => (roleMask & (MANAGER | DIRECTOR)) !== 0;
const normalizeId = (value?: string | number | null) => value == null ? '' : String(value);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatMoney = (value?: number | string | null) => value == null || value === '' || Number.isNaN(Number(value)) ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))} đ`;
const formatNumber = (value?: number | string | null, suffix = '') => value == null || value === '' ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))}${suffix}`;
const toNumber = (value: unknown) => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);
const normalizeHubs = (response: ListResponse<HubSummary> | HubSummary[]) => Array.isArray(response) ? response : response.hubs || response.data || response.items || [];
const normalizeProfitRows = (profit: TripProfitPayload | null, manifest: ManifestDetail | null, trip: Trip): TripProfitRow[] => {
  const rows: TripProfitRow[] = [{ id: `trip-${trip.id}`, type: 'trip', label: 'fuel_actual / fuel_cost / other_costs', status: trip.status, amount: sumNumbers(trip.fuel_cost, trip.other_costs), source: { fuel_actual: trip.fuel_actual, fuel_cost: trip.fuel_cost, other_costs: trip.other_costs } }];
  const waybills = profit?.waybills || manifest?.waybills || manifest?.manifest_waybills?.map(item => item.waybill).filter((item): item is WaybillSummary => Boolean(item)) || [];
  waybills.forEach((waybill, index) => rows.push({ id: `waybill-${normalizeId(waybill.id) || index}`, type: 'waybill', label: waybill.waybill_code || `Waybill #${normalizeId(waybill.id) || index + 1}`, status: waybill.current_state, payment_type: waybill.payment_type || undefined, amount: waybill.cost_amount, waybill, source: sanitizeWaybill(waybill) }));
  (profit?.expenses || []).forEach(expense => rows.push({ id: `expense-${normalizeId(expense.id)}`, type: 'expense', label: `Expense #${normalizeId(expense.id)}`, amount: firstNumeric(expense), expense, source: expense }));
  const apiRows = profit?.breakdown || profit?.data || profit?.items || [];
  apiRows.forEach((item, index) => rows.push(normalizeApiRow(item, index)));
  return rows;
};
const sumNumbers = (...values: Array<unknown>) => values.reduce<number | null>((total, value) => { const numeric = toNumber(value); return numeric == null ? total : (total ?? 0) + numeric; }, null);
const firstNumeric = (record: Record<string, unknown>) => Object.values(record).find(value => toNumber(value) != null) as number | string | undefined;
const sanitizeWaybill = (waybill: WaybillSummary): Record<string, unknown> => ({ waybill_code: waybill.waybill_code, sender_info: waybill.sender_info, receiver_info: waybill.receiver_info, weight: waybill.weight, length: waybill.length, width: waybill.width, height: waybill.height, volumetric_weight: waybill.volumetric_weight, payment_type: waybill.payment_type, cost_amount: waybill.cost_amount, origin_hub_id: waybill.origin_hub_id, dest_hub_id: waybill.dest_hub_id, current_state: waybill.current_state });
const normalizeApiRow = (item: TripProfitBreakdownItem, index: number): TripProfitRow => ({ id: `api-${normalizeId(item.id) || index}`, type: item.type || 'profit', label: item.label || `Breakdown #${index + 1}`, status: item.status, payment_type: item.waybill?.payment_type || (typeof item.payment_type === 'string' ? item.payment_type : undefined), amount: item.amount, waybill: item.waybill || null, expense: item.expense || null, source: item as Record<string, unknown> });

export default function TripProfitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(getStoredUser, []);
  const authorized = canSeeProfit(user?.role_mask ?? 0);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [profit, setProfit] = useState<TripProfitPayload | null>(null);
  const [manifest, setManifest] = useState<ManifestDetail | null>(null);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState<TripProfitRow | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<TripProfitFilters>({ keyword: '', breakdown_type: [], waybill_status: [], payment_type: [], page: 1, limit: 10 });

  useEffect(() => { void loadData(); }, [id, authorized]);

  async function loadData() {
    if (!id || !authorized) { setIsLoading(false); return; }
    setIsLoading(true); setError('');
    try {
      const tripPayload = await apiRequest<Trip>(`/trips/${id}`);
      setTrip(tripPayload);
      const [profitResult, hubsResult, manifestResult] = await Promise.allSettled([
        apiRequest<TripProfitPayload>(`/trips/${id}/profit`),
        apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active'),
        tripPayload.manifest_id ? apiRequest<ManifestDetail>(`/manifests/${tripPayload.manifest_id}`) : Promise.resolve(null),
      ]);
      setProfit(profitResult.status === 'fulfilled' ? profitResult.value : null);
      setHubs(hubsResult.status === 'fulfilled' ? normalizeHubs(hubsResult.value) : []);
      setManifest(manifestResult.status === 'fulfilled' ? manifestResult.value : null);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không tải được dữ liệu lãi/lỗ tạm tính.');
    } finally { setIsLoading(false); }
  }

  const hubMap = useMemo(() => new Map(hubs.map(hub => [normalizeId(hub.id), hub])), [hubs]);
  const rows = useMemo(() => trip ? normalizeProfitRows(profit, manifest, trip) : [], [manifest, profit, trip]);
  const filteredRows = useMemo(() => rows.filter(row => {
    const keyword = filters.keyword.trim().toLowerCase();
    const matchesKeyword = !keyword || [row.type, row.label, row.status, row.payment_type, row.amount].some(value => String(value ?? '').toLowerCase().includes(keyword));
    const matchesType = !filters.breakdown_type.length || filters.breakdown_type.includes(String(row.type));
    const matchesStatus = !filters.waybill_status.length || (row.status ? filters.waybill_status.includes(row.status) : false);
    const matchesPayment = !filters.payment_type.length || (row.payment_type ? filters.payment_type.includes(row.payment_type) : false);
    return matchesKeyword && matchesType && matchesStatus && matchesPayment;
  }), [filters, rows]);
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const pageRows = filteredRows.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  const activeFilterCount = filters.breakdown_type.length + filters.waybill_status.length + filters.payment_type.length;
  const totalCost = profit?.total_cost ?? sumNumbers(trip?.fuel_cost, trip?.other_costs);
  const revenue = profit?.revenue ?? profit?.total_revenue;
  const estimatedProfit = profit?.estimated_profit ?? profit?.profit ?? (toNumber(revenue) == null || toNumber(totalCost) == null ? null : Number(revenue) - Number(totalCost));
  const filterPanelGroups = [
    { id: 'breakdown_type', title: 'Loại breakdown', options: breakdownOptions, value: filters.breakdown_type, onChange: (value: string[]) => updateFilter('breakdown_type', value) },
    { id: 'waybill_status', title: 'Trạng thái vận đơn', options: waybillStatusOptions, value: filters.waybill_status, onChange: (value: string[]) => updateFilter('waybill_status', value) },
    { id: 'payment_type', title: 'Loại thanh toán PP/CC/COD', options: paymentOptions, value: filters.payment_type, onChange: (value: string[]) => updateFilter('payment_type', value) },
  ];

  function updateFilter<K extends keyof TripProfitFilters>(key: K, value: TripProfitFilters[K]) { setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? Number(value) : 1 })); }
  function clearFilters() { setFilters(prev => ({ ...prev, breakdown_type: [], waybill_status: [], payment_type: [], page: 1 })); }

  if (!authorized) return <div className="h-full min-h-0 flex flex-col gap-2"><div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col"><StateBlock icon={<AlertTriangle size={28} />} title="Không có quyền truy cập" description="Trang lãi/lỗ tạm tính chỉ dành cho MANAGER hoặc DIRECTOR." /></div></div>;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowLeft size={16} />Quay lại</button>
            <div className="relative min-w-[180px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="Tìm breakdown, vận đơn, chi phí..." className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/10" /></div>
            <button onClick={() => setIsFilterPanelOpen(true)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"><Filter size={17} /></button>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto h-10 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 hover:bg-red-100"><X size={14} className="mr-1 inline" />Xóa {activeFilterCount} bộ lọc</button>}
            <div className="flex-1" />
            <button disabled className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-bold text-white opacity-50"><ReceiptText size={16} />Thêm</button>
          </div>
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect multiple icon={Filter} placeholder="Loại breakdown" value={filters.breakdown_type} options={breakdownOptions} onValueChange={value => updateFilter('breakdown_type', value)} />
            <FilterSelect multiple icon={Tag} placeholder="Trạng thái vận đơn" value={filters.waybill_status} options={waybillStatusOptions} onValueChange={value => updateFilter('waybill_status', value)} />
            <FilterSelect multiple icon={ReceiptText} placeholder="PP/CC/COD" value={filters.payment_type} options={paymentOptions} onValueChange={value => updateFilter('payment_type', value)} />
          </div>
          {trip && <TripInfo trip={trip} hubMap={hubMap} revenue={revenue} totalCost={totalCost} estimatedProfit={estimatedProfit} />}
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {isLoading ? <StateBlock icon={<Loader2 size={28} className="animate-spin" />} title="Đang tải dữ liệu" description="Đang lấy chi tiết chuyến, profit, manifest và bưu cục." /> : error ? <StateBlock icon={<AlertTriangle size={28} />} title="Không tải được dữ liệu" description={error} /> : !trip ? <StateBlock icon={<AlertTriangle size={28} />} title="Không có chuyến xe" description="API không trả về chi tiết chuyến xe tương ứng." /> : !pageRows.length ? <StateBlock icon={<Package size={28} />} title="Chưa có breakdown" description="Không có dữ liệu phù hợp với bộ lọc hiện tại." /> : <><table className="hidden md:table min-w-[1280px] text-left border-collapse"><thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{headers.map(header => <th key={header.id} className={clsx('border-b border-border px-4 py-3 font-extrabold', header.className)}>{header.label}</th>)}</tr></thead><tbody className="divide-y divide-border text-[13px]">{pageRows.map(row => <tr key={row.id} className="hover:bg-muted/20"><td className="px-4 py-3"><BreakdownBadge type={row.type} /></td><td className="px-4 py-3 font-bold text-foreground">{row.label}</td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3">{row.payment_type || '—'}</td><td className="px-4 py-3 font-bold">{formatMoney(row.amount)}</td><td className="px-4 py-3"><button onClick={() => setSelectedRow(row)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2 text-[12px] font-bold text-primary hover:bg-muted"><Eye size={14} />Xem</button></td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{pageRows.map(row => <MobileBreakdownCard key={row.id} row={row} onOpen={() => setSelectedRow(row)} />)}</div></>}
        </div>
        <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0">
          <span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (pageRows.length ? 1 : 0)}–{(filters.page - 1) * filters.limit + pageRows.length}</b>/Tổng:{total}</span>
          <div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilter('limit', Number(event.target.value))} className="h-8 rounded border border-border bg-card px-2 text-[12px] focus:outline-none">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronLeft size={15} /></button><button disabled={filters.page >= totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronRight size={15} /></button><span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div>
        </div>
      </div>
      <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterPanelGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
      <TripProfitDetailDialog row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}

function TripInfo({ trip, hubMap, revenue, totalCost, estimatedProfit }: { trip: Trip; hubMap: Map<string, HubSummary>; revenue?: number | string | null; totalCost?: number | string | null; estimatedProfit?: number | string | null }) {
  return <div className="grid gap-2 rounded-xl border border-border bg-muted/5 p-3 text-[12px] md:grid-cols-5"><Info label="truck_id" value={<TruckBadge id={trip.truck_id} />} /><Info label="manifest_id" value={<ManifestBadge id={trip.manifest_id} />} /><Info label="start_hub_id" value={<HubBadge id={trip.start_hub_id} hub={hubMap.get(normalizeId(trip.start_hub_id))} />} /><Info label="end_hub_id" value={<HubBadge id={trip.end_hub_id} hub={hubMap.get(normalizeId(trip.end_hub_id))} />} /><Info label="status" value={<StatusBadge status={trip.status} />} /><Info label="departure_time" value={formatDate(trip.departure_time)} /><Info label="arrival_time" value={formatDate(trip.arrival_time)} /><Info label="fuel_actual" value={formatNumber(trip.fuel_actual, ' L')} /><Info label="fuel_cost" value={formatMoney(trip.fuel_cost)} /><Info label="other_costs" value={formatMoney(trip.other_costs)} /><Info label="total_cost" value={formatMoney(totalCost)} /><Info label="revenue API" value={formatMoney(revenue)} /><Info label="estimated_profit" value={<ProfitBadge value={estimatedProfit} />} /></div>;
}
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-lg border border-border bg-white p-2"><div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-bold text-foreground">{value}</div></div>; }
function TruckBadge({ id }: { id?: string | number | null }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-bold text-slate-700"><TruckIcon size={13} />Truck #{normalizeId(id) || '—'}</span>; }
function ManifestBadge({ id }: { id?: string | number | null }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[12px] font-bold text-emerald-700"><Package size={13} />Manifest #{normalizeId(id) || '—'}</span>; }
function HubBadge({ id, hub }: { id?: string | number | null; hub?: HubSummary }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[12px] font-bold text-blue-700">{hub?.code || `Hub #${normalizeId(id) || '—'}`}</span>; }
function StatusBadge({ status }: { status?: string | null }) { return <span className={clsx('inline-flex rounded-lg border px-2 py-1 text-[12px] font-bold', status ? statusConfig[status] || 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-500 border-slate-200')}>{status || '—'}</span>; }
function ProfitBadge({ value }: { value?: number | string | null }) { const numeric = toNumber(value); return <span className={clsx('inline-flex rounded-lg border px-2 py-1 text-[12px] font-bold', numeric == null ? 'bg-slate-50 text-slate-500 border-slate-200' : numeric >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200')}>{formatMoney(value)}</span>; }
function BreakdownBadge({ type }: { type: string }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-primary/15 bg-primary/5 px-2 py-1 text-[12px] font-bold text-primary"><Fuel size={13} />{type}</span>; }
function MobileBreakdownCard({ row, onOpen }: { row: TripProfitRow; onOpen: () => void }) { return <article className="rounded-2xl border border-border bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><BreakdownBadge type={row.type} /><h3 className="mt-2 truncate text-[14px] font-extrabold text-foreground">{row.label}</h3></div><button onClick={onOpen} className="rounded-lg border border-border p-2 text-primary"><Eye size={16} /></button></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px]"><Info label="status" value={<StatusBadge status={row.status} />} /><Info label="payment_type" value={row.payment_type || '—'} /><Info label="amount" value={formatMoney(row.amount)} /><Info label="id" value={row.id} /></div></article>; }
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground"><div className="mb-3 text-primary">{icon}</div><h3 className="text-[14px] font-bold text-foreground">{title}</h3><p className="mt-1 text-[13px] max-w-md">{description}</p></div>; }

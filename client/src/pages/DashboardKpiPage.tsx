import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Building2, CalendarDays, ChevronDown, Filter, Loader2, Package, RefreshCw, Search, Truck, WalletCards, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { DashboardFilters, DashboardKpi, FinanceSummary, HubOption, HubPerformance, ListResponse, OverdueWaybill, StatusMetric, AuthUserProfile } from './dashboard/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const MANAGER_MASK = 32;
const DIRECTOR_MASK = 64;
const PAGE_LIMIT = 8;

const waybillStatusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'RECEIVED', label: 'RECEIVED' },
  { value: 'IN_WAREHOUSE', label: 'IN_WAREHOUSE' },
  { value: 'MANIFEST_CLOSED', label: 'MANIFEST_CLOSED' },
  { value: 'IN_TRANSIT', label: 'IN_TRANSIT' },
  { value: 'AT_DEST_HUB', label: 'AT_DEST_HUB' },
  { value: 'OUT_FOR_DELIVERY', label: 'OUT_FOR_DELIVERY' },
  { value: 'DELIVERED', label: 'DELIVERED' },
  { value: 'RETURNED', label: 'RETURNED' },
];

const paymentOptions = [
  { value: '', label: 'Tất cả thanh toán' },
  { value: 'PP', label: 'PP' },
  { value: 'CC', label: 'CC' },
  { value: 'COD', label: 'COD' },
];

const dateRangeOptions = [
  { value: '7', label: '7 ngày gần đây' },
  { value: '30', label: '30 ngày gần đây' },
  { value: '90', label: '90 ngày gần đây' },
  { value: 'month', label: 'Tháng này' },
];

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};

const hasDashboardAccess = (roleMask: number) => (roleMask & (MANAGER_MASK | DIRECTOR_MASK)) !== 0;
const hasFinanceAccess = hasDashboardAccess;
const normalizeNumber = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};
const formatNumber = (value?: number | string | null) => normalizeNumber(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
const formatMoney = (value?: number | string | null) => normalizeNumber(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const toList = <T,>(response: ListResponse<T>) => Array.isArray(response) ? response : response.data || response.items || response.results || [];
const totalFrom = <T,>(response: ListResponse<T>, fallback: number) => Array.isArray(response) ? fallback : response.total ?? fallback;

const buildQuery = (filters: DashboardFilters, extra?: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
};

const getInitialFilters = (): DashboardFilters => {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);
  return { date_from: formatDateInput(start), date_to: formatDateInput(today), hub_id: '', status: '', payment_type: '' };
};

export default function DashboardKpiPage() {
  const user = useMemo(getStoredUser, []);
  const authorized = hasDashboardAccess(user?.role_mask ?? 0);
  const canSeeFinance = hasFinanceAccess(user?.role_mask ?? 0);
  const [filters, setFilters] = useState<DashboardFilters>(getInitialFilters);
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(filters);
  const [datePreset, setDatePreset] = useState('30');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ hub: true, date: true, status: false, payment: false });
  const [search, setSearch] = useState<Record<string, string>>({ hub: '', status: '', payment: '', date: '' });
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [kpi, setKpi] = useState<DashboardKpi | null>(null);
  const [waybillStatus, setWaybillStatus] = useState<StatusMetric[]>([]);
  const [tripStatus, setTripStatus] = useState<StatusMetric[]>([]);
  const [hubPerformance, setHubPerformance] = useState<HubPerformance[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [overdue, setOverdue] = useState<OverdueWaybill[]>([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const hubOptions = useMemo(() => [{ value: '', label: 'Tất cả bưu cục' }, ...hubs.map(hub => ({ value: String(hub.id), label: [hub.code, hub.name].filter(Boolean).join(' — ') || `Hub #${hub.id}` }))], [hubs]);
  const activeFilterCount = [filters.hub_id, filters.status, filters.payment_type, filters.date_from || filters.date_to].filter(Boolean).length;

  const updateFilters = (patch: Partial<DashboardFilters>) => setFilters(prev => ({ ...prev, ...patch }));
  const updateDraft = (patch: Partial<DashboardFilters>) => setDraftFilters(prev => ({ ...prev, ...patch }));
  const clearFilters = () => { const next = getInitialFilters(); setDatePreset('30'); setFilters(next); setDraftFilters(next); };

  const applyDatePreset = (value: string, mobile = false) => {
    const today = new Date();
    const start = new Date(today);
    if (value === 'month') start.setDate(1);
    else start.setDate(today.getDate() - Number(value));
    const patch = { date_from: formatDateInput(start), date_to: formatDateInput(today) };
    setDatePreset(value);
    mobile ? updateDraft(patch) : updateFilters(patch);
  };

  const fetchDashboard = useCallback(async (refetch = false) => {
    if (!authorized) return;
    refetch ? setIsRefetching(true) : setIsLoading(true);
    setError('');
    try {
      const commonQuery = buildQuery(filters);
      const compactQuery = buildQuery({ ...filters, status: '', payment_type: '' });
      const financeQuery = buildQuery({ ...filters, status: '' });
      const [hubsRes, kpiRes, waybillRes, tripRes, hubPerfRes, financeRes, overdueRes] = await Promise.all([
        apiRequest<ListResponse<HubOption>>('/hubs/active'),
        apiRequest<DashboardKpi>(`/dashboard/kpi?${commonQuery}`),
        apiRequest<ListResponse<StatusMetric>>(`/dashboard/waybill-status?${compactQuery}`),
        apiRequest<ListResponse<StatusMetric>>(`/dashboard/trip-status?${compactQuery}`),
        apiRequest<ListResponse<HubPerformance>>(`/dashboard/hub-performance?${compactQuery}`),
        canSeeFinance ? apiRequest<FinanceSummary>(`/dashboard/finance-summary?${financeQuery}`) : Promise.resolve(null),
        apiRequest<ListResponse<OverdueWaybill>>(`/dashboard/overdue?${buildQuery(filters, { page: 1, limit: PAGE_LIMIT })}`),
      ]);
      setHubs(toList(hubsRes));
      setKpi(kpiRes);
      setWaybillStatus(toList(waybillRes));
      setTripStatus(toList(tripRes));
      setHubPerformance(toList(hubPerfRes));
      setFinance(financeRes);
      const overdueList = toList(overdueRes);
      setOverdue(overdueList);
      setOverdueTotal(totalFrom(overdueRes, overdueList.length));
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải Dashboard KPI.');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [authorized, canSeeFinance, filters]);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

  if (!authorized) {
    return <StateBlock icon={<AlertTriangle size={26} />} title="Không có quyền truy cập Dashboard BGĐ" description="Trang này chỉ hiển thị với tài khoản MANAGER hoặc DIRECTOR." />;
  }

  const kpiCards = [
    { key: 'total_waybills', label: 'Tổng vận đơn', icon: Package, value: kpi?.total_waybills },
    { key: 'total_trips', label: 'Tổng chuyến xe', icon: Truck, value: kpi?.total_trips },
    { key: 'total_manifests', label: 'Tổng bảng kê', icon: BarChart3, value: kpi?.total_manifests },
    { key: 'delivered_waybills', label: 'Đã giao', icon: Package, value: kpi?.delivered_waybills },
    { key: 'returned_waybills', label: 'Hoàn trả', icon: ArrowDownRight, value: kpi?.returned_waybills },
    { key: 'overdue_waybills', label: 'Quá hạn', icon: AlertTriangle, value: kpi?.overdue_waybills },
    { key: 'in_transit_waybills', label: 'Đang vận chuyển', icon: Truck, value: kpi?.in_transit_waybills },
    { key: 'pending_cod_amount', label: 'COD chờ đối soát', icon: WalletCards, value: kpi?.pending_cod_amount, money: true },
    ...(canSeeFinance ? [
      { key: 'total_revenue', label: 'Doanh thu', icon: WalletCards, value: kpi?.total_revenue, money: true },
      { key: 'total_cost', label: 'Chi phí', icon: WalletCards, value: kpi?.total_cost, money: true },
      { key: 'estimated_profit', label: 'Lãi/lỗ tạm tính', icon: ArrowUpRight, value: kpi?.estimated_profit, money: true },
    ] : []),
  ].filter(card => card.value !== undefined && card.value !== null);

  return <div className="flex h-full min-h-0 flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600"><BarChart3 size={18} /></div>
          <div className="min-w-0"><h1 className="truncate text-[16px] font-extrabold text-foreground md:text-[20px]">Dashboard KPI BGĐ</h1><p className="hidden text-[12px] font-medium text-muted-foreground md:block">Theo dõi tổng quan vận đơn, chuyến xe, bưu cục và tài chính.</p></div>
        </div>
        <button onClick={() => fetchDashboard(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-muted-foreground hover:bg-muted/10"><RefreshCw size={14} className={clsx((isLoading || isRefetching) && 'animate-spin text-primary')} /><span className="hidden sm:inline">Cập nhật</span></button>
        <button onClick={() => { setDraftFilters(filters); setMobileOpen(true); }} className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-primary"><Filter size={17} /></button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <FilterSelect options={hubOptions} value={filters.hub_id} onValueChange={(value) => updateFilters({ hub_id: value })} placeholder="Bưu cục" icon={Building2} />
          <FilterSelect options={dateRangeOptions} value={datePreset} onValueChange={(value) => applyDatePreset(value)} placeholder="Khoảng thời gian" icon={CalendarDays} />
          <FilterSelect options={waybillStatusOptions} value={filters.status} onValueChange={(value) => updateFilters({ status: value })} placeholder="Trạng thái" icon={Package} />
          <FilterSelect options={paymentOptions} value={filters.payment_type} onValueChange={(value) => updateFilters({ payment_type: value })} placeholder="Thanh toán" icon={WalletCards} />
        </div>
        {activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 text-[12px] font-extrabold text-red-600"><X size={14} /> Xóa {activeFilterCount} bộ lọc</button>}
        <div className="ml-auto text-[12px] font-bold text-muted-foreground">Cập nhật: {updatedAt ? updatedAt.toLocaleTimeString('vi-VN') : '—'}</div>
      </div>
    </div>

    {error ? <StateBlock icon={<AlertTriangle size={24} />} title="Không tải được dashboard" description={error} /> : isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={24} />} title="Đang tải Dashboard KPI" description="Đang tổng hợp số liệu vận hành mới nhất." /> : (
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar space-y-4 pb-4">
        {kpiCards.length === 0 ? <StateBlock icon={<BarChart3 size={24} />} title="Chưa có KPI để hiển thị" description="API chưa trả về các trường KPI trong khoảng lọc hiện tại." /> : <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><>{kpiCards.map(({ key, ...card }) => <KpiCard key={key} {...card} trend={kpi?.trends?.[key]} />)}</></div>}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MetricPanel title="Vận đơn theo trạng thái" items={waybillStatus} empty="API chưa trả về thống kê vận đơn." />
          <MetricPanel title="Chuyến xe theo trạng thái" items={tripStatus} empty="API chưa trả về thống kê chuyến xe." />
        </div>
        <HubPerformancePanel items={hubPerformance} />
        {canSeeFinance && <FinancePanel finance={finance} />}
        <OverduePanel items={overdue} total={overdueTotal} canSeeFinance={canSeeFinance} />
      </div>
    )}
    <FilterBottomSheet isOpen={mobileOpen} filters={draftFilters} setFilters={updateDraft} openGroups={openGroups} setOpenGroups={setOpenGroups} search={search} setSearch={setSearch} hubOptions={hubOptions} onApply={() => { setFilters(draftFilters); setMobileOpen(false); }} onClose={() => setMobileOpen(false)} onDatePreset={(value) => applyDatePreset(value, true)} />
  </div>;
}

function KpiCard({ label, icon: Icon, value, money, trend }: { label: string; icon: typeof Package; value?: number | string | null; money?: boolean; trend?: number | string | null }) {
  const trendValue = Number(trend ?? 0);
  return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black text-foreground">{money ? formatMoney(value) : formatNumber(value)}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></div></div>{trend !== undefined && <div className={clsx('mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold', trendValue >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>{trendValue >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{formatNumber(trendValue)}%</div>}</article>;
}

function MetricPanel({ title, items, empty }: { title: string; items: StatusMetric[]; empty: string }) {
  const total = items.reduce((sum, item) => sum + normalizeNumber(item.count ?? item.total), 0);
  return <section className="rounded-2xl border border-border bg-white shadow-sm"><div className="border-b border-border px-4 py-3"><h2 className="text-[14px] font-extrabold text-foreground">{title}</h2></div><div className="space-y-3 p-4">{items.length === 0 ? <p className="py-8 text-center text-[13px] font-medium text-muted-foreground">{empty}</p> : items.map(item => { const label = item.status || item.state || 'UNKNOWN'; const count = normalizeNumber(item.count ?? item.total); const width = total > 0 ? Math.max(5, Math.round((count / total) * 100)) : 0; return <div key={label}><div className="mb-1 flex items-center justify-between text-[12px] font-bold"><StatusBadge value={label} /><span>{formatNumber(count)}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} /></div></div>; })}</div></section>;
}

function HubPerformancePanel({ items }: { items: HubPerformance[] }) {
  return <section className="rounded-2xl border border-border bg-white shadow-sm"><div className="border-b border-border px-4 py-3"><h2 className="text-[14px] font-extrabold text-foreground">Hiệu suất theo bưu cục/kho</h2></div><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{items.length === 0 ? <p className="col-span-full py-8 text-center text-[13px] font-medium text-muted-foreground">API chưa trả về hiệu suất bưu cục.</p> : items.map(item => <article key={`${item.hub_id}-${item.hub_code}`} className="rounded-2xl border border-border bg-muted/5 p-4"><HubBadge value={item.hub_code || item.hub_name || `Hub #${item.hub_id || '—'}`} /><div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-bold text-muted-foreground"><span>Vận đơn: <b className="text-foreground">{formatNumber(item.total_waybills)}</b></span><span>Chuyến: <b className="text-foreground">{formatNumber(item.total_trips)}</b></span><span>Đã giao: <b className="text-foreground">{formatNumber(item.delivered_waybills)}</b></span><span>Quá hạn: <b className="text-red-600">{formatNumber(item.overdue_waybills)}</b></span></div></article>)}</div></section>;
}

function FinancePanel({ finance }: { finance: FinanceSummary | null }) {
  const rows = finance ? [
    ['COD đang giữ', finance.cod_cash_held ?? finance.pending_cod_amount], ['CC đang giữ', finance.cc_cash_held], ['Đã nộp', finance.total_remitted], ['Doanh thu', finance.total_revenue], ['Chi phí', finance.total_cost], ['Lãi/lỗ', finance.estimated_profit],
  ].filter(([, value]) => value !== undefined && value !== null) : [];
  return <section className="rounded-2xl border border-border bg-white shadow-sm"><div className="border-b border-border px-4 py-3"><h2 className="text-[14px] font-extrabold text-foreground">Tổng quan tài chính</h2></div><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{rows.length === 0 ? <p className="col-span-full py-8 text-center text-[13px] font-medium text-muted-foreground">API chưa trả về dữ liệu tài chính.</p> : rows.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-muted/5 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-2 text-[18px] font-black text-foreground">{formatMoney(value)}</p></div>)}</div></section>;
}

function OverduePanel({ items, total, canSeeFinance }: { items: OverdueWaybill[]; total: number; canSeeFinance: boolean }) {
  return <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-[14px] font-extrabold text-foreground">Vận đơn quá hạn</h2><span className="text-[12px] font-bold text-muted-foreground">{total.toLocaleString('vi-VN')} đơn</span></div>{items.length === 0 ? <p className="p-8 text-center text-[13px] font-medium text-muted-foreground">Không có vận đơn quá hạn trong khoảng lọc hiện tại.</p> : <><table className="hidden md:table w-full text-left"><thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Mã vận đơn','Người gửi','Người nhận','TT','Kg','Kích thước','Hub','Cước'].map(header => <th key={header} className="px-4 py-2.5 font-bold">{header}</th>)}</tr></thead><tbody>{items.map(item => <tr key={item.id || item.waybill_code} className="border-t border-border text-[13px] font-medium"><td className="px-4 py-3 font-extrabold text-primary">{item.waybill_code || '—'}</td><td className="px-4 py-3">{item.sender_info || '—'}</td><td className="px-4 py-3">{item.receiver_info || '—'}</td><td className="px-4 py-3"><PaymentBadge value={item.payment_type} /></td><td className="px-4 py-3">{formatNumber(item.weight)}</td><td className="px-4 py-3">{formatNumber(item.length)}×{formatNumber(item.width)}×{formatNumber(item.height)}</td><td className="px-4 py-3">{item.origin_hub_id || '—'} → {item.dest_hub_id || '—'}</td><td className="px-4 py-3">{canSeeFinance ? formatMoney(item.cost_amount) : '—'}</td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{items.map(item => <article key={item.id || item.waybill_code} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[15px] font-extrabold text-primary">{item.waybill_code || '—'}</p><p className="mt-1 text-[12px] font-bold text-muted-foreground">{item.origin_hub_id || '—'} → {item.dest_hub_id || '—'}</p></div><PaymentBadge value={item.payment_type} /></div><div className="mt-3 space-y-2 text-[13px] font-medium text-muted-foreground"><p><b className="text-foreground">Gửi:</b> {item.sender_info || '—'}</p><p><b className="text-foreground">Nhận:</b> {item.receiver_info || '—'}</p><p><b className="text-foreground">Khối lượng:</b> {formatNumber(item.weight)} kg · VW {formatNumber(item.volumetric_weight)}</p><p><b className="text-foreground">Kích thước:</b> {formatNumber(item.length)}×{formatNumber(item.width)}×{formatNumber(item.height)}</p>{canSeeFinance && <p><b className="text-foreground">Cước:</b> {formatMoney(item.cost_amount)}</p>}</div></article>)}</div></>}</section>;
}

function FilterBottomSheet({ isOpen, filters, setFilters, openGroups, setOpenGroups, search, setSearch, hubOptions, onApply, onClose, onDatePreset }: { isOpen: boolean; filters: DashboardFilters; setFilters: (patch: Partial<DashboardFilters>) => void; openGroups: Record<string, boolean>; setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; search: Record<string, string>; setSearch: React.Dispatch<React.SetStateAction<Record<string, string>>>; hubOptions: { value: string; label: string }[]; onApply: () => void; onClose: () => void; onDatePreset: (value: string) => void }) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden"><button className="absolute inset-0 bg-slate-900/45" onClick={onClose} aria-label="Đóng bộ lọc" /><div className="relative max-h-[88vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-[15px] font-extrabold text-foreground">Bộ lọc Dashboard</h2><button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/20"><X size={16} /></button></div><div className="max-h-[68vh] overflow-y-auto p-4 custom-scrollbar"><MobileFilterGroup title="Bưu cục" groupKey="hub" openGroups={openGroups} setOpenGroups={setOpenGroups} search={search} setSearch={setSearch} options={hubOptions} value={filters.hub_id} onChange={(value) => setFilters({ hub_id: value })} /><MobileFilterGroup title="Khoảng thời gian" groupKey="date" openGroups={openGroups} setOpenGroups={setOpenGroups} search={search} setSearch={setSearch} options={dateRangeOptions} value="" onChange={onDatePreset} /><MobileFilterGroup title="Trạng thái" groupKey="status" openGroups={openGroups} setOpenGroups={setOpenGroups} search={search} setSearch={setSearch} options={waybillStatusOptions} value={filters.status} onChange={(value) => setFilters({ status: value })} /><MobileFilterGroup title="Loại thanh toán" groupKey="payment" openGroups={openGroups} setOpenGroups={setOpenGroups} search={search} setSearch={setSearch} options={paymentOptions} value={filters.payment_type} onChange={(value) => setFilters({ payment_type: value })} /></div><div className="border-t border-border p-4"><button onClick={onApply} className="h-11 w-full rounded-xl bg-primary text-[14px] font-extrabold text-white shadow-lg shadow-primary/20">Áp dụng</button></div></div></div>;
}

function MobileFilterGroup({ title, groupKey, openGroups, setOpenGroups, search, setSearch, options, value, onChange }: { title: string; groupKey: string; openGroups: Record<string, boolean>; setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; search: Record<string, string>; setSearch: React.Dispatch<React.SetStateAction<Record<string, string>>>; options: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  const keyword = search[groupKey] || '';
  const filtered = options.filter(option => option.label.toLowerCase().includes(keyword.toLowerCase()));
  const isOpen = openGroups[groupKey];
  return <div className="mb-3 rounded-2xl border border-border"><button onClick={() => setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))} className="flex w-full items-center justify-between px-3 py-3 text-[13px] font-extrabold text-foreground"><span>{title}</span><ChevronDown size={16} className={clsx(isOpen && 'rotate-180')} /></button>{isOpen && <div className="border-t border-border p-3"><div className="relative mb-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={keyword} onChange={(event) => setSearch(prev => ({ ...prev, [groupKey]: event.target.value }))} className="h-9 w-full rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] outline-none" placeholder={`Tìm ${title.toLowerCase()}...`} /></div><div className="mb-2 flex items-center justify-between text-[12px] font-bold"><button onClick={() => onChange(options.find(option => option.value)?.value || '')} className="text-primary">Chọn tất cả</button><button onClick={() => onChange('')} className="text-muted-foreground">Xóa chọn</button></div><div className="space-y-1">{filtered.map(option => <label key={`${groupKey}-${option.value || 'all'}`} className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium"><input type="checkbox" checked={value === option.value || (!value && !option.value)} onChange={() => onChange(option.value)} className="h-4 w-4 rounded border-border text-primary" />{option.label}</label>)}</div></div>}</div>;
}

function StatusBadge({ value }: { value?: string | null }) { return <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-extrabold text-primary">{value || '—'}</span>; }
function HubBadge({ value }: { value?: string | null }) { return <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-extrabold text-emerald-700">{value || '—'}</span>; }
function PaymentBadge({ value }: { value?: string | null }) { return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-extrabold text-amber-700">{value || '—'}</span>; }
function StateBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex flex-1 min-h-[360px] items-center justify-center rounded-2xl border border-border bg-white p-6 shadow-sm"><div className="max-w-sm text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/20 text-primary">{icon}</div><h2 className="text-[15px] font-extrabold text-foreground">{title}</h2><p className="mt-1 text-[13px] font-medium leading-6 text-muted-foreground">{description}</p></div></div>; }

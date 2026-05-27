import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Eye, Filter, Loader2, MapPin, Phone, Search, ShieldCheck, Truck, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import DriverPerformanceDetailDialog from './drivers/dialogs/DriverPerformanceDetailDialog';
import type { DriverPerformanceFilters, DriverPerformanceRow, DriverUser, FilterOption, HubSummary, ListResponse, TripSummary, TruckSummary } from './drivers/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const DRIVER = 4;
const DISPATCHER = 8;
const MANAGER = 32;
const DIRECTOR = 64;

const tripStatusOptions: FilterOption[] = [
  { value: '', label: 'Tất cả trạng thái chuyến' },
  { value: 'PLANNED', label: 'Đã lên kế hoạch' },
  { value: 'IN_TRANSIT', label: 'Đang chạy' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'DELAYED', label: 'Trễ' },
];

const driverStatusOptions: FilterOption[] = [
  { value: '', label: 'Tất cả trạng thái tài xế' },
  { value: 'ASSIGNED', label: 'Đang gán xe' },
  { value: 'UNASSIGNED', label: 'Chưa gán xe' },
];

const dateRangeOptions: FilterOption[] = [
  { value: '', label: 'Tất cả thời gian' },
  { value: '7d', label: '7 ngày gần đây' },
  { value: '30d', label: '30 ngày gần đây' },
  { value: '90d', label: '90 ngày gần đây' },
];

const scoreLevelOptions: FilterOption[] = [
  { value: '', label: 'Tất cả mức điểm' },
  { value: 'excellent', label: 'Xuất sắc (≥ 90)' },
  { value: 'good', label: 'Tốt (75–89)' },
  { value: 'watch', label: 'Cần theo dõi (< 75)' },
  { value: 'none', label: 'Chưa có dữ liệu' },
];

const defaultFilters: DriverPerformanceFilters = { keyword: '', hubIds: [], driverStatus: [], tripStatus: [], dateRange: [], scoreLevels: [], page: 1, limit: 10 };

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};

const hasAnyRole = (roleMask: number, roles: number[]) => roles.some(role => (roleMask & role) !== 0);
const normalizeId = (value?: string | number | null) => value == null ? '' : String(value);
const normalizeList = <T,>(response: ListResponse<T> | T[], key?: keyof ListResponse<T>) => Array.isArray(response) ? response : ((key ? response[key] : undefined) as T[] | undefined) || response.data || response.items || [];
const normalizeTotal = <T,>(response: ListResponse<T> | T[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const getDriverHubs = (driver: DriverUser) => driver.hubs || (driver.hub ? [driver.hub] : []);
const completedStatuses = new Set(['COMPLETED', 'DONE', 'FINISHED', 'ARRIVED']);
const issueStatuses = new Set(['CANCELLED', 'CANCELED', 'DELAYED', 'LATE']);

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
};

const getDateRange = (value?: string) => {
  if (!value) return {};
  const days = value === '7d' ? 7 : value === '30d' ? 30 : value === '90d' ? 90 : 0;
  if (!days) return {};
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { departure_from: from.toISOString().slice(0, 10), departure_to: new Date().toISOString().slice(0, 10) };
};

const scoreClass = (score: number | null) => {
  if (score == null) return 'bg-slate-50 text-slate-600 border-slate-200';
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 75) return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export default function DriverPerformancePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DriverPerformanceFilters>(defaultFilters);
  const [rows, setRows] = useState<DriverPerformanceRow[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<DriverPerformanceRow | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);

  const user = useMemo(getStoredUser, []);
  const canManage = hasAnyRole(user?.role_mask ?? 0, [MANAGER, DIRECTOR]);
  const canView = canManage || hasAnyRole(user?.role_mask ?? 0, [DISPATCHER]);
  const hubOptions = useMemo<FilterOption[]>(() => [{ value: '', label: 'Tất cả bưu cục' }, ...hubs.map(hub => ({ value: normalizeId(hub.id), label: `${hub.code} · ${hub.name}` }))], [hubs]);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const activeFilterCount = filters.hubIds.length + filters.driverStatus.length + filters.tripStatus.length + filters.dateRange.length + filters.scoreLevels.length;

  useEffect(() => {
    let mounted = true;
    const loadHubs = async () => {
      try {
        const response = await apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active');
        if (mounted) setHubs(normalizeList(response));
      } catch {
        if (mounted) setHubs([]);
      }
    };
    loadHubs();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const userQuery = buildQuery({ role_mask: DRIVER, keyword: filters.keyword, page: filters.page, limit: filters.limit });
        const driversResponse = await apiRequest<ListResponse<DriverUser> | DriverUser[]>(`/users?${userQuery}`);
        const drivers = normalizeList(driversResponse, 'users');
        const driverRows = await Promise.all(drivers.map(async driver => buildDriverRow(driver, filters)));
        const filteredRows = applyClientFilters(driverRows, filters);
        if (mounted) {
          setRows(filteredRows);
          setTotal(normalizeTotal(driversResponse, filteredRows.length));
        }
      } catch (requestError) {
        if (mounted) {
          setRows([]);
          setTotal(0);
          setError(requestError instanceof ApiError ? requestError.message : 'Không tải được dữ liệu chấm điểm tài xế.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filters]);

  const updateFilter = <K extends keyof DriverPerformanceFilters>(key: K, value: DriverPerformanceFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
  };

  const clearFilters = () => setFilters(prev => ({ ...defaultFilters, keyword: prev.keyword, limit: prev.limit }));
  const closeDetail = () => { setIsDetailClosing(true); window.setTimeout(() => { setDetailRow(null); setIsDetailClosing(false); }, 250); };

  const filterPanelGroups = [
    { id: 'hub', title: 'Bưu cục', icon: MapPin, options: hubOptions.filter(option => option.value), value: filters.hubIds, searchPlaceholder: 'Tìm bưu cục', onChange: (value: string[]) => updateFilter('hubIds', value) },
    { id: 'driver-status', title: 'Trạng thái tài xế', icon: User, options: driverStatusOptions.filter(option => option.value), value: filters.driverStatus, searchPlaceholder: 'Tìm trạng thái', onChange: (value: string[]) => updateFilter('driverStatus', value) },
    { id: 'trip-status', title: 'Trạng thái chuyến', icon: Truck, options: tripStatusOptions.filter(option => option.value), value: filters.tripStatus, searchPlaceholder: 'Tìm trạng thái chuyến', onChange: (value: string[]) => updateFilter('tripStatus', value) },
    { id: 'date-range', title: 'Khoảng thời gian', icon: CalendarClock, options: dateRangeOptions.filter(option => option.value), value: filters.dateRange, searchPlaceholder: 'Tìm khoảng thời gian', onChange: (value: string[]) => updateFilter('dateRange', value.slice(-1)) },
    { id: 'score', title: 'Mức điểm hiệu suất', icon: ShieldCheck, options: scoreLevelOptions.filter(option => option.value), value: filters.scoreLevels, searchPlaceholder: 'Tìm mức điểm', onChange: (value: string[]) => updateFilter('scoreLevels', value) },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate(-1)} className="h-10 px-3 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted flex items-center gap-2 text-[13px] font-bold"><ArrowLeft size={16} />Quay lại</button>
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="Tìm tài xế, username, số điện thoại..." className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10" />
            </div>
            <button onClick={() => setIsFilterPanelOpen(true)} className="md:hidden h-10 w-10 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted flex items-center justify-center"><Filter size={17} /></button>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto h-10 px-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-1 text-[13px] font-bold"><X size={15} /> Xóa {activeFilterCount} bộ lọc</button>}
            <div className="flex-1 hidden md:block" />
            <button disabled={!canManage} title={canManage ? 'Chấm điểm thủ công sẽ hiển thị khi backend hỗ trợ API lưu điểm.' : 'Chỉ MANAGER/DIRECTOR được cập nhật đánh giá'} className="h-10 px-3 rounded-xl bg-primary text-white opacity-60 flex items-center gap-2 text-[13px] font-bold disabled:cursor-not-allowed"><ShieldCheck size={16} /> Chấm điểm</button>
          </div>

          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect placeholder="Bưu cục" icon={MapPin} value={filters.hubIds[0] || ''} options={hubOptions} onValueChange={value => updateFilter('hubIds', value ? [value] : [])} />
            <FilterSelect placeholder="Trạng thái tài xế" icon={User} value={filters.driverStatus[0] || ''} options={driverStatusOptions} onValueChange={value => updateFilter('driverStatus', value ? [value] : [])} />
            <FilterSelect placeholder="Trạng thái chuyến" icon={Truck} value={filters.tripStatus[0] || ''} options={tripStatusOptions} onValueChange={value => updateFilter('tripStatus', value ? [value] : [])} />
            <FilterSelect placeholder="Khoảng thời gian" icon={CalendarClock} value={filters.dateRange[0] || ''} options={dateRangeOptions} onValueChange={value => updateFilter('dateRange', value ? [value] : [])} />
            <FilterSelect placeholder="Mức điểm" icon={ShieldCheck} value={filters.scoreLevels[0] || ''} options={scoreLevelOptions} onValueChange={value => updateFilter('scoreLevels', value ? [value] : [])} />
          </div>
        </div>

        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin text-primary" size={28} />} title="Đang tải hiệu suất tài xế" description="Hệ thống đang lấy users, trips, trucks và bưu cục từ API." /> : error ? <StateBlock icon={<ShieldCheck className="text-red-500" size={28} />} title="Không tải được dữ liệu" description={error} /> : !canView ? <StateBlock icon={<ShieldCheck className="text-amber-500" size={28} />} title="Không có quyền xem" description="Chỉ DISPATCHER, MANAGER hoặc DIRECTOR được xem dữ liệu vận hành tài xế." /> : rows.length === 0 ? <StateBlock icon={<User className="text-muted-foreground" size={28} />} title="Chưa có tài xế phù hợp" description="Thử đổi từ khóa, bộ lọc hoặc khoảng thời gian." /> : (
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            <table className="hidden md:table min-w-[1280px] w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>{['Tài xế', 'Username', 'Số điện thoại', 'Bưu cục', 'Xe đang gán', 'Tổng chuyến', 'Hoàn tất', 'Hủy/trễ', 'Điểm', 'Thao tác'].map(header => <th key={header} className="px-4 py-3 font-extrabold border-b border-border">{header}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border text-[13px]">
                {rows.map(row => <DriverTableRow key={row.driver.id} row={row} canManage={canManage} onDetail={() => setDetailRow(row)} />)}
              </tbody>
            </table>

            <div className="grid gap-3 p-3 md:hidden">
              {rows.map(row => <DriverMobileCard key={row.driver.id} row={row} canManage={canManage} onDetail={() => setDetailRow(row)} />)}
            </div>
          </div>
        )}

        <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0">
          <span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (rows.length ? 1 : 0)}–{(filters.page - 1) * filters.limit + rows.length}</b>/Tổng:{total}</span>
          <div className="flex items-center gap-2">
            <select value={filters.limit} onChange={event => updateFilter('limit', Number(event.target.value))} className="h-8 rounded border border-border bg-card px-2 text-[12px] focus:outline-none">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select>
            <span>/ trang</span>
            <button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronLeft size={15} /></button>
            <button disabled={filters.page >= totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronRight size={15} /></button>
            <span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span>
          </div>
        </div>
      </div>

      <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterPanelGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
      <DriverPerformanceDetailDialog row={detailRow} hubs={hubs} isClosing={isDetailClosing} onClose={closeDetail} />
    </div>
  );
}

async function buildDriverRow(driver: DriverUser, filters: DriverPerformanceFilters): Promise<DriverPerformanceRow> {
  const dateRange = getDateRange(filters.dateRange[0]);
  const tripQuery = buildQuery({ driver_id: driver.id, status: filters.tripStatus[0], departure_from: dateRange.departure_from, departure_to: dateRange.departure_to, page: 1, limit: 100 });
  const truckQuery = buildQuery({ assigned_driver_id: driver.id, page: 1, limit: 20 });
  const [tripsResponse, trucksResponse] = await Promise.allSettled([
    apiRequest<ListResponse<TripSummary> | TripSummary[]>(`/trips?${tripQuery}`),
    apiRequest<ListResponse<TruckSummary> | TruckSummary[]>(`/trucks?${truckQuery}`),
  ]);
  const trips = tripsResponse.status === 'fulfilled' ? normalizeList(tripsResponse.value, 'trips') : [];
  const assignedTrucks = trucksResponse.status === 'fulfilled' ? normalizeList(trucksResponse.value, 'trucks') : [];
  const completedTrips = trips.filter(trip => completedStatuses.has(String(trip.status || '').toUpperCase()) || Boolean(trip.arrival_time)).length;
  const issueTrips = trips.filter(trip => issueStatuses.has(String(trip.status || '').toUpperCase())).length;
  const totalTrips = trips.length;
  const completionRate = totalTrips ? Math.round((completedTrips / totalTrips) * 100) : 0;
  const performanceScore = totalTrips ? Math.max(0, Math.min(100, Math.round(completionRate - issueTrips * 5))) : null;

  return { driver, hubs: getDriverHubs(driver), assignedTrucks, trips, totalTrips, completedTrips, issueTrips, completionRate, performanceScore };
}

function applyClientFilters(rows: DriverPerformanceRow[], filters: DriverPerformanceFilters) {
  return rows.filter(row => {
    if (filters.hubIds.length && !row.hubs.some(hub => filters.hubIds.includes(normalizeId(hub.id)))) return false;
    if (filters.driverStatus.includes('ASSIGNED') && row.assignedTrucks.length === 0) return false;
    if (filters.driverStatus.includes('UNASSIGNED') && row.assignedTrucks.length > 0) return false;
    if (filters.scoreLevels.length && !filters.scoreLevels.some(level => matchScoreLevel(row.performanceScore, level))) return false;
    return true;
  });
}

function matchScoreLevel(score: number | null, level: string) {
  if (level === 'none') return score == null;
  if (score == null) return false;
  if (level === 'excellent') return score >= 90;
  if (level === 'good') return score >= 75 && score < 90;
  if (level === 'watch') return score < 75;
  return true;
}

function DriverTableRow({ row, canManage, onDetail }: { row: DriverPerformanceRow; canManage: boolean; onDetail: () => void }) {
  return <tr className="hover:bg-muted/30"><td className="px-4 py-3"><DriverBadge row={row} /></td><td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{row.driver.username}</td><td className="px-4 py-3">{row.driver.phone || '—'}</td><td className="px-4 py-3"><HubBadge row={row} /></td><td className="px-4 py-3"><TruckBadge row={row} /></td><td className="px-4 py-3 font-bold">{row.totalTrips}</td><td className="px-4 py-3 text-emerald-700 font-bold">{row.completedTrips}</td><td className="px-4 py-3 text-amber-700 font-bold">{row.issueTrips}</td><td className="px-4 py-3"><ScoreBadge score={row.performanceScore} /></td><td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={onDetail} className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-primary"><Eye size={15} /></button><button disabled={!canManage} className="p-2 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-40" title="Chỉ bật khi backend có API lưu điểm"><ShieldCheck size={15} /></button></div></td></tr>;
}

function DriverMobileCard({ row, canManage, onDetail }: { row: DriverPerformanceRow; canManage: boolean; onDetail: () => void }) {
  return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><DriverBadge row={row} /><ScoreBadge score={row.performanceScore} /></div><div className="mt-3 grid gap-2 text-[13px]"><MobileLine icon={<Phone size={14} />} label="Điện thoại" value={row.driver.phone || '—'} /><MobileLine icon={<MapPin size={14} />} label="Bưu cục" value={row.hubs.map(hub => hub.code).join(', ') || '—'} /><MobileLine icon={<Truck size={14} />} label="Xe" value={row.assignedTrucks.map(truck => truck.license_plate).join(', ') || '—'} /><MobileLine icon={<CalendarClock size={14} />} label="Chuyến" value={`${row.totalTrips} tổng · ${row.completedTrips} hoàn tất · ${row.issueTrips} hủy/trễ`} /></div><div className="mt-4 flex gap-2"><button onClick={onDetail} className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-bold text-primary hover:bg-muted">Xem chi tiết</button><button disabled={!canManage} className="rounded-xl border border-border bg-card px-3 py-2 text-[13px] font-bold text-muted-foreground disabled:opacity-40">Chấm điểm</button></div></article>;
}

function DriverBadge({ row }: { row: DriverPerformanceRow }) {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary"><User size={18} /></div><div><div className="font-extrabold text-foreground">{row.driver.name}</div><div className="text-[12px] text-muted-foreground">ID #{row.driver.id} · role {row.driver.role_mask}</div></div></div>;
}

function HubBadge({ row }: { row: DriverPerformanceRow }) {
  return <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[12px] font-bold text-blue-700">{row.hubs.map(hub => hub.code).join(', ') || '—'}</span>;
}

function TruckBadge({ row }: { row: DriverPerformanceRow }) {
  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-700">{row.assignedTrucks.map(truck => truck.license_plate).join(', ') || 'Chưa gán'}</span>;
}

function ScoreBadge({ score }: { score: number | null }) {
  return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-[12px] font-extrabold', scoreClass(score))}>{score == null ? 'Chưa có điểm' : `${score}/100`}</span>;
}

function MobileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2"><span className="flex items-center gap-2 text-muted-foreground">{icon}{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>;
}

function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center gap-3 p-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">{icon}</div><div><h3 className="text-[15px] font-extrabold text-foreground">{title}</h3><p className="mt-1 text-[13px] text-muted-foreground">{description}</p></div></div>;
}

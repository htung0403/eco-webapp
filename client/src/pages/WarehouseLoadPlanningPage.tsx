import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { AlertTriangle, ArrowLeft, Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Eye, Filter, Loader2, PackageCheck, Plus, Route, Search, Truck, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import AssignManifestTripDialog from './warehouse/load-planning/dialogs/AssignManifestTripDialog';
import LoadPlanningDetailDialog from './warehouse/load-planning/dialogs/LoadPlanningDetailDialog';
import type { AssignTripFormState, BadgeConfig, FilterOption, HubSummary, LoadPlanningFilters, LoadPlanningManifest, ManifestListResponse, TripListResponse, TripSummary } from './warehouse/load-planning/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const DISPATCHER = 8;
const MANAGER = 32;
const DIRECTOR = 64;

const statusConfig: Record<string, BadgeConfig> = {
  DRAFT: { label: 'Nháp', className: 'bg-slate-100 text-slate-600' },
  OPEN: { label: 'Đang gom', className: 'bg-blue-50 text-blue-700' },
  CLOSED: { label: 'Đã đóng', className: 'bg-emerald-50 text-emerald-700' },
  MANIFEST_CLOSED: { label: 'Đã đóng', className: 'bg-emerald-50 text-emerald-700' },
  ASSIGNED: { label: 'Đã gán chuyến', className: 'bg-indigo-50 text-indigo-700' },
  IN_TRANSIT: { label: 'Đang vận chuyển', className: 'bg-amber-50 text-amber-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-600' },
};
const tripStatusConfig: Record<string, BadgeConfig> = {
  PLANNED: { label: 'Đã lên kế hoạch', className: 'bg-blue-50 text-blue-700' },
  READY: { label: 'Sẵn sàng', className: 'bg-emerald-50 text-emerald-700' },
  IN_TRANSIT: { label: 'Đang chạy', className: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Hoàn tất', className: 'bg-slate-100 text-slate-600' },
};
const statusOptions: FilterOption[] = [
  { value: 'DRAFT', label: 'Nháp' }, { value: 'OPEN', label: 'Đang gom' }, { value: 'CLOSED', label: 'Đã đóng' }, { value: 'ASSIGNED', label: 'Đã gán chuyến' }, { value: 'IN_TRANSIT', label: 'Đang vận chuyển' },
];
const defaultFilters: LoadPlanningFilters = { keyword: '', status: [], origin_hub_id: [], dest_hub_id: [], trip_id: [], date_from: '', date_to: '', page: 1, limit: 10 };

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};
const hasRole = (mask: number, role: number) => (mask & role) !== 0;
const canViewPage = (mask: number) => hasRole(mask, MANAGER) || hasRole(mask, DIRECTOR);
const canAssignTrip = (mask: number) => hasRole(mask, DISPATCHER) || hasRole(mask, MANAGER) || hasRole(mask, DIRECTOR);
const normalizeList = (response: ManifestListResponse | LoadPlanningManifest[]) => Array.isArray(response) ? response : response.data || response.items || response.manifests || [];
const normalizeTripList = (response: TripListResponse | TripSummary[]) => Array.isArray(response) ? response : response.data || response.items || response.trips || [];
const normalizeTotal = (response: ManifestListResponse | LoadPlanningManifest[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const formatNumber = (value?: string | number | null, suffix = '') => value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')}${suffix}`;
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const manifestCode = (manifest: LoadPlanningManifest) => manifest.manifest_code || manifest.code || `MF-${manifest.id}`;
const hubLabel = (hub?: HubSummary | null, id?: string | number | null) => hub?.code || hub?.name || (id ? `Hub #${id}` : '—');
const tripLabel = (trip?: TripSummary | null, id?: string | number | null) => trip?.trip_code || trip?.code || (id ? `Chuyến #${id}` : 'Chưa gán');
const getWaybillCount = (manifest: LoadPlanningManifest) => Number(manifest.waybill_count ?? manifest.total_waybills ?? manifest.waybills?.length ?? 0);
const getTotalWeight = (manifest: LoadPlanningManifest) => manifest.total_weight ?? manifest.weight_total ?? manifest.waybills?.reduce((sum, item) => sum + Number(item.weight || 0), 0);
const closedBy = (manifest: LoadPlanningManifest) => manifest.closed_by?.name || manifest.closed_by?.full_name || manifest.closed_by?.username || manifest.created_by?.name || manifest.created_by?.full_name || manifest.created_by?.username || '—';

export default function WarehouseLoadPlanningPage() {
  const navigate = useNavigate();
  const user = useMemo(getStoredUser, []);
  const roleMask = user?.role_mask ?? 0;
  const allowed = canViewPage(roleMask);
  const mayAssign = canAssignTrip(roleMask);
  const [filters, setFilters] = useState<LoadPlanningFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<LoadPlanningFilters>(defaultFilters);
  const [manifests, setManifests] = useState<LoadPlanningManifest[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['status']);
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});
  const [detailManifest, setDetailManifest] = useState<LoadPlanningManifest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [assignManifest, setAssignManifest] = useState<LoadPlanningManifest | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAssignClosing, setIsAssignClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignTripFormState>({ trip_id: '' });

  const hubOptions = useMemo(() => hubs.map(hub => ({ value: String(hub.id), label: hub.code ? `${hub.code} · ${hub.name || 'Bưu cục'}` : hub.name || `Hub #${hub.id}` })), [hubs]);
  const tripOptions = useMemo(() => trips.map(trip => ({ value: String(trip.id), label: tripLabel(trip) })), [trips]);
  const activeFilterCount = filters.status.length + filters.origin_hub_id.length + filters.dest_hub_id.length + filters.trip_id.length + (filters.date_from ? 1 : 0) + (filters.date_to ? 1 : 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const rangeStart = total ? (filters.page - 1) * filters.limit + 1 : 0;
  const rangeEnd = Math.min(total, filters.page * filters.limit);

  useEffect(() => { if (!allowed) return; void fetchOptions(); }, [allowed]);
  useEffect(() => { if (!allowed) return; void fetchManifests(); }, [allowed, filters]);

  async function fetchOptions() {
    try {
      const [hubResponse, tripResponse] = await Promise.all([
        apiRequest<HubSummary[]>('/hubs/active'),
        apiRequest<TripListResponse | TripSummary[]>(`/trips?${new URLSearchParams({ page: '1', limit: '100', status: 'PLANNED' }).toString()}`),
      ]);
      setHubs(Array.isArray(hubResponse) ? hubResponse : []);
      setTrips(normalizeTripList(tripResponse));
    } catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu bộ lọc.'); }
  }

  async function fetchManifests() {
    setIsLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
      if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
      if (filters.status.length) params.set('status', filters.status.join(','));
      if (filters.origin_hub_id.length) params.set('origin_hub_id', filters.origin_hub_id.join(','));
      if (filters.dest_hub_id.length) params.set('dest_hub_id', filters.dest_hub_id.join(','));
      if (filters.trip_id.length) params.set('trip_id', filters.trip_id.join(','));
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      const response = await apiRequest<ManifestListResponse | LoadPlanningManifest[]>(`/manifests?${params.toString()}`);
      const list = normalizeList(response);
      setManifests(list); setTotal(normalizeTotal(response, list.length));
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách bảng kê.'); setManifests([]); setTotal(0); }
    finally { setIsLoading(false); }
  }

  const updateFilters = (patch: Partial<LoadPlanningFilters>) => setFilters(prev => ({ ...prev, ...patch }));
  const clearFilters = () => { const next = { ...defaultFilters, keyword: filters.keyword, limit: filters.limit }; setFilters(next); setDraftFilters(next); };
  const openFilters = () => { setDraftFilters(filters); setIsFilterOpen(true); };
  const applyFilters = () => { setFilters({ ...draftFilters, page: 1 }); setIsFilterOpen(false); };
  const closeDetail = () => { setIsDetailClosing(true); window.setTimeout(() => { setIsDetailOpen(false); setDetailManifest(null); setIsDetailClosing(false); }, 180); };
  const closeAssign = () => { setIsAssignClosing(true); window.setTimeout(() => { setIsAssignOpen(false); setAssignManifest(null); setIsAssignClosing(false); }, 180); };

  async function openDetail(manifest: LoadPlanningManifest) {
    setIsDetailOpen(true); setIsDetailLoading(true); setDetailManifest(manifest);
    try { setDetailManifest(await apiRequest<LoadPlanningManifest>(`/manifests/${manifest.id}`)); }
    catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể tải chi tiết bảng kê.'); }
    finally { setIsDetailLoading(false); }
  }

  function openAssign(manifest: LoadPlanningManifest) { if (!mayAssign) return; setAssignManifest(manifest); setAssignForm({ trip_id: manifest.trip_id ? String(manifest.trip_id) : '' }); setIsAssignOpen(true); }
  async function submitAssign() {
    if (!assignManifest || !assignForm.trip_id) return;
    setIsSubmitting(true); setActionError('');
    try { await apiRequest(`/manifests/${assignManifest.id}/assign-trip`, { method: 'PATCH', body: { trip_id: assignForm.trip_id } }); closeAssign(); await fetchManifests(); }
    catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể gán chuyến xe cho bảng kê.'); }
    finally { setIsSubmitting(false); }
  }

  if (!allowed) return null;

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {actionError && <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 flex items-center gap-2"><AlertTriangle size={16} />{actionError}</div>}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted md:w-auto md:px-3"><ArrowLeft size={15} /><span className="hidden md:ml-2 md:inline text-[13px] font-bold">Quay lại</span></button>
            <div className="relative min-w-0 flex-1 md:max-w-[460px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilters({ keyword: event.target.value, page: 1 })} placeholder="Tìm mã bảng kê, seal, chuyến xe..." className="w-full h-10 rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10" /></div>
            <button title="Mở bộ lọc" onClick={openFilters} className="relative h-10 w-10 rounded-lg border border-primary/30 bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center md:hidden"><Filter size={16} />{activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>}</button>
            {activeFilterCount > 0 && <div className="order-last basis-full md:order-none md:basis-auto"><button onClick={clearFilters} className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 hover:bg-red-100 md:h-10">× Xóa {activeFilterCount} bộ lọc</button></div>}
            <div className="hidden flex-1 md:block" />
            <button onClick={() => navigate('/warehouse/manifests')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-extrabold text-white hover:bg-primary/90"><Plus size={16} /><span className="hidden sm:inline">Thêm</span></button>
          </div>
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect multiple icon={PackageCheck} placeholder="Trạng thái bảng kê" options={statusOptions} value={filters.status} onValueChange={value => updateFilters({ status: value, page: 1 })} />
            <FilterSelect multiple icon={Building2} placeholder="Bưu cục đi" options={hubOptions} value={filters.origin_hub_id} onValueChange={value => updateFilters({ origin_hub_id: value, page: 1 })} />
            <FilterSelect multiple icon={Building2} placeholder="Bưu cục đến" options={hubOptions} value={filters.dest_hub_id} onValueChange={value => updateFilters({ dest_hub_id: value, page: 1 })} />
            <FilterSelect multiple icon={Truck} placeholder="Chuyến xe" options={tripOptions} value={filters.trip_id} onValueChange={value => updateFilters({ trip_id: value, page: 1 })} />
            <DateInput label="Từ ngày" value={filters.date_from} onChange={value => updateFilters({ date_from: value, page: 1 })} />
            <DateInput label="Đến ngày" value={filters.date_to} onChange={value => updateFilters({ date_to: value, page: 1 })} />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {isLoading ? <StateBlock icon={<Loader2 size={22} className="animate-spin" />} title="Đang tải danh sách bảng kê..." /> : error ? <StateBlock icon={<AlertTriangle size={22} />} title={error} /> : !manifests.length ? <StateBlock icon={<PackageCheck size={22} />} title="Chưa có bảng kê phù hợp." /> : <><table className="hidden md:table w-full min-w-[1280px] text-left border-collapse"><thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Mã bảng kê','Hub đi','Hub đến','Trạng thái','Tổng vận đơn','Tổng trọng lượng','Chuyến xe','Thời gian đóng','Người đóng','Thao tác'].map(header => <th key={header} className={clsx("border-r border-border px-4 py-3 font-bold last:border-r-0", header === "Thao tác" && "w-px whitespace-nowrap")}>{header}</th>)}</tr></thead><tbody>{manifests.map(manifest => <ManifestRow key={manifest.id} manifest={manifest} mayAssign={mayAssign} onDetail={openDetail} onAssign={openAssign} />)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{manifests.map(manifest => <ManifestCard key={manifest.id} manifest={manifest} mayAssign={mayAssign} onDetail={openDetail} onAssign={openAssign} />)}</div></>}
        </div>

        <div className="shrink-0 border-t border-border bg-card px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[12px] font-bold text-muted-foreground">{`${rangeStart}-${rangeEnd}/Tổng:${total}`}</p><div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilters({ limit: Number(event.target.value), page: 1 })} className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-muted-foreground outline-none"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span className="hidden text-[12px] text-muted-foreground sm:inline">/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground disabled:opacity-50"><ChevronLeft size={16} /></button><button disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground disabled:opacity-50"><ChevronRight size={16} /></button><span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2 text-[13px] font-bold text-white">{filters.page}</span><span className="text-[13px] font-bold text-foreground">/ {totalPages}</span></div></div></div>
      </div>
      <FilterBottomSheet isOpen={isFilterOpen} draftFilters={draftFilters} setDraftFilters={setDraftFilters} openGroups={openGroups} setOpenGroups={setOpenGroups} groupSearch={groupSearch} setGroupSearch={setGroupSearch} hubOptions={hubOptions} tripOptions={tripOptions} onClose={() => setIsFilterOpen(false)} onApply={applyFilters} />
      <LoadPlanningDetailDialog isOpen={isDetailOpen} isClosing={isDetailClosing} isLoading={isDetailLoading} manifest={detailManifest} statusConfig={statusConfig} canViewCost={allowed} onClose={closeDetail} />
      <AssignManifestTripDialog isOpen={isAssignOpen} isClosing={isAssignClosing} isSubmitting={isSubmitting} manifest={assignManifest} trips={trips} formState={assignForm} onChange={trip_id => setAssignForm({ trip_id })} onClose={closeAssign} onSubmit={submitAssign} />
    </div>
  );
}

function ManifestRow({ manifest, mayAssign, onDetail, onAssign }: { manifest: LoadPlanningManifest; mayAssign: boolean; onDetail: (manifest: LoadPlanningManifest) => void; onAssign: (manifest: LoadPlanningManifest) => void }) { return <tr className="border-b border-border align-top hover:bg-muted/10"><td className="border-r border-border px-4 py-3 text-[13px] font-extrabold text-primary">{manifestCode(manifest)}</td><td className="border-r border-border px-4 py-3"><HubBadge label={hubLabel(manifest.origin_hub, manifest.origin_hub_id)} /></td><td className="border-r border-border px-4 py-3"><HubBadge label={hubLabel(manifest.dest_hub, manifest.dest_hub_id)} /></td><td className="border-r border-border px-4 py-3"><Badge config={statusConfig[String(manifest.status || '')]} fallback={manifest.status} /></td><td className="border-r border-border px-4 py-3 text-[13px] font-bold">{formatNumber(getWaybillCount(manifest))}</td><td className="border-r border-border px-4 py-3 text-[13px] font-bold">{formatNumber(getTotalWeight(manifest), ' kg')}</td><td className="border-r border-border px-4 py-3"><TripBadge manifest={manifest} /></td><td className="border-r border-border px-4 py-3 text-[13px] text-muted-foreground">{formatDate(manifest.closed_at || manifest.created_at)}</td><td className="border-r border-border px-4 py-3 text-[13px] font-medium">{closedBy(manifest)}</td><td className="w-px whitespace-nowrap px-4 py-3"><Actions manifest={manifest} mayAssign={mayAssign} onDetail={onDetail} onAssign={onAssign} /></td></tr>; }
function ManifestCard(props: { manifest: LoadPlanningManifest; mayAssign: boolean; onDetail: (manifest: LoadPlanningManifest) => void; onAssign: (manifest: LoadPlanningManifest) => void }) { const { manifest } = props; return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bảng kê</p><h3 className="text-base font-extrabold text-primary">{manifestCode(manifest)}</h3></div><Badge config={statusConfig[String(manifest.status || '')]} fallback={manifest.status} /></div><div className="mt-4 grid gap-2 text-[13px]"><Line label="Hub đi" value={<HubBadge label={hubLabel(manifest.origin_hub, manifest.origin_hub_id)} />} /><Line label="Hub đến" value={<HubBadge label={hubLabel(manifest.dest_hub, manifest.dest_hub_id)} />} /><Line label="Tổng vận đơn" value={formatNumber(getWaybillCount(manifest))} /><Line label="Tổng trọng lượng" value={formatNumber(getTotalWeight(manifest), ' kg')} /><Line label="Chuyến xe" value={<TripBadge manifest={manifest} />} /><Line label="Thời gian đóng" value={formatDate(manifest.closed_at || manifest.created_at)} /><Line label="Người đóng" value={closedBy(manifest)} /></div><div className="mt-4"><Actions {...props} /></div></article>; }
function Actions({ manifest, mayAssign, onDetail, onAssign }: { manifest: LoadPlanningManifest; mayAssign: boolean; onDetail: (manifest: LoadPlanningManifest) => void; onAssign: (manifest: LoadPlanningManifest) => void }) {
  return (
    <div className="inline-flex flex-nowrap gap-2">
      <IconAction label="Xem" onClick={() => onDetail(manifest)} icon={<Eye size={15} />} />
      <IconAction label="Gán chuyến" disabled={!mayAssign} onClick={() => onAssign(manifest)} icon={<Route size={15} />} />
    </div>
  );
}
function IconAction({ label, icon, disabled, onClick }: { label: string; icon: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45">{icon}</button>;
}function Badge({ config, fallback }: { config?: BadgeConfig; fallback?: string | null }) { return <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-bold ${config?.className || 'bg-slate-100 text-slate-600'}`}>{config?.label || fallback || '—'}</span>; }
function HubBadge({ label }: { label: string }) { return <span className="inline-flex h-7 items-center rounded-full bg-violet-50 px-3 text-[12px] font-bold text-violet-700">{label}</span>; }
function TripBadge({ manifest }: { manifest: LoadPlanningManifest }) { const status = manifest.trip?.status || ''; return <div className="flex flex-col gap-1"><span className="text-[13px] font-bold text-foreground">{tripLabel(manifest.trip, manifest.trip_id)}</span>{status && <Badge config={tripStatusConfig[status]} fallback={status} />}</div>; }
function Line({ label, value }: { label: string; value: ReactNode }) { return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }
function StateBlock({ icon, title }: { icon: ReactNode; title: string }) { return <div className="flex-1 min-h-[360px] flex items-center justify-center"><div className="flex flex-col items-center gap-3 text-center text-muted-foreground"><div className="text-primary">{icon}</div><p className="text-[13px] font-bold">{title}</p></div></div>; }
function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[13px] font-bold text-muted-foreground"><CalendarDays size={15} /><span>{label}</span><input type="date" value={value} onChange={event => onChange(event.target.value)} className="bg-transparent text-foreground outline-none" /></label>; }

function FilterBottomSheet({ isOpen, draftFilters, setDraftFilters, openGroups, setOpenGroups, groupSearch, setGroupSearch, hubOptions, tripOptions, onClose, onApply }: { isOpen: boolean; draftFilters: LoadPlanningFilters; setDraftFilters: Dispatch<SetStateAction<LoadPlanningFilters>>; openGroups: string[]; setOpenGroups: Dispatch<SetStateAction<string[]>>; groupSearch: Record<string, string>; setGroupSearch: Dispatch<SetStateAction<Record<string, string>>>; hubOptions: FilterOption[]; tripOptions: FilterOption[]; onClose: () => void; onApply: () => void }) {
  if (!isOpen) return null;
  const groups = [{ id: 'status', title: 'Trạng thái bảng kê', key: 'status' as const, options: statusOptions }, { id: 'origin', title: 'Bưu cục đi', key: 'origin_hub_id' as const, options: hubOptions }, { id: 'dest', title: 'Bưu cục đến', key: 'dest_hub_id' as const, options: hubOptions }, { id: 'trip', title: 'Chuyến xe', key: 'trip_id' as const, options: tripOptions }];
  const toggleGroup = (id: string) => setOpenGroups(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const setArray = (key: 'status' | 'origin_hub_id' | 'dest_hub_id' | 'trip_id', value: string[]) => setDraftFilters(prev => ({ ...prev, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden"><div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} /><div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Bộ lọc</p><h2 className="text-lg font-extrabold text-foreground">Đóng xếp hàng</h2></div><button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground"><X size={18} /></button></div><div className="flex-1 overflow-auto p-4 custom-scrollbar">{groups.map(group => <FilterGroup key={group.id} id={group.id} title={group.title} isOpen={openGroups.includes(group.id)} search={groupSearch[group.id] || ''} options={group.options} value={draftFilters[group.key]} onToggle={() => toggleGroup(group.id)} onSearch={value => setGroupSearch(prev => ({ ...prev, [group.id]: value }))} onChange={value => setArray(group.key, value)} />)}<div className="mt-3 rounded-2xl border border-border bg-white p-4"><p className="mb-3 text-[13px] font-extrabold text-foreground">Khoảng thời gian</p><div className="grid gap-3"><input type="date" value={draftFilters.date_from} onChange={event => setDraftFilters(prev => ({ ...prev, date_from: event.target.value }))} className="h-11 rounded-xl border border-border px-3 text-[13px] font-bold outline-none" /><input type="date" value={draftFilters.date_to} onChange={event => setDraftFilters(prev => ({ ...prev, date_to: event.target.value }))} className="h-11 rounded-xl border border-border px-3 text-[13px] font-bold outline-none" /></div></div></div><div className="border-t border-border bg-white p-4"><button onClick={onApply} className="h-11 w-full rounded-xl bg-primary text-[13px] font-extrabold text-white">Áp dụng</button></div></div></div>;
}
function FilterGroup({ id, title, isOpen, search, options, value, onToggle, onSearch, onChange }: { id: string; title: string; isOpen: boolean; search: string; options: FilterOption[]; value: string[]; onToggle: () => void; onSearch: (value: string) => void; onChange: (value: string[]) => void }) { const filtered = options.filter(option => option.label.toLowerCase().includes(search.toLowerCase())); return <div className="mb-3 rounded-2xl border border-border bg-white"><button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left"><span className="text-[13px] font-extrabold text-foreground">{title}</span><ChevronDown size={16} className={clsx('text-muted-foreground transition-transform', isOpen && 'rotate-180')} /></button>{isOpen && <div className="border-t border-border p-3"><div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => onSearch(event.target.value)} placeholder={`Tìm ${title.toLowerCase()}`} className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-[13px] outline-none" /></div><div className="mb-2 flex items-center gap-2"><button onClick={() => onChange(options.map(option => option.value))} className="text-[12px] font-bold text-primary">Chọn tất cả</button><button onClick={() => onChange([])} className="text-[12px] font-bold text-red-500">Xóa chọn</button></div><div className="max-h-52 overflow-auto custom-scrollbar">{filtered.map(option => <label key={`${id}-${option.value}`} className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium hover:bg-muted/60"><input type="checkbox" checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(item => item !== option.value) : [...value, option.value])} className="h-4 w-4 rounded border-border" /><span>{option.label}</span></label>)}</div></div>}</div>; }




import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Building2, CalendarClock, ChevronLeft, ChevronRight, Edit, Filter, Loader2, Plus, Power, Search, ShieldAlert, Tag, Trash2, Truck as TruckIcon, User } from 'lucide-react';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterSelect } from '../components/ui/FilterSelect';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';
import type { AuthUserProfile } from './login/types';
import AddEditTruckDialog from './trucks/dialogs/AddEditTruckDialog';
import TruckDetailDialog from './trucks/dialogs/TruckDetailDialog';
import type { DriverSummary, FilterOption, HubSummary, Truck, TruckFilters, TruckFormState, TruckListResponse } from './trucks/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const DISPATCHER = 8;
const MANAGER = 32;
const DIRECTOR = 64;
const emptyForm: TruckFormState = { license_plate: '', payload: '', driver_id: '', fuel_consumption_limit: '', status: 'AVAILABLE' };

const statusOptions: FilterOption[] = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'ASSIGNED', label: 'Đã gán chuyến' },
  { value: 'IN_TRIP', label: 'Đang trong chuyến' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'INACTIVE', label: 'Tạm tắt' },
];
const truckTypeOptions: FilterOption[] = [
  { value: 'INTERNAL', label: 'Xe nội bộ' }, { value: 'VAN', label: 'Van' }, { value: 'LIGHT_TRUCK', label: 'Xe tải nhẹ' }, { value: 'MEDIUM_TRUCK', label: 'Xe tải trung' }, { value: 'HEAVY_TRUCK', label: 'Xe tải nặng' }, { value: 'CONTAINER', label: 'Container' },
];
const maintenanceOptions: FilterOption[] = [
  { value: 'AVAILABLE_ONLY', label: 'Đủ điều kiện lập chuyến' },
  { value: 'LOCKED', label: 'Khóa bảo trì/đăng kiểm' },
  { value: 'EXPIRED', label: 'Quá hạn đăng kiểm/bảo trì' },
];
const statusColor: Record<string, string> = { AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200', ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200', IN_TRIP: 'bg-indigo-50 text-indigo-700 border-indigo-200', IN_USE: 'bg-indigo-50 text-indigo-700 border-indigo-200', MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200', INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200' };

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};
const hasAnyRole = (mask: number, roles: number[]) => roles.some(role => (mask & role) !== 0);
const normalizeList = (response: TruckListResponse | Truck[]) => Array.isArray(response) ? response : response.data || response.items || response.trucks || [];
const normalizeTotal = (response: TruckListResponse | Truck[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const normalizeId = (value?: string | number | null) => value == null ? '' : String(value);
const toOptions = (items: Array<DriverSummary | HubSummary>, labeler: (item: any) => string): FilterOption[] => items.map(item => ({ value: normalizeId(item.id), label: labeler(item) }));
const isPast = (value?: string | null) => Boolean(value && new Date(value).getTime() < Date.now());
const isActiveTrip = (status?: string | null) => ['PLANNED', 'LOADING', 'IN_TRANSIT', 'ARRIVED_PENDING_CONFIRM'].includes(status || '');
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export default function TrucksPage() {
  const [filters, setFilters] = useState<TruckFilters>({ keyword: '', status: [], truck_type: [], hub_id: [], assigned_driver_id: [], maintenance_state: [], page: 1, limit: 10 });
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [detailTruck, setDetailTruck] = useState<Truck | null>(null);
  const [formState, setFormState] = useState<TruckFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormClosing, setIsFormClosing] = useState(false);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);

  const user = useMemo(getStoredUser, []);
  const roleMask = user?.role_mask ?? 0;
  const canView = hasAnyRole(roleMask, [DISPATCHER, MANAGER, DIRECTOR]);
  const canManage = hasAnyRole(roleMask, [MANAGER, DIRECTOR]);
  const canDelete = hasAnyRole(roleMask, [DIRECTOR]);
  const driverOptions = useMemo(() => toOptions(drivers, driver => `${driver.name || driver.username || `Tài xế #${driver.id}`}${driver.phone ? ` · ${driver.phone}` : ''}`), [drivers]);
  const hubOptions = useMemo(() => toOptions(hubs, hub => [hub.code, hub.name].filter(Boolean).join(' · ') || `Bưu cục #${hub.id}`), [hubs]);
  const activeFilterCount = filters.status.length + filters.truck_type.length + filters.hub_id.length + filters.assigned_driver_id.length + filters.maintenance_state.length;
  const from = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const to = Math.min(filters.page * filters.limit, total);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  useEffect(() => { if (canView) void loadReferences(); }, [canView]);
  useEffect(() => { if (canView) void loadTrucks(); }, [canView, filters]);

  async function loadReferences() {
    const [driversResult, hubsResult] = await Promise.allSettled([
      apiRequest<DriverSummary[] | { items?: DriverSummary[]; data?: DriverSummary[] }>('/users?role_mask=4&limit=100'),
      apiRequest<HubSummary[] | { items?: HubSummary[]; data?: HubSummary[] }>('/hubs/active'),
    ]);
    if (driversResult.status === 'fulfilled') setDrivers(Array.isArray(driversResult.value) ? driversResult.value : driversResult.value.items || driversResult.value.data || []);
    if (hubsResult.status === 'fulfilled') setHubs(Array.isArray(hubsResult.value) ? hubsResult.value : hubsResult.value.items || hubsResult.value.data || []);
  }

  async function loadTrucks() {
    setIsLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
      if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
      if (filters.status.length) params.set('status', filters.status.join(','));
      if (filters.truck_type.length) params.set('truck_type', filters.truck_type.join(','));
      if (filters.hub_id.length) params.set('hub_id', filters.hub_id.join(','));
      if (filters.assigned_driver_id.length) params.set('assigned_driver_id', filters.assigned_driver_id.join(','));
      const response = await apiRequest<TruckListResponse | Truck[]>(`/trucks?${params.toString()}`);
      let items = normalizeList(response);
      if (filters.maintenance_state.length) items = items.filter(matchesMaintenanceFilter);
      setTrucks(items); setTotal(normalizeTotal(response, items.length));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách xe nội bộ.'); setTrucks([]); setTotal(0);
    } finally { setIsLoading(false); }
  }

  function matchesMaintenanceFilter(truck: Truck) {
    const unavailable = getUnavailableReasons(truck);
    return filters.maintenance_state.some(state => state === 'AVAILABLE_ONLY' ? unavailable.length === 0 : state === 'LOCKED' ? Boolean(truck.maintenance_locked || ['MAINTENANCE', 'INACTIVE'].includes(truck.status)) : unavailable.some(reason => reason.includes('quá hạn')));
  }
  function updateFilters(next: Partial<TruckFilters>) { setFilters(prev => ({ ...prev, ...next, page: next.page ?? 1 })); }
  function setFilterArray(key: keyof Pick<TruckFilters, 'status' | 'truck_type' | 'hub_id' | 'assigned_driver_id' | 'maintenance_state'>, value: string[]) { updateFilters({ [key]: value } as Partial<TruckFilters>); }
  function clearFilters() { updateFilters({ status: [], truck_type: [], hub_id: [], assigned_driver_id: [], maintenance_state: [] }); }
  function setFormField<K extends keyof TruckFormState>(key: K, value: TruckFormState[K]) { setFormState(prev => ({ ...prev, [key]: value })); }
  function openCreate() { setSelectedTruck(null); setFormState(emptyForm); setIsEditMode(false); setIsFormOpen(true); }
  function openEdit(truck: Truck) { setSelectedTruck(truck); setFormState({ license_plate: truck.license_plate || '', payload: String(truck.payload ?? ''), driver_id: normalizeId(truck.driver_id), fuel_consumption_limit: String(truck.fuel_consumption_limit ?? ''), status: truck.status || 'AVAILABLE' }); setIsEditMode(true); setIsFormOpen(true); }
  function closeForm() { setIsFormClosing(true); setTimeout(() => { setIsFormOpen(false); setIsFormClosing(false); }, 260); }
  function closeDetail() { setIsDetailClosing(true); setTimeout(() => { setDetailTruck(null); setIsDetailClosing(false); }, 260); }
  async function submitTruck() {
    setIsSubmitting(true); setActionError('');
    const body = { license_plate: formState.license_plate.trim().toUpperCase(), payload: Number(formState.payload), driver_id: formState.driver_id || undefined, fuel_consumption_limit: Number(formState.fuel_consumption_limit || 0), status: formState.status };
    try { if (isEditMode && selectedTruck) await apiRequest(`/trucks/${selectedTruck.id}`, { method: 'PATCH', body }); else await apiRequest('/trucks', { method: 'POST', body }); closeForm(); await loadTrucks(); }
    catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể lưu thông tin xe.'); }
    finally { setIsSubmitting(false); }
  }
  function confirmStatus(truck: Truck, status: string) { setConfirmDialog({ title: 'Cập nhật trạng thái xe', message: `Xác nhận chuyển ${truck.license_plate} sang ${formatStatus(status)}?`, confirmLabel: 'Cập nhật', onConfirm: async () => { try { await apiRequest(`/trucks/${truck.id}/status`, { method: 'PATCH', body: { status } }); await loadTrucks(); } catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể cập nhật trạng thái xe.'); } } }); }
  function confirmDelete(truck: Truck) { setConfirmDialog({ title: 'Xóa xe nội bộ', message: `Xóa xe ${truck.license_plate}? Chỉ DIRECTOR được thực hiện thao tác này.`, confirmLabel: 'Xóa', danger: true, onConfirm: async () => { try { await apiRequest(`/trucks/${truck.id}`, { method: 'DELETE' }); await loadTrucks(); } catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể xóa xe.'); } } }); }
  function formatStatus(status?: string | null) { return statusOptions.find(option => option.value === status)?.label || status || '—'; }
  function formatTruckType(type?: string | null) { return truckTypeOptions.find(option => option.value === type)?.label || type || 'Xe nội bộ'; }
  function getDriverName(truck: Truck) { return truck.driver?.name || truck.driver?.username || driverOptions.find(option => option.value === normalizeId(truck.driver_id))?.label || (truck.driver_id ? `Tài xế #${truck.driver_id}` : 'Chưa gán'); }
  function getHubName(truck: Truck) { return truck.hub ? [truck.hub.code, truck.hub.name].filter(Boolean).join(' · ') : hubOptions.find(option => option.value === normalizeId(truck.hub_id))?.label || '—'; }
  function getUnavailableReasons(truck: Truck) { const reasons: string[] = []; if (truck.status !== 'AVAILABLE') reasons.push(formatStatus(truck.status)); if (truck.maintenance_locked) reasons.push('khóa bảo trì'); if (isPast(truck.registration_expiry)) reasons.push('đăng kiểm quá hạn'); if (isPast(truck.maintenance_due_at)) reasons.push('bảo trì quá hạn'); if (truck.trips?.some(trip => isActiveTrip(trip.status))) reasons.push('đang trong chuyến active'); return reasons; }

  if (!canView) return <StateBlock icon={<ShieldAlert size={24} />} title="Không có quyền truy cập" description="Trang này chỉ hiển thị cho DISPATCHER, MANAGER hoặc DIRECTOR." />;

  return <div className="h-full min-h-0 flex flex-col gap-2">
    {actionError && <Alert message={actionError} />}{error && <Alert message={error} />}
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b border-border bg-card shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => window.history.back()} className="h-10 w-10 shrink-0 rounded-lg border border-border bg-muted/10 text-[13px] font-medium text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 md:w-auto md:px-3"><ArrowLeft size={15} /><span className="hidden md:inline">Quay lại</span></button>
          <div className="relative min-w-0 flex-1 md:max-w-[460px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilters({ keyword: event.target.value })} placeholder="Tìm biển số/mã xe..." className="w-full h-10 rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10" /></div>
          <button title="Mở bộ lọc" onClick={() => setIsFilterOpen(true)} className="relative h-10 w-10 rounded-lg border border-primary/30 bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center md:hidden"><Filter size={16} />{activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>}</button>
          {activeFilterCount > 0 && <div className="order-last basis-full md:order-none md:basis-auto"><button onClick={clearFilters} className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-100 md:h-10">× Xóa {activeFilterCount} bộ lọc</button></div>}
          <div className="hidden flex-1 md:block" />
          {canManage && <button onClick={openCreate} className="h-10 rounded-lg bg-primary px-3 text-[13px] font-bold text-white hover:bg-primary/90 flex items-center gap-2"><Plus size={16} /><span className="hidden sm:inline">Thêm</span></button>}
        </div>
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <FilterSelect multiple icon={Tag} placeholder="Trạng thái xe" options={statusOptions} value={filters.status} onValueChange={value => setFilterArray('status', value)} />
          <FilterSelect multiple icon={TruckIcon} placeholder="Loại xe" options={truckTypeOptions} value={filters.truck_type} onValueChange={value => setFilterArray('truck_type', value)} />
          <FilterSelect multiple icon={Building2} placeholder="Bưu cục" options={hubOptions} value={filters.hub_id} onValueChange={value => setFilterArray('hub_id', value)} />
          <FilterSelect multiple icon={User} placeholder="Tài xế" options={driverOptions} value={filters.assigned_driver_id} onValueChange={value => setFilterArray('assigned_driver_id', value)} />
          <FilterSelect multiple icon={CalendarClock} placeholder="Đăng kiểm/bảo trì" options={maintenanceOptions} value={filters.maintenance_state} onValueChange={value => setFilterArray('maintenance_state', value)} />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={24} />} title="Đang tải danh sách xe" description="Hệ thống đang gọi API /trucks." /> : error ? <StateBlock icon={<AlertTriangle size={24} />} title="Không tải được dữ liệu" description={error} /> : trucks.length === 0 ? <StateBlock icon={<TruckIcon size={24} />} title="Chưa có xe phù hợp" description="Thử đổi bộ lọc hoặc tìm kiếm biển số khác." /> : <><table className="hidden md:table w-full min-w-[1280px] text-left border-collapse"><thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Biển số/mã xe','Loại xe','Sở hữu','Tải trọng','Bưu cục','Tài xế chính','Trạng thái','Đăng kiểm','Bảo trì','Thao tác'].map(h => <th key={h} className="px-4 py-3 border-b border-r border-border font-extrabold last:border-r-0">{h}</th>)}</tr></thead><tbody className="divide-y divide-border text-[13px]">{trucks.map(truck => <tr key={truck.id} onClick={() => setDetailTruck(truck)} className="hover:bg-blue-50/40 cursor-pointer"><td className="px-4 py-3 border-r border-border font-extrabold">{truck.license_plate}</td><td className="px-4 py-3 border-r border-border"><Badge>{formatTruckType(truck.truck_type)}</Badge></td><td className="px-4 py-3 border-r border-border">{truck.ownership_type || 'INTERNAL'}</td><td className="px-4 py-3 border-r border-border font-bold">{truck.payload != null ? `${Number(truck.payload).toLocaleString('vi-VN')} kg` : '—'}</td><td className="px-4 py-3 border-r border-border"><Badge tone="blue">{getHubName(truck)}</Badge></td><td className="px-4 py-3 border-r border-border"><Badge tone="slate">{getDriverName(truck)}</Badge></td><td className="px-4 py-3 border-r border-border"><StatusBadge status={truck.status} label={formatStatus(truck.status)} />{getUnavailableReasons(truck).length > 0 && <div className="mt-1 text-[11px] font-bold text-amber-600">Không khả dụng: {getUnavailableReasons(truck).join(', ')}</div>}</td><td className="px-4 py-3 border-r border-border">{formatDate(truck.registration_expiry)}</td><td className="px-4 py-3 border-r border-border">{formatDate(truck.maintenance_due_at)}</td><td className="px-4 py-3"><Actions truck={truck} canManage={canManage} canDelete={canDelete} onEdit={openEdit} onStatus={confirmStatus} onDelete={confirmDelete} /></td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{trucks.map(truck => <MobileCard key={truck.id} truck={truck} canManage={canManage} canDelete={canDelete} formatStatus={formatStatus} formatTruckType={formatTruckType} getDriverName={getDriverName} getHubName={getHubName} reasons={getUnavailableReasons(truck)} onOpen={setDetailTruck} onEdit={openEdit} onStatus={confirmStatus} onDelete={confirmDelete} />)}</div></>}
      </div>
      <div className="shrink-0 border-t border-border bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2"><div className="text-[12px] font-bold text-muted-foreground">{from}-{to}/Tổng: {total}</div><div className="flex items-center gap-2"><select value={filters.limit} onChange={e => updateFilters({ limit: Number(e.target.value), page: 1 })} className="h-8 rounded-lg border border-border bg-white px-2 text-[12px] font-bold"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} className="h-8 w-8 rounded-lg border border-border bg-white disabled:opacity-40 flex items-center justify-center"><ChevronLeft size={15} /></button><span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[12px] font-extrabold text-primary">{filters.page}/{totalPages}</span><button disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })} className="h-8 w-8 rounded-lg border border-border bg-white disabled:opacity-40 flex items-center justify-center"><ChevronRight size={15} /></button></div></div>
    </div>
    {isFilterOpen && <MobileFilterSheet filters={filters} driverOptions={driverOptions} hubOptions={hubOptions} onClose={() => setIsFilterOpen(false)} onApply={() => setIsFilterOpen(false)} setFilterArray={setFilterArray} />}
    <AddEditTruckDialog isOpen={isFormOpen} isClosing={isFormClosing} isEditMode={isEditMode} isSubmitting={isSubmitting} onClose={closeForm} onSubmit={submitTruck} formState={formState} setFormField={setFormField} statusOptions={[{ value: '', label: 'Chọn trạng thái' }, ...statusOptions]} driverOptions={[{ value: '', label: 'Chưa gán' }, ...driverOptions]} />
    <TruckDetailDialog isOpen={Boolean(detailTruck)} isClosing={isDetailClosing} truck={detailTruck} onClose={closeDetail} formatStatus={formatStatus} formatTruckType={formatTruckType} getDriverName={getDriverName} getHubName={getHubName} />
    <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
  </div>;
}

function Actions({ truck, canManage, canDelete, onEdit, onStatus, onDelete }: { truck: Truck; canManage: boolean; canDelete: boolean; onEdit: (truck: Truck) => void; onStatus: (truck: Truck, status: string) => void; onDelete: (truck: Truck) => void }) {
  return <div className="flex items-center gap-1" onClick={event => event.stopPropagation()}><button disabled={!canManage} onClick={() => onEdit(truck)} className="h-8 w-8 rounded-lg border border-border text-primary disabled:opacity-40 flex items-center justify-center"><Edit size={14} /></button><button disabled={!canManage} onClick={() => onStatus(truck, truck.status === 'AVAILABLE' ? 'INACTIVE' : 'AVAILABLE')} className="h-8 w-8 rounded-lg border border-border text-amber-600 disabled:opacity-40 flex items-center justify-center"><Power size={14} /></button>{canDelete && <button onClick={() => onDelete(truck)} className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-500 flex items-center justify-center"><Trash2 size={14} /></button>}</div>;
}
function MobileCard(props: { truck: Truck; canManage: boolean; canDelete: boolean; reasons: string[]; formatStatus: (v?: string | null) => string; formatTruckType: (v?: string | null) => string; getDriverName: (t: Truck) => string; getHubName: (t: Truck) => string; onOpen: (t: Truck) => void; onEdit: (t: Truck) => void; onStatus: (t: Truck, s: string) => void; onDelete: (t: Truck) => void }) { const { truck } = props; return <article onClick={() => props.onOpen(truck)} className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-3"><div className="flex items-start justify-between gap-3"><div><div className="text-[15px] font-extrabold text-foreground">{truck.license_plate}</div><div className="text-[12px] font-bold text-muted-foreground">{props.formatTruckType(truck.truck_type)} · {truck.ownership_type || 'INTERNAL'}</div></div><StatusBadge status={truck.status} label={props.formatStatus(truck.status)} /></div><div className="grid grid-cols-2 gap-2 text-[12px]"><Info label="Tải trọng" value={truck.payload != null ? `${truck.payload} kg` : '—'} /><Info label="Bưu cục" value={props.getHubName(truck)} /><Info label="Tài xế" value={props.getDriverName(truck)} /><Info label="Đăng kiểm" value={formatDate(truck.registration_expiry)} /><Info label="Bảo trì" value={formatDate(truck.maintenance_due_at)} /></div>{props.reasons.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700">Không khả dụng: {props.reasons.join(', ')}</div>}<Actions truck={truck} canManage={props.canManage} canDelete={props.canDelete} onEdit={props.onEdit} onStatus={props.onStatus} onDelete={props.onDelete} /></article>; }
function MobileFilterSheet({ filters, driverOptions, hubOptions, onClose, onApply, setFilterArray }: { filters: TruckFilters; driverOptions: FilterOption[]; hubOptions: FilterOption[]; onClose: () => void; onApply: () => void; setFilterArray: (key: any, value: string[]) => void }) { return <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden"><div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} /><div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl"><div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between"><div className="font-extrabold">Bộ lọc xe</div><button onClick={onClose} className="h-9 w-9 rounded-full bg-muted text-muted-foreground">×</button></div><div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"><CheckGroup title="Trạng thái xe" options={statusOptions} value={filters.status} onChange={value => setFilterArray('status', value)} /><CheckGroup title="Loại xe" options={truckTypeOptions} value={filters.truck_type} onChange={value => setFilterArray('truck_type', value)} /><CheckGroup title="Bưu cục" options={hubOptions} value={filters.hub_id} onChange={value => setFilterArray('hub_id', value)} /><CheckGroup title="Tài xế" options={driverOptions} value={filters.assigned_driver_id} onChange={value => setFilterArray('assigned_driver_id', value)} /><CheckGroup title="Tình trạng đăng kiểm/bảo trì" options={maintenanceOptions} value={filters.maintenance_state} onChange={value => setFilterArray('maintenance_state', value)} /></div><div className="shrink-0 border-t border-border p-3"><button onClick={onApply} className="h-11 w-full rounded-xl bg-primary text-[14px] font-extrabold text-white">Áp dụng</button></div></div></div>; }
function CheckGroup({ title, options, value, onChange }: { title: string; options: FilterOption[]; value: string[]; onChange: (value: string[]) => void }) { const [keyword, setKeyword] = useState(''); const visible = options.filter(o => o.label.toLowerCase().includes(keyword.toLowerCase())); const all = options.map(o => o.value); return <details open className="rounded-2xl border border-border bg-white p-3"><summary className="cursor-pointer text-[13px] font-extrabold text-foreground">{title}</summary><div className="mt-3 space-y-2"><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Tìm kiếm..." className="h-9 w-full rounded-lg border border-border bg-muted/10 px-3 text-[13px] outline-none" /><div className="flex items-center justify-between text-[12px] font-bold"><button onClick={() => onChange(all)} className="text-primary">Chọn tất cả</button><button onClick={() => onChange([])} className="text-red-500">Xóa chọn</button></div>{visible.map(option => <label key={option.value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium"><input type="checkbox" checked={value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter(item => item !== option.value) : [...value, option.value])} />{option.label}</label>)}</div></details>; }
function StatusBadge({ status, label }: { status?: string | null; label: string }) { return <span className={clsx('inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold', statusColor[status || ''] || 'bg-slate-50 text-slate-600 border-slate-200')}>{label}</span>; }
function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'blue' }) { return <span className={clsx('inline-flex rounded-full border px-2 py-1 text-[11px] font-extrabold', tone === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>{children}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/10 p-2"><div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-0.5 font-extrabold text-foreground">{value}</div></div>; }
function Alert({ message }: { message: string }) { return <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-bold text-red-600">{message}</div>; }
function StateBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center gap-2 p-6 text-center"><div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{icon}</div><div className="text-[15px] font-extrabold text-foreground">{title}</div><div className="max-w-md text-[13px] font-medium text-muted-foreground">{description}</div></div>; }


import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Building2, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Eye, Filter, Flag, Loader2, Package, Plus, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import AssignPriorityDialog from './warehouse/priority/dialogs/AssignPriorityDialog';
import WaybillPriorityDetailDialog from './warehouse/priority/dialogs/WaybillPriorityDetailDialog';
import type { BadgeConfig, FilterOption, HubSummary, PriorityFormState, WaybillListResponse, WaybillPriorityDetail, WaybillPriorityFilters, WaybillPriorityItem } from './warehouse/priority/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const DISPATCHER = 8;
const MANAGER = 32;
const DIRECTOR = 64;
const defaultFilters: WaybillPriorityFilters = { keyword: '', statuses: [], originHubIds: [], destHubIds: [], paymentTypes: [], page: 1, limit: 10 };

const statusConfig: Record<string, BadgeConfig> = {
  RECEIVED: { label: 'Đã tạo đơn', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_WAREHOUSE: { label: 'Trong kho', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MANIFEST_CLOSED: { label: 'Chờ xuất chuyến', className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  IN_TRANSIT: { label: 'Đang trung chuyển', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  AT_DEST_HUB: { label: 'Tới hub đích', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  OUT_FOR_DELIVERY: { label: 'Chờ giao', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  DELIVERED: { label: 'Đã giao', className: 'bg-green-50 text-green-700 border-green-200' },
  RETURNED: { label: 'Hoàn trả', className: 'bg-red-50 text-red-700 border-red-200' },
};
const paymentConfig: Record<string, BadgeConfig> = {
  PP: { label: 'PP', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  CC: { label: 'CC', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  COD: { label: 'COD', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};
const priorityConfig: Record<string, BadgeConfig> = {
  HIGH: { label: 'Cao', className: 'bg-red-50 text-red-700 border-red-200' },
  NORMAL: { label: 'Tiêu chuẩn', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  LOW: { label: 'Thấp', className: 'bg-muted text-muted-foreground border-border' },
};
const priorityToneConfig: Record<string, { rowClassName: string; cardClassName: string; iconClassName: string; labelClassName: string }> = {
  HIGH: {
    rowClassName: 'bg-red-50/55 hover:bg-red-50 border-l-4 border-l-red-400',
    cardClassName: 'border-red-200 bg-red-50/60 shadow-red-100',
    iconClassName: 'border-red-200 bg-red-100 text-red-600',
    labelClassName: 'bg-red-100 text-red-700 border-red-200',
  },
  NORMAL: {
    rowClassName: 'bg-blue-50/45 hover:bg-blue-50 border-l-4 border-l-blue-400',
    cardClassName: 'border-blue-200 bg-blue-50/55 shadow-blue-100',
    iconClassName: 'border-blue-200 bg-blue-100 text-primary',
    labelClassName: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  LOW: {
    rowClassName: 'bg-slate-50/80 hover:bg-slate-100 border-l-4 border-l-slate-300',
    cardClassName: 'border-slate-200 bg-slate-50 shadow-slate-100',
    iconClassName: 'border-slate-200 bg-slate-100 text-slate-500',
    labelClassName: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};
const statusOptions = Object.entries(statusConfig).map(([value, config]) => ({ value, label: config.label }));
const paymentOptions = Object.entries(paymentConfig).map(([value, config]) => ({ value, label: config.label }));

const getStoredUser = (): AuthUserProfile | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};
const canUpdatePriority = (roleMask: number) => (roleMask & (DISPATCHER | MANAGER | DIRECTOR)) !== 0;
const normalizeList = (response: WaybillListResponse | WaybillPriorityItem[]) => Array.isArray(response) ? response : response.data || response.items || response.waybills || [];
const normalizeTotal = (response: WaybillListResponse | WaybillPriorityItem[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const displayValue = (value: unknown, suffix = '') => value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
const displayCode = (waybill: WaybillPriorityItem) => waybill.waybill_code || `#${waybill.id}`;
const normalizePriority = (waybill: WaybillPriorityItem) => String(waybill.priority || 'NORMAL').toUpperCase();
const getPriorityTone = (waybill: WaybillPriorityItem) => priorityToneConfig[normalizePriority(waybill)] || priorityToneConfig.NORMAL;
const formatHub = (hub: HubSummary | null | undefined, fallback?: string | number | null) => hub ? [hub.code?.toUpperCase(), hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}` : fallback ? `Hub #${fallback}` : '—';
const formatMoney = (value?: string | number | null) => value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const buildQuery = (filters: WaybillPriorityFilters) => {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.statuses.length) params.set('status', filters.statuses.join(','));
  if (filters.originHubIds.length) params.set('origin_hub_id', filters.originHubIds.join(','));
  if (filters.destHubIds.length) params.set('dest_hub_id', filters.destHubIds.join(','));
  if (filters.paymentTypes.length) params.set('payment_type', filters.paymentTypes.join(','));
  return params.toString();
};

export default function WarehousePriorityPage() {
  const [filters, setFilters] = useState<WaybillPriorityFilters>(defaultFilters);
  const [waybills, setWaybills] = useState<WaybillPriorityItem[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [detailWaybill, setDetailWaybill] = useState<WaybillPriorityDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [priorityWaybill, setPriorityWaybill] = useState<WaybillPriorityItem | null>(null);
  const [priorityForm, setPriorityForm] = useState<PriorityFormState>({ priority: 'NORMAL' });
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isPriorityClosing, setIsPriorityClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const user = useMemo(getStoredUser, []);
  const canUpdate = canUpdatePriority(user?.role_mask ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const hubOptions = useMemo(() => hubs.map(hub => ({ value: String(hub.id), label: formatHub(hub) })), [hubs]);
  const activeFilterCount = filters.statuses.length + filters.originHubIds.length + filters.destHubIds.length + filters.paymentTypes.length;
  const from = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const to = Math.min(total, filters.page * filters.limit);

  const updateFilters = (patch: Partial<WaybillPriorityFilters>) => setFilters(prev => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  const setFilterArray = (key: keyof Pick<WaybillPriorityFilters, 'statuses' | 'originHubIds' | 'destHubIds' | 'paymentTypes'>, value: string[]) => updateFilters({ [key]: value } as Partial<WaybillPriorityFilters>);
  const clearFilters = () => setFilters(defaultFilters);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    apiRequest<WaybillListResponse | WaybillPriorityItem[]>(`/waybills?${buildQuery(filters)}`)
      .then(response => { if (!cancelled) { const list = normalizeList(response); setWaybills(list); setTotal(normalizeTotal(response, list.length)); } })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách vận đơn.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  useEffect(() => {
    apiRequest<HubSummary[]>('/hubs/active').then(setHubs).catch(() => setHubs([]));
  }, []);

  const openDetail = (waybill: WaybillPriorityItem) => {
    setIsDetailOpen(true); setIsDetailLoading(true); setDetailWaybill(null);
    apiRequest<WaybillPriorityDetail>(`/waybills/${waybill.id}`)
      .then(setDetailWaybill)
      .catch(() => setDetailWaybill(waybill))
      .finally(() => setIsDetailLoading(false));
  };
  const closeDetail = () => { setIsDetailClosing(true); window.setTimeout(() => { setIsDetailOpen(false); setIsDetailClosing(false); setDetailWaybill(null); }, 180); };
  const openPriority = (waybill: WaybillPriorityItem) => { if (!canUpdate) return; setPriorityWaybill(waybill); setPriorityForm({ priority: String(waybill.priority || 'NORMAL').toUpperCase() }); setActionError(''); setIsPriorityOpen(true); };
  const closePriority = () => { setIsPriorityClosing(true); window.setTimeout(() => { setIsPriorityOpen(false); setIsPriorityClosing(false); setPriorityWaybill(null); }, 180); };
  const submitPriority = async () => {
    if (!priorityWaybill) return;
    setIsSubmitting(true); setActionError('');
    try {
      const updated = await apiRequest<WaybillPriorityItem>(`/waybills/${priorityWaybill.id}/priority`, { method: 'PATCH', body: { priority: priorityForm.priority } });
      setWaybills(prev => prev.map(item => String(item.id) === String(priorityWaybill.id) ? { ...item, ...updated, priority: updated.priority ?? priorityForm.priority } : item));
      closePriority();
    } catch (err) { setActionError(err instanceof ApiError ? err.message : 'Không thể cập nhật ưu tiên.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground md:w-auto md:px-3"><ArrowLeft size={16} /><span className="ml-2 hidden text-[13px] font-bold md:inline">Quay lại</span></button>
            <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilters({ keyword: event.target.value })} placeholder="Tìm mã vận đơn, người gửi, người nhận..." className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-3 text-[13px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
            <button aria-label="Mở bộ lọc" onClick={() => setIsFilterPanelOpen(true)} className="relative h-10 w-10 rounded-lg border border-primary/30 bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center md:hidden"><Filter size={16} />{activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>}</button>
            {activeFilterCount > 0 && <div className="order-last basis-full md:order-none md:basis-auto"><button onClick={clearFilters} className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-100 md:h-10">× Xóa {activeFilterCount} bộ lọc</button></div>}
            <div className="hidden flex-1 md:block" />
            <button disabled className="hidden h-10 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-[13px] font-bold text-muted-foreground opacity-60 md:flex"><Plus size={16} />Thêm</button>
          </div>
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect multiple icon={Flag} placeholder="Trạng thái" options={statusOptions} value={filters.statuses} onValueChange={value => setFilterArray('statuses', value)} />
            <FilterSelect multiple icon={Building2} placeholder="Bưu cục đi" options={hubOptions} value={filters.originHubIds} onValueChange={value => setFilterArray('originHubIds', value)} />
            <FilterSelect multiple icon={Building2} placeholder="Bưu cục đến" options={hubOptions} value={filters.destHubIds} onValueChange={value => setFilterArray('destHubIds', value)} />
            <FilterSelect multiple icon={CreditCard} placeholder="Loại thanh toán" options={paymentOptions} value={filters.paymentTypes} onValueChange={value => setFilterArray('paymentTypes', value)} />
          </div>
          {actionError && <Alert message={actionError} tone="red" />}
        </div>
        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin" />} title="Đang tải vận đơn" description="Hệ thống đang lấy dữ liệu phân loại ưu tiên." /> : error ? <StateBlock icon={<AlertTriangle />} title="Không tải được dữ liệu" description={error} /> : !waybills.length ? <StateBlock icon={<Package />} title="Không có vận đơn" description="Không tìm thấy vận đơn phù hợp với bộ lọc hiện tại." /> : (
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            <table className="hidden md:table w-full min-w-[1280px] text-left border-collapse">
              <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Mã vận đơn','Người gửi','Người nhận','Hub đi','Hub đến','Trạng thái','Loại TT','Cân nặng','Kích thước','TL quy đổi','Cước phí','Thao tác'].map(header => <th key={header} className="px-4 py-2.5 font-bold border-r border-border last:border-r-0">{header}</th>)}</tr></thead>
              <tbody>{waybills.map(waybill => <DesktopRow key={waybill.id} waybill={waybill} canUpdate={canUpdate} onDetail={openDetail} onPriority={openPriority} />)}</tbody>
            </table>
            <div className="grid gap-3 p-3 md:hidden">{waybills.map(waybill => <MobileCard key={waybill.id} waybill={waybill} canUpdate={canUpdate} onDetail={openDetail} onPriority={openPriority} />)}</div>
          </div>
        )}
        <div className="shrink-0 border-t border-border bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] font-bold text-muted-foreground">{from}-{to}/Tổng:{total}</span>
          <div className="flex items-center gap-2"><select value={filters.limit} onChange={event => setFilters(prev => ({ ...prev, limit: Number(event.target.value), page: 1 }))} className="h-9 rounded-lg border border-input bg-white px-2 text-[12px] font-bold"><option value={10}>10/trang</option><option value={20}>20/trang</option><option value={50}>50/trang</option></select><button disabled={filters.page <= 1} onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"><ChevronLeft size={16} /></button><span className="rounded-lg bg-primary/10 px-3 py-2 text-[12px] font-black text-primary">{filters.page}/{totalPages}</span><button disabled={filters.page >= totalPages} onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white disabled:opacity-40"><ChevronRight size={16} /></button></div>
        </div>
      </div>
      {isFilterPanelOpen && <MobileFilterSheet filters={filters} hubOptions={hubOptions} onApply={next => { setFilters({ ...next, page: 1 }); setIsFilterPanelOpen(false); }} onClose={() => setIsFilterPanelOpen(false)} />}
      <WaybillPriorityDetailDialog isOpen={isDetailOpen} isClosing={isDetailClosing} isLoading={isDetailLoading} waybill={detailWaybill} statusConfig={statusConfig} paymentConfig={paymentConfig} priorityConfig={priorityConfig} onClose={closeDetail} />
      <AssignPriorityDialog isOpen={isPriorityOpen} isClosing={isPriorityClosing} isSubmitting={isSubmitting} waybill={priorityWaybill} formState={priorityForm} priorityConfig={priorityConfig} onChange={value => setPriorityForm({ priority: value })} onClose={closePriority} onSubmit={submitPriority} />
    </div>
  );
}

function DesktopRow({ waybill, canUpdate, onDetail, onPriority }: { waybill: WaybillPriorityItem; canUpdate: boolean; onDetail: (waybill: WaybillPriorityItem) => void; onPriority: (waybill: WaybillPriorityItem) => void }) {
  const status = String(waybill.current_state || '').toUpperCase();
  const payment = String(waybill.payment_type || '').toUpperCase();
  const priority = normalizePriority(waybill);
  const priorityBadge = priorityConfig[priority] || priorityConfig.NORMAL;
  const tone = getPriorityTone(waybill);
  return <tr className={clsx('border-b border-border text-[13px] transition-colors', tone.rowClassName)}><Cell className="font-black text-primary">{displayCode(waybill)}</Cell><Cell>{displayValue(waybill.sender_info)}</Cell><Cell>{displayValue(waybill.receiver_info)}</Cell><Cell><HubBadge>{formatHub(waybill.origin_hub, waybill.origin_hub_id)}</HubBadge></Cell><Cell><HubBadge>{formatHub(waybill.dest_hub, waybill.dest_hub_id)}</HubBadge></Cell><Cell><Badge config={statusConfig[status]} fallback={status || '—'} /></Cell><Cell><Badge config={paymentConfig[payment]} fallback={payment || '—'} /></Cell><Cell>{displayValue(waybill.weight, ' kg')}</Cell><Cell>{displayValue(waybill.length)} × {displayValue(waybill.width)} × {displayValue(waybill.height)}</Cell><Cell>{displayValue(waybill.volumetric_weight, ' kg')}</Cell><Cell>{formatMoney(waybill.cost_amount)}</Cell><Cell><div className="flex items-center gap-2"><Badge config={{ ...priorityBadge, className: tone.labelClassName }} fallback={priority || '—'} /><IconButton label="Xem chi tiết" onClick={() => onDetail(waybill)}><Eye size={15} /></IconButton><IconButton label={canUpdate ? 'Cập nhật ưu tiên' : 'Không đủ quyền'} disabled={!canUpdate} onClick={() => onPriority(waybill)}><Flag size={15} /></IconButton></div></Cell></tr>;
}
function MobileCard({ waybill, canUpdate, onDetail, onPriority }: { waybill: WaybillPriorityItem; canUpdate: boolean; onDetail: (waybill: WaybillPriorityItem) => void; onPriority: (waybill: WaybillPriorityItem) => void }) {
  const status = String(waybill.current_state || '').toUpperCase();
  const payment = String(waybill.payment_type || '').toUpperCase();
  const priority = normalizePriority(waybill);
  const priorityBadge = priorityConfig[priority] || priorityConfig.NORMAL;
  const tone = getPriorityTone(waybill);
  return <article className={clsx('rounded-2xl border p-4 shadow-sm', tone.cardClassName)}><div className="flex items-start gap-3"><div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', tone.iconClassName)}><Package size={20} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[14px] font-black text-primary">{displayCode(waybill)}</p><p className="mt-1 text-[12px] font-bold text-muted-foreground line-clamp-2">{displayValue(waybill.sender_info)} → {displayValue(waybill.receiver_info)}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><Badge config={statusConfig[status]} fallback={status || '—'} /><Badge config={{ ...priorityBadge, className: tone.labelClassName }} fallback={priority || '—'} /></div></div><div className="mt-3 grid gap-2 text-[12px]"><MobileInfo label="Hub đi" value={<HubBadge>{formatHub(waybill.origin_hub, waybill.origin_hub_id)}</HubBadge>} /><MobileInfo label="Hub đến" value={<HubBadge>{formatHub(waybill.dest_hub, waybill.dest_hub_id)}</HubBadge>} /><MobileInfo label="Loại thanh toán" value={<Badge config={paymentConfig[payment]} fallback={payment || '—'} />} /><MobileInfo label="Cân nặng" value={displayValue(waybill.weight, ' kg')} /><MobileInfo label="Kích thước" value={`${displayValue(waybill.length)} × ${displayValue(waybill.width)} × ${displayValue(waybill.height)}`} /><MobileInfo label="Trọng lượng quy đổi" value={displayValue(waybill.volumetric_weight, ' kg')} /><MobileInfo label="Cước phí" value={formatMoney(waybill.cost_amount)} /></div><div className="mt-4 flex gap-2"><button onClick={() => onDetail(waybill)} className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[12px] font-bold text-foreground">Xem chi tiết</button><button disabled={!canUpdate} onClick={() => onPriority(waybill)} className="flex-1 rounded-xl bg-primary px-3 py-2 text-[12px] font-bold text-white disabled:bg-muted disabled:text-muted-foreground">Ưu tiên</button></div></div></div></article>;
}
function MobileFilterSheet({ filters, hubOptions, onApply, onClose }: { filters: WaybillPriorityFilters; hubOptions: FilterOption[]; onApply: (filters: WaybillPriorityFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(filters);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ statuses: true, origin: false, dest: false, payment: false });
  const toggle = (key: keyof Pick<WaybillPriorityFilters, 'statuses' | 'originHubIds' | 'destHubIds' | 'paymentTypes'>, value: string) => setDraft(prev => ({ ...prev, [key]: (prev[key] as string[]).includes(value) ? (prev[key] as string[]).filter(item => item !== value) : [...(prev[key] as string[]), value] }));
  return <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden"><div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} /><div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border bg-card p-5"><div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Bộ lọc</p><h2 className="text-lg font-black text-foreground">Phân loại ưu tiên</h2></div><button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar"><FilterGroup id="statuses" title="Trạng thái" options={statusOptions} selected={draft.statuses} openGroups={openGroups} setOpenGroups={setOpenGroups} onToggle={value => toggle('statuses', value)} onAll={() => setDraft(prev => ({ ...prev, statuses: statusOptions.map(item => item.value) }))} onClear={() => setDraft(prev => ({ ...prev, statuses: [] }))} /><FilterGroup id="origin" title="Bưu cục đi" options={hubOptions} selected={draft.originHubIds} openGroups={openGroups} setOpenGroups={setOpenGroups} onToggle={value => toggle('originHubIds', value)} onAll={() => setDraft(prev => ({ ...prev, originHubIds: hubOptions.map(item => item.value) }))} onClear={() => setDraft(prev => ({ ...prev, originHubIds: [] }))} /><FilterGroup id="dest" title="Bưu cục đến" options={hubOptions} selected={draft.destHubIds} openGroups={openGroups} setOpenGroups={setOpenGroups} onToggle={value => toggle('destHubIds', value)} onAll={() => setDraft(prev => ({ ...prev, destHubIds: hubOptions.map(item => item.value) }))} onClear={() => setDraft(prev => ({ ...prev, destHubIds: [] }))} /><FilterGroup id="payment" title="Loại thanh toán" options={paymentOptions} selected={draft.paymentTypes} openGroups={openGroups} setOpenGroups={setOpenGroups} onToggle={value => toggle('paymentTypes', value)} onAll={() => setDraft(prev => ({ ...prev, paymentTypes: paymentOptions.map(item => item.value) }))} onClear={() => setDraft(prev => ({ ...prev, paymentTypes: [] }))} /></div><div className="border-t border-border bg-card p-4"><button onClick={() => onApply(draft)} className="w-full rounded-xl bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-sm shadow-primary/20">Áp dụng</button></div></div></div>;
}
function FilterGroup({ id, title, options, selected, openGroups, setOpenGroups, onToggle, onAll, onClear }: { id: string; title: string; options: FilterOption[]; selected: string[]; openGroups: Record<string, boolean>; setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>; onToggle: (value: string) => void; onAll: () => void; onClear: () => void }) {
  const [search, setSearch] = useState(''); const filteredOptions = options.filter(option => option.label.toLowerCase().includes(search.toLowerCase())); const isOpen = openGroups[id];
  return <div className="overflow-hidden rounded-2xl border border-border bg-white"><button onClick={() => setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))} className="flex w-full items-center justify-between px-4 py-3 text-left"><span className="text-[13px] font-black text-foreground">{title}</span><ChevronDown size={16} className={clsx('transition-transform', isOpen && 'rotate-180')} /></button>{isOpen && <div className="border-t border-border p-4"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm trong nhóm lọc..." className="h-10 w-full rounded-xl border border-input bg-white pl-9 pr-3 text-[12px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></div><div className="mt-3 flex gap-2"><button onClick={onAll} className="rounded-lg bg-primary/10 px-3 py-2 text-[12px] font-bold text-primary">Chọn tất cả</button><button onClick={onClear} className="rounded-lg bg-muted px-3 py-2 text-[12px] font-bold text-muted-foreground">Xóa chọn</button></div><div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">{filteredOptions.map(option => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-[13px] font-bold text-foreground hover:bg-muted/40"><input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} className="h-4 w-4 accent-primary" />{option.label}</label>)}</div></div>}</div>;
}
function Cell({ children, className }: { children: ReactNode; className?: string }) { return <td className={clsx('max-w-[220px] border-r border-border px-4 py-3 align-middle last:border-r-0', className)}><div className="truncate">{children}</div></td>; }
function Badge({ config, fallback }: { config?: BadgeConfig; fallback: ReactNode }) { return <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black whitespace-nowrap', config?.className || 'bg-muted text-muted-foreground border-border')}>{config?.label || fallback}</span>; }
function HubBadge({ children }: { children: ReactNode }) { return <span className="inline-flex max-w-[180px] items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700"><span className="truncate">{children}</span></span>; }
function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) { return <button aria-label={label} title={label} disabled={disabled} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-muted-foreground">{children}</button>; }
function MobileInfo({ label, value }: { label: string; value: ReactNode }) { return <div className="min-w-0"><span className="text-muted-foreground">{label}: </span><span className="font-bold text-foreground break-words">{value}</span></div>; }
function Alert({ message, tone = 'amber' }: { message: string; tone?: 'amber' | 'red' }) { return <div className={clsx('flex gap-2 rounded-2xl border px-4 py-3 text-[13px] font-bold', tone === 'red' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800')}><AlertTriangle size={16} className="mt-0.5 shrink-0" />{message}</div>; }
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center bg-white p-8 text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div><h3 className="text-base font-black text-foreground">{title}</h3><p className="mt-2 max-w-md text-[13px] leading-6 text-muted-foreground">{description}</p></div>; }


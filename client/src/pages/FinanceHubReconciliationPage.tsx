import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, Building2, CalendarDays, ChevronLeft, ChevronRight, DollarSign, Edit, Eye, Filter, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel, type FilterPanelGroup } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import AddEditReconciliationDialog from './finance/hub-reconciliation/dialogs/AddEditReconciliationDialog';
import HubReconciliationDetailDialog from './finance/hub-reconciliation/dialogs/HubReconciliationDetailDialog';
import UpdateRemittanceStatusDialog from './finance/hub-reconciliation/dialogs/UpdateRemittanceStatusDialog';
import type { FilterOption, HubReconciliation, HubReconciliationFilters, HubSummary, ListResponse, ReconciliationFormState, RemittanceStatus } from './finance/hub-reconciliation/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const ACCOUNTANT = 16;
const MANAGER = 32;
const DIRECTOR = 64;
const defaultFilters: HubReconciliationFilters = { keyword: '', hub_id: '', remittance_status: '', date_from: '', date_to: '', page: 1, limit: 10 };
const emptyForm: ReconciliationFormState = { hub_id: '', reconciliation_date: '', cod_cash_held: '0', cc_cash_held: '0', total_remitted: '0', remittance_status: 'PENDING' };
const statusOptions: FilterOption[] = [
  { value: 'PENDING', label: 'PENDING' },
  { value: 'REMITTED', label: 'REMITTED' },
  { value: 'OVERDUE', label: 'OVERDUE' },
];

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};
const canUseFinance = (roleMask: number) => (roleMask & (ACCOUNTANT | MANAGER | DIRECTOR)) !== 0;
const normalizeList = <T,>(response: ListResponse<T> | T[]) => Array.isArray(response) ? response : response.data || response.items || response.results || [];
const normalizeTotal = <T,>(response: ListResponse<T> | T[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const getErrorMessage = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Không thể tải dữ liệu.';
const money = (value?: string | number | null) => Number(value || 0).toLocaleString('vi-VN');
const remaining = (item: HubReconciliation) => Number(item.cod_cash_held || 0) + Number(item.cc_cash_held || 0) - Number(item.total_remitted || 0);
const hubLabel = (item: HubReconciliation) => item.hub?.code || item.hub?.name || `Hub #${item.hub_id}`;

const buildQuery = (filters: HubReconciliationFilters) => {
  const params = new URLSearchParams();
  if (filters.hub_id) params.set('hub_id', filters.hub_id);
  if (filters.remittance_status) params.set('remittance_status', filters.remittance_status);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.date_from === filters.date_to && filters.date_from) params.set('reconciliation_date', filters.date_from);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
};

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }) {
  return <span className={clsx('inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-extrabold', tone === 'green' && 'bg-emerald-50 text-emerald-700', tone === 'amber' && 'bg-amber-50 text-amber-700', tone === 'red' && 'bg-red-50 text-red-600', tone === 'blue' && 'bg-blue-50 text-blue-700', tone === 'slate' && 'bg-slate-100 text-slate-700')}>{children}</span>;
}
const statusTone = (status: RemittanceStatus) => status === 'REMITTED' ? 'green' : status === 'OVERDUE' ? 'red' : 'amber';
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex flex-1 min-h-[360px] items-center justify-center p-6"><div className="max-w-md text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">{icon}</div><p className="text-[15px] font-extrabold text-foreground">{title}</p><p className="mt-1 text-[13px] text-muted-foreground">{description}</p></div></div>; }

export default function FinanceHubReconciliationPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<HubReconciliationFilters>(defaultFilters);
  const [items, setItems] = useState<HubReconciliation[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HubReconciliation | null>(null);
  const [detailItem, setDetailItem] = useState<HubReconciliation | null>(null);
  const [formState, setFormState] = useState<ReconciliationFormState>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [statusDialogItem, setStatusDialogItem] = useState<HubReconciliation | null>(null);
  const [nextStatus, setNextStatus] = useState<RemittanceStatus>('PENDING');

  const user = useMemo(getStoredUser, []);
  const canManageFinance = canUseFinance(user?.role_mask ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const hubOptions = useMemo(() => hubs.map(hub => ({ value: String(hub.id), label: [hub.code, hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}` })), [hubs]);
  const activeFilterCount = Number(Boolean(filters.hub_id)) + Number(Boolean(filters.remittance_status)) + Number(Boolean(filters.date_from || filters.date_to));

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const query = buildQuery(filters);
      const [listResponse, hubResponse] = await Promise.all([
        apiRequest<ListResponse<HubReconciliation> | HubReconciliation[]>(`/finance/hub-reconciliation?${query}`).catch(async () => apiRequest<ListResponse<HubReconciliation> | HubReconciliation[]>(`/finance/reconciliations?${query}`)),
        apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active').catch(() => [] as HubSummary[]),
      ]);
      const rows = normalizeList(listResponse);
      setItems(rows);
      setTotal(normalizeTotal(listResponse, rows.length));
      setHubs(normalizeList(hubResponse));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [filters.hub_id, filters.remittance_status, filters.date_from, filters.date_to, filters.page, filters.limit]);

  const filteredItems = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(item => [hubLabel(item), item.reconciliation_date, item.remittance_status, String(item.hub_id)].some(value => value.toLowerCase().includes(keyword)));
  }, [filters.keyword, items]);

  const updateFilters = (patch: Partial<HubReconciliationFilters>) => setFilters(current => ({ ...current, ...patch }));
  const setFormField = <K extends keyof ReconciliationFormState>(key: K, value: ReconciliationFormState[K]) => setFormState(current => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters(current => ({ ...defaultFilters, keyword: current.keyword, limit: current.limit }));

  const validateForm = () => {
    if (!formState.hub_id) return 'Bưu cục/kho là bắt buộc.';
    if (!formState.reconciliation_date) return 'Ngày đối soát là bắt buộc.';
    if (Number(formState.cod_cash_held) < 0) return 'Tiền COD giữ không được âm.';
    if (Number(formState.cc_cash_held) < 0) return 'Tiền CC giữ không được âm.';
    if (Number(formState.total_remitted) < 0) return 'Tổng đã nộp không được âm.';
    if (!statusOptions.some(option => option.value === formState.remittance_status)) return 'Trạng thái nộp tiền không hợp lệ.';
    return '';
  };

  const openCreate = () => { setIsEditMode(false); setSelectedItem(null); setFormState(emptyForm); setDialogError(''); setIsFormOpen(true); };
  const openEdit = (item: HubReconciliation) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setFormState({ hub_id: String(item.hub_id), reconciliation_date: item.reconciliation_date?.slice(0, 10) || '', cod_cash_held: String(item.cod_cash_held ?? 0), cc_cash_held: String(item.cc_cash_held ?? 0), total_remitted: String(item.total_remitted ?? 0), remittance_status: item.remittance_status });
    setDialogError('');
    setIsFormOpen(true);
  };
  const openStatus = (item: HubReconciliation) => { setStatusDialogItem(item); setNextStatus(item.remittance_status); setDialogError(''); };

  const submitForm = async () => {
    if (!canManageFinance) return;
    const validationError = validateForm();
    if (validationError) { setDialogError(validationError); return; }
    setIsSubmitting(true);
    setDialogError('');
    try {
      const payload = { hub_id: formState.hub_id, reconciliation_date: formState.reconciliation_date, cod_cash_held: Number(formState.cod_cash_held), cc_cash_held: Number(formState.cc_cash_held), total_remitted: Number(formState.total_remitted), remittance_status: formState.remittance_status };
      if (isEditMode && selectedItem) await apiRequest(`/finance/reconciliations/${selectedItem.id}`, { method: 'PATCH', body: payload });
      else await apiRequest('/finance/reconciliations', { method: 'POST', body: payload });
      setIsFormOpen(false);
      await loadData();
    } catch (submitError) {
      setDialogError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStatus = async () => {
    if (!canManageFinance || !statusDialogItem) return;
    setIsSubmitting(true);
    setDialogError('');
    try {
      await apiRequest(`/finance/reconciliations/${statusDialogItem.id}/remittance-status`, { method: 'PATCH', body: { remittance_status: nextStatus } });
      setStatusDialogItem(null);
      await loadData();
    } catch (submitError) {
      setDialogError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filterGroups: FilterPanelGroup[] = [
    { id: 'status', title: 'Trạng thái đối soát', icon: RefreshCw, options: statusOptions, value: filters.remittance_status ? [filters.remittance_status] : [], searchPlaceholder: 'Tìm trạng thái', onChange: value => updateFilters({ remittance_status: (value[0] || '') as RemittanceStatus | '', page: 1 }) },
    { id: 'hub', title: 'Bưu cục', icon: Building2, options: hubOptions, value: filters.hub_id ? [filters.hub_id] : [], searchPlaceholder: 'Tìm bưu cục', onChange: value => updateFilters({ hub_id: value[0] || '', page: 1 }) },
    { id: 'date', title: 'Khoảng thời gian', icon: CalendarDays, options: [
      { value: 'today', label: 'Hôm nay' },
      { value: 'week', label: '7 ngày gần nhất' },
      { value: 'month', label: '30 ngày gần nhất' },
    ], value: [], searchPlaceholder: 'Tìm khoảng thời gian', onChange: value => {
      const now = new Date();
      const end = now.toISOString().slice(0, 10);
      const start = new Date(now);
      if (value[0] === 'today') start.setDate(now.getDate());
      if (value[0] === 'week') start.setDate(now.getDate() - 6);
      if (value[0] === 'month') start.setDate(now.getDate() - 29);
      updateFilters({ date_from: value[0] ? start.toISOString().slice(0, 10) : '', date_to: value[0] ? end : '', page: 1 });
    } },
  ];

  return <div className="h-full min-h-0 flex flex-col gap-2">
    {actionError && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600"><AlertTriangle size={15} />{actionError}</div>}
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b border-border shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted"><ArrowLeft size={16} />Quay lại</button>
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={filters.keyword} onChange={event => updateFilters({ keyword: event.target.value, page: 1 })} placeholder="Tìm bưu cục, ngày, trạng thái..." className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-primary" />
          </div>
          <button type="button" onClick={() => setIsFilterPanelOpen(true)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground"><Filter size={17} /></button>
          {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-200 bg-white px-3 text-[13px] font-bold text-red-500 hover:bg-red-50"><X size={15} />Xóa {activeFilterCount} bộ lọc</button>}
          <div className="hidden sm:block flex-1" />
          {canManageFinance && <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-[13px] font-bold text-white hover:bg-primary/90"><Plus size={16} />Thêm</button>}
        </div>
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <FilterSelect placeholder="Trạng thái đối soát" icon={RefreshCw} value={filters.remittance_status} options={[{ value: '', label: 'Tất cả trạng thái' }, ...statusOptions]} onValueChange={(value: string) => updateFilters({ remittance_status: value as RemittanceStatus | '', page: 1 })} />
          <FilterSelect placeholder="Bưu cục" icon={Building2} value={filters.hub_id} options={[{ value: '', label: 'Tất cả bưu cục' }, ...hubOptions]} onValueChange={(value: string) => updateFilters({ hub_id: value, page: 1 })} />
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[12px] font-bold text-muted-foreground"><CalendarDays size={15} /><input type="date" value={filters.date_from} onChange={event => updateFilters({ date_from: event.target.value, page: 1 })} className="bg-transparent outline-none" /><span>→</span><input type="date" value={filters.date_to} onChange={event => updateFilters({ date_to: event.target.value, page: 1 })} className="bg-transparent outline-none" /></div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={22} />} title="Đang tải phiên đối soát" description="Hệ thống đang lấy dữ liệu tiền mặt bưu cục từ API." /> : error ? <StateBlock icon={<AlertTriangle size={22} />} title="Không tải được dữ liệu" description={error} /> : !filteredItems.length ? <StateBlock icon={<DollarSign size={22} />} title="Chưa có phiên đối soát" description="Thử đổi bộ lọc hoặc tạo phiên đối soát tiền mặt mới." /> : <>
          <table className="hidden md:table min-w-[1280px] text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>{['Bưu cục hub_id', 'Ngày đối soát', 'Tiền COD giữ', 'Tiền CC giữ', 'Tổng đã nộp', 'Còn phải nộp', 'Trạng thái', 'Thao tác'].map(header => <th key={header} className="px-4 py-3 font-extrabold">{header}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {filteredItems.map(item => <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3"><Badge tone="blue">{hubLabel(item)}</Badge><div className="mt-1 text-[11px] font-bold text-muted-foreground">hub_id: {item.hub_id}</div></td>
                <td className="px-4 py-3 font-bold text-foreground">{item.reconciliation_date}</td>
                <td className="px-4 py-3 font-bold">{money(item.cod_cash_held)}</td>
                <td className="px-4 py-3 font-bold">{money(item.cc_cash_held)}</td>
                <td className="px-4 py-3 font-bold">{money(item.total_remitted)}</td>
                <td className="px-4 py-3 font-black text-foreground">{money(remaining(item))}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(item.remittance_status)}>{item.remittance_status}</Badge></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => setDetailItem(item)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-primary"><Eye size={14} />Xem</button>{canManageFinance && <button type="button" disabled={item.remittance_status === 'REMITTED'} onClick={() => openEdit(item)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-amber-600 disabled:opacity-40"><Edit size={14} />Sửa</button>}{canManageFinance && <button type="button" onClick={() => openStatus(item)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-foreground"><RefreshCw size={14} />TT</button>}</div></td>
              </tr>)}
            </tbody>
          </table>
          <div className="grid gap-3 p-3 md:hidden">
            {filteredItems.map(item => <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><Badge tone="blue">{hubLabel(item)}</Badge><p className="mt-2 text-[15px] font-black text-foreground">{item.reconciliation_date}</p><p className="text-[12px] font-bold text-muted-foreground">hub_id: {item.hub_id}</p></div><Badge tone={statusTone(item.remittance_status)}>{item.remittance_status}</Badge></div>
              <div className="mt-3 grid gap-2 text-[13px]"><Line label="Tiền COD giữ" value={money(item.cod_cash_held)} /><Line label="Tiền CC giữ" value={money(item.cc_cash_held)} /><Line label="Tổng đã nộp" value={money(item.total_remitted)} /><Line label="Còn phải nộp" value={money(remaining(item))} /></div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setDetailItem(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-primary"><Eye size={14} />Xem</button>{canManageFinance && <button type="button" disabled={item.remittance_status === 'REMITTED'} onClick={() => openEdit(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-amber-600 disabled:opacity-40"><Edit size={14} />Sửa</button>}{canManageFinance && <button type="button" onClick={() => openStatus(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-foreground"><RefreshCw size={14} />Trạng thái</button>}</div>
            </article>)}
          </div>
        </>}
      </div>

      <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0">
        <span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (filteredItems.length ? 1 : 0)}-{(filters.page - 1) * filters.limit + filteredItems.length}</b>/Tổng:{total}</span>
        <div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilters({ limit: Number(event.target.value), page: 1 })} className="h-8 rounded border border-border bg-card px-2 text-[12px] focus:outline-none">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button type="button" disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronLeft size={15} /></button><button type="button" disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronRight size={15} /></button><span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div>
      </div>
    </div>

    <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
    <AddEditReconciliationDialog isOpen={isFormOpen} isEditMode={isEditMode} isSubmitting={isSubmitting} error={dialogError} formState={formState} hubs={hubOptions} onClose={() => setIsFormOpen(false)} onSubmit={submitForm} setFormField={setFormField} />
    <UpdateRemittanceStatusDialog isOpen={!!statusDialogItem} isSubmitting={isSubmitting} status={nextStatus} error={dialogError} onChange={setNextStatus} onClose={() => setStatusDialogItem(null)} onSubmit={submitStatus} />
    <HubReconciliationDetailDialog item={detailItem} onClose={() => setDetailItem(null)} />
  </div>;
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}</span></div>;
}


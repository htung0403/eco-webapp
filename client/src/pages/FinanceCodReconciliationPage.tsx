import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Building2, CalendarDays, ChevronLeft, ChevronRight, DollarSign, Edit, Eye, Filter, Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel, type FilterPanelGroup } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import AddEditReconciliationDialog from './finance/cod-reconciliation/dialogs/AddEditReconciliationDialog';
import CodReconciliationDetailDialog from './finance/cod-reconciliation/dialogs/CodReconciliationDetailDialog';
import UpdateRemittanceStatusDialog from './finance/cod-reconciliation/dialogs/UpdateRemittanceStatusDialog';
import type { CodReconciliationFilters, CodWaybill, FilterOption, HubSummary, ListResponse, Reconciliation, ReconciliationFormState, RemittanceStatus } from './finance/cod-reconciliation/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const ACCOUNTANT = 16;
const MANAGER = 32;
const DIRECTOR = 64;
const defaultFilters: CodReconciliationFilters = { keyword: '', hub_id: '', remittance_status: '', date_from: '', date_to: '', page: 1, limit: 10 };
const emptyForm: ReconciliationFormState = { hub_id: '', reconciliation_date: '', cod_cash_held: '0', cc_cash_held: '0', total_remitted: '0', remittance_status: 'PENDING' };
const statusOptions: FilterOption[] = [{ value: 'PENDING', label: 'PENDING' }, { value: 'REMITTED', label: 'REMITTED' }, { value: 'OVERDUE', label: 'OVERDUE' }];

const getStoredUser = (): AuthUserProfile | null => { const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY); if (!raw) return null; try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; } };
const canFinance = (roleMask: number) => (roleMask & (ACCOUNTANT | MANAGER | DIRECTOR)) !== 0;
const normalizeList = <T,>(response: ListResponse<T> | T[]) => Array.isArray(response) ? response : response.data || response.items || response.results || [];
const normalizeTotal = <T,>(response: ListResponse<T> | T[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? response.meta?.totalPages ?? fallback;
const getErrorMessage = (error: unknown) => error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Không thể tải dữ liệu.';
const money = (value?: string | number | null) => Number(value || 0).toLocaleString('vi-VN');
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value)) : '—';
const remaining = (item: Reconciliation) => Number(item.remaining_amount ?? Number(item.cod_cash_held || 0) + Number(item.cc_cash_held || 0) - Number(item.total_remitted || 0));
const hubLabel = (item: Reconciliation) => item.hub?.code || item.hub?.name || `Hub #${item.hub_id}`;

const buildQuery = (filters: CodReconciliationFilters) => {
  const params = new URLSearchParams();
  if (filters.hub_id) params.set('hub_id', filters.hub_id);
  if (filters.remittance_status) params.set('remittance_status', filters.remittance_status);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
};

function Badge({ children, tone = 'slate' }: { children: string; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }) {
  return <span className={clsx('inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-extrabold', tone === 'green' && 'bg-emerald-50 text-emerald-700', tone === 'amber' && 'bg-amber-50 text-amber-700', tone === 'red' && 'bg-red-50 text-red-600', tone === 'blue' && 'bg-blue-50 text-blue-700', tone === 'slate' && 'bg-slate-100 text-slate-700')}>{children}</span>;
}
const statusTone = (status: RemittanceStatus) => status === 'REMITTED' ? 'green' : status === 'OVERDUE' ? 'red' : 'amber';
function StateBlock({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="flex flex-1 min-h-[360px] items-center justify-center p-6"><div className="max-w-md text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">{icon}</div><p className="text-[15px] font-extrabold text-foreground">{title}</p><p className="mt-1 text-[13px] text-muted-foreground">{description}</p></div></div>; }

export default function FinanceCodReconciliationPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<CodReconciliationFilters>(defaultFilters);
  const [items, setItems] = useState<Reconciliation[]>([]);
  const [hubs, setHubs] = useState<HubSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState<ReconciliationFormState>(emptyForm);
  const [selectedItem, setSelectedItem] = useState<Reconciliation | null>(null);
  const [statusDialogItem, setStatusDialogItem] = useState<Reconciliation | null>(null);
  const [nextStatus, setNextStatus] = useState<RemittanceStatus>('PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [codWaybills, setCodWaybills] = useState<CodWaybill[]>([]);
  const [isWaybillsLoading, setIsWaybillsLoading] = useState(false);

  const user = useMemo(getStoredUser, []);
  const canManageFinance = canFinance(user?.role_mask ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const hubOptions = useMemo(() => hubs.map(h => ({ value: String(h.id), label: `${h.code || h.id} — ${h.name || 'Bưu cục'}` })), [hubs]);
  const activeFilterCount = [filters.hub_id, filters.remittance_status, filters.date_from, filters.date_to].filter(Boolean).length;
  const filteredItems = useMemo(() => filters.keyword.trim() ? items.filter(item => `${hubLabel(item)} ${item.reconciliation_date} ${item.remittance_status}`.toLowerCase().includes(filters.keyword.trim().toLowerCase())) : items, [filters.keyword, items]);

  const updateFilters = (patch: Partial<CodReconciliationFilters>) => setFilters(current => ({ ...current, ...patch, page: patch.page ?? 1 }));
  const clearFilters = () => setFilters(current => ({ ...defaultFilters, keyword: current.keyword, limit: current.limit }));
  const setFormField = <K extends keyof ReconciliationFormState>(key: K, value: ReconciliationFormState[K]) => setFormState(current => ({ ...current, [key]: value }));

  const loadData = async () => {
    setIsLoading(true); setError('');
    try { const response = await apiRequest<ListResponse<Reconciliation> | Reconciliation[]>(`/finance/reconciliations?${buildQuery(filters)}`); const list = normalizeList(response); setItems(list); setTotal(normalizeTotal(response, list.length)); }
    catch (error) { setItems([]); setTotal(0); setError(getErrorMessage(error)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { let active = true; apiRequest<ListResponse<HubSummary> | HubSummary[]>('/hubs/active').then(r => { if (active) setHubs(normalizeList(r)); }).catch(() => { if (active) setHubs([]); }); return () => { active = false; }; }, []);
  useEffect(() => { loadData(); }, [filters.hub_id, filters.remittance_status, filters.date_from, filters.date_to, filters.page, filters.limit]);

  const validateForm = () => {
    if (!formState.hub_id) return 'Bưu cục là bắt buộc.';
    if (!formState.reconciliation_date) return 'Ngày đối soát là bắt buộc.';
    if ([formState.cod_cash_held, formState.cc_cash_held, formState.total_remitted].some(v => Number(v) < 0 || Number.isNaN(Number(v)))) return 'Các số liệu tiền không được âm.';
    if (!['PENDING', 'REMITTED', 'OVERDUE'].includes(formState.remittance_status)) return 'Trạng thái không hợp lệ.';
    return '';
  };

  const openAdd = () => { setIsEditMode(false); setFormState(emptyForm); setDialogError(''); setIsFormOpen(true); };
  const openEdit = (item: Reconciliation) => { setIsEditMode(true); setFormState({ hub_id: String(item.hub_id), reconciliation_date: item.reconciliation_date, cod_cash_held: String(item.cod_cash_held), cc_cash_held: String(item.cc_cash_held), total_remitted: String(item.total_remitted), remittance_status: item.remittance_status }); setDialogError(''); setIsFormOpen(true); };
  const submitForm = async () => {
    const validation = validateForm(); if (validation) { setDialogError(validation); return; }
    setIsSubmitting(true); setDialogError('');
    try {
      if (isEditMode) await apiRequest(`/finance/reconciliations/${selectedItem?.id}`, { method: 'PATCH', body: JSON.stringify({ cod_cash_held: Number(formState.cod_cash_held), cc_cash_held: Number(formState.cc_cash_held), total_remitted: Number(formState.total_remitted) }) });
      else await apiRequest('/finance/reconciliations', { method: 'POST', body: JSON.stringify({ hub_id: formState.hub_id, reconciliation_date: formState.reconciliation_date, cod_cash_held: Number(formState.cod_cash_held), cc_cash_held: Number(formState.cc_cash_held), total_remitted: Number(formState.total_remitted) }) });
      setIsFormOpen(false); await loadData();
    } catch (error) { setDialogError(getErrorMessage(error)); } finally { setIsSubmitting(false); }
  };

  const openDetail = async (item: Reconciliation) => {
    setSelectedItem(item); setCodWaybills([]); setIsWaybillsLoading(true);
    try { const response = await apiRequest<ListResponse<CodWaybill> | CodWaybill[]>(`/waybills?payment_type=COD&origin_hub_id=${item.hub_id}&page=1&limit=20`); setCodWaybills(normalizeList(response)); } catch { setCodWaybills([]); } finally { setIsWaybillsLoading(false); }
  };
  const openStatus = (item: Reconciliation) => { setStatusDialogItem(item); setNextStatus(item.remittance_status); setDialogError(''); };
  const submitStatus = async () => { if (!statusDialogItem) return; setIsSubmitting(true); setDialogError(''); try { await apiRequest(`/finance/reconciliations/${statusDialogItem.id}/remittance-status`, { method: 'PATCH', body: JSON.stringify({ remittance_status: nextStatus }) }); setStatusDialogItem(null); await loadData(); } catch (error) { setDialogError(getErrorMessage(error)); } finally { setIsSubmitting(false); } };

  const filterGroups: FilterPanelGroup[] = [
    { id: 'status', title: 'Trạng thái đối soát', icon: DollarSign, options: statusOptions, value: filters.remittance_status ? [filters.remittance_status] : [], onChange: v => updateFilters({ remittance_status: (v.at(-1) || '') as '' | RemittanceStatus }) },
    { id: 'hub', title: 'Bưu cục', icon: Building2, options: hubOptions, value: filters.hub_id ? [filters.hub_id] : [], onChange: v => updateFilters({ hub_id: v.at(-1) || '' }) },
  ];

  return <div className="h-full min-h-0 flex flex-col gap-2">
    {actionError && <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600"><AlertTriangle size={16}/>{actionError}</div>}
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b border-border shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2"><button onClick={() => navigate(-1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-[13px] font-bold hover:bg-muted"><ArrowLeft size={16}/>Quay lại</button><div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={filters.keyword} onChange={e => updateFilters({ keyword: e.target.value, page: 1 })} placeholder="Tìm bưu cục, ngày đối soát, trạng thái..." className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/10"/></div><button onClick={() => setIsFilterPanelOpen(true)} className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"><Filter size={17}/></button>{activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 text-[13px] font-bold text-red-500"><X size={15}/>Xóa {activeFilterCount} bộ lọc</button>}<div className="hidden md:block flex-1"/>{canManageFinance && <button onClick={openAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white shadow-sm shadow-primary/20"><Plus size={16}/>Thêm</button>}</div>
        <div className="hidden md:flex flex-wrap items-center gap-2"><FilterSelect icon={DollarSign} placeholder="Trạng thái" options={[{ value: '', label: 'Tất cả trạng thái' }, ...statusOptions]} value={filters.remittance_status} onValueChange={v => updateFilters({ remittance_status: v as '' | RemittanceStatus })}/><FilterSelect icon={Building2} placeholder="Bưu cục" options={[{ value: '', label: 'Tất cả bưu cục' }, ...hubOptions]} value={filters.hub_id} onValueChange={v => updateFilters({ hub_id: v })}/><div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5"><CalendarDays size={15} className="text-muted-foreground"/><input type="date" value={filters.date_from} onChange={e => updateFilters({ date_from: e.target.value })} className="text-[12px] outline-none"/><span className="text-muted-foreground">→</span><input type="date" value={filters.date_to} onChange={e => updateFilters({ date_to: e.target.value })} className="text-[12px] outline-none"/></div></div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {isLoading ? <StateBlock icon={<Loader2 size={22} className="animate-spin"/>} title="Đang tải đối soát COD" description="Hệ thống đang tải phiên đối soát theo bộ lọc hiện tại."/> : error ? <StateBlock icon={<AlertTriangle size={22}/>} title="Không tải được dữ liệu" description={error}/> : !filteredItems.length ? <StateBlock icon={<DollarSign size={22}/>} title="Chưa có phiên đối soát" description="Tạo phiên đối soát hoặc thay đổi bộ lọc để xem dữ liệu COD."/> : <><table className="hidden md:table min-w-[1280px] w-full text-left border-collapse"><thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground"><tr>{['Bưu cục','Ngày đối soát','COD giữ','CC giữ','Tổng đã nộp','Còn phải nộp','Trạng thái','Thao tác'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-border text-[13px]">{filteredItems.map(item => <tr key={item.id} className="hover:bg-muted/20"><td className="px-4 py-3"><Badge tone="blue">{hubLabel(item)}</Badge></td><td className="px-4 py-3 font-bold">{formatDate(item.reconciliation_date)}</td><td className="px-4 py-3 font-black">{money(item.cod_cash_held)}</td><td className="px-4 py-3 font-bold">{money(item.cc_cash_held)}</td><td className="px-4 py-3 font-bold">{money(item.total_remitted)}</td><td className="px-4 py-3 font-black text-foreground">{money(remaining(item))}</td><td className="px-4 py-3"><Badge tone={statusTone(item.remittance_status)}>{item.remittance_status}</Badge></td><td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={() => openDetail(item)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-primary"><Eye size={14}/>Xem</button>{canManageFinance && <button disabled={item.remittance_status === 'REMITTED'} onClick={() => { setSelectedItem(item); openEdit(item); }} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-amber-600 disabled:opacity-40"><Edit size={14}/>Sửa</button>}{canManageFinance && <button onClick={() => openStatus(item)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[12px] font-bold text-foreground"><RefreshCw size={14}/>TT</button>}</div></td></tr>)}</tbody></table><div className="grid gap-3 p-3 md:hidden">{filteredItems.map(item => <article key={item.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><Badge tone="blue">{hubLabel(item)}</Badge><p className="mt-2 text-[15px] font-black">{formatDate(item.reconciliation_date)}</p></div><Badge tone={statusTone(item.remittance_status)}>{item.remittance_status}</Badge></div><div className="mt-3 grid gap-2 text-[13px]"><Line label="COD giữ" value={money(item.cod_cash_held)}/><Line label="CC giữ" value={money(item.cc_cash_held)}/><Line label="Tổng đã nộp" value={money(item.total_remitted)}/><Line label="Còn phải nộp" value={money(remaining(item))}/></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => openDetail(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-primary"><Eye size={14}/>Xem</button>{canManageFinance && <button disabled={item.remittance_status === 'REMITTED'} onClick={() => { setSelectedItem(item); openEdit(item); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-amber-600 disabled:opacity-40"><Edit size={14}/>Sửa</button>}</div></article>)}</div></>}
      </div>
      <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0"><span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (filteredItems.length ? 1 : 0)}-{(filters.page - 1) * filters.limit + filteredItems.length}</b>/Tổng:{total}</span><div className="flex items-center gap-2"><select value={filters.limit} onChange={e => updateFilters({ limit: Number(e.target.value), page: 1 })} className="h-8 rounded border border-border bg-card px-2 text-[12px]">{[10,20,50].map(l => <option key={l} value={l}>{l}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilters({ page: filters.page - 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40"><ChevronLeft size={15}/></button><button disabled={filters.page >= totalPages} onClick={() => updateFilters({ page: filters.page + 1 })} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40"><ChevronRight size={15}/></button><span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div></div>
    </div>
    <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters}/>
    <AddEditReconciliationDialog isOpen={isFormOpen} isEditMode={isEditMode} isSubmitting={isSubmitting} error={dialogError} formState={formState} hubs={hubOptions} onClose={() => setIsFormOpen(false)} onSubmit={submitForm} setFormField={setFormField}/>
    <UpdateRemittanceStatusDialog isOpen={!!statusDialogItem} isSubmitting={isSubmitting} status={nextStatus} error={dialogError} onChange={setNextStatus} onClose={() => setStatusDialogItem(null)} onSubmit={submitStatus}/>
    <CodReconciliationDetailDialog item={selectedItem && !isFormOpen ? selectedItem : null} waybills={codWaybills} isLoadingWaybills={isWaybillsLoading} error="" onClose={() => setSelectedItem(null)}/>
  </div>;
}
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}</span></div>; }


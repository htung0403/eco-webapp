import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Eye, Filter, Fuel, Loader2, Package, Search, Tag, Truck as TruckIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../lib/api';
import { FilterPanel } from '../components/ui/FilterPanel';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { AuthUserProfile } from './login/types';
import UpdateTripCostsDialog from './trips/dialogs/UpdateTripCostsDialog';
import ApproveTripCostDialog from './trips/dialogs/ApproveTripCostDialog';
import TripExpenseDetailDialog from './trips/dialogs/TripExpenseDetailDialog';
import type { FilterOption, ListResponse, Trip, TripApprovalStatus, TripCostApprovalType, TripCostFormState, TripExpense, TripExpenseFilters, TripExpenseListResponse } from './trips/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const ACCOUNTANT = 16;
const MANAGER = 32;
const DIRECTOR = 64;

type ExpenseColumnId = 'id' | 'trip_id' | 'extended' | 'internal_approval' | 'vendor_approval' | 'actions';

const headers: Array<{ id: ExpenseColumnId; label: string; className?: string }> = [
  { id: 'id', label: 'id' },
  { id: 'trip_id', label: 'trip_id' },
  { id: 'extended', label: 'Field API mở rộng' },
  { id: 'internal_approval', label: 'Duyệt nội bộ' },
  { id: 'vendor_approval', label: 'Duyệt NCC' },
  { id: 'actions', label: 'Thao tác', className: 'w-[132px] min-w-[132px]' },
];

const approvalOptions: FilterOption[] = [
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'REMITTED', label: 'REMITTED' },
];
const emptyCostForm: TripCostFormState = { fuel_actual: '', fuel_cost: '', other_costs: '' };
const statusConfig: Record<string, string> = { PLANNED: 'bg-amber-50 text-amber-700 border-amber-200', IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200', ARRIVED: 'bg-purple-50 text-purple-700 border-purple-200', COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200', CANCELLED: 'bg-red-50 text-red-700 border-red-200' };
const approvalConfig: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-700 border-amber-200', APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200', REJECTED: 'bg-red-50 text-red-700 border-red-200', REMITTED: 'bg-blue-50 text-blue-700 border-blue-200' };

const getStoredUser = (): AuthUserProfile | null => { const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY); if (!raw) return null; try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; } };
const hasAnyRole = (roleMask: number, roles: number[]) => roles.some(role => (roleMask & role) !== 0);
const normalizeId = (value?: string | number | null) => value == null ? '' : String(value);
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatMoney = (value?: number | string | null) => value == null || value === '' ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))} đ`;
const formatNumber = (value?: number | string | null, suffix = '') => value == null || value === '' ? '—' : `${new Intl.NumberFormat('vi-VN').format(Number(value))}${suffix}`;
const normalizeExpenseList = (response: TripExpenseListResponse | TripExpense[]) => Array.isArray(response) ? response : response.expenses || response.data || response.items || [];
const normalizeExpenseTotal = (response: TripExpenseListResponse | TripExpense[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const normalizeApproval = (payload: unknown, type: TripCostApprovalType): TripApprovalStatus | null => Array.isArray(payload) ? (payload[0] as TripApprovalStatus | undefined) || null : payload && typeof payload === 'object' ? { type, ...(payload as Record<string, unknown>) } : null;
const isRenderable = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value) || value == null;

export default function TripExpensesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useMemo(getStoredUser, []);
  const canManageCosts = hasAnyRole(user?.role_mask ?? 0, [ACCOUNTANT, MANAGER, DIRECTOR]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [internalApproval, setInternalApproval] = useState<TripApprovalStatus | null>(null);
  const [vendorApproval, setVendorApproval] = useState<TripApprovalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [approveType, setApproveType] = useState<TripCostApprovalType | null>(null);
  const [detailExpense, setDetailExpense] = useState<TripExpense | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TripCostFormState, string>>>({});
  const [costForm, setCostForm] = useState<TripCostFormState>(emptyCostForm);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<TripExpenseFilters>({ keyword: '', approval_status: [], trip_type: [], date_range: [], page: 1, limit: 10 });

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true); setError('');
    try {
      const tripPayload = await apiRequest<Trip>(`/trips/${id}`);
      setTrip(tripPayload);
      setCostForm({ fuel_actual: tripPayload.fuel_actual == null ? '' : String(tripPayload.fuel_actual), fuel_cost: tripPayload.fuel_cost == null ? '' : String(tripPayload.fuel_cost), other_costs: tripPayload.other_costs == null ? '' : String(tripPayload.other_costs) });
      const [expensePayload, internalPayload, vendorPayload] = await Promise.all([
        apiRequest<TripExpenseListResponse | TripExpense[]>(`/trips/${id}/expenses?page=${filters.page}&limit=${filters.limit}`).catch(() => []),
        apiRequest<ListResponse<TripApprovalStatus> | TripApprovalStatus[]>(`/finance/approve/internal?trip_id=${id}`).catch(() => []),
        apiRequest<ListResponse<TripApprovalStatus> | TripApprovalStatus[]>(`/finance/approve/vendor?trip_id=${id}`).catch(() => []),
      ]);
      const expenseItems = normalizeExpenseList(expensePayload);
      setExpenses(expenseItems);
      setTotal(normalizeExpenseTotal(expensePayload, expenseItems.length));
      const internalItems = Array.isArray(internalPayload) ? internalPayload : internalPayload.data || internalPayload.items || [];
      const vendorItems = Array.isArray(vendorPayload) ? vendorPayload : vendorPayload.data || vendorPayload.items || [];
      setInternalApproval(normalizeApproval(internalItems, 'internal'));
      setVendorApproval(normalizeApproval(vendorItems, 'vendor'));
    } catch (fetchError) {
      setError(fetchError instanceof ApiError ? fetchError.message : 'Không tải được dữ liệu chi phí chuyến.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void loadData(); }, [id, filters.page, filters.limit]);

  const activeFilterCount = filters.approval_status.length + filters.trip_type.length + filters.date_range.length;
  const isFinal = ['COMPLETED', 'CANCELLED'].includes(String(trip?.status || ''));
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const tripCostRow = trip ? [{ id: `trip-cost-${trip.id}`, trip_id: trip.id, fuel_actual: trip.fuel_actual, fuel_cost: trip.fuel_cost, other_costs: trip.other_costs } as TripExpense] : [];
  const rows = expenses.length ? expenses : tripCostRow;
  const filteredRows = rows.filter(expense => {
    const keyword = filters.keyword.trim().toLowerCase();
    const textMatch = !keyword || Object.values(expense).some(value => isRenderable(value) && String(value ?? '').toLowerCase().includes(keyword));
    const approvalStatus = [internalApproval?.status, vendorApproval?.status].filter(Boolean).map(String);
    return textMatch && (!filters.approval_status.length || filters.approval_status.some(status => approvalStatus.includes(status)));
  });
  const pageRows = expenses.length ? filteredRows : filteredRows.slice((filters.page - 1) * filters.limit, filters.page * filters.limit);
  const filterPanelGroups = [
    { id: 'approval_status', title: 'Trạng thái phê duyệt', options: approvalOptions, value: filters.approval_status, onChange: (value: string[]) => updateFilter('approval_status', value) },
    { id: 'trip_type', title: 'Loại chuyến nếu API có', options: [], value: filters.trip_type, onChange: (value: string[]) => updateFilter('trip_type', value) },
    { id: 'date_range', title: 'Khoảng thời gian nếu API có', options: [], value: filters.date_range, onChange: (value: string[]) => updateFilter('date_range', value) },
  ];

  function updateFilter<K extends keyof TripExpenseFilters>(key: K, value: TripExpenseFilters[K]) { setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? Number(value) : 1 })); }
  function clearFilters() { setFilters(prev => ({ ...prev, approval_status: [], trip_type: [], date_range: [], page: 1 })); }
  function validateCosts() { const nextErrors: Partial<Record<keyof TripCostFormState, string>> = {}; (['fuel_actual', 'fuel_cost', 'other_costs'] as Array<keyof TripCostFormState>).forEach(key => { if (Number(costForm[key]) < 0) nextErrors[key] = `${key} không được âm`; }); setFieldErrors(nextErrors); return Object.keys(nextErrors).length === 0; }
  async function submitCosts() { if (!trip || !canManageCosts || isFinal || !validateCosts()) return; setIsSubmitting(true); setActionError(''); try { await apiRequest<Trip>(`/trips/${trip.id}/costs`, { method: 'PATCH', body: { fuel_actual: Number(costForm.fuel_actual || 0), fuel_cost: Number(costForm.fuel_cost || 0), other_costs: Number(costForm.other_costs || 0) } }); setCostDialogOpen(false); await loadData(); } catch (submitError) { setActionError(submitError instanceof ApiError ? submitError.message : 'Không cập nhật được chi phí chuyến.'); } finally { setIsSubmitting(false); } }
  async function submitApproval() { if (!trip || !approveType || !canManageCosts) return; setIsSubmitting(true); setActionError(''); try { await apiRequest(`/finance/approve/${approveType}/${trip.id}`, { method: 'PATCH' }); setApproveType(null); await loadData(); } catch (submitError) { setActionError(submitError instanceof ApiError ? submitError.message : 'Không phê duyệt được chi phí chuyến.'); } finally { setIsSubmitting(false); } }

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-lg border border-border bg-card text-[13px] font-medium text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 md:w-auto md:px-3"><ArrowLeft size={15} /><span className="hidden md:inline">Quay lại</span></button>
            <div className="relative min-w-0 flex-1 md:max-w-[460px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="Tìm chi phí theo id/trip_id/field API..." className="w-full h-10 rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/10" /></div>
            <button title="Mở bộ lọc" onClick={() => setIsFilterPanelOpen(true)} className="relative h-10 w-10 rounded-lg border border-primary/30 bg-blue-50 text-primary hover:bg-blue-100 flex items-center justify-center md:hidden"><Filter size={16} />{activeFilterCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{activeFilterCount}</span>}</button>
            {activeFilterCount > 0 && <div className="order-last basis-full md:order-none md:basis-auto"><button onClick={clearFilters} className="h-9 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-100 md:h-10">× Xóa {activeFilterCount} bộ lọc</button></div>}
            <div className="hidden flex-1 md:block" />
            {canManageCosts && <button disabled={isFinal || !trip} onClick={() => { setActionError(''); setFieldErrors({}); setCostDialogOpen(true); }} className="h-10 rounded-lg bg-primary px-3 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-40"><span className="hidden md:inline">+ Cập nhật chi phí</span><Fuel className="md:hidden" size={16} /></button>}
          </div>
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <FilterSelect multiple icon={CheckCircle2} placeholder="Trạng thái phê duyệt" options={approvalOptions} value={filters.approval_status} onValueChange={value => updateFilter('approval_status', value)} />
            <FilterSelect multiple icon={TruckIcon} placeholder="Loại chuyến nếu API có" options={[]} value={filters.trip_type} onValueChange={value => updateFilter('trip_type', value)} />
            <FilterSelect multiple icon={Tag} placeholder="Khoảng thời gian nếu API có" options={[]} value={filters.date_range} onValueChange={value => updateFilter('date_range', value)} />
          </div>
          {trip && <TripInfo trip={trip} internalApproval={internalApproval} vendorApproval={vendorApproval} canManageCosts={canManageCosts} openApprove={setApproveType} />}
        </div>

        {isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={28} />} title="Đang tải chi phí chuyến" description="Hệ thống đang lấy dữ liệu thật từ API." /> : error ? <StateBlock icon={<AlertTriangle size={28} />} title="Không tải được dữ liệu" description={error} /> : !trip ? <StateBlock icon={<TruckIcon size={28} />} title="Không tìm thấy chuyến xe" description="Kiểm tra lại mã chuyến hoặc quyền truy cập." /> : !pageRows.length ? <StateBlock icon={<Fuel size={28} />} title="Chưa có chi phí phù hợp" description="API chưa trả expenses hoặc bộ lọc không có kết quả." /> : (
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
            <table className="hidden md:table w-full min-w-[1280px] text-left border-collapse"><thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{headers.map(header => <th key={header.id} className={clsx('px-4 py-2.5 font-bold border-r border-border last:border-r-0', header.className)}>{header.label}</th>)}</tr></thead><tbody>{pageRows.map(expense => <tr key={String(expense.id)} className="border-b border-border hover:bg-muted/10 transition-colors">{headers.map(header => renderExpenseCell(header.id, expense, internalApproval, vendorApproval, () => setDetailExpense(expense)))}</tr>)}</tbody></table>
            <div className="grid gap-3 p-3 md:hidden">{pageRows.map(expense => <ExpenseMobileCard key={String(expense.id)} expense={expense} internalApproval={internalApproval} vendorApproval={vendorApproval} onDetail={() => setDetailExpense(expense)} />)}</div>
          </div>
        )}

        <div className="border-t border-border bg-card flex flex-col items-center justify-between gap-1 px-2 py-1 text-[11px] text-muted-foreground shrink-0 sm:flex-row sm:gap-3 sm:px-4 sm:py-2 sm:text-[12px]"><span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (pageRows.length ? 1 : 0)}–{(filters.page - 1) * filters.limit + pageRows.length}</b>/Tổng:{expenses.length ? total : filteredRows.length}</span><div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilter('limit', Number(event.target.value))} className="h-7 rounded border border-border bg-card px-1.5 text-[11px] focus:outline-none sm:h-8 sm:px-2 sm:text-[12px]">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="rounded-lg border border-border bg-card p-1.5 disabled:opacity-40 hover:bg-muted sm:p-2"><ChevronLeft size={15} /></button><button disabled={filters.page >= totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="rounded-lg border border-border bg-card p-1.5 disabled:opacity-40 hover:bg-muted sm:p-2"><ChevronRight size={15} /></button><span className="h-7 px-2 rounded bg-primary text-white text-[11px] font-bold flex items-center sm:h-8 sm:text-[12px]">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div></div>
      </div>
      <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterPanelGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
      <UpdateTripCostsDialog trip={costDialogOpen ? trip : null} formState={costForm} isSubmitting={isSubmitting} error={actionError} fieldErrors={fieldErrors} onClose={() => setCostDialogOpen(false)} onChange={(key, value) => setCostForm(prev => ({ ...prev, [key]: value }))} onSubmit={submitCosts} />
      <ApproveTripCostDialog trip={trip} approvalType={approveType} isSubmitting={isSubmitting} error={actionError} onClose={() => setApproveType(null)} onConfirm={submitApproval} />
      <TripExpenseDetailDialog trip={trip} expense={detailExpense} internalApproval={internalApproval} vendorApproval={vendorApproval} onClose={() => setDetailExpense(null)} />
    </div>
  );
}

function TripInfo({ trip, internalApproval, vendorApproval, canManageCosts, openApprove }: { trip: Trip; internalApproval: TripApprovalStatus | null; vendorApproval: TripApprovalStatus | null; canManageCosts: boolean; openApprove: (type: TripCostApprovalType) => void }) {
  return <div className="grid gap-2 rounded-xl border border-border bg-muted/5 p-3 text-[12px] md:grid-cols-5"><Info label="truck_id" value={<TruckBadge id={trip.truck_id} />} /><Info label="manifest_id" value={<ManifestBadge id={trip.manifest_id} />} /><Info label="start_hub_id" value={<HubBadge id={trip.start_hub_id} />} /><Info label="end_hub_id" value={<HubBadge id={trip.end_hub_id} />} /><Info label="status" value={<TripStatusBadge status={trip.status} />} /><Info label="departure_time" value={formatDate(trip.departure_time)} /><Info label="arrival_time" value={formatDate(trip.arrival_time)} /><Info label="fuel_actual" value={formatNumber(trip.fuel_actual, ' L')} /><Info label="fuel_cost" value={formatMoney(trip.fuel_cost)} /><Info label="other_costs" value={formatMoney(trip.other_costs)} /><Info label="duyệt nội bộ" value={<ApprovalBadge status={internalApproval?.status} />} /><Info label="duyệt NCC" value={<ApprovalBadge status={vendorApproval?.status} />} /><div className="flex flex-wrap items-center gap-1 md:col-span-3">{canManageCosts && <><button onClick={() => openApprove('internal')} className="h-8 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700">Duyệt nội bộ</button><button onClick={() => openApprove('vendor')} className="h-8 rounded-lg border border-blue-200 bg-blue-50 px-2 text-[11px] font-bold text-blue-700">Duyệt NCC</button></>}</div></div>;
}

function renderExpenseCell(column: ExpenseColumnId, expense: TripExpense, internalApproval: TripApprovalStatus | null, vendorApproval: TripApprovalStatus | null, onDetail: () => void) { const content: Record<ExpenseColumnId, ReactNode> = { id: <span className="font-extrabold text-primary">{String(expense.id)}</span>, trip_id: String(expense.trip_id), extended: <ExtendedFields expense={expense} />, internal_approval: <ApprovalBadge status={internalApproval?.status} />, vendor_approval: <ApprovalBadge status={vendorApproval?.status} />, actions: <IconButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={onDetail} /> }; return <td key={column} className="px-4 py-3 border-r border-border last:border-r-0 text-[13px] align-top">{content[column]}</td>; }
function ExpenseMobileCard({ expense, internalApproval, vendorApproval, onDetail }: { expense: TripExpense; internalApproval: TripApprovalStatus | null; vendorApproval: TripApprovalStatus | null; onDetail: () => void }) { return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chi phí</p><h3 className="text-base font-extrabold text-primary">#{String(expense.id)}</h3></div><ApprovalBadge status={internalApproval?.status || vendorApproval?.status} /></div><div className="mt-4 grid gap-2 text-[13px]"><Line label="trip_id" value={String(expense.trip_id)} /><Line label="Duyệt nội bộ" value={<ApprovalBadge status={internalApproval?.status} />} /><Line label="Duyệt NCC" value={<ApprovalBadge status={vendorApproval?.status} />} /><Line label="Field API mở rộng" value={<ExtendedFields expense={expense} />} /></div><div className="mt-4"><IconButton icon={<Eye size={15} />} title="Xem chi tiết" onClick={onDetail} /></div></article>; }
function ExtendedFields({ expense }: { expense: TripExpense }) { const entries = Object.entries(expense).filter(([key, value]) => !['id', 'trip_id'].includes(key) && isRenderable(value)); if (!entries.length) return <span className="text-muted-foreground">—</span>; return <div className="flex flex-wrap gap-1">{entries.map(([key, value]) => <span key={key} className="rounded-lg border border-border bg-muted/10 px-2 py-1 text-[11px] font-bold text-slate-700">{key}: {String(value ?? '—')}</span>)}</div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="mt-1 truncate font-bold text-foreground">{value}</div></div>; }
function Line({ label, value }: { label: string; value: ReactNode }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/5 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }
function IconButton({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) { return <button title={title} onClick={onClick} className="rounded-lg border border-border bg-white p-2 text-muted-foreground hover:bg-muted hover:text-primary">{icon}</button>; }
function TripStatusBadge({ status }: { status?: string | null }) { return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold', statusConfig[String(status || '')] || 'border-border bg-muted text-muted-foreground')}>{status || '—'}</span>; }
function ApprovalBadge({ status }: { status?: string | null }) { return <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold', approvalConfig[String(status || '')] || 'border-border bg-muted text-muted-foreground')}>{status || '—'}</span>; }
function HubBadge({ id }: { id?: string | number | null }) { return <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[12px] font-bold text-blue-700">Hub #{normalizeId(id) || '—'}</span>; }
function TruckBadge({ id }: { id?: string | number | null }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-bold text-slate-700"><TruckIcon size={13} />Truck #{normalizeId(id) || '—'}</span>; }
function ManifestBadge({ id }: { id?: string | number | null }) { return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[12px] font-bold text-emerald-700"><Package size={13} />Manifest #{normalizeId(id) || '—'}</span>; }
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground"><div className="mb-3 text-primary">{icon}</div><h3 className="text-[14px] font-bold text-foreground">{title}</h3><p className="mt-1 text-[13px] max-w-md">{description}</p></div>; }

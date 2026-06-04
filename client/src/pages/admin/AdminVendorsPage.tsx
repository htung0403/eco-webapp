import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, BadgeDollarSign, Briefcase, ChevronLeft, ChevronRight, Edit, Eye, Filter, Loader2, MapPinned, Plus, Power, Search, ServerOff, Tag, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../../lib/api';
import { ConfirmDialog, type ConfirmDialogState } from '../../components/ui/ConfirmDialog';
import { FilterPanel } from '../../components/ui/FilterPanel';
import { FilterSelect } from '../../components/ui/FilterSelect';
import type { AuthUserProfile } from '../login/types';
import AddEditVendorDialog from './vendors/dialogs/AddEditVendorDialog';
import VendorDetailDialog from './vendors/dialogs/VendorDetailDialog';
import VendorPricingDialog from './vendors/dialogs/VendorPricingDialog';
import VendorRoutesDialog from './vendors/dialogs/VendorRoutesDialog';
import VendorStatusConfirmDialog from './vendors/dialogs/VendorStatusConfirmDialog';
import type { FilterOption, VendorFilters, VendorFormState, VendorListResponse, VendorRecord } from './vendors/types';

const USER_PROFILE_KEY = 'eco_user_profile';
const MANAGER = 32;
const DIRECTOR = 64;
const hiddenKeys = new Set(['password_hash', 'refresh_token', 'profit', 'profit_amount', 'internal_cost', 'internal_notes']);
const systemKeys = new Set(['id', 'created_at', 'updated_at', 'deleted_at']);
const preferredColumns = ['code', 'name', 'service_type', 'contact_name', 'phone', 'email', 'province', 'contract_type', 'status', 'routes', 'pricing', 'metadata'];
const defaultEditableFields = ['code', 'name', 'service_type', 'contact_name', 'phone', 'email', 'province', 'contract_type', 'status'];
const filterKeys = ['status', 'service_type', 'province', 'contract_type'] as const;

type FilterKey = typeof filterKeys[number];

type Capability = 'create' | 'update' | 'status' | 'routes' | 'pricing' | 'delete';

const capabilityMessages: Record<Capability, string> = {
  create: 'Chưa thể tạo nhà cung cấp lúc này.',
  update: 'Chưa thể cập nhật thông tin nhà cung cấp lúc này.',
  status: 'Chưa thể cập nhật trạng thái nhà cung cấp lúc này.',
  routes: 'Chưa thể cập nhật tuyến phục vụ lúc này.',
  pricing: 'Chưa thể cập nhật bảng giá tham chiếu lúc này.',
  delete: 'Chưa thể xóa nhà cung cấp lúc này.',
};

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};

const isManager = (roleMask: number) => (roleMask & (MANAGER | DIRECTOR)) !== 0;
const isDirector = (roleMask: number) => (roleMask & DIRECTOR) !== 0;
const normalizeId = (value?: unknown) => value == null ? '' : String(value);
const normalizeList = (response: VendorListResponse | VendorRecord[]) => Array.isArray(response) ? response : response.data || response.items || response.vendors || [];
const normalizeTotal = (response: VendorListResponse | VendorRecord[], fallback: number) => Array.isArray(response) ? fallback : response.total ?? response.meta?.total ?? fallback;
const formatValue = (value: unknown): string => {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
const vendorName = (vendor: VendorRecord) => formatValue(vendor.name ?? vendor.vendor_name ?? vendor.company_name ?? vendor.code ?? vendor.vendor_code ?? vendor.id);
const getString = (vendor: VendorRecord, key: string) => typeof vendor[key] === 'string' || typeof vendor[key] === 'number' ? String(vendor[key]) : '';
const labelize = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
const hasKey = (vendors: VendorRecord[], key: string) => vendors.some(vendor => Object.prototype.hasOwnProperty.call(vendor, key));
const apiMessage = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;
const isUnsupported = (error: unknown) => error instanceof ApiError && [404, 405, 501].includes(error.status);

export default function AdminVendorsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VendorFilters>({ keyword: '', status: [], service_type: [], province: [], contract_type: [], page: 1, limit: 10 });
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [unsupportedCapabilities, setUnsupportedCapabilities] = useState<Capability[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null);
  const [detailVendor, setDetailVendor] = useState<VendorRecord | null>(null);
  const [formState, setFormState] = useState<VendorFormState>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormClosing, setIsFormClosing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [routesValue, setRoutesValue] = useState('');
  const [pricingValue, setPricingValue] = useState('');
  const [routesOpen, setRoutesOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);

  const user = useMemo(getStoredUser, []);
  const canManage = isManager(user?.role_mask ?? 0);
  const canDelete = isDirector(user?.role_mask ?? 0);

  const columns = useMemo(() => {
    const keys = vendors.flatMap(vendor => Object.keys(vendor)).filter(key => !hiddenKeys.has(key.toLowerCase()));
    const unique = Array.from(new Set([...preferredColumns.filter(key => keys.includes(key)), ...keys.filter(key => !systemKeys.has(key))]));
    return unique.slice(0, 9);
  }, [vendors]);

  const editableFields = useMemo(() => {
    const fields = columns.filter(key => !systemKeys.has(key) && !hiddenKeys.has(key.toLowerCase()) && !['routes', 'pricing', 'metadata'].includes(key));
    return fields.length ? fields : defaultEditableFields;
  }, [columns]);
  const activeFilterCount = filters.status.length + filters.service_type.length + filters.province.length + filters.contract_type.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const options = useMemo<Record<FilterKey, FilterOption[]>>(() => {
    const build = (key: FilterKey, fallback: string) => [{ value: '', label: fallback }, ...Array.from(new Set(vendors.map(vendor => getString(vendor, key)).filter(Boolean))).sort().map(value => ({ value, label: value }))];
    return { status: build('status', 'Tất cả trạng thái'), service_type: build('service_type', 'Tất cả loại dịch vụ'), province: build('province', 'Tất cả khu vực'), contract_type: build('contract_type', 'Tất cả hợp đồng') };
  }, [vendors]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    filterKeys.forEach(key => filters[key].forEach(value => params.append(key, value)));
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));
    return params.toString();
  }, [filters]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError('');
    apiRequest<VendorListResponse | VendorRecord[]>(`/vendors?${queryString}`)
      .then(response => {
        if (ignore) return;
        const list = normalizeList(response).filter(vendor => vendor && typeof vendor === 'object');
        setVendors(list);
        setTotal(normalizeTotal(response, list.length));
      })
      .catch(err => { if (!ignore) setError(apiMessage(err, 'Không tải được danh sách NCC.')); })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [queryString]);

  const updateFilter = <K extends keyof VendorFilters>(key: K, value: VendorFilters[K]) => setFilters(prev => ({ ...prev, [key]: value, page: key === 'page' ? value as number : 1 }));
  const clearFilters = () => setFilters(prev => ({ ...prev, status: [], service_type: [], province: [], contract_type: [], page: 1 }));
  const rememberUnsupported = (capability: Capability) => setUnsupportedCapabilities(prev => prev.includes(capability) ? prev : [...prev, capability]);
  const isCapabilityUnsupported = (capability: Capability) => unsupportedCapabilities.includes(capability);
  const refresh = () => apiRequest<VendorListResponse | VendorRecord[]>(`/vendors?${queryString}`).then(response => { const list = normalizeList(response); setVendors(list); setTotal(normalizeTotal(response, list.length)); });

  const closeForm = () => closeWithAnimation(setIsFormClosing, setIsFormOpen);

  const openCreate = () => { setSelectedVendor(null); setIsEditMode(false); setFormState(Object.fromEntries(editableFields.map(field => [field, field === 'status' ? 'ACTIVE' : '']))); setActionError(''); setIsFormOpen(true); };
  const openEdit = (vendor: VendorRecord) => { setSelectedVendor(vendor); setIsEditMode(true); setFormState(Object.fromEntries(editableFields.map(field => [field, formatValue(vendor[field]) === '—' ? '' : formatValue(vendor[field])]))) ; setActionError(''); setIsFormOpen(true); };
  const openDetail = async (vendor: VendorRecord) => {
    const id = normalizeId(vendor.id);
    setDetailVendor(vendor);
    if (!id) return;
    apiRequest<VendorRecord>(`/vendors/${id}`).then(setDetailVendor).catch(err => { if (!isUnsupported(err)) setActionError(apiMessage(err, 'Không tải được chi tiết NCC.')); });
  };
  const submitForm = async () => {
    setIsSubmitting(true); setActionError('');
    try {
      const payload = Object.fromEntries(Object.entries(formState).filter(([, value]) => value !== ''));
      if (isEditMode && selectedVendor?.id != null) await apiRequest(`/vendors/${selectedVendor.id}`, { method: 'PATCH', body: payload });
      else await apiRequest('/vendors', { method: 'POST', body: payload });
      closeForm(); await refresh();
    } catch (err) {
      if (isUnsupported(err)) rememberUnsupported(isEditMode ? 'update' : 'create');
      setActionError(apiMessage(err, isEditMode ? capabilityMessages.update : capabilityMessages.create));
    } finally { setIsSubmitting(false); }
  };
  const submitJsonConfig = async (kind: 'routes' | 'pricing') => {
    if (!selectedVendor?.id) return;
    setIsSubmitting(true); setActionError('');
    try {
      const raw = kind === 'routes' ? routesValue : pricingValue;
      await apiRequest(`/vendors/${selectedVendor.id}/${kind}`, { method: 'PATCH', body: raw.trim() ? JSON.parse(raw) : {} });
      kind === 'routes' ? setRoutesOpen(false) : setPricingOpen(false);
      await refresh();
    } catch (err) {
      if (isUnsupported(err)) rememberUnsupported(kind);
      setActionError(apiMessage(err, capabilityMessages[kind]));
    } finally { setIsSubmitting(false); }
  };
  const openJsonConfig = (vendor: VendorRecord, kind: 'routes' | 'pricing') => { setSelectedVendor(vendor); setActionError(''); const value = JSON.stringify(vendor[kind] ?? {}, null, 2); kind === 'routes' ? (setRoutesValue(value), setRoutesOpen(true)) : (setPricingValue(value), setPricingOpen(true)); };
  const openStatus = (vendor: VendorRecord) => { setSelectedVendor(vendor); setActionError(''); setStatusOpen(true); };
  const nextStatus = selectedVendor && String(selectedVendor.status || '').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const submitStatus = async () => {
    if (!selectedVendor?.id) return;
    setIsSubmitting(true); setActionError('');
    try { await apiRequest(`/vendors/${selectedVendor.id}/status`, { method: 'PATCH', body: { status: nextStatus } }); setStatusOpen(false); await refresh(); }
    catch (err) { if (isUnsupported(err)) rememberUnsupported('status'); setActionError(apiMessage(err, capabilityMessages.status)); }
    finally { setIsSubmitting(false); }
  };
  const confirmDelete = (vendor: VendorRecord) => setConfirmDialog({ title: 'Xóa NCC', message: `Xóa ${vendorName(vendor)}? Chỉ DIRECTOR được thực hiện thao tác này.`, confirmLabel: 'Xóa', danger: true, onConfirm: async () => { try { await apiRequest(`/vendors/${vendor.id}`, { method: 'DELETE' }); await refresh(); } catch (err) { if (isUnsupported(err)) rememberUnsupported('delete'); setError(apiMessage(err, capabilityMessages.delete)); } } });

  const filterPanelGroups = [
    { id: 'status', title: 'Trạng thái NCC', icon: Tag, options: options.status, value: filters.status, onChange: (value: string[]) => updateFilter('status', value) },
    { id: 'service_type', title: 'Loại dịch vụ', icon: ServerOff, options: options.service_type, value: filters.service_type, onChange: (value: string[]) => updateFilter('service_type', value) },
    { id: 'province', title: 'Khu vực phục vụ', icon: MapPinned, options: options.province, value: filters.province, onChange: (value: string[]) => updateFilter('province', value) },
    { id: 'contract_type', title: 'Loại hợp đồng', icon: Briefcase, options: options.contract_type, value: filters.contract_type, onChange: (value: string[]) => updateFilter('contract_type', value) },
  ];

  return <div className="h-full min-h-0 flex flex-col gap-2">
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b border-border shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:bg-muted"><ArrowLeft size={16} /></button>
          <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} placeholder="Tìm NCC..." className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-[13px] outline-none focus:border-primary" /></div>
          <button onClick={() => setIsFilterPanelOpen(true)} className="md:hidden h-10 w-10 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground"><Filter size={16} /></button>
          {activeFilterCount > 0 && <button onClick={clearFilters} className="order-last basis-full md:order-none md:basis-auto h-10 px-3 rounded-lg border border-red-200 bg-red-50 text-[13px] font-bold text-red-500 hover:bg-red-100"><X size={14} className="inline mr-1" />Xóa {activeFilterCount} bộ lọc</button>}
          <div className="hidden md:block flex-1" />
          {canManage && !isCapabilityUnsupported('create') && <button onClick={openCreate}  className="h-10 inline-flex items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-50"><Plus size={16} />Thêm</button>}
        </div>
        <div className="hidden md:flex flex-wrap items-center gap-2">
          <FilterSelect multiple icon={Tag} placeholder="Trạng thái NCC" value={filters.status} options={options.status} onValueChange={value => updateFilter('status', value)} />
          <FilterSelect multiple icon={ServerOff} placeholder="Loại dịch vụ" value={filters.service_type} options={options.service_type} onValueChange={value => updateFilter('service_type', value)} />
          <FilterSelect multiple icon={MapPinned} placeholder="Khu vực phục vụ" value={filters.province} options={options.province} onValueChange={value => updateFilter('province', value)} />
          <FilterSelect multiple icon={Briefcase} placeholder="Loại hợp đồng" value={filters.contract_type} options={options.contract_type} onValueChange={value => updateFilter('contract_type', value)} />
        </div>
      </div>

      {error ? <StateBlock icon={<AlertTriangle size={24} />} title="Không tải được NCC" description={error} /> : isLoading ? <StateBlock icon={<Loader2 className="animate-spin" size={24} />} title="Đang tải cấu hình NCC" description="Đang cập nhật danh sách nhà cung cấp mới nhất." /> : vendors.length === 0 ? <StateBlock icon={<ServerOff size={24} />} title="Chưa có NCC" description="Không có nhà cung cấp vận tải phù hợp bộ lọc hiện tại." /> : <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table className="hidden md:table w-full min-w-[1280px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur"><tr>{columns.map(column => <th key={column} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">{labelize(column)}</th>)}<th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border w-[220px]">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-border">{vendors.map(vendor => <tr key={normalizeId(vendor.id) || JSON.stringify(vendor)} className="hover:bg-muted/40">{columns.map(column => <td key={column} className="px-4 py-3 text-[13px] font-medium text-foreground">{renderCell(vendor, column)}</td>)}<td className="px-4 py-3"><Actions vendor={vendor} canManage={canManage} canDelete={canDelete} unsupported={unsupportedCapabilities} onDetail={openDetail} onEdit={openEdit} onRoutes={item => openJsonConfig(item, 'routes')} onPricing={item => openJsonConfig(item, 'pricing')} onStatus={openStatus} onDelete={confirmDelete} /></td></tr>)}</tbody>
        </table>
        <div className="grid gap-3 p-3 md:hidden">{vendors.map(vendor => <MobileVendorCard key={normalizeId(vendor.id) || JSON.stringify(vendor)} vendor={vendor} columns={columns} canManage={canManage} canDelete={canDelete} unsupported={unsupportedCapabilities} onDetail={openDetail} onEdit={openEdit} onRoutes={item => openJsonConfig(item, 'routes')} onPricing={item => openJsonConfig(item, 'pricing')} onStatus={openStatus} onDelete={confirmDelete} />)}</div>
      </div>}

      <div className="px-4 py-2 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-muted-foreground shrink-0"><span><b className="text-foreground font-medium">{(filters.page - 1) * filters.limit + (vendors.length ? 1 : 0)}–{(filters.page - 1) * filters.limit + vendors.length}</b>/Tổng:{total}</span><div className="flex items-center gap-2"><select value={filters.limit} onChange={event => updateFilter('limit', Number(event.target.value))} className="h-8 rounded border border-border bg-card px-2 text-[12px] focus:outline-none">{[10, 20, 50].map(limit => <option key={limit} value={limit}>{limit}</option>)}</select><span>/ trang</span><button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronLeft size={15} /></button><button disabled={filters.page >= totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="p-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-muted"><ChevronRight size={15} /></button><span className="h-8 px-2 rounded bg-primary text-white text-[12px] font-bold flex items-center">{filters.page}</span><span>/</span><span className="text-foreground">{totalPages}</span></div></div>
    </div>

    <AddEditVendorDialog isOpen={isFormOpen} isClosing={isFormClosing} isEditMode={isEditMode} isSubmitting={isSubmitting} fields={editableFields} formState={formState} error={actionError} onClose={closeForm} onSubmit={submitForm} onChange={(key, value) => setFormState(prev => ({ ...prev, [key]: value }))} />
    <VendorDetailDialog vendor={detailVendor} canManage={canManage} onClose={() => setDetailVendor(null)} onEdit={vendor => { setDetailVendor(null); openEdit(vendor); }} />
    <VendorRoutesDialog isOpen={routesOpen} value={routesValue} isSubmitting={isSubmitting} error={actionError} onClose={() => setRoutesOpen(false)} onChange={setRoutesValue} onSubmit={() => submitJsonConfig('routes')} />
    <VendorPricingDialog isOpen={pricingOpen} value={pricingValue} isSubmitting={isSubmitting} error={actionError} onClose={() => setPricingOpen(false)} onChange={setPricingValue} onSubmit={() => submitJsonConfig('pricing')} />
    <VendorStatusConfirmDialog isOpen={statusOpen} vendorName={selectedVendor ? vendorName(selectedVendor) : '—'} nextStatus={nextStatus || 'ACTIVE'} isSubmitting={isSubmitting} error={actionError} onClose={() => setStatusOpen(false)} onConfirm={submitStatus} />
    <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
    <FilterPanel open={isFilterPanelOpen} activeCount={activeFilterCount} groups={filterPanelGroups} onClose={() => setIsFilterPanelOpen(false)} onApply={() => setIsFilterPanelOpen(false)} onClear={clearFilters} />
  </div>;
}

function renderCell(vendor: VendorRecord, column: string) {
  const value = vendor[column];
  if (['status', 'service_type', 'contract_type'].includes(column) && value != null && value !== '') return <Badge value={String(value)} tone={column} />;
  return <span className="break-words">{formatValue(value)}</span>;
}

function Badge({ value, tone }: { value: string; tone: string }) {
  const normalized = value.toUpperCase();
  const className = tone === 'status' && normalized === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : tone === 'status' ? 'bg-slate-100 text-slate-600 border-slate-200' : tone === 'service_type' ? 'bg-blue-50 text-primary border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={clsx('inline-flex rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-wide', className)}>{value}</span>;
}

function Actions({ vendor, canManage, canDelete, unsupported, onDetail, onEdit, onRoutes, onPricing, onStatus, onDelete }: { vendor: VendorRecord; canManage: boolean; canDelete: boolean; unsupported: Capability[]; onDetail: (vendor: VendorRecord) => void; onEdit: (vendor: VendorRecord) => void; onRoutes: (vendor: VendorRecord) => void; onPricing: (vendor: VendorRecord) => void; onStatus: (vendor: VendorRecord) => void; onDelete: (vendor: VendorRecord) => void }) {
  return <div className="flex items-center gap-1"><IconButton title="Xem" icon={<Eye size={15} />} onClick={() => onDetail(vendor)} />{canManage && !unsupported.includes('update') && <IconButton title="Sửa" icon={<Edit size={15} />} onClick={() => onEdit(vendor)} />}{canManage && hasConfig(vendor, 'routes') && !unsupported.includes('routes') && <IconButton title="Tuyến" icon={<MapPinned size={15} />} onClick={() => onRoutes(vendor)} />}{canManage && hasConfig(vendor, 'pricing') && !unsupported.includes('pricing') && <IconButton title="Giá" icon={<BadgeDollarSign size={15} />} onClick={() => onPricing(vendor)} />}{canManage && hasKey([vendor], 'status') && !unsupported.includes('status') && <IconButton title="Bật/tắt" icon={<Power size={15} />} onClick={() => onStatus(vendor)} />}{canDelete && !unsupported.includes('delete') && <IconButton title="Xóa" danger icon={<Trash2 size={15} />} onClick={() => onDelete(vendor)} />}</div>;
}

function hasConfig(vendor: VendorRecord, key: 'routes' | 'pricing') { return Object.prototype.hasOwnProperty.call(vendor, key); }
function IconButton({ icon, title, danger, onClick }: { icon: ReactNode; title: string; danger?: boolean; onClick: () => void }) { return <button title={title} onClick={onClick} className={clsx('rounded-lg border p-2 hover:bg-muted', danger ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{icon}</button>; }
function MobileVendorCard(props: { vendor: VendorRecord; columns: string[]; canManage: boolean; canDelete: boolean; unsupported: Capability[]; onDetail: (vendor: VendorRecord) => void; onEdit: (vendor: VendorRecord) => void; onRoutes: (vendor: VendorRecord) => void; onPricing: (vendor: VendorRecord) => void; onStatus: (vendor: VendorRecord) => void; onDelete: (vendor: VendorRecord) => void }) { return <article className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">NCC</div><h3 className="mt-1 text-[15px] font-extrabold text-foreground">{vendorName(props.vendor)}</h3></div><Actions {...props} /></div><div className="mt-4 grid gap-2">{props.columns.map(column => <div key={column} className="rounded-xl bg-muted/40 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{labelize(column)}</div><div className="mt-1 text-[13px] font-bold text-foreground">{renderCell(props.vendor, column)}</div></div>)}</div></article>; }
function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground"><div className="mb-3 text-primary">{icon}</div><h3 className="text-[14px] font-bold text-foreground">{title}</h3><p className="mt-1 text-[13px] max-w-md">{description}</p></div>; }



function closeWithAnimation(setClosing: (value: boolean) => void, setOpen: (value: boolean) => void) { setClosing(true); window.setTimeout(() => { setOpen(false); setClosing(false); }, 280); }




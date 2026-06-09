import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Eye, Loader2, Package, RefreshCcw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { getStoredAuthUser } from '../lib/authUser';
import WaybillPriorityControl from './warehouse/inventory/WaybillPriorityControl';
import WaybillPriorityDetailDialog from './warehouse/priority/dialogs/WaybillPriorityDetailDialog';
import type { BadgeConfig, WaybillListResponse, WaybillPriorityDetail, WaybillPriorityItem } from './warehouse/priority/types';

const PAGE_ROLES = 1 | 8 | 32 | 64;
const UPDATE_ROLES = 8 | 32 | 64;
const STATUSES = ['RECEIVED', 'MANIFEST_CLOSED', 'LOADED', 'IN_TRANSIT', 'AT_DEST_HUB', 'DELIVERED', 'RETURNED'];

const statusConfig: Record<string, BadgeConfig> = {
  RECEIVED: { label: 'Đã tạo đơn', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  MANIFEST_CLOSED: { label: 'Chờ bốc', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  LOADED: { label: 'Đã bốc', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_TRANSIT: { label: 'Đang vận chuyển', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  AT_DEST_HUB: { label: 'Tới hub đích', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  DELIVERED: { label: 'Đã giao', className: 'bg-green-50 text-green-700 border-green-200' },
  RETURNED: { label: 'Hoàn', className: 'bg-red-50 text-red-700 border-red-200' },
};

const WAYBILL_STATUS_NEXT: Record<string, string> = {
  RECEIVED: 'MANIFEST_CLOSED',
  IN_WAREHOUSE: 'MANIFEST_CLOSED',
  MANIFEST_CLOSED: 'LOADED',
  LOADED: 'IN_TRANSIT',
  IN_TRANSIT: 'AT_DEST_HUB',
  AT_DEST_HUB: 'DELIVERED',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

function boardColumnStatus(status: string) {
  if (status === 'IN_WAREHOUSE') return 'RECEIVED';
  if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') return 'DELIVERED';
  return status;
}

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

const extractList = (response: WaybillListResponse | WaybillPriorityItem[]) =>
  Array.isArray(response) ? response : response.data || response.items || response.waybills || [];

const displayCode = (waybill: WaybillPriorityItem) => waybill.waybill_code || `#${waybill.id}`;
const displayValue = (value: unknown, suffix = '') => value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
const normalizeStatus = (waybill: WaybillPriorityItem) => String(waybill.current_state || '').toUpperCase();
const normalizePriority = (priority?: string | null) => String(priority || 'NORMAL').toUpperCase();
const hasRole = (roleMask: number, roles: number) => (roleMask & roles) !== 0;

export default function WarehousePriorityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [waybills, setWaybills] = useState<WaybillPriorityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailWaybill, setDetailWaybill] = useState<WaybillPriorityDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const user = useMemo(() => getStoredAuthUser(), []);
  const roleMask = user?.role_mask ?? 0;
  const canView = hasRole(roleMask, PAGE_ROLES);
  const canUpdate = hasRole(roleMask, UPDATE_ROLES);

  const grouped = useMemo(() => {
    const map = new Map<string, WaybillPriorityItem[]>(STATUSES.map((status) => [status, []]));
    const fallback: WaybillPriorityItem[] = [];
    for (const waybill of waybills) {
      const status = boardColumnStatus(normalizeStatus(waybill));
      if (map.has(status)) map.get(status)?.push(waybill);
      else fallback.push(waybill);
    }
    return { map, fallback };
  }, [waybills]);

  useEffect(() => {
    if (!canView) return;
    void loadWaybills();
  }, [canView]);

  async function loadWaybills() {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', limit: '200' });
      if (keyword.trim()) params.set('keyword', keyword.trim());
      const response = await apiRequest<WaybillListResponse | WaybillPriorityItem[]>(`/waybills?${params.toString()}`);
      setWaybills(extractList(response));
    } catch (err) {
      setWaybills([]);
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách vận đơn ưu tiên.');
    } finally {
      setIsLoading(false);
    }
  }

  async function openDetail(waybill: WaybillPriorityItem) {
    setIsDetailOpen(true);
    setIsDetailClosing(false);
    setIsDetailLoading(true);
    setDetailWaybill(null);
    try {
      const detail = await apiRequest<WaybillPriorityDetail>(`/waybills/${waybill.id}`);
      setDetailWaybill(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết vận đơn.');
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetail() {
    setIsDetailClosing(true);
    window.setTimeout(() => {
      setIsDetailOpen(false);
      setIsDetailClosing(false);
      setDetailWaybill(null);
    }, 220);
  }

  function updateLocalPriority(id: string | number, priority: string) {
    setWaybills((prev) => prev.map((waybill) => String(waybill.id) === String(id) ? { ...waybill, priority } : waybill));
  }

  function updateLocalStatus(id: string | number, status: string) {
    setWaybills((prev) =>
      prev.map((waybill) => (String(waybill.id) === String(id) ? { ...waybill, current_state: status } : waybill)),
    );
  }

  if (!canView) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-[13px] font-semibold text-red-600">
        <AlertTriangle className="mr-2" size={18} />
        Bạn không có quyền xem phân loại ưu tiên.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted md:w-auto md:px-3">
          <ArrowLeft size={16} />
          <span className="ml-2 hidden text-[13px] font-bold md:inline">Quay lại</span>
        </button>
        <div className="relative min-w-0 flex-1 md:max-w-[520px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void loadWaybills()}
            placeholder="Tìm mã vận đơn, người gửi, người nhận..."
            className="h-10 w-full rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button onClick={() => void loadWaybills()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90">
          <RefreshCcw size={15} />
          Tải lại
        </button>
      </div>

      {error && <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">{error}</div>}

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-slate-100 shadow-sm">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-primary">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="custom-scrollbar flex h-full gap-3 overflow-x-auto p-3">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                items={grouped.map.get(status) || []}
                canUpdate={canUpdate}
                onPriorityUpdated={updateLocalPriority}
                onStatusUpdated={updateLocalStatus}
                onDetail={openDetail}
              />
            ))}
            {grouped.fallback.length > 0 && (
              <KanbanColumn
                status="OTHER"
                items={grouped.fallback}
                canUpdate={canUpdate}
                onPriorityUpdated={updateLocalPriority}
                onStatusUpdated={updateLocalStatus}
                onDetail={openDetail}
              />
            )}
          </div>
        )}
      </div>

      <WaybillPriorityDetailDialog
        isOpen={isDetailOpen}
        isClosing={isDetailClosing}
        isLoading={isDetailLoading}
        waybill={detailWaybill}
        statusConfig={statusConfig}
        paymentConfig={paymentConfig}
        priorityConfig={priorityConfig}
        onClose={closeDetail}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  items,
  canUpdate,
  onPriorityUpdated,
  onStatusUpdated,
  onDetail,
}: {
  status: string;
  items: WaybillPriorityItem[];
  canUpdate: boolean;
  onPriorityUpdated: (id: string | number, priority: string) => void;
  onStatusUpdated: (id: string | number, status: string) => void;
  onDetail: (waybill: WaybillPriorityItem) => void;
}) {
  const config = statusConfig[status] || { label: 'Khác', className: 'bg-muted text-muted-foreground border-border' };
  return (
    <section className="flex h-full w-[320px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
        <span className={clsx('inline-flex min-h-8 items-center rounded-lg border px-2.5 text-[12px] font-black', config.className)}>{config.label}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[12px] font-black text-slate-600">{items.length}</span>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {items.length ? items.map((waybill) => (
          <WaybillCard
            key={String(waybill.id)}
            waybill={waybill}
            canUpdate={canUpdate}
            onPriorityUpdated={onPriorityUpdated}
            onStatusUpdated={onStatusUpdated}
            onDetail={onDetail}
          />
        )) : (
          <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-[12px] font-bold text-muted-foreground">
            <Package size={20} className="mb-2" />
            Chưa có vận đơn
          </div>
        )}
      </div>
    </section>
  );
}

function WaybillCard({
  waybill,
  canUpdate,
  onPriorityUpdated,
  onStatusUpdated,
  onDetail,
}: {
  waybill: WaybillPriorityItem;
  canUpdate: boolean;
  onPriorityUpdated: (id: string | number, priority: string) => void;
  onStatusUpdated: (id: string | number, status: string) => void;
  onDetail: (waybill: WaybillPriorityItem) => void;
}) {
  const priority = normalizePriority(waybill.priority);
  const priorityBadge = priorityConfig[priority] || priorityConfig.NORMAL;
  const paymentBadge = paymentConfig[String(waybill.payment_type || '')] || { label: waybill.payment_type || '—', className: 'bg-muted text-muted-foreground border-border' };
  const rawStatus = normalizeStatus(waybill);
  const nextStatus = WAYBILL_STATUS_NEXT[rawStatus];
  const nextLabel = nextStatus ? statusConfig[nextStatus]?.label : null;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState('');

  async function advanceStatus() {
    if (!nextStatus || !canUpdate) return;
    setIsAdvancing(true);
    setAdvanceError('');
    try {
      const body: { status: string; delivery_photo_url?: string } = { status: nextStatus };
      if (nextStatus === 'DELIVERED') body.delivery_photo_url = 'priority-board';
      await apiRequest(`/waybills/${waybill.id}/status`, { method: 'PATCH', body });
      onStatusUpdated(waybill.id, nextStatus);
    } catch (err) {
      setAdvanceError(err instanceof ApiError ? err.message : 'Không chuyển được trạng thái.');
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-white p-3 shadow-sm transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-black text-primary">{displayCode(waybill)}</p>
          <p className="mt-1 truncate text-[12px] font-medium text-muted-foreground">{waybill.receiver_info || 'Chưa có người nhận'}</p>
        </div>
        <button onClick={() => onDetail(waybill)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground" title="Xem chi tiết">
          <Eye size={15} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={clsx('inline-flex min-h-7 items-center rounded-lg border px-2 text-[11px] font-black', priorityBadge.className)}>{priorityBadge.label}</span>
        <span className={clsx('inline-flex min-h-7 items-center rounded-lg border px-2 text-[11px] font-black', paymentBadge.className)}>{paymentBadge.label}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <Info label="Kg" value={displayValue(waybill.weight, ' kg')} />
        <Info label="TL quy đổi" value={displayValue(waybill.volumetric_weight, ' kg')} />
      </div>
      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {nextLabel && canUpdate && (
          <button
            type="button"
            disabled={isAdvancing}
            onClick={() => void advanceStatus()}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 text-[12px] font-extrabold text-primary hover:bg-primary/15 disabled:opacity-60"
          >
            {isAdvancing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            {nextLabel}
          </button>
        )}
        {advanceError && <p className="text-[11px] font-bold text-red-600">{advanceError}</p>}
        <WaybillPriorityControl
          waybillId={waybill.id}
          value={waybill.priority}
          disabled={!canUpdate}
          compact
          onUpdated={(next) => onPriorityUpdated(waybill.id, next)}
        />
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/30 px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[12px] font-bold text-foreground">{value}</p>
    </div>
  );
}

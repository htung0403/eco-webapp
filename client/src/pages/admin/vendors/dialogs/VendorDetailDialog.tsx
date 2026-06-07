import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, Edit, ExternalLink, Loader2, Package, Truck, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../../lib/api';
import type { AuthUserProfile } from '../../../login/types';
import { VENDOR_DETAIL_TABS, type VendorDetailTabId } from '../vendorDetailTabs';
import {
  formatContractType,
  formatMoney as formatVendorMoney,
  formatProvince,
  formatServiceType,
  formatStatus,
} from '../data';
import type { Vendor } from '../types';
import type { InventoryListResponse, WaybillInventoryItem } from '../../../warehouse/inventory/types';
import { resolveNoiDen } from '../../../warehouse/inventory/inventoryColumns';
import LoadPlanningTruckBoard from '../../../warehouse/load-planning/LoadPlanningTruckBoard';
import type { LoadPlanningBoardResponse } from '../../../warehouse/load-planning/types';
import CustomerBillsPanel from '../../../warehouse/customers/panels/CustomerBillsPanel';
import type { BillFilters } from '../../../warehouse/customers/utils/customerFinanceUtils';
import VendorPaymentsPanel, {
  type VendorLedgerBalance,
  type VendorLedgerEntry,
  type VendorPaymentFilters,
} from '../panels/VendorPaymentsPanel';

interface Props {
  vendor: Vendor | null;
  loading?: boolean;
  canManage: boolean;
  onClose: () => void;
  onEdit: (vendor: Vendor) => void;
}

const USER_PROFILE_KEY = 'eco_user_profile';
const MANAGER = 32;
const DIRECTOR = 64;
const ACCOUNTANT = 16;

const statusLabel: Record<string, string> = {
  RECEIVED: 'Đã tạo đơn',
  IN_WAREHOUSE: 'Trong kho',
  MANIFEST_CLOSED: 'Chờ xuất chuyến',
  IN_TRANSIT: 'Đang vận chuyển',
  AT_DEST_HUB: 'Tới hub đích',
  OUT_FOR_DELIVERY: 'Chờ giao',
  DELIVERED: 'Đã giao',
  RETURNED: 'Hoàn hàng',
  CANCELLED: 'Đã hủy',
};

function Row({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={clsx('grid grid-cols-[140px_1fr] gap-2 border-b border-border/60 py-2.5 text-[13px] last:border-0', className)}>
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground break-words">{value?.trim() || '—'}</span>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="mb-1 text-[12px] font-extrabold uppercase tracking-wide text-primary">{title}</p>
      {children}
    </section>
  );
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-2xl border border-border bg-white p-4 shadow-sm', className)}>{children}</div>;
}

function getStoredUser(): AuthUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
}

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');
const formatMoney = (value?: number | string | null) =>
  value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')} đ`;

const normalizeInventoryList = (response: InventoryListResponse | WaybillInventoryItem[]) =>
  Array.isArray(response) ? response : response.data || response.items || response.waybills || [];

const dedupeWaybills = (lines: WaybillInventoryItem[]) => {
  const map = new Map<string, WaybillInventoryItem>();
  for (const line of lines) {
    const key = `${line.id}-${line.split_id ?? '0'}`;
    if (!map.has(key)) map.set(key, line);
  }
  return [...map.values()];
};

const inventoryTotalFromResponse = (response: InventoryListResponse | WaybillInventoryItem[], fallback: number) =>
  Array.isArray(response) ? fallback : response.meta?.total_waybills ?? response.total ?? response.meta?.total ?? fallback;

const formatJson = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export default function VendorDetailDialog({ vendor, loading, canManage, onClose, onEdit }: Props) {
  const navigate = useNavigate();
  const vendorId = vendor?.id != null ? String(vendor.id) : '';
  const [activeTab, setActiveTab] = useState<VendorDetailTabId>('chi-tiet');
  const [inventoryItems, setInventoryItems] = useState<WaybillInventoryItem[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [deliveryBoard, setDeliveryBoard] = useState<LoadPlanningBoardResponse | null>(null);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<VendorLedgerEntry[]>([]);
  const [ledgerBalance, setLedgerBalance] = useState<VendorLedgerBalance>({});
  const [paymentFilters, setPaymentFilters] = useState<VendorPaymentFilters>({
    fromDate: '',
    toDate: '',
    entryType: '',
  });
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [billFilters, setBillFilters] = useState<BillFilters>({
    fromDate: '',
    toDate: '',
    billCode: '',
    paymentType: '',
  });

  const canViewCost = useMemo(() => {
    const user = getStoredUser();
    return ((user?.role_mask ?? 0) & (MANAGER | DIRECTOR)) !== 0;
  }, []);

  const canViewFinance = useMemo(() => {
    const user = getStoredUser();
    return ((user?.role_mask ?? 0) & (ACCOUNTANT | MANAGER | DIRECTOR)) !== 0;
  }, []);

  useEffect(() => {
    if (!vendor) {
      setActiveTab('chi-tiet');
      setInventoryItems([]);
      setInventoryTotal(0);
      setInventoryError('');
      setDeliveryBoard(null);
      setDeliveryTotal(0);
      setDeliveryError('');
      setLedgerEntries([]);
      setLedgerBalance({});
      setPaymentFilters({ fromDate: '', toDate: '', entryType: '' });
      setBillFilters({ fromDate: '', toDate: '', billCode: '', paymentType: '' });
      setLedgerError('');
    }
  }, [vendor?.id]);

  useEffect(() => {
    const needsInventory = activeTab === 'don-hang' || activeTab === 'bill';
    if (!vendorId || !needsInventory) return;

    let cancelled = false;
    setInventoryLoading(true);
    setInventoryError('');

    apiRequest<InventoryListResponse | WaybillInventoryItem[]>(
      `/waybills/inventory/trip-lines?vendor_id=${encodeURIComponent(vendorId)}&limit=200&page=1`,
    )
      .then((response) => {
        if (cancelled) return;
        const list = dedupeWaybills(normalizeInventoryList(response));
        setInventoryItems(list);
        setInventoryTotal(inventoryTotalFromResponse(response, list.length));
      })
      .catch(() => {
        if (!cancelled) {
          setInventoryItems([]);
          setInventoryTotal(0);
          setInventoryError('Không tải được danh sách đơn / bill của NCC.');
        }
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, vendorId]);

  useEffect(() => {
    if (!vendorId || activeTab !== 'giao-hang') return;

    let cancelled = false;
    setDeliveryLoading(true);
    setDeliveryError('');

    apiRequest<LoadPlanningBoardResponse>(
      `/waybills/load-planning/board?vendor_id=${encodeURIComponent(vendorId)}&limit=100`,
    )
      .then((response) => {
        if (cancelled) return;
        setDeliveryBoard(response);
        setDeliveryTotal(response.total_items ?? 0);
      })
      .catch(() => {
        if (!cancelled) {
          setDeliveryBoard(null);
          setDeliveryTotal(0);
          setDeliveryError('Không tải được danh sách phân xe / giao hàng.');
        }
      })
      .finally(() => {
        if (!cancelled) setDeliveryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, vendorId]);

  useEffect(() => {
    if (!vendorId || activeTab !== 'thanh-toan' || !canViewFinance) return;

    let cancelled = false;
    setLedgerLoading(true);
    setLedgerError('');

    apiRequest<{ entries?: VendorLedgerEntry[]; balance?: VendorLedgerBalance }>(`/vendors/${vendorId}/ledger`)
      .then((response) => {
        if (cancelled) return;
        setLedgerEntries(response.entries ?? []);
        setLedgerBalance(response.balance ?? {});
      })
      .catch(() => {
        if (cancelled) return;
        setLedgerEntries([]);
        setLedgerBalance({});
        setLedgerError('Không tải được sổ cái công nợ NCC.');
      })
      .finally(() => {
        if (!cancelled) setLedgerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, vendorId, canViewFinance]);

  const reloadDeliveryBoard = () => {
    if (!vendorId) return;
    setDeliveryLoading(true);
    setDeliveryError('');
    apiRequest<LoadPlanningBoardResponse>(
      `/waybills/load-planning/board?vendor_id=${encodeURIComponent(vendorId)}&limit=100`,
    )
      .then((response) => {
        setDeliveryBoard(response);
        setDeliveryTotal(response.total_items ?? 0);
      })
      .catch(() => {
        setDeliveryBoard(null);
        setDeliveryTotal(0);
        setDeliveryError('Không tải được danh sách phân xe / giao hàng.');
      })
      .finally(() => setDeliveryLoading(false));
  };

  const openLoadPlanning = () => {
    if (!vendorId) return;
    onClose();
    navigate(`/warehouse/load-planning?vendor_id=${encodeURIComponent(vendorId)}`);
  };

  if (!vendor) return null;

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      );
    }

    switch (activeTab) {
      case 'chi-tiet':
        return (
          <div className="space-y-4">
            <DetailSection title="Thông tin NCC">
              <Row label="Mã NCC" value={vendor.code} />
              <Row label="Tên NCC" value={vendor.name} />
              <Row label="Loại dịch vụ" value={formatServiceType(vendor.service_type)} />
              <Row label="Loại hợp đồng" value={formatContractType(vendor.contract_type)} />
              <Row label="Trạng thái" value={formatStatus(vendor.status)} />
              <Row label="Công nợ phải trả" value={formatVendorMoney(vendor.payable_balance)} />
            </DetailSection>

            <DetailSection title="Liên hệ">
              <Row label="Người liên hệ" value={vendor.contact_name} />
              <Row label="Số điện thoại" value={vendor.phone} />
              <Row label="Email" value={vendor.email} />
              <Row label="Khu vực" value={formatProvince(vendor.province)} />
            </DetailSection>

            {(vendor.routes != null || vendor.pricing != null) && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {vendor.routes != null && (
                  <DetailSection title="Tuyến phục vụ">
                    <pre className="max-h-48 overflow-auto rounded-lg bg-muted/20 p-3 text-[11px] font-medium text-foreground">
                      {formatJson(vendor.routes)}
                    </pre>
                  </DetailSection>
                )}
                {vendor.pricing != null && (
                  <DetailSection title="Bảng giá tham chiếu">
                    <pre className="max-h-48 overflow-auto rounded-lg bg-muted/20 p-3 text-[11px] font-medium text-foreground">
                      {formatJson(vendor.pricing)}
                    </pre>
                  </DetailSection>
                )}
              </div>
            )}
          </div>
        );

      case 'don-hang':
        return (
          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">
                NCC: <span className="text-primary">{vendor.code}</span>
                {inventoryTotal > 0 && (
                  <span className="ml-2 font-medium text-muted-foreground">({inventoryTotal} đơn)</span>
                )}
              </p>
              <button
                type="button"
                onClick={openLoadPlanning}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted"
              >
                <ExternalLink size={12} />
                Phân xe
              </button>
            </div>

            {inventoryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : inventoryError ? (
              <p className="py-8 text-center text-[13px] font-bold text-red-600">{inventoryError}</p>
            ) : inventoryItems.length === 0 ? (
              <div className="py-10 text-center">
                <Package size={28} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-[13px] font-medium text-muted-foreground">Chưa có đơn hàng trên xe NCC này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full min-w-[760px] border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Mã vận đơn</th>
                      <th className="px-2 py-2">Ngày</th>
                      <th className="px-2 py-2">Trạng thái</th>
                      <th className="px-2 py-2">Xe / NCC</th>
                      <th className="px-2 py-2">Nơi đến</th>
                      <th className="px-2 py-2 text-right">Kiện</th>
                      <th className="px-2 py-2">TT</th>
                      {canViewCost && <th className="px-2 py-2 text-right">Cước</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((order) => {
                      const state = String(order.current_state || '').toUpperCase();
                      const freight = order.allocated_freight ?? order.freight_amount ?? order.cost_amount;
                      return (
                        <tr key={`${order.id}-${order.split_id ?? '0'}`} className="border-b border-border/70 hover:bg-muted/20">
                          <td className="px-2 py-2.5 font-extrabold text-primary">
                            {order.waybill_code || order.order_code || `#${order.id}`}
                          </td>
                          <td className="px-2 py-2.5">{formatDate(order.received_at || order.created_at)}</td>
                          <td className="px-2 py-2.5">{statusLabel[state] || state || '—'}</td>
                          <td className="px-2 py-2.5">
                            {[order.license_plate, order.trip_nha_xe].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td className="px-2 py-2.5">{resolveNoiDen(order)}</td>
                          <td className="px-2 py-2.5 text-right">{order.trip_package_count ?? order.package_count ?? '—'}</td>
                          <td className="px-2 py-2.5">{order.payment_type || '—'}</td>
                          {canViewCost && (
                            <td className="px-2 py-2.5 text-right font-bold">{formatMoney(freight)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        );

      case 'giao-hang':
        return (
          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">
                NCC: <span className="text-primary">{vendor.name || vendor.code}</span>
                {deliveryTotal > 0 && (
                  <span className="ml-2 font-medium text-muted-foreground">({deliveryTotal} dòng)</span>
                )}
              </p>
              <button
                type="button"
                onClick={openLoadPlanning}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted"
              >
                <ExternalLink size={12} />
                Phân xe
              </button>
            </div>

            {deliveryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : deliveryError ? (
              <p className="py-8 text-center text-[13px] font-bold text-red-600">{deliveryError}</p>
            ) : !deliveryBoard?.trucks?.length ? (
              <div className="py-10 text-center">
                <Truck size={28} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-[13px] font-medium text-muted-foreground">Chưa có hàng phân xe cho NCC này.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryBoard.trucks.map((truck) => (
                  <LoadPlanningTruckBoard
                    key={String(truck.truck_id)}
                    truck={truck}
                    canViewCost={canViewCost}
                    onStatusUpdated={reloadDeliveryBoard}
                  />
                ))}
              </div>
            )}
          </Panel>
        );

      case 'bill':
        return (
          <CustomerBillsPanel
            customerCode={vendor.code || vendor.name || vendorId}
            items={inventoryItems}
            totalCount={inventoryTotal}
            vouchers={[]}
            filters={billFilters}
            loading={inventoryLoading}
            vouchersLoading={false}
            error={inventoryError}
            canViewCost={canViewCost}
            enablePaymentTracking={false}
            filterSubjectLabel="NCC"
            inventoryLinkLabel="Phân xe"
            onFiltersChange={(patch) => setBillFilters((prev) => ({ ...prev, ...patch }))}
            onOpenInventory={openLoadPlanning}
            formatDate={formatDate}
          />
        );

      case 'thanh-toan':
        return (
          <div className="space-y-4">
            <DetailSection title="Thông tin thanh toán NCC">
              <Row label="Loại hợp đồng" value={formatContractType(vendor.contract_type)} />
              <Row label="Công nợ phải trả" value={formatVendorMoney(vendor.payable_balance)} />
              <Row label="Tổng phát sinh" value={formatVendorMoney(ledgerBalance.total_incurred)} />
              <Row label="Đã chi trả" value={formatVendorMoney(ledgerBalance.total_paid)} />
              <Row label="Còn lại" value={formatVendorMoney(ledgerBalance.remaining)} />
            </DetailSection>

            {canViewFinance ? (
              <VendorPaymentsPanel
                vendorCode={vendor.code || vendor.name || vendorId}
                entries={ledgerEntries}
                balance={ledgerBalance}
                filters={paymentFilters}
                loading={ledgerLoading}
                error={ledgerError}
                onFiltersChange={(patch) => setPaymentFilters((prev) => ({ ...prev, ...patch }))}
              />
            ) : (
              <Panel>
                <p className="text-[13px] font-medium text-muted-foreground">
                  Sổ cái công nợ chỉ hiển thị với quyền Kế toán hoặc Quản lý.
                </p>
              </Panel>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-3xl flex-col border-l border-border bg-[#f8fafc] shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-foreground">{vendor.name || '—'}</h2>
              <p className="text-[12px] font-bold text-primary">{vendor.code || '—'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b border-border bg-slate-100 px-2 py-2">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar">
            {VENDOR_DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-colors',
                  activeTab === tab.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-white text-foreground hover:bg-muted/60',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={clsx('flex-1 overflow-y-auto custom-scrollbar p-4', activeTab === 'chi-tiet' && 'pb-8')}>
          {renderTabContent()}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-white p-4">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-border px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">
            Đóng
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(vendor)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90"
            >
              <Edit size={15} />
              Sửa
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

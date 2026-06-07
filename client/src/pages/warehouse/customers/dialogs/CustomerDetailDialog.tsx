import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Building2, Edit, ExternalLink, Loader2, Package, Printer, Truck, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../../lib/api';
import type { AuthUserProfile } from '../../../login/types';
import { CUSTOMER_DETAIL_TABS, type CustomerDetailTabId } from '../customerDetailTabs';
import type { InventoryListResponse, WaybillInventoryItem } from '../../inventory/types';
import { resolveNoiDen } from '../../inventory/inventoryColumns';
import LoadPlanningTruckBoard from '../../load-planning/LoadPlanningTruckBoard';
import type { LoadPlanningBoardResponse } from '../../load-planning/types';
import type { CustomerRecord } from '../customerFormTypes';
import CustomerCashVouchersPanel, { type CashVoucherFilters } from '../panels/CustomerCashVouchersPanel';
import CustomerBillsPanel from '../panels/CustomerBillsPanel';
import type { BillFilters } from '../utils/customerFinanceUtils';
import type { WaybillCashVoucher } from '../../inventory/dialogs/WaybillCashVoucherDialog';

interface Props {
  customer: CustomerRecord | null;
  loading?: boolean;
  onClose: () => void;
  onEdit: () => void;
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
    const key = String(line.id);
    if (!map.has(key)) map.set(key, line);
  }
  return [...map.values()];
};

const inventoryTotalFromResponse = (response: InventoryListResponse | WaybillInventoryItem[], fallback: number) =>
  Array.isArray(response) ? fallback : response.meta?.total_waybills ?? response.total ?? response.meta?.total ?? fallback;

export default function CustomerDetailDialog({ customer, loading, onClose, onEdit }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CustomerDetailTabId>('chi-tiet');
  const [inventoryItems, setInventoryItems] = useState<WaybillInventoryItem[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [deliveryBoard, setDeliveryBoard] = useState<LoadPlanningBoardResponse | null>(null);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [cashVouchers, setCashVouchers] = useState<WaybillCashVoucher[]>([]);
  const [cashVoucherFilters, setCashVoucherFilters] = useState<CashVoucherFilters>({
    fromDate: '',
    toDate: '',
    voucherType: '',
  });
  const [billFilters, setBillFilters] = useState<BillFilters>({
    fromDate: '',
    toDate: '',
    billCode: '',
    paymentType: '',
  });
  const [cashVouchersLoading, setCashVouchersLoading] = useState(false);
  const [cashVouchersError, setCashVouchersError] = useState('');

  const canViewCost = useMemo(() => {
    const user = getStoredUser();
    return ((user?.role_mask ?? 0) & (MANAGER | DIRECTOR)) !== 0;
  }, []);

  const canViewCashVouchers = useMemo(() => {
    const user = getStoredUser();
    return ((user?.role_mask ?? 0) & (ACCOUNTANT | MANAGER | DIRECTOR)) !== 0;
  }, []);

  useEffect(() => {
    if (!customer) {
      setActiveTab('chi-tiet');
      setInventoryItems([]);
      setInventoryTotal(0);
      setInventoryError('');
      setDeliveryBoard(null);
      setDeliveryTotal(0);
      setDeliveryError('');
      setCashVouchers([]);
      setCashVoucherFilters({ fromDate: '', toDate: '', voucherType: '' });
      setBillFilters({ fromDate: '', toDate: '', billCode: '', paymentType: '' });
      setCashVouchersError('');
    }
  }, [customer?.id]);

  useEffect(() => {
    const needsInventory = activeTab === 'don-hang' || activeTab === 'bill';
    if (!customer?.code?.trim() || !needsInventory) return;

    let cancelled = false;
    setInventoryLoading(true);
    setInventoryError('');

    apiRequest<InventoryListResponse | WaybillInventoryItem[]>(
      `/waybills/inventory/trip-lines?ma_kh=${encodeURIComponent(customer.code.trim())}&limit=200&page=1`,
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
          setInventoryError('Không tải được danh sách bill / tồn kho.');
        }
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, customer?.code]);

  const deliveryTenCty = customer?.code?.trim() || customer?.name?.trim() || '';

  useEffect(() => {
    if (!deliveryTenCty || activeTab !== 'giao-hang') return;

    let cancelled = false;
    setDeliveryLoading(true);
    setDeliveryError('');

    apiRequest<LoadPlanningBoardResponse>(
      `/waybills/load-planning/board?ten_cty=${encodeURIComponent(deliveryTenCty)}&limit=100`,
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
  }, [activeTab, deliveryTenCty]);

  useEffect(() => {
    const maKh = customer?.code?.trim();
    const needsVouchers = (activeTab === 'thanh-toan' || activeTab === 'bill') && canViewCashVouchers;
    if (!maKh || !needsVouchers) return;

    let cancelled = false;
    setCashVouchersLoading(true);
    setCashVouchersError('');

    apiRequest<{ items?: WaybillCashVoucher[]; meta?: { total?: number } }>(
      `/waybills/cash-vouchers?ma_kh=${encodeURIComponent(maKh)}&limit=500`,
    )
      .then((response) => {
        if (cancelled) return;
        setCashVouchers(response.items ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setCashVouchers([]);
        setCashVouchersError('Không tải được danh sách thu chi.');
      })
      .finally(() => {
        if (!cancelled) setCashVouchersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, customer?.code, canViewCashVouchers]);

  const handleCashVoucherFiltersChange = (patch: Partial<CashVoucherFilters>) => {
    setCashVoucherFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleBillFiltersChange = (patch: Partial<BillFilters>) => {
    setBillFilters((prev) => ({ ...prev, ...patch }));
  };

  const reloadDeliveryBoard = () => {
    if (!deliveryTenCty) return;
    setDeliveryLoading(true);
    setDeliveryError('');
    apiRequest<LoadPlanningBoardResponse>(
      `/waybills/load-planning/board?ten_cty=${encodeURIComponent(deliveryTenCty)}&limit=100`,
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

  const openInventory = () => {
    if (!customer?.code?.trim()) return;
    onClose();
    navigate(`/warehouse/inventory?ma_kh=${encodeURIComponent(customer.code.trim())}`);
  };

  const openPriority = () => {
    if (!deliveryTenCty) return;
    onClose();
    navigate(`/warehouse/priority?keyword=${encodeURIComponent(deliveryTenCty)}`);
  };

  if (!customer) return null;

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
          <div className="space-y-4 pb-2">
            <DetailSection title="Thông tin chính">
              <Row label="Mã KH" value={customer.code} />
              <Row label="Tên KH" value={customer.name} />
              <Row label="Tên tắt" value={customer.short_name} />
              <Row label="Tiếng Anh" value={customer.english_name} />
              <Row label="Loại KH" value={customer.customer_type || 'KHACH_HANG'} />
              <Row label="Trạng thái" value={customer.is_suspended ? 'Tạm dừng' : customer.status || 'ACTIVE'} />
              <Row label="Số đơn" value={String(customer.waybill_count ?? inventoryTotal ?? 0)} />
            </DetailSection>

            <DetailSection title="Liên hệ">
              <Row label="Liên hệ" value={customer.contact_person} />
              <Row label="Di động" value={customer.mobile} />
              <Row label="Số ĐT" value={customer.phone_landline} />
              <Row label="Email" value={customer.email} />
              <Row label="Địa chỉ" value={customer.address} />
              <Row label="Đ/chỉ LH" value={customer.contact_address} />
              <Row label="Khu vực" value={customer.region} />
              <Row label="NV quản lý" value={customer.manager_name} />
              <Row label="MST" value={customer.tax_id} />
              <Row label="Số CMT" value={customer.id_number} />
            </DetailSection>

            <DetailSection title="Giao nhận & kho">
              <Row label="Giao nhận" value={customer.delivery_handler} />
              <Row label="Tỉnh đến" value={customer.destination_province} />
              <Row label="Nhận HCM" value={customer.receiver_hcm} />
              <Row label="ĐC kho HCM" value={customer.address_hcm} />
              <Row label="ĐT nhận HCM" value={customer.phone_hcm} />
              <Row label="Nhận DNG" value={customer.receiver_dng} />
              <Row label="ĐC DNG" value={customer.address_dng} />
              <Row label="ĐT DNG" value={customer.phone_dng} />
            </DetailSection>

            <DetailSection title="Bill & giá">
              <Row label="Bảng giá" value={customer.price_table} />
              <Row label="Mã hợp đồng" value={customer.contract_code} />
              <Row label="Cơ chế" value={customer.mechanism} />
              <Row label="Chiết khấu %" value={String(customer.discount_percent ?? 0)} />
              <Row label="Công nợ" value={customer.credit_type} />
            </DetailSection>

            <DetailSection title="Thanh toán">
              <Row label="Hình thức CN" value={customer.credit_type} />
              <Row label="Ngân hàng" value={customer.bank_name} />
              <Row label="Tài khoản" value={customer.bank_account} />
              <Row label="Chủ t.khoản" value={customer.bank_account_holder} />
            </DetailSection>
          </div>
        );

      case 'don-hang':
        return (
          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">
                Mã KH: <span className="text-primary">{customer.code}</span>
                {inventoryTotal > 0 && (
                  <span className="ml-2 font-medium text-muted-foreground">({inventoryTotal} đơn)</span>
                )}
              </p>
              <button
                type="button"
                onClick={openInventory}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted-foreground hover:bg-muted"
              >
                <ExternalLink size={12} />
                Tồn kho
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
                <p className="text-[13px] font-medium text-muted-foreground">Chưa có đơn hàng với mã KH này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full min-w-[680px] border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Mã vận đơn</th>
                      <th className="px-2 py-2">Ngày</th>
                      <th className="px-2 py-2">Trạng thái</th>
                      <th className="px-2 py-2">Nơi đến</th>
                      <th className="px-2 py-2 text-right">Kiện</th>
                      <th className="px-2 py-2">TT</th>
                      {canViewCost && <th className="px-2 py-2 text-right">Cước</th>}
                      <th className="px-2 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryItems.map((order) => {
                      const state = String(order.current_state || '').toUpperCase();
                      const freight = order.freight_amount ?? order.cost_amount;
                      return (
                        <tr key={String(order.id)} className="border-b border-border/70 hover:bg-muted/20">
                          <td className="px-2 py-2.5 font-extrabold text-primary">
                            {order.waybill_code || order.order_code || `#${order.id}`}
                          </td>
                          <td className="px-2 py-2.5">{formatDate(order.received_at || order.created_at)}</td>
                          <td className="px-2 py-2.5">{statusLabel[state] || state || '—'}</td>
                          <td className="px-2 py-2.5">{resolveNoiDen(order)}</td>
                          <td className="px-2 py-2.5 text-right">{order.package_count ?? order.trip_package_count ?? '—'}</td>
                          <td className="px-2 py-2.5">{order.payment_type || '—'}</td>
                          {canViewCost && (
                            <td className="px-2 py-2.5 text-right font-bold">{formatMoney(freight)}</td>
                          )}
                          <td className="px-2 py-2.5">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                title="Sửa đơn"
                                onClick={() => navigate('/orders/new', { state: { waybillId: String(order.id) } })}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                title="In bill"
                                onClick={() => window.open(`/print/waybill/${order.id}`, '_blank')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                              >
                                <Printer size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => navigate('/orders/new', { state: { maKh: customer.code, nguoiGui: customer.name } })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary/90"
              >
                <Package size={14} />
                Nhập đơn mới
              </button>
            </div>
          </Panel>
        );

      case 'giao-hang':
        return (
          <Panel>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground">
                Tên CTY: <span className="text-primary">{deliveryTenCty}</span>
                {deliveryTotal > 0 && (
                  <span className="ml-2 font-medium text-muted-foreground">({deliveryTotal} dòng)</span>
                )}
              </p>
              <button
                type="button"
                onClick={openPriority}
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
                <p className="text-[13px] font-medium text-muted-foreground">
                  Chưa có hàng phân xe cho Tên CTY này.
                </p>
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
            customerCode={customer.code}
            items={inventoryItems}
            totalCount={inventoryTotal}
            vouchers={cashVouchers}
            filters={billFilters}
            loading={inventoryLoading}
            vouchersLoading={canViewCashVouchers && cashVouchersLoading}
            error={inventoryError || (canViewCashVouchers ? cashVouchersError : '')}
            canViewCost={canViewCost}
            onFiltersChange={handleBillFiltersChange}
            onOpenInventory={openInventory}
            formatDate={formatDate}
          />
        );

      case 'thanh-toan':
        return (
          <div className="space-y-4">
            <DetailSection title="Thông tin thanh toán">
              <Row label="Hình thức CN" value={customer.credit_type} />
              <Row label="Cơ chế" value={customer.mechanism} />
              <Row label="Ngân hàng" value={customer.bank_name} />
              <Row label="Tài khoản" value={customer.bank_account} />
              <Row label="Chủ t.khoản" value={customer.bank_account_holder} />
              <Row label="MST" value={customer.tax_id} />
              <Row label="Mã hợp đồng" value={customer.contract_code} />
            </DetailSection>

            {canViewCashVouchers ? (
              <CustomerCashVouchersPanel
                customerCode={customer.code}
                vouchers={cashVouchers}
                filters={cashVoucherFilters}
                loading={cashVouchersLoading}
                error={cashVouchersError}
                onFiltersChange={handleCashVoucherFiltersChange}
              />
            ) : (
              <Panel>
                <p className="text-[13px] font-medium text-muted-foreground">
                  Danh sách phiếu thu/chi chỉ hiển thị với quyền Kế toán hoặc Quản lý.
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-foreground">{customer.name}</h2>
              <p className="text-[12px] font-bold text-primary">{customer.code}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b border-border bg-slate-100 px-2 py-2">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar">
            {CUSTOMER_DETAIL_TABS.map((tab) => (
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
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90"
          >
            <Edit size={15} />
            Sửa
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

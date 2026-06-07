import type { LoadPlanningBoardFilters, LoadPlanningBoardResponse } from '../warehouse/load-planning/types';
import { splitLoadStatusLabel } from '../warehouse/splits/splitLoadStatus';

export const LOAD_PLANNING_PRINT_STORAGE_KEY = 'eco_load_planning_print_v1';

export interface LoadPlanningPrintColumn {
  id: string;
  label: string;
}

export interface LoadPlanningPrintPayload {
  title: string;
  printedAt: string;
  filterSummary: string;
  showPricing: boolean;
  columns: LoadPlanningPrintColumn[];
  rows: Record<string, string>[];
  totals: {
    package_count: string;
    weight_kg: string;
    freight: string;
  };
}

const columns = (showPricing: boolean): LoadPlanningPrintColumn[] => [
  { id: 'truck', label: 'Xe' },
  { id: 'position', label: 'Vị trí' },
  { id: 'status', label: 'Trạng thái' },
  { id: 'dispatch_date', label: 'Ngày bốc' },
  { id: 'province', label: 'Mã tỉnh' },
  { id: 'customer', label: 'Tên CTY' },
  { id: 'service', label: 'DV' },
  { id: 'goods', label: 'Mặt hàng' },
  { id: 'dropoff', label: 'Nơi trả' },
  { id: 'package_count', label: 'Số lượng' },
  { id: 'type', label: 'Loại' },
  ...(showPricing ? [{ id: 'freight', label: 'Cước phí' }] : []),
  { id: 'address', label: 'Địa chỉ' },
];

const fmt = (value?: string | number | null) => (value == null || value === '' ? '' : String(value));
const fmtNumber = (value: number) => (value ? value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '0');
const fmtMoney = (value: number) => (value ? value.toLocaleString('vi-VN') : '');

export function buildLoadPlanningQuery(filters: LoadPlanningBoardFilters, forcedLoadStatuses?: string[], limit = 100) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.origin_hub_id.length) params.set('origin_hub_id', filters.origin_hub_id.join(','));
  if (filters.dest_hub_id.length) params.set('dest_hub_id', filters.dest_hub_id.join(','));
  if (filters.truck_id.length) params.set('truck_id', filters.truck_id.join(','));
  const loadStatuses = forcedLoadStatuses?.length ? forcedLoadStatuses : filters.load_status;
  if (loadStatuses.length) params.set('load_status', loadStatuses.join(','));
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  return params.toString();
}

export function summarizeLoadPlanningFilters(filters: LoadPlanningBoardFilters, forcedLoadStatuses?: string[]) {
  const parts: string[] = [];
  if (filters.keyword.trim()) parts.push(`Từ khóa: ${filters.keyword.trim()}`);
  if (filters.origin_hub_id.length) parts.push(`Hub đi: ${filters.origin_hub_id.length} chọn`);
  if (filters.dest_hub_id.length) parts.push(`Hub đến: ${filters.dest_hub_id.length} chọn`);
  if (filters.truck_id.length) parts.push(`Xe: ${filters.truck_id.length} chọn`);
  const statuses = forcedLoadStatuses?.length ? forcedLoadStatuses : filters.load_status;
  if (statuses.length) parts.push(`Trạng thái: ${statuses.map((status) => splitLoadStatusLabel(status)).join(', ')}`);
  if (filters.date_from || filters.date_to) parts.push(`Ngày bốc: ${filters.date_from || '...'} -> ${filters.date_to || '...'}`);
  return parts.length ? parts.join(' · ') : 'Tất cả dòng hàng theo bộ lọc hiện tại';
}

export function mapLoadPlanningBoardToPrintPayload(
  board: LoadPlanningBoardResponse,
  showPricing: boolean,
  filterSummary: string,
): LoadPlanningPrintPayload {
  let totalPackages = 0;
  let totalWeight = 0;
  let totalFreight = 0;

  const rows = board.trucks.flatMap((truck) => {
    const truckLabel = [truck.license_plate, truck.nha_xe].filter(Boolean).join(' · ') || `Xe #${truck.truck_id}`;
    return truck.items.map((item) => {
      const packageCount = Number(item.so_luong ?? 0);
      const weight = Number(item.weight ?? 0);
      const freight = Number(item.allocated_freight ?? 0);
      totalPackages += packageCount;
      totalWeight += weight;
      totalFreight += freight;

      const row: Record<string, string> = {
        truck: truckLabel,
        position: fmt(item.vi_tri_hang ?? item.loading_position),
        status: splitLoadStatusLabel(item.load_status),
        dispatch_date: fmt(item.ngay_boc),
        province: fmt(item.ma_tinh || item.noi_den),
        customer: fmt(item.ten_cty),
        service: fmt(item.dv),
        goods: [item.mat_hang, item.mat_hang_note].filter(Boolean).join(' - '),
        dropoff: fmt(item.noi_tra),
        package_count: fmt(packageCount),
        type: fmt(item.loai),
        address: fmt(item.dia_chi),
      };
      if (showPricing) row.freight = fmtMoney(freight);
      return row;
    });
  });

  return {
    title: 'Phiếu phân loại ưu tiên ECO',
    printedAt: new Date().toLocaleString('vi-VN'),
    filterSummary,
    showPricing,
    columns: columns(showPricing),
    rows,
    totals: {
      package_count: fmtNumber(totalPackages),
      weight_kg: fmtNumber(totalWeight),
      freight: showPricing ? fmtMoney(totalFreight) : '',
    },
  };
}

export function saveLoadPlanningPrintPayload(payload: LoadPlanningPrintPayload) {
  const json = JSON.stringify(payload);
  localStorage.setItem(LOAD_PLANNING_PRINT_STORAGE_KEY, json);
  try {
    sessionStorage.setItem(LOAD_PLANNING_PRINT_STORAGE_KEY, json);
  } catch {
    /* quota */
  }
}

export function loadLoadPlanningPrintPayload(): LoadPlanningPrintPayload | null {
  const raw =
    localStorage.getItem(LOAD_PLANNING_PRINT_STORAGE_KEY) ||
    sessionStorage.getItem(LOAD_PLANNING_PRINT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoadPlanningPrintPayload;
  } catch {
    return null;
  }
}

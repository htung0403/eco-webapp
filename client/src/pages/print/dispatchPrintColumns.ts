import type { DispatchPrintRow } from './dispatchPrintFormat';

export type DispatchPrintColumnId =
  | 'viTriHang'
  | 'ngayBoc'
  | 'maTinh'
  | 'tenCtv'
  | 'dv'
  | 'matHang'
  | 'noiTra'
  | 'soLuong'
  | 'nguoiNhan'
  | 'tinhTrangGiaoHang'
  | 'ngayHoanThanh'
  | 'keHoach'
  | 'tangHaThuKhach'
  | 'cuoc'
  | 'laiXeThuHo'
  | 'bcThuHo'
  | 'maBill'
  | 'ghiChu';

export interface DispatchPrintColumnDef {
  id: DispatchPrintColumnId;
  label: string;
  header: string;
  cssClass: string;
  align?: 'left' | 'center' | 'right';
  defaultVisible: boolean;
  required?: boolean;
  managerOnly?: boolean;
  totalKey?: 'soLuong' | 'tangHaThuKhach' | 'cuoc';
}

export const DISPATCH_PRINT_COLUMN_DEFS: DispatchPrintColumnDef[] = [
  { id: 'viTriHang', label: 'Vị trí hàng', header: 'Vị trí hàng', cssClass: 'col-location', align: 'center', defaultVisible: true, required: true },
  { id: 'ngayBoc', label: 'Ngày bốc', header: 'Ngày bốc', cssClass: 'col-date', align: 'center', defaultVisible: true },
  { id: 'maTinh', label: 'Mã Tỉnh', header: 'Mã Tỉnh', cssClass: 'col-province', align: 'center', defaultVisible: true },
  { id: 'tenCtv', label: 'Tên CTY', header: 'Tên CTY', cssClass: 'col-company', defaultVisible: true },
  { id: 'dv', label: 'DV', header: 'DV', cssClass: 'col-service', align: 'center', defaultVisible: true },
  { id: 'matHang', label: 'Mặt Hàng', header: 'Mặt Hàng', cssClass: 'col-item', defaultVisible: true },
  { id: 'noiTra', label: 'Nơi Trả', header: 'Nơi Trả', cssClass: 'col-place', defaultVisible: true },
  { id: 'soLuong', label: 'Số Lượng', header: 'Số Lượng', cssClass: 'col-qty', align: 'center', defaultVisible: true, totalKey: 'soLuong' },
  { id: 'nguoiNhan', label: 'Người nhận / SĐT', header: '', cssClass: 'col-recipient', defaultVisible: true },
  { id: 'tinhTrangGiaoHang', label: 'Tình trạng giao hàng', header: 'TÌNH TRẠNG\nGIAO HÀNG', cssClass: 'col-delivery-status', align: 'center', defaultVisible: true },
  { id: 'ngayHoanThanh', label: 'Ngày hoàn thành', header: 'Ngày\nhoàn thành', cssClass: 'col-completion-date', align: 'center', defaultVisible: true },
  { id: 'keHoach', label: 'Kế hoạch', header: 'Kế hoạch', cssClass: 'col-plan', defaultVisible: true },
  { id: 'tangHaThuKhach', label: 'Tăng hạ thu khách', header: 'Tăng hạ\nthu khách', cssClass: 'col-surcharge', align: 'right', defaultVisible: true, totalKey: 'tangHaThuKhach' },
  { id: 'cuoc', label: 'Cước', header: 'Cước', cssClass: 'col-fee', align: 'right', defaultVisible: true, managerOnly: true, totalKey: 'cuoc' },
  { id: 'laiXeThuHo', label: 'Lái xe thu hộ', header: 'Lái xe\nthu hộ', cssClass: 'col-driver', defaultVisible: true },
  { id: 'bcThuHo', label: 'BC thu hộ', header: 'BC thu hộ', cssClass: 'col-post', defaultVisible: true },
  { id: 'maBill', label: 'Mã Bill', header: 'Mã Bill', cssClass: 'col-bill', align: 'center', defaultVisible: true },
  { id: 'ghiChu', label: 'Ghi chú', header: 'Ghi chú', cssClass: 'col-note', defaultVisible: true },
];

export const DISPATCH_PRINT_COLUMN_STORAGE_KEY = 'eco_dispatch_print_visible_columns_v2';

const defMap = new Map(DISPATCH_PRINT_COLUMN_DEFS.map((def) => [def.id, def]));

export function getDispatchColumnDef(id: DispatchPrintColumnId): DispatchPrintColumnDef {
  return defMap.get(id)!;
}

export function getSelectableDispatchColumns(canViewPricing: boolean): DispatchPrintColumnDef[] {
  return DISPATCH_PRINT_COLUMN_DEFS.filter((col) => !col.managerOnly || canViewPricing);
}

export function getDefaultVisibleDispatchColumnIds(canViewPricing: boolean): DispatchPrintColumnId[] {
  return getSelectableDispatchColumns(canViewPricing)
    .filter((col) => col.defaultVisible)
    .map((col) => col.id);
}

export function loadVisibleDispatchColumnIds(canViewPricing: boolean): DispatchPrintColumnId[] {
  if (typeof window === 'undefined') return getDefaultVisibleDispatchColumnIds(canViewPricing);
  const raw = localStorage.getItem(DISPATCH_PRINT_COLUMN_STORAGE_KEY);
  if (!raw) return getDefaultVisibleDispatchColumnIds(canViewPricing);
  try {
    const parsed = JSON.parse(raw) as DispatchPrintColumnId[];
    return resolveVisibleDispatchColumnIds(parsed, canViewPricing);
  } catch {
    return getDefaultVisibleDispatchColumnIds(canViewPricing);
  }
}

export function saveVisibleDispatchColumnIds(ids: DispatchPrintColumnId[]) {
  localStorage.setItem(DISPATCH_PRINT_COLUMN_STORAGE_KEY, JSON.stringify(ids));
}

export function resolveVisibleDispatchColumnIds(
  ids: DispatchPrintColumnId[],
  canViewPricing: boolean,
): DispatchPrintColumnId[] {
  const allowed = new Set(getSelectableDispatchColumns(canViewPricing).map((col) => col.id));
  const selected = new Set(ids.filter((id) => allowed.has(id)));
  selected.add('viTriHang');
  const ordered = DISPATCH_PRINT_COLUMN_DEFS.filter((col) => selected.has(col.id)).map((col) => col.id);
  return ordered.length ? ordered : getDefaultVisibleDispatchColumnIds(canViewPricing);
}

export function toggleDispatchColumnId(
  ids: DispatchPrintColumnId[],
  columnId: DispatchPrintColumnId,
  checked: boolean,
  canViewPricing: boolean,
): DispatchPrintColumnId[] {
  const def = getDispatchColumnDef(columnId);
  if (def.required) return resolveVisibleDispatchColumnIds(ids, canViewPricing);
  const set = new Set(ids);
  if (checked) set.add(columnId);
  else set.delete(columnId);
  return resolveVisibleDispatchColumnIds(Array.from(set), canViewPricing);
}

/** Legacy exports — giữ thứ tự cột mặc định cho code cũ nếu cần. */
export const DISPATCH_PRINT_HEADERS = DISPATCH_PRINT_COLUMN_DEFS.map((col) => col.header);
export const DISPATCH_PRINT_COLUMNS = DISPATCH_PRINT_COLUMN_DEFS.map((col) => col.cssClass);

export type DispatchPrintRowData = DispatchPrintRow;

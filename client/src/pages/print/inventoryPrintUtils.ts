import type { InventoryFilters, WaybillInventoryItem } from '../warehouse/inventory/types';

export const INVENTORY_PRINT_STORAGE_KEY = 'eco_inventory_print_v1';

export interface InventoryPrintRow {
  viTriHang: string;
  ngayBoc: string;
  maTinh: string;
  tenCty: string;
  dv: string;
  matHang: string;
  noiTra: string;
  soLuong: string;
  donVi: string;
  nguoiNhanPhone: string;
  nguoiNhanDiaChi: string;
  keHoach: string;
  tongBoThuKhach: string;
  cuoc: string;
  laiXeThuHo: string;
  bcThuHo: string;
  maBill: string;
  ghiChu: string;
  kg: string;
  m3: string;
}

export interface InventoryPrintPayload {
  printedAt: string;
  filterSummary: string;
  showPricing: boolean;
  rows: InventoryPrintRow[];
  totals: {
    soLuong: number;
    tongBoThuKhach: number;
    cuoc: number;
    kg: number;
    m3: number;
  };
}

const parseNote = (note: string | null | undefined, key: string) => {
  const m = (note || '').match(new RegExp(`${key}=([^|]+)`));
  return m?.[1]?.trim() || '';
};

const parseContact = (info?: string | null) => {
  const raw = (info || '').trim();
  if (!raw) return { phone: '', name: '', address: '' };
  if (raw.includes('|')) {
    const [phone, name, address] = raw.split('|').map((p) => p.trim());
    return { phone: phone || '', name: name || '', address: address || '' };
  }
  return { phone: '', name: raw, address: '' };
};

const formatShortDate = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
};

const num = (v: unknown) => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n: number) => (n ? n.toLocaleString('vi-VN') : '');

const formatPrintNote = (note: string) => {
  const parts = [
    parseNote(note, 'ma_kh'),
    parseNote(note, 'content'),
    parseNote(note, 'dich_vu'),
    parseNote(note, 'loai_bp'),
    parseNote(note, 'dimensions_cm'),
  ].filter(Boolean);
  const summary = parts.length ? parts.join(' / ') : note.replace(/\s*\|\s*/g, ' ');
  return summary.slice(0, 70);
};

const calcM3 = (w: WaybillInventoryItem, note: string) => {
  const fromNote = parseNote(note, 'volumetric_weight');
  const vol = num((w as { volumetric_weight?: unknown }).volumetric_weight) || num(fromNote);
  if (vol > 0 && vol < 500) return (vol / 500).toFixed(2);
  const dim = parseNote(note, 'dimensions_cm');
  const parts = dim.split('x').map((p) => num(p));
  if (parts.length === 3 && parts.every((p) => p > 0)) {
    return ((parts[0] * parts[1] * parts[2]) / 1_000_000).toFixed(2);
  }
  return '';
};

export function buildInventoryQueryForPrint(filters: InventoryFilters) {
  const params = new URLSearchParams({ page: '1', limit: '500' });
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  if (filters.statuses.length) params.set('status', filters.statuses.join(','));
  if (filters.hubIds.length) params.set('hub_id', filters.hubIds.join(','));
  if (filters.paymentTypes.length) params.set('payment_type', filters.paymentTypes.join(','));
  if (filters.priorities.length) params.set('priority', filters.priorities.join(','));
  if (filters.receivedFrom) params.set('received_from', filters.receivedFrom);
  if (filters.receivedTo) params.set('received_to', filters.receivedTo);
  return params.toString();
}

export function summarizeFilters(filters: InventoryFilters) {
  const parts: string[] = [];
  if (filters.keyword.trim()) parts.push(`Từ khóa: ${filters.keyword.trim()}`);
  if (filters.statuses.length) parts.push(`TT: ${filters.statuses.join(', ')}`);
  if (filters.hubIds.length) parts.push(`Hub: ${filters.hubIds.length} bưu cục`);
  if (filters.receivedFrom || filters.receivedTo) {
    parts.push(`Ngày nhận: ${filters.receivedFrom || '…'} → ${filters.receivedTo || '…'}`);
  }
  return parts.length ? parts.join(' · ') : 'Tất cả đơn tồn kho theo bộ lọc hiện tại';
}

export function mapWaybillsToPrintRows(
  waybills: WaybillInventoryItem[],
  showPricing: boolean,
): InventoryPrintPayload {
  const rows: InventoryPrintRow[] = waybills.map((w) => {
    const note = w.note || w.notes || '';
    const sender = parseContact(w.sender_info);
    const receiver = parseContact(w.receiver_info);
    const maKh = parseNote(note, 'ma_kh');
    const dichVu = parseNote(note, 'dich_vu');
    const loaiBp = parseNote(note, 'loai_bp');
    const content = parseNote(note, 'content');
    const destLabel = w.dest_hub?.name || w.dest_hub?.code?.toUpperCase() || '';
    const cod = num(w.cod_amount);
    const freight = num((w as { freight_amount?: unknown }).freight_amount);
    const cost = num((w as { cost_amount?: unknown }).cost_amount);
    const cuocVal = cost || freight;
    const pkg = Math.max(1, num(w.package_count || w.declared_package_count));
    const kg = num(w.actual_weight || w.weight);
    const m3Str = calcM3(w, note);

    return {
      viTriHang: w.route_code || w.delivery_route || '',
      ngayBoc: formatShortDate(w.received_at || w.created_at),
      maTinh: destLabel,
      tenCty: sender.name || maKh || w.sender_info || '',
      dv: dichVu || loaiBp || '',
      matHang: content || w.sender_info || '',
      noiTra: destLabel ? `Kho ${destLabel}` : '',
      soLuong: String(pkg),
      donVi: 'kiện',
      nguoiNhanPhone: receiver.phone || (w as { receiver_phone?: string }).receiver_phone || '',
      nguoiNhanDiaChi:
        (w as { receiver_address?: string }).receiver_address ||
        receiver.address ||
        w.receiver_info ||
        '',
      keHoach: '',
      tongBoThuKhach: formatMoney(cod),
      cuoc: showPricing ? formatMoney(cuocVal) : '',
      laiXeThuHo: '',
      bcThuHo: '',
      maBill: w.waybill_code || w.code || String(w.id),
      ghiChu: formatPrintNote(note),
      kg: kg ? String(Math.round(kg * 10) / 10) : '',
      m3: m3Str,
    };
  });

  const totals = waybills.reduce(
    (acc, w) => {
      const note = w.note || w.notes || '';
      const pkg = Math.max(1, num(w.package_count || w.declared_package_count));
      const kg = num(w.actual_weight || w.weight);
      const m3Str = calcM3(w, note);
      return {
        soLuong: acc.soLuong + pkg,
        tongBoThuKhach: acc.tongBoThuKhach + num(w.cod_amount),
        cuoc:
          acc.cuoc +
          (showPricing ? num((w as { cost_amount?: unknown }).cost_amount) || num((w as { freight_amount?: unknown }).freight_amount) : 0),
        kg: acc.kg + kg,
        m3: acc.m3 + num(m3Str),
      };
    },
    { soLuong: 0, tongBoThuKhach: 0, cuoc: 0, kg: 0, m3: 0 },
  );

  return {
    printedAt: new Date().toLocaleString('vi-VN'),
    filterSummary: '',
    showPricing,
    rows,
    totals,
  };
}

/** localStorage: tab in mới (window.open) không đọc được sessionStorage của tab gốc */
export function saveInventoryPrintPayload(payload: InventoryPrintPayload) {
  const json = JSON.stringify(payload);
  localStorage.setItem(INVENTORY_PRINT_STORAGE_KEY, json);
  try {
    sessionStorage.setItem(INVENTORY_PRINT_STORAGE_KEY, json);
  } catch {
    /* quota / private mode */
  }
}

export function loadInventoryPrintPayload(): InventoryPrintPayload | null {
  const raw =
    localStorage.getItem(INVENTORY_PRINT_STORAGE_KEY) ||
    sessionStorage.getItem(INVENTORY_PRINT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InventoryPrintPayload;
  } catch {
    return null;
  }
}

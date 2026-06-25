import type { LoadPlanningManifest, ManifestDispatchFields, ManifestWaybill } from '../warehouse/manifests/types';
import type { DispatchPrintRow } from './dispatchPrintFormat';
import { formatDispatchMoney } from './dispatchPrintFormat';
import type { LoadPlanningPrintGroup, LoadPlanningPrintPayload } from './loadPlanningPrintUtils';

type ManifestLink = {
  waybill_id?: string | number | null;
  loading_position?: number | string | null;
  loaded_at?: string | null;
  dispatch_fields?: ManifestDispatchFields | null;
  waybill?: ManifestWaybill | null;
};

const fmt = (value?: string | number | null) => (value == null || value === '' ? '' : String(value));

const parsePhone = (info?: string | null) => {
  if (!info) return '';
  const parts = info.split('|').map((part) => part.trim());
  return parts[1] || '';
};

const parseAddress = (info?: string | null, address?: string | null) => {
  if (address?.trim()) return address.trim();
  if (!info) return '';
  const parts = info.split('|').map((part) => part.trim());
  return parts.slice(2).join(' | ').trim() || parts[0] || '';
};

const parseSenderName = (info?: string | null) => (info || '').split('|')[0]?.trim() || '';

const formatShortDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fmt(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

function dispatchValue(fields: ManifestDispatchFields | null | undefined, key: string) {
  return fmt(fields?.[key] as string | number | null | undefined);
}

function normalizeLinks(manifest: LoadPlanningManifest): ManifestLink[] {
  if (manifest.manifest_waybills?.length) return manifest.manifest_waybills as ManifestLink[];
  return (manifest.waybills ?? []).map((waybill, index) => ({
    waybill_id: waybill.id,
    loading_position: waybill.loading_position ?? index + 1,
    dispatch_fields: waybill.dispatch_fields,
    waybill,
  }));
}

function mapLinkToRow(link: ManifestLink, index: number, showPricing: boolean): DispatchPrintRow {
  const waybill = link.waybill;
  const fields: ManifestDispatchFields = {
    ...(waybill?.dispatch_fields ?? {}),
    ...(link.dispatch_fields ?? {}),
  };

  const bcThuHoRaw = dispatchValue(fields, 'bc_thu_ho').replace(/\./g, '');
  const laiXeThuHoRaw = dispatchValue(fields, 'lai_xe_thu_ho').replace(/\./g, '');
  const freight = Number(waybill?.cost_amount ?? (bcThuHoRaw ? Number(bcThuHoRaw) : 0));
  const cod = Number(laiXeThuHoRaw || 0);

  const ghiChu = [dispatchValue(fields, 'ghi_chu_1'), dispatchValue(fields, 'ghi_chu_2'), dispatchValue(fields, 'ghi_chu_bill')]
    .filter(Boolean)
    .join(' · ');

  const receiverAddress = dispatchValue(fields, 'dia_chi') || parseAddress(waybill?.receiver_info, waybill?.receiver_address);

  return {
    viTriHang: fmt(link.loading_position ?? index + 1),
    ngayBoc: dispatchValue(fields, 'ngay_boc') || formatShortDate(link.loaded_at ?? null),
    maTinh: dispatchValue(fields, 'ma_tinh') || fmt(waybill?.noi_den || waybill?.dest_hub?.code || waybill?.dest_hub_id),
    tenCtv: dispatchValue(fields, 'ten_cty') || parseSenderName(waybill?.sender_info),
    dv: dispatchValue(fields, 'dv') || 'TC',
    matHang: dispatchValue(fields, 'mat_hang') || fmt((waybill as { item_name?: string | null } | undefined)?.item_name || waybill?.waybill_code),
    matHangNote: '',
    noiTra: dispatchValue(fields, 'noi_tra') || fmt(waybill?.dest_hub?.name || waybill?.noi_den),
    soLuong: dispatchValue(fields, 'so_luong') || fmt(waybill?.package_count) || '1',
    donVi: dispatchValue(fields, 'loai') || 'kiện',
    nguoiNhanPhone: parsePhone(waybill?.receiver_info),
    nguoiNhanDiaChi: receiverAddress,
    diaChiNhan: receiverAddress,
    tinhTrangGiaoHang: dispatchValue(fields, 'trang_thai_giao'),
    ngayHoanThanh: dispatchValue(fields, 'du_kien_toi_hcm'),
    keHoach: dispatchValue(fields, 'ke_hoach'),
    tangHaThuKhach: formatDispatchMoney(cod),
    cuoc: showPricing ? formatDispatchMoney(freight) : '',
    laiXeThuHo: dispatchValue(fields, 'lai_xe_thu_ho'),
    bcThuHo: dispatchValue(fields, 'bc_thu_ho'),
    maBill: dispatchValue(fields, 'ma_bill') || fmt(waybill?.waybill_code),
    ghiChu,
  };
}

function buildGroupTotals(rows: DispatchPrintRow[], showPricing: boolean) {
  return rows.reduce(
    (acc, row) => ({
      soLuong: acc.soLuong + (Number(row.soLuong) || 0),
      tangHaThuKhach:
        acc.tangHaThuKhach + Number(String(row.tangHaThuKhach).replace(/\./g, '').replace(/,/g, '') || 0),
      cuoc:
        acc.cuoc + (showPricing ? Number(String(row.cuoc).replace(/\./g, '').replace(/,/g, '') || 0) : 0),
    }),
    { soLuong: 0, tangHaThuKhach: 0, cuoc: 0 },
  );
}

export function buildManifestPrintPayload(manifest: LoadPlanningManifest, showPricing: boolean): LoadPlanningPrintPayload {
  const trip = manifest.trip ?? manifest.trips?.[0] ?? null;
  const licensePlate = trip?.truck?.bks?.trim() || trip?.truck?.license_plate?.trim() || trip?.carrier_label?.trim() || '';
  const nhaXe = trip?.carrier_label?.trim() || '';
  const links = normalizeLinks(manifest).sort(
    (a, b) => Number(a.loading_position ?? 9999) - Number(b.loading_position ?? 9999),
  );
  const rows = links.map((link, index) => mapLinkToRow(link, index, showPricing));
  const group: LoadPlanningPrintGroup = {
    truckLabel: [licensePlate, nhaXe].filter(Boolean).join(' · ') || manifest.manifest_code || `BK-${manifest.id}`,
    licensePlate,
    nhaXe,
    manifestCode: manifest.manifest_code || manifest.code || `BK-${manifest.id}`,
    rows,
    totals: buildGroupTotals(rows, showPricing),
  };

  return {
    title: 'BẢNG KÊ PHÁT HÀNG ECO',
    printedAt: new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
    filterSummary: group.manifestCode,
    showPricing,
    groups: [group],
  };
}

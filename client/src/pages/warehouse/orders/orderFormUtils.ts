import type { HubSummary, PaymentType, WaybillDetail } from './types';
import { emptyOrderForm } from './orderFormData';
import type { BillListItem, NewOrderFormState } from './orderFormTypes';

const parseNumber = (value: string) => Number(String(value).replace(/[^\d.-]/g, ''));

export function formatDisplayNumber(value: unknown, digits = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('vi-VN', { maximumFractionDigits: digits });
}

export function calcVolumetricWeight(length: string, width: string, height: string): string {
  const l = parseNumber(length);
  const w = parseNumber(width);
  const h = parseNumber(height);
  if (!l || !w || !h) return '';
  return formatDisplayNumber((l * w * h) / 5000, 3);
}

export function calcM3(length: string, width: string, height: string): string {
  const l = parseNumber(length);
  const w = parseNumber(width);
  const h = parseNumber(height);
  if (!l || !w || !h) return '';
  return formatDisplayNumber((l * w * h) / 1_000_000, 3);
}

/** Số lượng tính cước theo ĐVT: Kg | M3 | Kiện */
export function getBillingQuantity(form: NewOrderFormState): number {
  const unit = (form.donGiaDonVi || 'Kg').trim().toLowerCase();
  if (unit === 'm3' || unit === 'm³') return parseNumber(form.m3);
  if (unit === 'kiện' || unit === 'kien') return Math.max(1, parseNumber(form.soKien));
  const kg = parseNumber(form.klKg);
  const volKg = parseNumber(form.klQuyDoi);
  return Math.max(kg, volKg, kg || volKg || 0);
}

/** Cước chính = đơn giá × số lượng (theo ĐVT) */
export function calcCuocChinhAmount(form: NewOrderFormState): number {
  const qty = getBillingQuantity(form);
  const unitPrice = parseNumber(form.donGia);
  if (!qty || !unitPrice) return 0;
  return Math.round(qty * unitPrice);
}

export function calcOrderPricing(form: NewOrderFormState) {
  const cuocChinh = calcCuocChinhAmount(form);
  const phuPhi = parseNumber(form.dvdb);
  const giamGia = parseNumber(form.giamGia);
  const tongCuoc = cuocChinh + phuPhi;
  const thueRate = parseNumber(String(form.thueSuat).replace('%', ''));
  const vatAmount = form.coVat ? Math.round((tongCuoc * thueRate) / 100) : parseNumber(form.vat);
  const thanhToan = Math.max(0, tongCuoc - giamGia + vatAmount);

  return {
    cuocChinh: formatDisplayNumber(cuocChinh, 0),
    tongCuoc: formatDisplayNumber(tongCuoc, 0),
    vat: formatDisplayNumber(vatAmount, 0),
    thanhToan: formatDisplayNumber(thanhToan, 0),
  };
}

const PRICING_FIELDS: (keyof NewOrderFormState)[] = [
  'donGia',
  'donGiaDonVi',
  'klKg',
  'klQuyDoi',
  'm3',
  'soKien',
  'dvdb',
  'giamGia',
  'thueSuat',
  'vat',
  'coVat',
  'chieuDai',
  'chieuRong',
  'chieuCao',
];

export function isPricingField(key: keyof NewOrderFormState) {
  return PRICING_FIELDS.includes(key);
}

export function applyPricingToForm(form: NewOrderFormState): NewOrderFormState {
  const pricing = calcOrderPricing(form);
  return { ...form, ...pricing };
}

export function hubCodeFromId(hubs: HubSummary[], hubId: string) {
  return hubs.find((h) => String(h.id) === hubId)?.code?.toUpperCase() || '';
}

export function hubIdFromCode(hubs: HubSummary[], code: string) {
  const normalized = code.trim().toUpperCase();
  return String(hubs.find((h) => h.code?.toUpperCase() === normalized)?.id || '');
}

function waybillToOrderFormBase(waybill: WaybillDetail, hubs: HubSummary[]): NewOrderFormState {
  const destId = waybill.dest_hub_id ? String(waybill.dest_hub_id) : '';
  const originId = waybill.origin_hub_id ? String(waybill.origin_hub_id) : '';
  const destCode = waybill.dest_hub?.code?.toUpperCase() || hubCodeFromId(hubs, destId);

  return {
    ...emptyOrderForm(),
    maKh: waybill.sender_info?.split('|')[0]?.trim() || '',
    nguoiGui: waybill.sender_info?.split('|')[1]?.trim() || waybill.sender_info || '',
    diaChiGui: waybill.sender_info?.split('|')[2]?.trim() || '',
    dienThoaiNhan: waybill.receiver_info?.split('|')[0]?.trim() || '',
    nguoiNhan: waybill.receiver_info?.split('|')[1]?.trim() || waybill.receiver_info || '',
    diaChiNhan: waybill.receiver_address || waybill.receiver_info?.split('|')[2]?.trim() || waybill.receiver_info || '',
    noiDen: destCode || 'HCM',
    originHubId: originId,
    destHubId: destId,
    huyen: waybill.dest_hub?.name || '',
    soBill: waybill.waybill_code || waybill.code || '',
    klKg: String(waybill.weight ?? ''),
    soKien: String(waybill.package_count ?? 1),
    klQuyDoi: String(waybill.volumetric_weight ?? waybill.weight ?? ''),
    m3: String((waybill as { the_tich_m3?: number }).the_tich_m3 ?? ''),
    donGia: String((waybill as { don_gia?: number }).don_gia ?? ''),
    donGiaDonVi: String((waybill as { don_gia_don_vi?: string }).don_gia_don_vi ?? 'Kg'),
    dvdb: formatDisplayNumber((waybill as { dvdb?: number }).dvdb, 0) || '0',
    cuocChinh: formatDisplayNumber(waybill.cost_amount ?? waybill.freight_amount, 0),
    tongCuoc: formatDisplayNumber(waybill.cost_amount ?? waybill.freight_amount, 0),
    thanhToan: formatDisplayNumber(waybill.cost_amount ?? waybill.freight_amount, 0),
    cod: formatDisplayNumber(waybill.cod_amount, 0),
    phuongThuc:
      waybill.payment_type === 'COD' ? 'COD' : waybill.payment_type === 'CC' ? 'Tiền mặt' : 'Công nợ tháng',
    ghiChu: waybill.note || waybill.notes || '',
    trangThai: String(waybill.current_state || waybill.status || 'RECEIVED'),
  };
}

export function waybillToOrderForm(waybill: WaybillDetail, hubs: HubSummary[]): NewOrderFormState {
  const base = waybillToOrderFormBase(waybill, hubs);
  return applyPricingToForm(base);
}

export function waybillToBillItem(waybill: WaybillDetail): BillListItem {
  return {
    id: String(waybill.id),
    waybill_code: waybill.waybill_code || waybill.code || `#${waybill.id}`,
    package_count: Number(waybill.package_count) || 1,
  };
}

export function paymentTypeFromForm(form: NewOrderFormState): PaymentType {
  if (form.phuongThuc === 'COD') return 'COD';
  if (form.phuongThuc === 'Tiền mặt') return 'CC';
  return 'PP';
}

export function buildCreatePayload(form: NewOrderFormState, volumetricWeight: number) {
  const paymentType = paymentTypeFromForm(form);
  const freight = parseNumber(form.cuocChinh) || parseNumber(form.tongCuoc) || parseNumber(form.thanhToan);
  const cod = parseNumber(form.cod);

  return {
    sender_name: form.nguoiGui.trim(),
    sender_phone: form.dienThoaiKh.trim() || '0900000000',
    sender_address: form.diaChiGui.trim() || form.nguoiGui.trim(),
    receiver_name: form.nguoiNhan.trim(),
    receiver_phone: form.dienThoaiNhan.trim() || '0900000000',
    receiver_address: form.diaChiNhan.trim(),
    origin_hub_id: form.originHubId,
    dest_hub_id: form.destHubId,
    weight: parseNumber(form.klKg) || parseNumber(form.klQuyDoi) || 1,
    package_count: Math.max(1, parseInt(form.soKien, 10) || 1),
    freight_amount: paymentType === 'COD' ? 0 : freight,
    cod_amount: paymentType === 'COD' ? cod || freight : undefined,
    note: [
      form.maKh && `ma_kh=${form.maKh}`,
      form.noiDung && `content=${form.noiDung}`,
      form.loaiBp && `loai_bp=${form.loaiBp}`,
      form.dichVu && `dich_vu=${form.dichVu}`,
      `dimensions_cm=${form.chieuDai}x${form.chieuRong}x${form.chieuCao}`,
      `volumetric_weight=${volumetricWeight}`,
      form.ghiChu,
    ]
      .filter(Boolean)
      .join(' | '),
  };
}

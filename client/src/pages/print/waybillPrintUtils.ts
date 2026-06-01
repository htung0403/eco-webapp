import type { WaybillDetail } from '../warehouse/orders/types';

export interface WaybillPrintData {
  waybillCode: string;
  maKhGui: string;
  maBcGui: string;
  tenKhGui: string;
  diaChiGui: string;
  quanHuyenGui: string;
  tinhGui: string;
  sdtGui: string;
  lienHeGui: string;
  maKhNhan: string;
  maBcNhan: string;
  tenKhNhan: string;
  diaChiNhan: string;
  quanHuyenNhan: string;
  tinhNhan: string;
  sdtNhan: string;
  lienHeNhan: string;
  moTaHang: string;
  soKien: string;
  trongLuongThuc: string;
  trongLuongQuyDoi: string;
  ghiChu: string;
  noiDungHang: string;
  hinhThucThanhToan: string;
  thuHo: string;
  khaiGia: string;
  ngayGioGui: string;
  cuocChinh: string;
  dichVuCongThem: string;
  tongCuoc: string;
  tongPhaiThuPhat: string;
  dichVu: string;
  dvGtgt: string;
  showPricing: boolean;
}

function parseContact(info?: string | null) {
  const parts = (info || '').split('|').map((p) => p.trim());
  if (parts.length >= 3) {
    return { phone: parts[0], name: parts[1], address: parts.slice(2).join(' | ') };
  }
  return { phone: '', name: info || '', address: '' };
}

function parseNoteField(note: string, key: string) {
  const match = note.match(new RegExp(`${key}=([^|]+)`));
  return match?.[1]?.trim() || '';
}

function paymentLabel(type?: string | null) {
  const t = (type || '').toUpperCase();
  if (t === 'COD') return 'COD';
  if (t === 'CC') return 'TIỀN MẶT';
  if (t === 'PP') return 'CÔNG NỢ THÁNG';
  return t || '';
}

function formatNum(v: unknown, digits = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('vi-VN', { maximumFractionDigits: digits });
}

function formatDate(d?: string | null) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
}

export function buildWaybillPrintData(waybill: WaybillDetail, showPricing: boolean): WaybillPrintData {
  const note = waybill.note || waybill.notes || '';
  const sender = parseContact(waybill.sender_info);
  const receiver = parseContact(waybill.receiver_info);
  const maKh = parseNoteField(note, 'ma_kh');
  const noiDung = parseNoteField(note, 'content') || note.split('|').pop()?.trim() || '';
  const dichVu = parseNoteField(note, 'dich_vu');
  const loaiBp = parseNoteField(note, 'loai_bp');

  const receiverAddress = waybill.receiver_address || receiver.address;
  const weight = Number(waybill.weight) || 0;
  const vol = Number((waybill as { volumetric_weight?: number }).volumetric_weight) || weight;

  const cod = Number(waybill.cod_amount) || 0;
  const freight = showPricing
    ? Number(waybill.cost_amount ?? waybill.freight_amount) || 0
    : 0;

  return {
    waybillCode: waybill.waybill_code || waybill.code || String(waybill.id),
    maKhGui: maKh || sender.name.split(' ')[0] || '',
    maBcGui: waybill.origin_hub?.code?.toUpperCase() || '',
    tenKhGui: (waybill as { sender_name?: string }).sender_name || sender.name,
    diaChiGui: (waybill as { sender_address?: string }).sender_address || sender.address,
    quanHuyenGui: '',
    tinhGui: waybill.origin_hub?.name || '',
    sdtGui: (waybill as { sender_phone?: string }).sender_phone || sender.phone,
    lienHeGui: '',
    maKhNhan: '',
    maBcNhan: waybill.dest_hub?.code?.toUpperCase() || '',
    tenKhNhan: (waybill as { receiver_name?: string }).receiver_name || receiver.name,
    diaChiNhan: receiverAddress,
    quanHuyenNhan: '',
    tinhNhan: waybill.dest_hub?.name || waybill.dest_hub?.code?.toUpperCase() || '',
    sdtNhan: (waybill as { receiver_phone?: string }).receiver_phone || receiver.phone,
    lienHeNhan: '',
    moTaHang: noiDung,
    soKien: String(waybill.package_count ?? 1),
    trongLuongThuc: formatNum(weight, 0),
    trongLuongQuyDoi: formatNum(vol, 2),
    ghiChu: note.replace(/\s*\|\s*/g, ' ').slice(0, 200),
    noiDungHang: noiDung,
    hinhThucThanhToan: paymentLabel(waybill.payment_type),
    thuHo: formatNum(cod, 0) || '0',
    khaiGia: '',
    ngayGioGui: formatDate(waybill.received_at || (waybill as { created_at?: string }).created_at),
    cuocChinh: showPricing ? formatNum(freight, 0) : '',
    dichVuCongThem: '',
    tongCuoc: showPricing ? formatNum(freight, 0) : '',
    tongPhaiThuPhat: formatNum(cod || (waybill.payment_type === 'COD' ? freight : 0), 0) || '0',
    dichVu: (dichVu || loaiBp || 'ĐƯỜNG BỘ').toUpperCase(),
    dvGtgt: parseNoteField(note, 'dich_vu_gia_tang') || 'tiêu chuẩn',
    showPricing,
  };
}

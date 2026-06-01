import type { NewOrderFormState } from './orderFormTypes';

export const ORDER_TABS = [
  { id: 'trang-thai' as const, label: 'Trạng thái' },
  { id: 'goc' as const, label: 'Gốc' },
  { id: 'den' as const, label: 'Đến' },
  { id: 'tn' as const, label: 'TN' },
  { id: 'bc-gui' as const, label: 'BC gửi' },
  { id: 'hni' as const, label: 'HNI' },
];

export const LOAI_BP_OPTIONS = ['CPN', 'Hỏa tốc', 'Tiết kiệm'];
export const DICH_VU_OPTIONS = ['Đường bộ', 'Đường bay', 'Chuyển phát nhanh'];
export const GIO_OPTIONS = ['8h', '10h', '12h', '14h', '16h', '18h'];
export const GIAO_HANG_OPTIONS = ['Văn phòng', 'Tận nơi', 'Lấy tại kho'];
export const DON_GIA_DON_VI_OPTIONS = ['Kg', 'Kiện', 'M3'];
export const PHUONG_THUC_OPTIONS = ['Công nợ tháng', 'Tiền mặt', 'Chuyển khoản', 'COD'];

export const emptyOrderForm = (): NewOrderFormState => ({
  maKh: '',
  dienThoaiKh: '',
  nguoiGui: '',
  diaChiGui: '',
  dienThoaiNhan: '',
  noiDen: 'HCM',
  originHubId: '',
  destHubId: '',
  huyen: '',
  nguoiNhan: '',
  diaChiNhan: '',
  soBill: '',
  loaiBp: 'CPN',
  dichVu: 'Đường bộ',
  gio: '16h',
  giaoHang: 'Văn phòng',
  klKg: '',
  soKien: '1',
  nvgn: 'ADMIN',
  chieuDai: '0',
  chieuRong: '0',
  chieuCao: '0',
  klQuyDoi: '',
  m3: '',
  donGia: '0',
  donGiaDonVi: 'Kg',
  dichVuGiaTang: 'Tiêu chuẩn',
  soKhoang: '',
  noiDung: '',
  ghiChu: '',
  xeLay: '',
  buuTaLay: '',
  xePhat: '',
  buuTaPhat: '',
  dvdb: '0',
  cuocChinh: '',
  ngayDi: '',
  phuongThuc: 'Công nợ tháng',
  thueSuat: '0%',
  vat: '0',
  cod: '0',
  tongCuoc: '',
  giamGia: '0',
  thanhToan: '',
  coVat: false,
  trangThai: 'RECEIVED',
});

export const sampleOrderForm = (): NewOrderFormState => ({
  ...emptyOrderForm(),
  maKh: 'ALPHATIC',
  nguoiGui: 'ALPHATIC',
  dienThoaiNhan: '0888727897',
  noiDen: 'HCM',
  huyen: 'HỒ CHÍ MINH',
  nguoiNhan: 'Tuấn Nguyễn',
  diaChiNhan: '215i Nguyễn Trãi, P. Nguyễn Cư Trinh, Quận 1, TP HCM',
  soBill: 'ECO109602',
  klKg: '50',
  soKien: '1',
  klQuyDoi: '50',
  m3: '0.060',
  noiDung: 'APT5171-1HN',
  cuocChinh: '250000',
  tongCuoc: '250000',
  thanhToan: '250000',
});

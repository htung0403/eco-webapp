export type IncomingTripDetailTabId = 'tong-quan' | 'hang-hoa' | 'van-hanh' | 'lich-su-thanh-toan';

export const INCOMING_TRIP_DETAIL_TABS: { id: IncomingTripDetailTabId; label: string }[] = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'hang-hoa', label: 'Hàng hóa' },
  { id: 'van-hanh', label: 'Vận hành' },
  { id: 'lich-su-thanh-toan', label: 'Lịch sử thanh toán' },
];

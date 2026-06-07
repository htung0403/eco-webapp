export type CustomerDetailTabId = 'chi-tiet' | 'don-hang' | 'giao-hang' | 'bill' | 'thanh-toan';

export const CUSTOMER_DETAIL_TABS: { id: CustomerDetailTabId; label: string }[] = [
  { id: 'chi-tiet', label: 'Chi tiết' },
  { id: 'don-hang', label: 'Đơn hàng' },
  { id: 'giao-hang', label: 'Giao hàng' },
  { id: 'bill', label: 'Bill' },
  { id: 'thanh-toan', label: 'Thanh toán' },
];

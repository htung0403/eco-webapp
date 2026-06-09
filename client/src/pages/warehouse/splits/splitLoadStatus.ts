export const SPLIT_LOAD_STATUSES = [
  { value: 'WAITING_LOAD', label: 'Chờ bốc', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'LOADED', label: 'Đã bốc', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'DEPARTED', label: 'Đã khởi hành', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'IN_TRANSIT', label: 'Đang vận chuyển', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'DELIVERED', label: 'Đã giao', className: 'bg-green-50 text-green-700 border-green-200' },
] as const;

export type SplitLoadStatus = typeof SPLIT_LOAD_STATUSES[number]['value'];

/** Thứ tự chuyển trạng thái — chỉ được tiến một bước. */
export const SPLIT_LOAD_STATUS_FLOW: SplitLoadStatus[] = [
  'WAITING_LOAD',
  'LOADED',
  'DEPARTED',
  'IN_TRANSIT',
  'DELIVERED',
];

const statusMap = new Map(SPLIT_LOAD_STATUSES.map((item) => [item.value, item]));

/** ARRIVED (cũ) không còn trong luồng — coi như IN_TRANSIT khi hiển thị. */
export function normalizeSplitLoadStatus(value?: string | null): SplitLoadStatus | 'ARRIVED' {
  const raw = String(value || 'WAITING_LOAD').toUpperCase();
  if (raw === 'ARRIVED') return 'ARRIVED';
  if (statusMap.has(raw as SplitLoadStatus)) return raw as SplitLoadStatus;
  return 'WAITING_LOAD';
}

export function getNextSplitLoadStatus(value?: string | null): SplitLoadStatus | null {
  const normalized = normalizeSplitLoadStatus(value);
  if (normalized === 'ARRIVED') return 'DELIVERED';
  const index = SPLIT_LOAD_STATUS_FLOW.indexOf(normalized);
  if (index < 0 || index >= SPLIT_LOAD_STATUS_FLOW.length - 1) return null;
  return SPLIT_LOAD_STATUS_FLOW[index + 1] ?? null;
}

export const splitLoadStatusLabel = (value?: string | null) => {
  const normalized = normalizeSplitLoadStatus(value);
  if (normalized === 'ARRIVED') return SPLIT_LOAD_STATUSES.find((item) => item.value === 'IN_TRANSIT')?.label ?? 'Đang vận chuyển';
  return statusMap.get(normalized)?.label ?? 'Chờ bốc';
};

export const splitLoadStatusClass = (value?: string | null) => {
  const normalized = normalizeSplitLoadStatus(value);
  if (normalized === 'ARRIVED') return SPLIT_LOAD_STATUSES.find((item) => item.value === 'IN_TRANSIT')?.className ?? SPLIT_LOAD_STATUSES[0].className;
  return statusMap.get(normalized)?.className ?? SPLIT_LOAD_STATUSES[0].className;
};

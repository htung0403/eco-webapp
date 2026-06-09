export enum WaybillSplitLoadStatus {
  WAITING_LOAD = 'WAITING_LOAD',
  LOADED = 'LOADED',
  DEPARTED = 'DEPARTED',
  IN_TRANSIT = 'IN_TRANSIT',
  /** @deprecated Dùng DELIVERED — giữ để tương thích dữ liệu cũ */
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
}

export const WAYBILL_SPLIT_LOAD_STATUS_LABELS: Record<WaybillSplitLoadStatus, string> = {
  [WaybillSplitLoadStatus.WAITING_LOAD]: 'Chờ bốc',
  [WaybillSplitLoadStatus.LOADED]: 'Đã bốc',
  [WaybillSplitLoadStatus.DEPARTED]: 'Đã khởi hành',
  [WaybillSplitLoadStatus.IN_TRANSIT]: 'Đang vận chuyển',
  [WaybillSplitLoadStatus.ARRIVED]: 'Đang vận chuyển',
  [WaybillSplitLoadStatus.DELIVERED]: 'Đã giao',
};

const SPLIT_LOAD_STATUS_TRANSITIONS: Partial<Record<WaybillSplitLoadStatus, WaybillSplitLoadStatus[]>> = {
  [WaybillSplitLoadStatus.WAITING_LOAD]: [WaybillSplitLoadStatus.LOADED],
  [WaybillSplitLoadStatus.LOADED]: [WaybillSplitLoadStatus.DEPARTED],
  [WaybillSplitLoadStatus.DEPARTED]: [WaybillSplitLoadStatus.IN_TRANSIT],
  [WaybillSplitLoadStatus.IN_TRANSIT]: [WaybillSplitLoadStatus.DELIVERED],
  [WaybillSplitLoadStatus.ARRIVED]: [WaybillSplitLoadStatus.DELIVERED],
  [WaybillSplitLoadStatus.DELIVERED]: [],
};

export function assertSplitLoadStatusTransition(
  current: WaybillSplitLoadStatus,
  next: WaybillSplitLoadStatus,
) {
  const allowed = SPLIT_LOAD_STATUS_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`INVALID_SPLIT_LOAD_STATUS_TRANSITION:${current}->${next}`);
  }
}

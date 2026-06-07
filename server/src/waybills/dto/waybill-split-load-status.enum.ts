export enum WaybillSplitLoadStatus {
  WAITING_LOAD = 'WAITING_LOAD',
  LOADED = 'LOADED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
}

export const WAYBILL_SPLIT_LOAD_STATUS_LABELS: Record<WaybillSplitLoadStatus, string> = {
  [WaybillSplitLoadStatus.WAITING_LOAD]: 'Chờ bốc',
  [WaybillSplitLoadStatus.LOADED]: 'Đã bốc',
  [WaybillSplitLoadStatus.DEPARTED]: 'Đã di chuyển',
  [WaybillSplitLoadStatus.ARRIVED]: 'Đã tới',
};

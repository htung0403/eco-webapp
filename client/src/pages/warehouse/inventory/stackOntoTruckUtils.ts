import type { WaybillInventoryItem } from './types';

export interface StackOntoTruckFormRow {
  waybill_id: string;
  waybill_code: string;
  package_count: string;
  max_package_count: number;
  loading_position: string;
  expected_arrival_label: string;
}

export interface StackOntoTruckSharedFields {
  truck_id: string;
  nha_xe: string;
  vendor_cost: string;
}

export function computeExpectedArrivalDate(base?: string | null): Date {
  const date = base ? new Date(base) : new Date();
  if (Number.isNaN(date.getTime())) return new Date(Date.now() + 3 * 86400000);
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + 3);
  return next;
}

export function formatExpectedArrivalLabel(base?: string | null): string {
  return computeExpectedArrivalDate(base).toLocaleDateString('vi-VN');
}

export function buildStackFormRows(waybills: WaybillInventoryItem[]): StackOntoTruckFormRow[] {
  return waybills.map((waybill) => {
    const orderDate = waybill.created_at || waybill.received_at;
    return {
      waybill_id: String(waybill.id),
      waybill_code: waybill.waybill_code || waybill.code || `#${waybill.id}`,
      package_count: String(Math.max(1, Number(waybill.remaining_packages ?? waybill.package_count ?? 1))),
      max_package_count: Math.max(1, Number(waybill.remaining_packages ?? waybill.package_count ?? 1)),
      loading_position: waybill.loading_position ? String(waybill.loading_position) : '',
      expected_arrival_label: formatExpectedArrivalLabel(orderDate),
    };
  });
}

export function buildInitialSharedFields(waybills: WaybillInventoryItem[]): StackOntoTruckSharedFields {
  const preset = waybills.find((waybill) => waybill.truck_id);
  return {
    truck_id: preset?.truck_id ? String(preset.truck_id) : '',
    nha_xe: preset?.trip_nha_xe || '',
    vendor_cost: '',
  };
}


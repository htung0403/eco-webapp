import { formatExpectedArrivalLabel } from '../inventory/stackOntoTruckUtils';
import type { WaybillInventoryItem } from '../inventory/types';

export interface ManifestAddFormRow {
  waybill_id: string;
  waybill_code: string;
  noi_den: string;
  selected: boolean;
  package_count: string;
  max_package_count: number;
  loading_position: string;
  expected_arrival_label: string;
}

export function buildManifestAddFormRows(waybills: WaybillInventoryItem[]): ManifestAddFormRow[] {
  return waybills.map((waybill) => {
    const maxPackages = Math.max(
      1,
      Number(waybill.remaining_packages ?? waybill.package_count ?? waybill.order_total_packages ?? 1),
    );
    const orderDate = waybill.created_at || waybill.received_at;
    return {
      waybill_id: String(waybill.id),
      waybill_code: waybill.waybill_code || waybill.code || `#${waybill.id}`,
      noi_den: waybill.noi_den || waybill.dest_hub?.name || waybill.receiver_info || '—',
      selected: false,
      package_count: '',
      max_package_count: maxPackages,
      loading_position: waybill.loading_position ? String(waybill.loading_position) : '',
      expected_arrival_label: formatExpectedArrivalLabel(orderDate),
    };
  });
}

export interface ManifestAddSubmitItem {
  waybill_id: string;
  package_count: number;
  loading_position?: number;
}

export function buildManifestAddSubmitItems(rows: ManifestAddFormRow[]): ManifestAddSubmitItem[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => ({
      waybill_id: row.waybill_id,
      package_count: Number(row.package_count),
      loading_position: row.loading_position.trim() ? Number(row.loading_position) : undefined,
    }));
}

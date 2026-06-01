export type PaymentType = 'PP' | 'CC' | 'COD';
export type WaybillState = 'RECEIVED' | 'IN_WAREHOUSE' | 'MANIFEST_CLOSED' | 'IN_TRANSIT' | 'AT_DEST_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED';

export interface FilterOption { value: string; label: string; count?: number }
export interface BadgeConfig { label: string; className: string }

export interface HubSummary {
  id: string | number;
  code?: string | null;
  name?: string | null;
  address?: string | null;
}

export interface WaybillRoutingItem {
  id: string | number;
  waybill_code: string;
  sender_info: string;
  receiver_info: string;
  weight: number | string | null;
  length: number | string | null;
  width: number | string | null;
  height: number | string | null;
  volumetric_weight: number | string | null;
  payment_type: PaymentType | string;
  cost_amount?: number | string | null;
  current_state: WaybillState | string;
  origin_hub_id: string | number | null;
  dest_hub_id: string | number | null;
  origin_hub?: HubSummary | null;
  dest_hub?: HubSummary | null;
  delivery_route?: string | null;
  route_code?: string | null;
  package_count?: number | null;
  cod_amount?: number | string | null;
  note?: string | null;
}

export type WaybillRoutingDetail = WaybillRoutingItem;

export interface WaybillRoutingListResponse {
  data?: WaybillRoutingItem[];
  items?: WaybillRoutingItem[];
  waybills?: WaybillRoutingItem[];
  total?: number;
  meta?: { total?: number };
}

export interface RoutingFilters {
  keyword: string;
  statuses: string[];
  originHubIds: string[];
  destHubIds: string[];
  paymentTypes: string[];
  page: number;
  limit: number;
}

export interface AssignRouteFormState { route_code: string }

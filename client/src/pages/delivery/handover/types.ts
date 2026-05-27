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

export interface UserSummary {
  id: string | number;
  username: string;
  name?: string | null;
  phone?: string | null;
  role_mask: number;
}

export interface TripSummary {
  id: string | number;
  status?: string | null;
  start_hub_id?: string | number | null;
  end_hub_id?: string | number | null;
  manifest_id?: string | number | null;
  truck_id?: string | number | null;
}

export interface WaybillHandoverItem {
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
  last_mile_driver_id?: string | number | null;
  origin_hub?: HubSummary | null;
  dest_hub?: HubSummary | null;
  last_mile_driver?: UserSummary | null;
  driver?: UserSummary | null;
  trip_id?: string | number | null;
}

export type WaybillHandoverDetail = WaybillHandoverItem;

export interface WaybillHandoverListResponse {
  data?: WaybillHandoverItem[];
  items?: WaybillHandoverItem[];
  waybills?: WaybillHandoverItem[];
  total?: number;
  meta?: { total?: number };
}

export interface ListResponse<T> {
  data?: T[];
  items?: T[];
  users?: T[];
  hubs?: T[];
  trips?: T[];
  total?: number;
  meta?: { total?: number };
}

export interface HandoverFilters {
  keyword: string;
  statuses: string[];
  driverIds: string[];
  tripIds: string[];
  originHubIds: string[];
  destHubIds: string[];
  paymentTypes: string[];
  page: number;
  limit: number;
}

export interface AssignDriverHandoverFormState {
  driver_id: string;
  trip_id: string;
}

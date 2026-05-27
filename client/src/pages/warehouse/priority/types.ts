export type WaybillStatus = 'RECEIVED' | 'IN_WAREHOUSE' | 'MANIFEST_CLOSED' | 'IN_TRANSIT' | 'AT_DEST_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | string;
export type PaymentType = 'PP' | 'CC' | 'COD' | string;
export type PriorityLevel = 'HIGH' | 'NORMAL' | 'LOW' | 'URGENT' | string;

export interface HubSummary {
  id: string | number;
  code?: string | null;
  name?: string | null;
  address?: string | null;
}

export interface WaybillPriorityItem {
  id: string | number;
  waybill_code?: string | null;
  sender_info?: string | null;
  receiver_info?: string | null;
  weight?: number | string | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  volumetric_weight?: number | string | null;
  payment_type?: PaymentType | null;
  cost_amount?: number | string | null;
  current_state?: WaybillStatus | null;
  origin_hub_id?: string | number | null;
  dest_hub_id?: string | number | null;
  origin_hub?: HubSummary | null;
  dest_hub?: HubSummary | null;
  priority?: PriorityLevel | null;
}

export interface WaybillPriorityDetail extends WaybillPriorityItem {
  created_at?: string | null;
  delivery_time?: string | null;
  delivery_photo_url?: string | null;
}

export interface WaybillPriorityFilters {
  keyword: string;
  statuses: string[];
  originHubIds: string[];
  destHubIds: string[];
  paymentTypes: string[];
  page: number;
  limit: number;
}

export interface WaybillListResponse {
  data?: WaybillPriorityItem[];
  items?: WaybillPriorityItem[];
  waybills?: WaybillPriorityItem[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number };
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface BadgeConfig {
  label: string;
  className: string;
}

export interface PriorityFormState {
  priority: string;
}

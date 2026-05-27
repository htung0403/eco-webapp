export type BadgeConfig = { label: string; className: string };
export type FilterOption = { value: string; label: string };

export type ListResponse<T> = {
  data?: T[];
  items?: T[];
  waybills?: T[];
  hubs?: T[];
  trips?: T[];
  total?: number;
  meta?: { total?: number };
};

export type HubSummary = {
  id: string | number;
  code?: string | null;
  name?: string | null;
  address?: string | null;
};

export type TripSummary = {
  id: string | number;
  truck_id?: string | number | null;
  manifest_id?: string | number | null;
  start_hub_id?: string | number | null;
  end_hub_id?: string | number | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  status?: string | null;
  fuel_actual?: number | string | null;
  fuel_cost?: number | string | null;
  other_costs?: number | string | null;
};

export type HubDropoffWaybill = {
  id: string | number;
  waybill_code: string;
  sender_info?: string | null;
  receiver_info?: string | null;
  weight?: number | string | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  volumetric_weight?: number | string | null;
  payment_type?: 'PP' | 'CC' | 'COD' | string | null;
  cost_amount?: number | string | null;
  current_state?: string | null;
  origin_hub_id?: string | number | null;
  dest_hub_id?: string | number | null;
  last_mile_driver_id?: string | number | null;
  created_at?: string | null;
};

export type HubDropoffWaybillDetail = HubDropoffWaybill;

export type HubDropoffFilters = {
  keyword: string;
  statuses: string[];
  originHubIds: string[];
  destHubIds: string[];
  paymentTypes: string[];
  tripIds: string[];
  page: number;
  limit: number;
};

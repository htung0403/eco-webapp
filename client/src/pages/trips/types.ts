export type TripStatus = 'PLANNED' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | string;
export type PaymentType = 'PP' | 'CC' | 'COD' | string;

export interface HubSummary { id: string | number; code?: string | null; name?: string | null; address?: string | null; }
export interface TruckSummary { id: string | number; license_plate?: string | null; status?: string | null; payload?: number | null; fuel_consumption_limit?: number | null; }
export interface ManifestSummary { id: string | number; manifest_code?: string | null; seal_code?: string | null; status?: string | null; origin_hub_id?: string | number | null; dest_hub_id?: string | number | null; origin_hub?: HubSummary | null; dest_hub?: HubSummary | null; }

export interface WaybillSummary {
  id?: string | number;
  waybill_code?: string | null;
  sender_info?: string | null;
  receiver_info?: string | null;
  weight?: number | string | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  volumetric_weight?: number | string | null;
  payment_type?: PaymentType | null;
  current_state?: string | null;
  cost_amount?: number | string | null;
  origin_hub_id?: string | number | null;
  dest_hub_id?: string | number | null;
}

export interface ManifestDetail extends ManifestSummary {
  waybills?: WaybillSummary[];
  manifest_waybills?: Array<{ waybill?: WaybillSummary | null }>;
}

export interface Trip {
  id: string | number;
  truck_id?: string | number | null;
  manifest_id?: string | number | null;
  start_hub_id?: string | number | null;
  end_hub_id?: string | number | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  status?: TripStatus | null;
  fuel_actual?: number | null;
  fuel_cost?: number | string | null;
  other_costs?: number | string | null;
  truck?: TruckSummary | null;
  manifest?: ManifestSummary | null;
  start_hub?: HubSummary | null;
  end_hub?: HubSummary | null;
  created_at?: string | null;
}

export interface ListResponse<T> {
  data?: T[];
  items?: T[];
  trips?: T[];
  hubs?: T[];
  trucks?: T[];
  manifests?: T[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number; total_pages?: number };
}

export interface TripFilters {
  keyword: string;
  status: string[];
  start_hub_id: string[];
  end_hub_id: string[];
  departure_from: string;
  departure_to: string;
  page: number;
  limit: number;
}

export interface WaybillFilters {
  keyword: string;
  current_state: string[];
  origin_hub_id: string[];
  dest_hub_id: string[];
  payment_type: string[];
  page: number;
  limit: number;
}

export interface FilterOption { value: string; label: string; }
export type TripAction = 'start' | 'arrive' | 'complete' | 'cancel';

export interface TripCostFormState { fuel_actual: string; fuel_cost: string; other_costs: string; }

export interface TripCreateHubSummary {
  id: string | number;
  code?: string | null;
  name?: string | null;
  address?: string | null;
  status?: string | null;
}

export interface TripCreateTruckSummary {
  id: string | number;
  license_plate?: string | null;
  payload?: number | null;
  status?: string | null;
  fuel_consumption_limit?: number | null;
  warning?: string | null;
  warnings?: string[] | null;
}

export interface TripCreateManifestSummary {
  id: string | number;
  manifest_code?: string | null;
  seal_code?: string | null;
  origin_hub_id?: string | number | null;
  dest_hub_id?: string | number | null;
  status?: string | null;
  warning?: string | null;
  warnings?: string[] | null;
  origin_hub?: TripCreateHubSummary | null;
  dest_hub?: TripCreateHubSummary | null;
}

export interface TripCreateFormState {
  truck_id: string;
  manifest_id: string;
  start_hub_id: string;
  end_hub_id: string;
  departure_time: string;
  arrival_time: string;
  fuel_actual: string;
  fuel_cost: string;
  other_costs: string;
}

export type TripCreatePayload = {
  truck_id: number | string;
  manifest_id: number | string;
  start_hub_id: number | string;
  end_hub_id: number | string;
  departure_time: string;
  arrival_time?: string;
  fuel_actual?: number;
  fuel_cost?: number;
  other_costs?: number;
};

export type TripCreateFieldErrors = Partial<Record<keyof TripCreateFormState, string>>;

export interface TripExpense {
  id: string | number;
  trip_id: string | number;
  [key: string]: unknown;
}

export interface TripExpenseListResponse {
  data?: TripExpense[];
  items?: TripExpense[];
  expenses?: TripExpense[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number; total_pages?: number };
}

export interface TripExpenseFilters {
  keyword: string;
  approval_status: string[];
  trip_type: string[];
  date_range: string[];
  page: number;
  limit: number;
}

export interface TripApprovalStatus {
  trip_id?: string | number;
  status?: string | null;
  type?: 'internal' | 'vendor' | string;
  [key: string]: unknown;
}

export type TripCostApprovalType = 'internal' | 'vendor';

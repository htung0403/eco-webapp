export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | string;
export type TripStatus = 'PLANNED' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | string;

export interface FilterOption { value: string; label: string; }
export interface HubSummary { id: string | number; code?: string | null; name?: string | null; }
export interface TruckSummary { id: string | number; license_plate?: string | null; status?: string | null; }
export interface ManifestSummary { id: string | number; manifest_code?: string | null; status?: string | null; }
export interface TripExpense { id: string | number; trip_id: string | number; }

export interface InternalCostTrip {
  id: string | number;
  truck_id?: string | number | null;
  manifest_id?: string | number | null;
  start_hub_id?: string | number | null;
  end_hub_id?: string | number | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  status?: TripStatus | null;
  fuel_actual?: number | string | null;
  fuel_cost?: number | string | null;
  other_costs?: number | string | null;
  approval_status?: ApprovalStatus | null;
  approvalStatus?: ApprovalStatus | null;
  internal_approval_status?: ApprovalStatus | null;
  truck?: TruckSummary | null;
  manifest?: ManifestSummary | null;
  start_hub?: HubSummary | null;
  end_hub?: HubSummary | null;
  expenses?: TripExpense[];
}

export interface InternalCostFilters {
  keyword: string;
  status: string[];
  start_hub_id: string[];
  end_hub_id: string[];
  trip_status: string[];
  date_from: string;
  date_to: string;
  page: number;
  limit: number;
}

export interface TripCostFormState { fuel_actual: string; fuel_cost: string; other_costs: string; }
export type TripCostFieldErrors = Partial<Record<keyof TripCostFormState, string>>;

export interface ListResponse<T> {
  data?: T[];
  items?: T[];
  trips?: T[];
  hubs?: T[];
  trucks?: T[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number; total_pages?: number };
}

export type TruckStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_TRIP' | 'IN_USE' | 'MAINTENANCE' | 'INACTIVE' | string;

export interface DriverSummary {
  id: string | number;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  role_mask?: number | null;
}

export interface HubSummary {
  id: string | number;
  code?: string | null;
  name?: string | null;
}

export interface TripSummary {
  id: string | number;
  status?: string | null;
}

export interface Truck {
  id: string | number;
  license_plate: string;
  payload?: number | null;
  driver_id?: string | number | null;
  driver?: DriverSummary | null;
  fuel_consumption_limit?: number | null;
  status: TruckStatus;
  truck_type?: string | null;
  ownership_type?: string | null;
  hub_id?: string | number | null;
  hub?: HubSummary | null;
  registration_expiry?: string | null;
  maintenance_due_at?: string | null;
  maintenance_locked?: boolean | null;
  trips?: TripSummary[] | null;
}

export interface TruckListResponse {
  data?: Truck[];
  items?: Truck[];
  trucks?: Truck[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number; total_pages?: number };
}

export interface TruckFilters {
  keyword: string;
  status: string[];
  truck_type: string[];
  hub_id: string[];
  assigned_driver_id: string[];
  maintenance_state: string[];
  page: number;
  limit: number;
}

export interface TruckFormState {
  license_plate: string;
  payload: string;
  driver_id: string;
  fuel_consumption_limit: string;
  status: string;
}

export interface FilterOption { value: string; label: string; count?: number }

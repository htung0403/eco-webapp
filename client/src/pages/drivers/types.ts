export interface DriverUser {
  id: string | number;
  username: string;
  name: string;
  phone: string;
  role_mask: number;
  hubs?: HubSummary[];
  hub?: HubSummary | null;
}

export interface HubSummary {
  id: string | number;
  code: string;
  name: string;
}

export interface TruckSummary {
  id: string | number;
  license_plate: string;
  payload?: number | null;
  driver_id?: string | number | null;
  assigned_driver_id?: string | number | null;
  status?: string | null;
}

export interface TripSummary {
  id?: string | number;
  status?: string | null;
  truck_id: string | number;
  manifest_id: string | number;
  start_hub_id: string | number;
  end_hub_id: string | number;
  departure_time: string;
  arrival_time: string | null;
  fuel_actual: number | null;
  fuel_cost: number | string | null;
  other_costs: number | string | null;
}

export interface ListResponse<T> {
  data?: T[];
  items?: T[];
  users?: T[];
  trucks?: T[];
  trips?: T[];
  total?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    total_pages?: number;
  };
}

export interface DriverPerformanceRow {
  driver: DriverUser;
  hubs: HubSummary[];
  assignedTrucks: TruckSummary[];
  trips: TripSummary[];
  totalTrips: number;
  completedTrips: number;
  issueTrips: number;
  completionRate: number;
  performanceScore: number | null;
}

export interface DriverPerformanceFilters {
  keyword: string;
  hubIds: string[];
  driverStatus: string[];
  tripStatus: string[];
  dateRange: string[];
  scoreLevels: string[];
  page: number;
  limit: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

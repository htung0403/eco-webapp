import type { HubSummary, ManifestDetail, Trip, WaybillSummary } from '../types';

export type BreakdownType = 'trip' | 'waybill' | 'expense' | 'revenue' | 'profit';

export interface TripProfitFilters {
  keyword: string;
  breakdown_type: string[];
  waybill_status: string[];
  payment_type: string[];
  page: number;
  limit: number;
}

export interface TripProfitPayload {
  revenue?: number | string | null;
  total_revenue?: number | string | null;
  fuel_cost?: number | string | null;
  other_costs?: number | string | null;
  total_cost?: number | string | null;
  estimated_profit?: number | string | null;
  profit?: number | string | null;
  waybills?: WaybillSummary[];
  expenses?: TripProfitExpense[];
  breakdown?: TripProfitBreakdownItem[];
  data?: TripProfitBreakdownItem[];
  items?: TripProfitBreakdownItem[];
  total?: number;
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number; total_pages?: number };
  [key: string]: unknown;
}

export interface TripProfitExpense {
  id: string | number;
  trip_id: string | number;
  [key: string]: unknown;
}

export interface TripProfitBreakdownItem {
  id?: string | number;
  type?: BreakdownType | string;
  label?: string | null;
  status?: string | null;
  amount?: number | string | null;
  waybill?: WaybillSummary | null;
  expense?: TripProfitExpense | null;
  [key: string]: unknown;
}

export interface TripProfitPageData {
  trip: Trip;
  profit: TripProfitPayload | null;
  manifest: ManifestDetail | null;
  hubs: HubSummary[];
}

export interface TripProfitRow {
  id: string;
  type: BreakdownType | string;
  label: string;
  status?: string | null;
  payment_type?: string | null;
  amount?: number | string | null;
  waybill?: WaybillSummary | null;
  expense?: TripProfitExpense | null;
  source: Record<string, unknown>;
}

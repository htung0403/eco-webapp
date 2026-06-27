import type { IncomingHub } from './types';

export interface IncomingTripPaymentHistoryItem {
  id: string | number;
  type: 'VENDOR_PAYMENT' | 'TRIP_STATUS';
  amount: number;
  payment_date: string;
  description?: string | null;
  proof_image_url?: string | null;
  created_by_name?: string | null;
  vendor_name?: string | null;
}

export interface IncomingTripPaymentSummary {
  status: string;
  paid_amount: number;
  payable_amount: number;
  proof_image_url?: string | null;
  vendor_paid_amount?: number | string | null;
  payment_note?: string | null;
}

export interface IncomingTripDetail {
  id: string | number;
  manifest_id?: string | number | null;
  manifest_code?: string | null;
  seal_code?: string | null;
  status?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  expected_arrival_time?: string | null;
  start_hub?: IncomingHub | null;
  end_hub?: IncomingHub | null;
  origin_hub?: IncomingHub | null;
  dest_hub?: IncomingHub | null;
  license_plate?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vendor_name?: string | null;
  vehicle_type?: string | null;
  waybill_count?: number;
  planned_total_weight?: number;
  planned_total_volume?: number;
  total_collect?: number;
  trip_cost?: number;
  fuel_cost?: number;
  other_costs?: number;
  payment_summary: IncomingTripPaymentSummary;
  vendor_payment_note?: string | null;
  payment_history: IncomingTripPaymentHistoryItem[];
}

import { X } from 'lucide-react';
import type { InternalCostTrip } from '../types';

interface Props { trip: InternalCostTrip | null; onClose: () => void; }
const value = (input: unknown) => input == null || input === '' ? '—' : String(input);
const money = (input: unknown) => input == null || input === '' ? '—' : Number(input).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default function InternalCostDetailDialog({ trip, onClose }: Props) {
  if (!trip) return null;
  const rows = [
    ['truck_id', value(trip.truck?.license_plate || trip.truck_id)], ['manifest_id', value(trip.manifest?.manifest_code || trip.manifest_id)],
    ['start_hub_id', value(trip.start_hub?.code || trip.start_hub_id)], ['end_hub_id', value(trip.end_hub?.code || trip.end_hub_id)],
    ['departure_time', value(trip.departure_time)], ['arrival_time', value(trip.arrival_time)], ['status', value(trip.status)],
    ['fuel_actual', trip.fuel_actual == null ? '—' : `${trip.fuel_actual} L`], ['fuel_cost', money(trip.fuel_cost)], ['other_costs', money(trip.other_costs)],
  ];
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}><div className="w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-[16px] font-extrabold text-foreground">Chi tiết chi phí chuyến #{trip.id}</h2><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="grid gap-2 p-5 md:grid-cols-2">{rows.map(([label, rowValue]) => <div key={label} className="rounded-xl border border-border bg-muted/5 p-3"><div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 text-[13px] font-bold text-foreground">{rowValue}</div></div>)}</div></div></div>;
}

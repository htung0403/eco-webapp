import { Truck, X } from 'lucide-react';
import type { TruckSummary } from '../types';

const value = (input: unknown) => input === null || input === undefined || input === '' ? '—' : String(input);

interface Props { truck: TruckSummary | null; onClose: () => void; }

export default function TripTruckDetailDialog({ truck, onClose }: Props) {
  if (!truck) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Truck size={20} /></span><div><h2 className="text-[16px] font-extrabold text-foreground">Xe {value(truck.license_plate || truck.id)}</h2><p className="text-[13px] text-muted-foreground">Thông tin xe liên quan chuyến.</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="grid gap-2 p-5 text-[13px]">
          <Line label="truck_id" value={value(truck.id)} />
          <Line label="license_plate" value={value(truck.license_plate)} />
          <Line label="payload" value={value(truck.payload)} />
          <Line label="fuel_consumption_limit" value={value(truck.fuel_consumption_limit)} />
          <Line label="status" value={value(truck.status)} />
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/5 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}</span></div>; }

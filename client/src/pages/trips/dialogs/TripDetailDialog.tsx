import { CalendarClock, Fuel, MapPin, Package, Truck as TruckIcon, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Trip } from '../types';

const value = (input: unknown) => input === null || input === undefined || input === '' ? '—' : String(input);
const money = (input: unknown) => input === null || input === undefined || input === '' ? '—' : new Intl.NumberFormat('vi-VN').format(Number(input)) + ' đ';
const date = (input?: string | null) => input ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(input)) : '—';

interface Props { trip: Trip | null; onClose: () => void; }

export default function TripDetailDialog({ trip, onClose }: Props) {
  if (!trip) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Chi tiết chuyến xe</p>
            <h2 className="text-lg font-extrabold text-primary">Chuyến #{trip.id}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="grid gap-3 overflow-y-auto p-5 custom-scrollbar sm:grid-cols-2">
          <Info icon={<TruckIcon size={15} />} label="Xe" value={trip.truck?.license_plate || `Truck #${value(trip.truck_id)}`} />
          <Info icon={<Package size={15} />} label="Bảng kê" value={trip.manifest?.manifest_code || `Manifest #${value(trip.manifest_id)}`} />
          <Info icon={<MapPin size={15} />} label="Bưu cục đi" value={trip.start_hub?.code || trip.start_hub?.name || `Hub #${value(trip.start_hub_id)}`} />
          <Info icon={<MapPin size={15} />} label="Bưu cục đến" value={trip.end_hub?.code || trip.end_hub?.name || `Hub #${value(trip.end_hub_id)}`} />
          <Info icon={<CalendarClock size={15} />} label="Khởi hành" value={date(trip.departure_time)} />
          <Info icon={<CalendarClock size={15} />} label="Đến nơi" value={date(trip.arrival_time)} />
          <Info icon={<Fuel size={15} />} label="Nhiên liệu thực tế" value={trip.fuel_actual == null ? '—' : `${trip.fuel_actual} L`} />
          <Info icon={<Fuel size={15} />} label="Chi phí nhiên liệu" value={money(trip.fuel_cost)} />
          <Info icon={<Fuel size={15} />} label="Chi phí khác" value={money(trip.other_costs)} />
          <Info icon={<Package size={15} />} label="Trạng thái" value={value(trip.status)} />
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return <div className="rounded-2xl border border-border bg-muted/5 p-4"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{icon}{label}</div><div className="mt-1 text-[13px] font-bold text-foreground">{value}</div></div>;
}

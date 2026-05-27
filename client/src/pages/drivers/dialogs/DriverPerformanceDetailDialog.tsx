import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { CalendarClock, Fuel, MapPin, Phone, ShieldCheck, Truck, User, X } from 'lucide-react';
import type { DriverPerformanceRow, HubSummary, TripSummary } from '../types';

interface Props {
  row: DriverPerformanceRow | null;
  hubs: HubSummary[];
  isClosing: boolean;
  onClose: () => void;
}

const formatDateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const formatMoney = (value?: number | string | null) => value == null || value === '' ? '—' : new Intl.NumberFormat('vi-VN').format(Number(value));
const hubLabel = (hubs: HubSummary[], id?: string | number | null) => hubs.find(hub => String(hub.id) === String(id))?.code || (id ? `Hub #${id}` : '—');

export default function DriverPerformanceDetailDialog({ row, hubs, isClosing, onClose }: Props) {
  if (!row && !isClosing) return null;
  const driver = row?.driver;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className={`relative flex h-screen w-full max-w-[760px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl ${isClosing ? 'dialog-slide-out' : 'dialog-slide-in'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Hiệu suất tài xế</p>
            <h2 className="text-lg font-extrabold text-foreground">{driver?.name || 'Chi tiết tài xế'}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 custom-scrollbar">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info icon={<User size={15} />} label="Tài xế" value={driver ? `${driver.name} · ${driver.username}` : '—'} />
              <Info icon={<Phone size={15} />} label="Số điện thoại" value={driver?.phone || '—'} />
              <Info icon={<MapPin size={15} />} label="Bưu cục" value={row?.hubs.map(hub => hub.code).join(', ') || '—'} />
              <Info icon={<Truck size={15} />} label="Xe đang gán" value={row?.assignedTrucks.map(truck => truck.license_plate).join(', ') || '—'} />
              <Info icon={<ShieldCheck size={15} />} label="Điểm hiệu suất" value={row?.performanceScore == null ? 'Chưa có dữ liệu' : `${row.performanceScore}/100`} />
              <Info icon={<CalendarClock size={15} />} label="Tỷ lệ hoàn thành" value={`${row?.completionRate ?? 0}%`} />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border bg-muted/5 px-5 py-3 text-[12px] font-bold uppercase tracking-wider text-primary">Danh sách chuyến liên quan</div>
            <div className="divide-y divide-border">
              {row?.trips.length ? row.trips.map((trip, index) => <TripItem key={`${trip.truck_id}-${trip.manifest_id}-${index}`} trip={trip} hubs={hubs} />) : <div className="p-5 text-center text-[13px] text-muted-foreground">Chưa có chuyến xe từ API.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-3"><div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground">{icon}{label}</div><div className="text-[13px] font-extrabold text-foreground">{value}</div></div>;
}

function TripItem({ trip, hubs }: { trip: TripSummary; hubs: HubSummary[] }) {
  return <div className="grid gap-3 p-4 text-[13px] md:grid-cols-4"><Info icon={<Truck size={15} />} label="Xe / Manifest" value={`#${trip.truck_id} · #${trip.manifest_id}`} /><Info icon={<MapPin size={15} />} label="Tuyến" value={`${hubLabel(hubs, trip.start_hub_id)} → ${hubLabel(hubs, trip.end_hub_id)}`} /><Info icon={<CalendarClock size={15} />} label="Thời gian" value={`${formatDateTime(trip.departure_time)} → ${formatDateTime(trip.arrival_time)}`} /><Info icon={<Fuel size={15} />} label="Chi phí" value={`Dầu ${trip.fuel_actual ?? '—'} · ${formatMoney(trip.fuel_cost)}đ · ${formatMoney(trip.other_costs)}đ`} /></div>;
}

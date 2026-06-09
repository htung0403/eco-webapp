import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Eye, Loader2, PackageCheck, Printer, Receipt, RefreshCw, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import type { ListResponse, Trip } from './trips/types';

const activeTripStatuses = ['IN_TRANSIT', 'ARRIVED'];

const normalizeList = <T,>(response: ListResponse<T> | T[]) => (
  Array.isArray(response) ? response : response.data || response.items || response.trips || []
);

const formatDate = (value?: string | null) => (
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'
);

const tripStatusLabel = (status?: string | null) => {
  if (status === 'IN_TRANSIT') return 'Xe đã khởi hành';
  if (status === 'ARRIVED') return 'Xe đã đến';
  return status || '—';
};

export default function TripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTrips() {
    setIsLoading(true);
    setError('');
    try {
      const responses = await Promise.all(activeTripStatuses.map((status) => (
        apiRequest<ListResponse<Trip> | Trip[]>(`/trips?${new URLSearchParams({ page: '1', limit: '100', status }).toString()}`)
      )));
      setTrips(responses.flatMap(normalizeList).sort((a, b) => (
        new Date(b.departure_time || b.created_at || 0).getTime() - new Date(a.departure_time || a.created_at || 0).getTime()
      )));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được bảng kê đơn đã đi.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTrips();
  }, []);

  const totals = useMemo(() => ({
    departed: trips.filter((trip) => trip.status === 'IN_TRANSIT').length,
    arrived: trips.filter((trip) => trip.status === 'ARRIVED').length,
  }), [trips]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck size={22} /></div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Bảng kê đơn đã đi</h1>
            <p className="text-[13px] text-muted-foreground">Quản lý các chuyến xe đã đóng: vị trí xếp hàng, thông tin xe, in bảng kê và chi phí chuyến.</p>
          </div>
          <button type="button" onClick={() => void loadTrips()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[13px] font-bold text-muted-foreground hover:bg-muted">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Làm mới
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-bold text-muted-foreground">
          <span>{trips.length.toLocaleString('vi-VN')} chuyến</span><span>·</span>
          <span>{totals.departed.toLocaleString('vi-VN')} xe đã khởi hành</span><span>·</span>
          <span>{totals.arrived.toLocaleString('vi-VN')} xe đã đến</span>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {isLoading ? (
          <StateBlock icon={<Loader2 size={22} className="animate-spin" />} title="Đang tải bảng kê đơn đã đi..." />
        ) : error ? (
          <StateBlock icon={<AlertTriangle size={22} />} title={error} />
        ) : !trips.length ? (
          <StateBlock icon={<PackageCheck size={22} />} title="Chưa có chuyến xe đã khởi hành." />
        ) : (
          <div className="h-full overflow-auto custom-scrollbar">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
                <tr>
                  {['Chuyến', 'Trạng thái', 'Xe / tài xế', 'Bảng kê', 'Tuyến', 'Giờ khởi hành', 'Giờ đến', 'Thao tác'].map((header) => (
                    <th key={header} className="border-r border-border px-4 py-3 font-bold last:border-r-0">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={String(trip.id)} className="border-b border-border hover:bg-muted/10">
                    <td className="px-4 py-3 text-[13px] font-extrabold text-primary">Chuyến #{trip.id}</td>
                    <td className="px-4 py-3"><TripStatusBadge status={trip.status} /></td>
                    <td className="px-4 py-3 text-[13px] font-bold text-foreground">
                      <div>{trip.truck?.license_plate || `Xe #${trip.truck_id || '—'}`}</div>
                      <div className="text-[12px] font-medium text-muted-foreground">{trip.driver_name || trip.truck?.ten_lai_xe || 'Chưa có tài xế'}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-bold text-emerald-700">{trip.manifest?.manifest_code || `BK #${trip.manifest_id || '—'}`}</td>
                    <td className="px-4 py-3 text-[13px]">{trip.start_hub?.code || trip.start_hub_id || '—'} → {trip.end_hub?.code || trip.end_hub_id || '—'}</td>
                    <td className="px-4 py-3 text-[13px]">{formatDate(trip.departure_time)}</td>
                    <td className="px-4 py-3 text-[13px]">{formatDate(trip.arrival_time)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton title="Xem chi tiết" icon={<Eye size={14} />} onClick={() => navigate(`/trips/${trip.id}`)} />
                        <ActionButton title="In bảng kê" icon={<Printer size={14} />} onClick={() => navigate(`/trips/${trip.id}`)} />
                        <ActionButton title="Chi phí" icon={<Receipt size={14} />} onClick={() => navigate(`/trips/${trip.id}/expenses`)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TripStatusBadge({ status }: { status?: string | null }) {
  const className = status === 'ARRIVED'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-blue-200 bg-blue-50 text-blue-700';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${className}`}>{tripStatusLabel(status)}</span>;
}

function ActionButton({ icon, title, onClick }: { icon: ReactNode; title: string; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:bg-muted hover:text-primary">{icon}</button>;
}

function StateBlock({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-muted-foreground"><div className="text-primary">{icon}</div><p className="text-[13px] font-bold">{title}</p></div>;
}

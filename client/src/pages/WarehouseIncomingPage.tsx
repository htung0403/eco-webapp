import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, Truck as TruckIcon } from 'lucide-react';
import { ApiError, apiRequest } from '../lib/api';
import { getStoredAuthUser } from '../lib/authUser';
import type { AuthUserProfile } from './login/types';
import type { IncomingHub, IncomingManifest, IncomingTrip, IncomingTripListResponse } from './warehouse/incoming/types';
import { isArrivedTripStatus } from './warehouse/manifests/manifestHubUtils';

const POLLING_INTERVAL_MS = 30_000;
const MANAGER_ROLES = 32 | 64;

type OriginLane = 'HAN' | 'HCM';

const normalizeList = (response: IncomingTripListResponse | IncomingTrip[]) => Array.isArray(response) ? response : response.data || response.items || response.trips || [];
const normalizeNumber = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};
const formatNumber = (value?: number | string | null, digits = 1) => normalizeNumber(value).toLocaleString('vi-VN', { maximumFractionDigits: digits });
const formatTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value)) : '—';
const formatUpdatedAt = (date: Date | null) => date ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date) : '—';
const formatHub = (hub?: IncomingHub | null, fallback?: string | number | null) => hub?.code || hub?.name || (fallback ? `Hub #${fallback}` : '—');
const getManifest = (trip: IncomingTrip): IncomingManifest | null => trip.manifest || null;
const getArrivalTime = (trip: IncomingTrip) => trip.arrival_time || trip.expected_arrival_time || trip.estimated_arrival_time || null;
const getManifestCode = (trip: IncomingTrip) => trip.manifest_code || getManifest(trip)?.manifest_code || trip.manifest?.manifest_code || 'Chưa có BK';
const getWaybillCount = (trip: IncomingTrip) => trip.waybill_count ?? trip.total_waybills ?? getManifest(trip)?.waybill_count ?? getManifest(trip)?.total_waybills ?? 0;
const getTotalWeight = (trip: IncomingTrip) => trip.planned_total_weight ?? trip.total_weight ?? getManifest(trip)?.total_weight ?? 0;
const getOriginHub = (trip: IncomingTrip) => formatHub(trip.origin_hub || trip.start_hub || getManifest(trip)?.origin_hub, trip.origin_hub_id || trip.start_hub_id || getManifest(trip)?.origin_hub_id);
const getDestinationHub = (trip: IncomingTrip) => formatHub(trip.end_hub || trip.dest_hub || getManifest(trip)?.dest_hub, trip.end_hub_id || getManifest(trip)?.dest_hub_id);
const getRouteLabel = (trip: IncomingTrip) => `${getOriginHub(trip)} → ${getDestinationHub(trip)}`;
const getPlateLabel = (trip: IncomingTrip) => trip.license_plate?.trim() || `Chuyến #${trip.id}`;

const normalizeHubCode = (hub?: IncomingHub | null): OriginLane | null => {
  const code = hub?.code?.trim().toUpperCase();
  if (code === 'HAN' || code === 'HCM') return code;
  const name = hub?.name?.trim().toUpperCase() || '';
  if (/HÀ NỘI|HA NOI|HAN/.test(name)) return 'HAN';
  if (/HỒ CHÍ MINH|HO CHI MINH|TP\.?HCM|HCM/.test(name)) return 'HCM';
  return null;
};

const getOriginLane = (trip: IncomingTrip): OriginLane | null => (
  normalizeHubCode(trip.start_hub || trip.origin_hub || getManifest(trip)?.origin_hub)
);

const isArrivedTrip = (trip: IncomingTrip) => isArrivedTripStatus(trip.status);

const formatArrivedSubline = (trip: IncomingTrip) => {
  const arrivedAt = getArrivalTime(trip);
  const parts = [
    getPlateLabel(trip),
    `${getWaybillCount(trip).toLocaleString('vi-VN')} đơn`,
    `${formatNumber(getTotalWeight(trip))} kg`,
    arrivedAt ? `Đã đến ${formatTime(arrivedAt)}` : 'Đã đến bưu cục',
  ].filter(Boolean);
  return parts.join(' · ');
};

const sortArrivedTrips = (trips: IncomingTrip[]) => [...trips].sort((left, right) => {
  const leftTime = new Date(getArrivalTime(left) || left.departure_time || 0).getTime();
  const rightTime = new Date(getArrivalTime(right) || right.departure_time || 0).getTime();
  return rightTime - leftTime;
});

export default function WarehouseIncomingPage() {
  const user = useMemo(getStoredAuthUser, []);
  const hubId = user?.hub_id;
  const isManagerPlus = Boolean(user && (user.role_mask & MANAGER_ROLES) !== 0);
  const [trips, setTrips] = useState<IncomingTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchIncomingTrips = useCallback(async (showLoading = false) => {
    if (!hubId && !isManagerPlus) {
      setTrips([]);
      setError('Tài khoản chưa được gán bưu cục để xem chuyến xe.');
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (hubId) query.set('end_hub_id', String(hubId));
      const response = await apiRequest<IncomingTripListResponse | IncomingTrip[]>(`/trips/expected-arrivals?${query.toString()}`);
      setTrips(normalizeList(response));
      setUpdatedAt(new Date());
    } catch (err) {
      setTrips([]);
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách chuyến xe.');
    } finally {
      setIsLoading(false);
    }
  }, [hubId, isManagerPlus]);

  useEffect(() => {
    void fetchIncomingTrips(true);
    const intervalId = window.setInterval(() => void fetchIncomingTrips(false), POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchIncomingTrips]);

  const { arrivedFromHan, arrivedFromHcm } = useMemo(() => {
    const arrived = trips.filter((trip) => isArrivedTrip(trip));
    return {
      arrivedFromHan: sortArrivedTrips(arrived.filter((trip) => getOriginLane(trip) === 'HAN')),
      arrivedFromHcm: sortArrivedTrips(arrived.filter((trip) => getOriginLane(trip) === 'HCM')),
    };
  }, [trips]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 flex items-center gap-2 shrink-0">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="border-b border-border bg-card p-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="h-9 w-9 shrink-0 rounded-lg border border-border bg-muted/10 text-muted-foreground hover:bg-muted flex items-center justify-center md:w-auto md:px-3 md:gap-2"
            >
              <ArrowLeft size={15} />
              <span className="hidden md:inline text-[13px] font-medium">Quay lại</span>
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
                <TruckIcon size={17} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-extrabold text-foreground md:text-[17px]">Hàng đã tới bưu cục</h1>
                <p className="hidden text-[12px] font-medium text-muted-foreground md:block">Xe đã đến, tách theo bưu cục xuất phát Hà Nội và TP.HCM.</p>
              </div>
            </div>
            <div className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 text-[11px] font-bold text-muted-foreground">
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-primary' : 'text-primary'} />
              <span>{formatUpdatedAt(updatedAt)}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <StateBlock icon={<Loader2 className="animate-spin" size={22} />} title="Đang tải danh sách xe" />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-3 md:p-4">
            <div className="grid min-h-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <TripSection
                title="Đã đến từ Hà Nội"
                count={arrivedFromHan.length}
                tone="border-blue-200 bg-blue-50 text-blue-700"
                emptyText="Chưa có xe đã đến từ Hà Nội."
                trips={arrivedFromHan}
                renderSubline={formatArrivedSubline}
              />
              <TripSection
                title="Đã đến từ TP.HCM"
                count={arrivedFromHcm.length}
                tone="border-orange-200 bg-orange-50 text-orange-700"
                emptyText="Chưa có xe đã đến từ TP.HCM."
                trips={arrivedFromHcm}
                renderSubline={formatArrivedSubline}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TripSection({
  title,
  count,
  tone,
  emptyText,
  trips,
  renderSubline,
}: {
  title: string;
  count: number;
  tone: string;
  emptyText: string;
  trips: IncomingTrip[];
  renderSubline: (trip: IncomingTrip) => string;
}) {
  return (
    <section className="flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 shrink-0">
        <h2 className="text-[13px] font-extrabold text-foreground">{title}</h2>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-extrabold ${tone}`}>{count}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {trips.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center px-4 py-8 text-center text-[12px] font-medium text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20">
                  <td className="px-3 py-2 align-middle">
                    <p className="truncate text-[13px] font-extrabold text-foreground">
                      {getManifestCode(trip)} · {getRouteLabel(trip)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                      {renderSubline(trip)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function StateBlock({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-1 min-h-[320px] items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/20 text-primary">
          {icon}
        </div>
        <h2 className="text-[14px] font-extrabold text-foreground">{title}</h2>
      </div>
    </div>
  );
}

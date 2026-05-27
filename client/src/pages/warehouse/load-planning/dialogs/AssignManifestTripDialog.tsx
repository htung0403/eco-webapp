import { Loader2, Route, X } from 'lucide-react';
import type { AssignTripFormState, LoadPlanningManifest, TripSummary } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isSubmitting: boolean;
  manifest: LoadPlanningManifest | null;
  trips: TripSummary[];
  formState: AssignTripFormState;
  onChange: (tripId: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const manifestCode = (manifest?: LoadPlanningManifest | null) => manifest?.manifest_code || manifest?.code || (manifest ? `MF-${manifest.id}` : '—');
const tripLabel = (trip: TripSummary) => trip.trip_code || trip.code || `Chuyến #${trip.id}`;
const hubName = (hub?: { code?: string | null; name?: string | null } | null, id?: string | number | null) => hub?.code || hub?.name || (id ? `Hub #${id}` : '—');

export default function AssignManifestTripDialog({ isOpen, isClosing, isSubmitting, manifest, trips, formState, onChange, onClose, onSubmit }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 backdrop-blur-sm p-0 md:items-center md:p-4">
      <div className={`w-full max-w-lg overflow-hidden rounded-t-[28px] border border-border bg-white shadow-2xl md:rounded-2xl ${isClosing ? 'animate-out fade-out slide-out-to-bottom-3 duration-200' : 'animate-in fade-in slide-in-from-bottom-3 duration-200'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Gán chuyến xe</p><h2 className="text-lg font-extrabold text-foreground">{manifestCode(manifest)}</h2></div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="relative">
            <Route size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select value={formState.trip_id} onChange={event => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-[13px] font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/10">
              <option value="">Chọn chuyến xe khả dụng</option>
              {trips.map(trip => <option key={trip.id} value={String(trip.id)}>{tripLabel(trip)} · {hubName(trip.start_hub, trip.start_hub_id)} → {hubName(trip.end_hub, trip.end_hub_id)} · {trip.status || '—'}</option>)}
            </select>
          </div>
          <p className="text-[12px] font-medium text-muted-foreground">Chỉ chọn chuyến phù hợp hub đi/đến và trạng thái vận hành. Nếu backend chưa hỗ trợ, hệ thống sẽ hiển thị lỗi từ API.</p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/10 p-4">
          <button onClick={onClose} className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">Hủy</button>
          <button disabled={!formState.trip_id || isSubmitting} onClick={onSubmit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 size={16} className="animate-spin" />}Gán chuyến</button>
        </div>
      </div>
    </div>
  );
}

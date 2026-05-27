import { Loader2, Route, X } from 'lucide-react';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
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
  const tripOptions = trips.map(trip => ({ value: String(trip.id), label: `${tripLabel(trip)} · ${hubName(trip.start_hub, trip.start_hub_id)} → ${hubName(trip.end_hub, trip.end_hub_id)} · ${trip.status || '—'}` }));

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out" onClick={onClose} />
      <div className={`relative w-full max-w-[560px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border ${isClosing ? 'dialog-slide-out' : 'dialog-slide-in'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Gán chuyến xe</p><h2 className="text-lg font-extrabold text-foreground">{manifestCode(manifest)}</h2></div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="relative">
            <Route size={16} className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
            <SearchableSelect value={formState.trip_id} onValueChange={onChange} options={tripOptions} placeholder="Chọn chuyến xe khả dụng" searchPlaceholder="Tìm chuyến xe..." className="h-11 bg-white pl-10 font-bold text-foreground" />
          </div>
          <p className="text-[12px] font-medium text-muted-foreground">Chỉ chọn chuyến phù hợp hub đi/đến và trạng thái vận hành. Nếu backend chưa hỗ trợ, hệ thống sẽ hiển thị lỗi từ API.</p>
        </div>
        <div className="mt-auto flex items-center justify-end gap-2 border-t border-border bg-muted/10 p-4">
          <button onClick={onClose} className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">Hủy</button>
          <button disabled={!formState.trip_id || isSubmitting} onClick={onSubmit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 size={16} className="animate-spin" />}Gán chuyến</button>
        </div>
      </div>
    </div>
  );
}

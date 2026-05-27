import { Package, X } from 'lucide-react';
import type { ManifestDetail } from '../types';

const value = (input: unknown) => input === null || input === undefined || input === '' ? '—' : String(input);

interface Props { manifest: ManifestDetail | null; onClose: () => void; }

export default function TripManifestDetailDialog({ manifest, onClose }: Props) {
  if (!manifest) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Package size={20} /></span><div><h2 className="text-[16px] font-extrabold text-foreground">Bảng kê {value(manifest.manifest_code || manifest.id)}</h2><p className="text-[13px] text-muted-foreground">Thông tin bảng kê liên quan chuyến xe.</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="grid gap-2 p-5 text-[13px]">
          <Line label="manifest_id" value={value(manifest.id)} />
          <Line label="manifest_code" value={value(manifest.manifest_code)} />
          <Line label="seal_code" value={value(manifest.seal_code)} />
          <Line label="origin_hub_id" value={value(manifest.origin_hub_id)} />
          <Line label="dest_hub_id" value={value(manifest.dest_hub_id)} />
          <Line label="status" value={value(manifest.status)} />
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/5 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="font-bold text-foreground">{value}</span></div>; }

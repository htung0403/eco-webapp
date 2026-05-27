import { Package, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TripProfitRow } from '../types';

const getRenderableEntries = (source: Record<string, unknown>) => Object.entries(source).filter(([key, value]) => !['password_hash', 'refresh_token'].includes(key) && (value == null || ['string', 'number', 'boolean'].includes(typeof value)));

export default function TripProfitDetailDialog({ row, onClose }: { row: TripProfitRow | null; onClose: () => void }) {
  if (!row) return null;
  const entries = getRenderableEntries(row.source);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 md:items-center md:p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-white shadow-2xl md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-primary">Chi tiết breakdown</p>
            <h2 className="text-[18px] font-extrabold text-foreground">{row.label}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 custom-scrollbar">
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => <Info key={key} label={key} value={String(value ?? '—')} />)}
          </div>
          {!entries.length && <StateBlock icon={<Package size={24} />} title="Không có field hiển thị" description="Breakdown không có field dạng string/number/boolean để render." />}
        </div>
        <div className="border-t border-border p-4">
          <button onClick={onClose} className="h-11 w-full rounded-xl bg-primary text-[14px] font-extrabold text-white">Đóng</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border border-border bg-white p-2"><div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 font-bold text-foreground">{value}</div></div>;
}

function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground"><div className="mb-3 text-primary">{icon}</div><h3 className="text-[14px] font-bold text-foreground">{title}</h3><p className="mt-1 text-[13px] max-w-md">{description}</p></div>;
}

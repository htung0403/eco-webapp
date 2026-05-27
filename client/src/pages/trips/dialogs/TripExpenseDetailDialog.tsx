import { FileText, X } from 'lucide-react';
import type { Trip, TripApprovalStatus, TripExpense } from '../types';

const value = (input: unknown) => input === null || input === undefined || input === '' ? '—' : String(input);
const isRenderable = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value) || value == null;

interface Props {
  trip: Trip | null;
  expense: TripExpense | null;
  internalApproval: TripApprovalStatus | null;
  vendorApproval: TripApprovalStatus | null;
  onClose: () => void;
}

export default function TripExpenseDetailDialog({ trip, expense, internalApproval, vendorApproval, onClose }: Props) {
  if (!trip && !expense) return null;
  const extendedEntries = expense ? Object.entries(expense).filter(([key, entryValue]) => !['id', 'trip_id'].includes(key) && isRenderable(entryValue)) : [];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary"><FileText size={20} /></span><div><h2 className="text-[16px] font-extrabold text-foreground">Chi phí chuyến {value(expense?.trip_id || trip?.id)}</h2><p className="text-[13px] text-muted-foreground">Chỉ hiển thị field API trả về.</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="grid gap-2 p-5 text-[13px] md:grid-cols-2">
          {expense && <><Line label="id" value={value(expense.id)} /><Line label="trip_id" value={value(expense.trip_id)} /></>}
          {trip && <><Line label="fuel_actual" value={value(trip.fuel_actual)} /><Line label="fuel_cost" value={value(trip.fuel_cost)} /><Line label="other_costs" value={value(trip.other_costs)} /><Line label="status" value={value(trip.status)} /></>}
          <Line label="internal_approval" value={value(internalApproval?.status)} />
          <Line label="vendor_approval" value={value(vendorApproval?.status)} />
          {extendedEntries.map(([key, entryValue]) => <Line key={key} label={key} value={value(entryValue)} />)}
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/5 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }

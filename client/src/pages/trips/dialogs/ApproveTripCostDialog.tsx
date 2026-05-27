import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { Trip, TripCostApprovalType } from '../types';

interface Props {
  trip: Trip | null;
  approvalType: TripCostApprovalType | null;
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const labels: Record<TripCostApprovalType, string> = {
  internal: 'phê duyệt chi phí xe nội bộ',
  vendor: 'phê duyệt chi phí NCC',
};

export default function ApproveTripCostDialog({ trip, approvalType, isSubmitting, error, onClose, onConfirm }: Props) {
  if (!trip || !approvalType) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={20} /></div>
          <div>
            <h2 className="text-[16px] font-extrabold text-foreground">Xác nhận {labels[approvalType]}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Thao tác gọi API PATCH /finance/approve/{approvalType}/{trip.id}.</p>
          </div>
        </div>
        {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800"><AlertTriangle size={15} />{error}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} disabled={isSubmitting} className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-60"><XCircle size={15} className="inline mr-1" />Đóng</button>
          <button onClick={onConfirm} disabled={isSubmitting} className="h-10 rounded-xl bg-primary px-4 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Phê duyệt'}</button>
        </div>
      </div>
    </div>
  );
}

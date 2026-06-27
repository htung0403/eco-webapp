import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import type { IncomingTrip } from '../types';
import { getManifestCode, getPlateLabel } from '../incomingTripUtils';

export function IncomingTripDeleteDialog({
  trip,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: {
  trip: IncomingTrip | null;
  isSubmitting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-red-600">Xóa bảng kê</p>
            <h2 className="text-[15px] font-black text-foreground">{getManifestCode(trip)}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-4 text-[13px]">
          <p className="font-medium text-foreground">
            Xác nhận xóa bảng kê của xe <span className="font-extrabold">{getPlateLabel(trip)}</span>?
          </p>
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
            Chỉ xóa được bảng kê ở trạng thái nháp. Bảng kê đã đóng đi không thể xóa.
          </p>
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="h-9 rounded-lg border border-border px-3 text-[12px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-50">
            Hủy
          </button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting} className="inline-flex h-9 items-center gap-1 rounded-lg bg-red-600 px-3 text-[12px] font-extrabold text-white disabled:opacity-50">
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

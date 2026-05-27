import { CheckCircle2, Loader2, Plus, Route, X } from 'lucide-react';
import type { Trip } from '../types';

interface Props {
  isOpen: boolean;
  trip: Trip | null;
  isLoadingDetail: boolean;
  onDetail: () => void;
  onList: () => void;
  onCreateAnother: () => void;
  onClose: () => void;
}

export default function CreateTripSuccessDialog({ isOpen, trip, isLoadingDetail, onDetail, onList, onCreateAnother, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-border bg-emerald-50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm"><CheckCircle2 size={20} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-foreground">Tạo chuyến xe thành công</h2>
            <p className="mt-1 text-[13px] font-medium text-muted-foreground">Chuyến xe {trip?.id ? `#${trip.id}` : 'mới'} đã được ghi nhận từ API.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-5 py-4 text-[13px] font-medium text-muted-foreground">
          <div className="rounded-xl border border-border bg-muted/10 p-3">
            <Route className="mr-2 inline text-primary" size={16} />
            {isLoadingDetail ? <><Loader2 className="mr-2 inline animate-spin" size={15} />Đang lấy chi tiết chuyến vừa tạo...</> : 'Bạn có thể xem chi tiết, quay về danh sách hoặc tạo thêm chuyến khác.'}
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onCreateAnother} className="rounded-lg border border-border bg-white px-4 py-2 text-[13px] font-bold text-foreground hover:bg-muted"><Plus className="mr-1.5 inline" size={15} />Tạo chuyến khác</button>
          <button onClick={onList} className="rounded-lg border border-primary/30 bg-blue-50 px-4 py-2 text-[13px] font-bold text-primary hover:bg-blue-100">Quay về danh sách chuyến xe</button>
          <button disabled={!trip?.id} onClick={onDetail} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60">Xem chi tiết chuyến</button>
        </div>
      </div>
    </div>
  );
}

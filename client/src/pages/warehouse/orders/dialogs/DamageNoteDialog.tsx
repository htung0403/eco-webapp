import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  note: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

export default function DamageNoteDialog({ isOpen, isClosing, note, onChange, onClose }: Props) {
  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className={`w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${isClosing ? 'animate-out fade-out slide-out-to-bottom-4 duration-200' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">Ghi chú sai lệch/hư hỏng</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">Ghi rõ tình trạng kiện hàng để lưu cùng biên nhận kho.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <label className="text-[13px] font-bold text-foreground" htmlFor="damage-note">Nội dung ghi chú</label>
          <textarea id="damage-note" value={note} onChange={(event) => onChange(event.target.value)} rows={6} className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[13px] font-medium outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Ví dụ: thiếu 1 kiện, thùng móp góc, cân thực tế lệch so với khai báo..." />
        </div>
        <div className="border-t border-border p-5">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-primary/20 transition-all hover:brightness-105">Lưu ghi chú</button>
        </div>
      </div>
    </div>
  );
}

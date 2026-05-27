import type { ReactNode } from 'react';
import { Loader2, PackagePlus, X } from 'lucide-react';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';
import type { HubSummary, ManifestFormState } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isEditMode: boolean;
  isSubmitting: boolean;
  formState: ManifestFormState;
  hubs: HubSummary[];
  onChange: <K extends keyof ManifestFormState>(key: K, value: ManifestFormState[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const hubLabel = (hub: HubSummary) => hub.code ? `${hub.code} · ${hub.name || 'Bưu cục'}` : hub.name || `Hub #${hub.id}`;

export default function AddEditManifestDialog({ isOpen, isClosing, isEditMode, isSubmitting, formState, hubs, onChange, onClose, onSubmit }: Props) {
  if (!isOpen) return null;
  const hubOptions = hubs.map(hub => ({ value: String(hub.id), label: hubLabel(hub) }));

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out" onClick={onClose} />
      <div className={`relative w-full max-w-[680px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border ${isClosing ? 'dialog-slide-out' : 'dialog-slide-in'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-primary">{isEditMode ? 'Cập nhật bảng kê' : 'Tạo bảng kê'}</p><h2 className="text-lg font-extrabold text-foreground">Thông tin bảng kê</h2></div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Bưu cục đi"><SearchableSelect disabled={isEditMode} value={formState.origin_hub_id} onValueChange={value => onChange('origin_hub_id', value)} options={hubOptions} placeholder="Chọn bưu cục đi" searchPlaceholder="Tìm bưu cục đi..." className="h-11 bg-white font-bold text-foreground" /></Field>
          <Field label="Bưu cục đến"><SearchableSelect value={formState.dest_hub_id} onValueChange={value => onChange('dest_hub_id', value)} options={hubOptions} placeholder="Chọn bưu cục đến" searchPlaceholder="Tìm bưu cục đến..." className="h-11 bg-white font-bold text-foreground" /></Field>
          <Field label="Seal"><input value={formState.seal_code} onChange={event => onChange('seal_code', event.target.value)} placeholder="SEAL001" className="h-11 w-full rounded-xl border border-border px-3 text-[13px] font-bold outline-none" /></Field>
          <Field label="Ghi chú"><input value={formState.note} onChange={event => onChange('note', event.target.value)} placeholder="Ghi chú bảng kê" className="h-11 w-full rounded-xl border border-border px-3 text-[13px] font-bold outline-none" /></Field>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/10 p-4">
          <button onClick={onClose} className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-muted-foreground hover:bg-muted">Hủy</button>
          <button disabled={!formState.origin_hub_id || !formState.dest_hub_id || isSubmitting} onClick={onSubmit} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-white disabled:opacity-60">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />}{isEditMode ? 'Lưu' : 'Tạo'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="space-y-2"><span className="text-[12px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>; }

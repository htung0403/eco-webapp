import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { FilterOption, ReconciliationFormState, RemittanceStatus } from '../types';

interface Props {
  isOpen: boolean;
  isEditMode: boolean;
  isSubmitting: boolean;
  error: string;
  formState: ReconciliationFormState;
  hubs: FilterOption[];
  onClose: () => void;
  onSubmit: () => void;
  setFormField: <K extends keyof ReconciliationFormState>(key: K, value: ReconciliationFormState[K]) => void;
}

const statuses: RemittanceStatus[] = ['PENDING', 'REMITTED', 'OVERDUE'];

export default function AddEditReconciliationDialog({ isOpen, isEditMode, isSubmitting, error, formState, hubs, onClose, onSubmit, setFormField }: Props) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button type="button" aria-label="Đóng" className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Đối soát bưu cục</p>
            <h2 className="text-lg font-black text-foreground">{isEditMode ? 'Cập nhật phiên đối soát' : 'Tạo phiên đối soát'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600"><AlertTriangle size={15} />{error}</div>}
          <Field label="Bưu cục/kho">
            <select value={formState.hub_id} onChange={event => setFormField('hub_id', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary">
              <option value="">Chọn bưu cục/kho</option>
              {hubs.map(hub => <option key={hub.value} value={hub.value}>{hub.label}</option>)}
            </select>
          </Field>
          <Field label="Ngày đối soát">
            <input type="date" value={formState.reconciliation_date} onChange={event => setFormField('reconciliation_date', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary" />
          </Field>
          <Field label="Tiền COD giữ">
            <input type="number" min="0" value={formState.cod_cash_held} onChange={event => setFormField('cod_cash_held', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary" />
          </Field>
          <Field label="Tiền CC giữ">
            <input type="number" min="0" value={formState.cc_cash_held} onChange={event => setFormField('cc_cash_held', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary" />
          </Field>
          <Field label="Tổng đã nộp">
            <input type="number" min="0" value={formState.total_remitted} onChange={event => setFormField('total_remitted', event.target.value)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary" />
          </Field>
          <Field label="Trạng thái nộp tiền">
            <select value={formState.remittance_status} onChange={event => setFormField('remittance_status', event.target.value as RemittanceStatus)} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:border-primary">
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-card p-5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-muted-foreground hover:bg-muted disabled:opacity-60">Đóng</button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex min-w-28 items-center justify-center rounded-xl bg-primary px-5 py-2 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60">{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : isEditMode ? 'Lưu thay đổi' : 'Tạo phiên'}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}

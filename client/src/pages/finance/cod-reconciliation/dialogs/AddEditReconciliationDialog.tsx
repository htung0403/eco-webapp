import { createPortal } from 'react-dom';
import { Building2, CalendarDays, DollarSign, X } from 'lucide-react';
import { clsx } from 'clsx';
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

const statusOptions: RemittanceStatus[] = ['PENDING', 'REMITTED', 'OVERDUE'];

export default function AddEditReconciliationDialog({ isOpen, isEditMode, isSubmitting, error, formState, hubs, onClose, onSubmit, setFormField }: Props) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative flex h-screen w-full max-w-[680px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl dialog-slide-in">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Phiên đối soát COD</p><h2 className="text-lg font-black text-foreground">{isEditMode ? 'Cập nhật số liệu' : 'Tạo phiên đối soát'}</h2></div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {error && <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">{error}</div>}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-muted/5 px-5 py-3"><Building2 size={16} className="text-primary"/><span className="text-[12px] font-bold uppercase tracking-wider text-primary">Thông tin đối soát</span></div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="Bưu cục" icon={<Building2 size={15}/> }><select disabled={isEditMode} value={formState.hub_id} onChange={e => setFormField('hub_id', e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none disabled:opacity-60"><option value="">Chọn bưu cục</option>{hubs.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}</select></Field>
              <Field label="Ngày đối soát" icon={<CalendarDays size={15}/> }><input disabled={isEditMode} type="date" value={formState.reconciliation_date} onChange={e => setFormField('reconciliation_date', e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none disabled:opacity-60"/></Field>
              <MoneyField label="Tiền COD giữ" value={formState.cod_cash_held} onChange={v => setFormField('cod_cash_held', v)} />
              <MoneyField label="Tiền CC giữ" value={formState.cc_cash_held} onChange={v => setFormField('cc_cash_held', v)} />
              <MoneyField label="Tổng đã nộp" value={formState.total_remitted} onChange={v => setFormField('total_remitted', v)} />
              <Field label="Trạng thái" icon={<DollarSign size={15}/> }><select value={formState.remittance_status} onChange={e => setFormField('remittance_status', e.target.value as RemittanceStatus)} className="h-10 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none">{statusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-card p-5"><button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold text-muted-foreground hover:bg-muted">Đóng</button><button disabled={isSubmitting} onClick={onSubmit} className="rounded-xl bg-primary px-5 py-2 text-[13px] font-bold text-white shadow-sm shadow-primary/20 disabled:opacity-60">{isSubmitting ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo phiên'}</button></div>
      </div>
    </div>, document.body);
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="space-y-1.5"><label className="flex items-center gap-2 text-[13px] font-bold text-foreground">{icon}{label}</label>{children}</div>; }
function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label} icon={<DollarSign size={15}/> }><input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} className={clsx('h-10 w-full rounded-xl border border-border bg-card px-3 text-[13px] outline-none focus:ring-2 focus:ring-primary/10')} /></Field>; }

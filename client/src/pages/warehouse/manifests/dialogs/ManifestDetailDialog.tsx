import type { ReactNode } from 'react';
import { Loader2, Package, Trash2, X } from 'lucide-react';
import type { BadgeConfig, LoadPlanningManifest, ManifestWaybill } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  manifest: LoadPlanningManifest | null;
  statusConfig: Record<string, BadgeConfig>;
  canManage: boolean;
  onClose: () => void;
  onRemoveWaybill: (waybill: ManifestWaybill) => void;
}

const display = (value?: string | number | null, fallback = '—') => value == null || value === '' ? fallback : String(value);
const num = (value?: string | number | null, suffix = '') => value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')}${suffix}`;
const code = (manifest: LoadPlanningManifest) => manifest.manifest_code || manifest.code || `MF-${manifest.id}`;
const badge = (status?: string | null, config?: BadgeConfig) => <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-bold ${config?.className || 'bg-slate-100 text-slate-600'}`}>{config?.label || status || '—'}</span>;
const extractWaybills = (manifest: LoadPlanningManifest | null): ManifestWaybill[] => manifest?.waybills?.length ? manifest.waybills : (manifest?.manifest_waybills || []).map((link) => link.waybill).filter(Boolean) as ManifestWaybill[];

export default function ManifestDetailDialog({ isOpen, isClosing, isLoading, manifest, statusConfig, canManage, onClose, onRemoveWaybill }: Props) {
  if (!isOpen) return null;
  const waybills = extractWaybills(manifest);

  return <div className="fixed inset-0 z-[9999] flex justify-end">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out" onClick={onClose} />
    <div className={`relative flex h-screen w-full max-w-[920px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl ${isClosing ? 'dialog-slide-out' : 'dialog-slide-in'}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-primary">Chi tiết bảng kê</p><h2 className="truncate text-lg font-extrabold text-foreground">{manifest ? code(manifest) : 'Đang tải'}</h2></div>
        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><X size={18} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4 custom-scrollbar">
        {isLoading ? <State label="Đang tải chi tiết bảng kê..." /> : !manifest ? <State label="Không tìm thấy bảng kê." /> : <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Info label="Trạng thái" value={badge(manifest.status, statusConfig[String(manifest.status || '')])} />
            <Info label="Hub đi" value={display(manifest.origin_hub?.code || manifest.origin_hub?.name || manifest.origin_hub_id)} />
            <Info label="Hub đến" value={display(manifest.dest_hub?.code || manifest.dest_hub?.name || manifest.dest_hub_id)} />
            <Info label="Seal" value={display(manifest.seal_code)} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-3"><Package size={16} className="text-primary" /><span className="text-[12px] font-bold uppercase tracking-wider text-primary">Vận đơn trong bảng kê</span></div>
            <div className="overflow-auto custom-scrollbar">
              <table className="hidden w-full min-w-[980px] border-collapse text-left md:table">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Mã vận đơn', 'Người gửi', 'Người nhận', 'TL', 'Kích thước', 'TL quy đổi', 'Thanh toán', 'Hub đi', 'Hub đến', 'Thao tác'].map((header) => <th key={header} className="border-r border-border px-4 py-3 font-bold last:border-r-0">{header}</th>)}</tr></thead>
                <tbody>{waybills.map((waybill) => <tr key={waybill.id} className="border-b border-border last:border-b-0"><td className="border-r border-border px-4 py-3 text-[13px] font-extrabold text-primary">{display(waybill.waybill_code)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.sender_info)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.receiver_info)}</td><td className="border-r border-border px-4 py-3 text-[13px] font-bold">{num(waybill.weight, ' kg')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{[waybill.length, waybill.width, waybill.height].map((value) => display(value, '0')).join(' × ')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{num(waybill.volumetric_weight, ' kg')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.payment_type)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.origin_hub_id)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.dest_hub_id)}</td><td className="px-4 py-3">{canManage && <button onClick={() => onRemoveWaybill(waybill)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>}</td></tr>)}</tbody>
              </table>
              <div className="grid gap-3 p-3 md:hidden">{waybills.map((waybill) => <article key={waybill.id} className="rounded-xl border border-border p-3 text-[13px]"><Line label="Mã" value={display(waybill.waybill_code)} /><Line label="Người gửi" value={display(waybill.sender_info)} /><Line label="Người nhận" value={display(waybill.receiver_info)} /><Line label="TL" value={num(waybill.weight, ' kg')} /></article>)}</div>
              {!waybills.length && <State label="Bảng kê chưa có vận đơn." />}
            </div>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}

function State({ label }: { label: string }) { return <div className="flex min-h-[220px] items-center justify-center text-[13px] font-bold text-muted-foreground">{label.includes('Đang') && <Loader2 className="mr-2 animate-spin" size={16} />}{label}</div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-2xl border border-border bg-muted/10 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="mt-2 text-[13px] font-extrabold text-foreground">{value}</div></div>; }
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }

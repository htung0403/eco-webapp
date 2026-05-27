import type { ReactNode } from 'react';
import { Loader2, Package, X } from 'lucide-react';
import type { BadgeConfig, LoadPlanningManifest } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  manifest: LoadPlanningManifest | null;
  statusConfig: Record<string, BadgeConfig>;
  canViewCost: boolean;
  onClose: () => void;
}

const display = (value?: string | number | null, fallback = '—') => value == null || value === '' ? fallback : String(value);
const numberDisplay = (value?: string | number | null, suffix = '') => value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')}${suffix}`;
const manifestCode = (manifest: LoadPlanningManifest) => manifest.manifest_code || manifest.code || `MF-${manifest.id}`;
const badge = (status?: string | null, config?: BadgeConfig) => <span className={`inline-flex h-7 items-center rounded-full px-3 text-[12px] font-bold ${config?.className || 'bg-slate-100 text-slate-600'}`}>{config?.label || status || '—'}</span>;

export default function LoadPlanningDetailDialog({ isOpen, isClosing, isLoading, manifest, statusConfig, canViewCost, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 backdrop-blur-sm p-0 md:items-center md:p-4">
      <div className={`flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-white shadow-2xl md:rounded-2xl ${isClosing ? 'animate-out fade-out slide-out-to-bottom-3 duration-200' : 'animate-in fade-in slide-in-from-bottom-3 duration-200'}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Chi tiết bảng kê</p>
            <h2 className="truncate text-lg font-extrabold text-foreground">{manifest ? manifestCode(manifest) : 'Đang tải'}</h2>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 custom-scrollbar">
          {isLoading ? <State label="Đang tải chi tiết bảng kê..." /> : !manifest ? <State label="Không tìm thấy bảng kê." /> : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Info label="Trạng thái" value={badge(manifest.status, statusConfig[String(manifest.status || '')])} />
                <Info label="Hub đi" value={display(manifest.origin_hub?.code || manifest.origin_hub?.name || manifest.origin_hub_id)} />
                <Info label="Hub đến" value={display(manifest.dest_hub?.code || manifest.dest_hub?.name || manifest.dest_hub_id)} />
                <Info label="Seal" value={display(manifest.seal_code)} />
              </div>

              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-3"><Package size={16} className="text-primary" /><span className="text-[12px] font-bold uppercase tracking-wider text-primary">Vận đơn trong bảng kê</span></div>
                <div className="overflow-auto custom-scrollbar">
                  <table className="hidden w-full min-w-[980px] border-collapse text-left md:table">
                    <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600"><tr>{['Mã vận đơn','Người gửi','Người nhận','TL','Kích thước','TL quy đổi','Thanh toán', ...(canViewCost ? ['Cước phí'] : []), 'Hub đi','Hub đến'].map(header => <th key={header} className="border-r border-border px-4 py-3 font-bold last:border-r-0">{header}</th>)}</tr></thead>
                    <tbody>{(manifest.waybills || []).map(waybill => <tr key={waybill.id} className="border-b border-border last:border-b-0"><td className="border-r border-border px-4 py-3 text-[13px] font-extrabold text-primary">{display(waybill.waybill_code)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.sender_info)}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.receiver_info)}</td><td className="border-r border-border px-4 py-3 text-[13px] font-bold">{numberDisplay(waybill.weight, ' kg')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{[waybill.length, waybill.width, waybill.height].map(v => display(v, '0')).join(' × ')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{numberDisplay(waybill.volumetric_weight, ' kg')}</td><td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.payment_type)}</td>{canViewCost && <td className="border-r border-border px-4 py-3 text-[13px] font-bold">{numberDisplay(waybill.cost_amount, ' đ')}</td>}<td className="border-r border-border px-4 py-3 text-[13px]">{display(waybill.origin_hub_id)}</td><td className="px-4 py-3 text-[13px]">{display(waybill.dest_hub_id)}</td></tr>)}</tbody>
                  </table>
                  <div className="grid gap-3 p-3 md:hidden">{(manifest.waybills || []).map(waybill => <article key={waybill.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm"><div className="font-extrabold text-primary">{display(waybill.waybill_code)}</div><div className="mt-3 grid gap-2 text-[13px]"><Line label="Người gửi" value={display(waybill.sender_info)} /><Line label="Người nhận" value={display(waybill.receiver_info)} /><Line label="Trọng lượng" value={numberDisplay(waybill.weight, ' kg')} /><Line label="Kích thước" value={[waybill.length, waybill.width, waybill.height].map(v => display(v, '0')).join(' × ')} /><Line label="TL quy đổi" value={numberDisplay(waybill.volumetric_weight, ' kg')} /><Line label="Thanh toán" value={display(waybill.payment_type)} />{canViewCost && <Line label="Cước phí" value={numberDisplay(waybill.cost_amount, ' đ')} />}<Line label="Hub đi" value={display(waybill.origin_hub_id)} /><Line label="Hub đến" value={display(waybill.dest_hub_id)} /></div></article>)}</div>
                  {!(manifest.waybills || []).length && <div className="flex min-h-[220px] items-center justify-center text-[13px] font-medium text-muted-foreground">Bảng kê chưa có dữ liệu vận đơn.</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function State({ label }: { label: string }) { return <div className="flex min-h-[360px] items-center justify-center gap-2 text-[13px] font-bold text-muted-foreground"><Loader2 size={18} className="animate-spin" />{label}</div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-2xl border border-border bg-muted/10 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><div className="mt-2 text-[13px] font-extrabold text-foreground">{value}</div></div>; }
function Line({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>; }


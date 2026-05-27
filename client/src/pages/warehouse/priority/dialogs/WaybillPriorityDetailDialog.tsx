import { createPortal } from 'react-dom';
import { Building2, CreditCard, Package, Ruler, Scale, User, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { BadgeConfig, WaybillPriorityDetail } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  waybill: WaybillPriorityDetail | null;
  statusConfig: Record<string, BadgeConfig>;
  paymentConfig: Record<string, BadgeConfig>;
  priorityConfig: Record<string, BadgeConfig>;
  onClose: () => void;
}

const displayValue = (value: unknown, suffix = '') => value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
const displayCode = (waybill: WaybillPriorityDetail | null) => waybill?.waybill_code || `#${waybill?.id || ''}`;
const formatHub = (hub: WaybillPriorityDetail['origin_hub'], fallback?: string | number | null) => hub ? [hub.code?.toUpperCase(), hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}` : fallback ? `Hub #${fallback}` : '—';
const formatMoney = (value?: string | number | null) => value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function WaybillPriorityDetailDialog({ isOpen, isClosing, isLoading, waybill, statusConfig, paymentConfig, priorityConfig, onClose }: Props) {
  if (!isOpen && !isClosing) return null;

  const status = String(waybill?.current_state || '').toUpperCase();
  const statusBadge = statusConfig[status] || { label: status || '—', className: 'bg-muted text-muted-foreground border-border' };
  const paymentBadge = paymentConfig[String(waybill?.payment_type || '')] || { label: waybill?.payment_type || '—', className: 'bg-muted text-muted-foreground border-border' };
  const priorityBadge = priorityConfig[String(waybill?.priority || 'NORMAL').toUpperCase()] || priorityConfig.NORMAL;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className={clsx('fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300 ease-out', isClosing ? 'opacity-0' : 'animate-in fade-in duration-200')} onClick={onClose} />
      <div className={clsx('relative flex h-screen w-full max-w-[760px] flex-col border-l border-border bg-[#f8fafc] shadow-2xl', isClosing ? 'dialog-slide-out' : 'dialog-slide-in')} onClick={event => event.stopPropagation()}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Chi tiết vận đơn</p><h2 className="text-lg font-black text-foreground">{displayCode(waybill)}</h2></div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isLoading ? <div className="flex min-h-[320px] items-center justify-center text-[13px] font-bold text-muted-foreground">Đang tải chi tiết...</div> : waybill && (
            <div className="space-y-4">
              <Section title="Thông tin vận đơn" icon={Package}>
                <Info label="Mã vận đơn" value={displayCode(waybill)} />
                <Info label="Trạng thái" value={<Badge label={statusBadge.label} className={statusBadge.className} />} />
                <Info label="Loại thanh toán" value={<Badge label={paymentBadge.label} className={paymentBadge.className} />} />
                <Info label="Ưu tiên" value={<Badge label={priorityBadge.label} className={priorityBadge.className} />} />
              </Section>
              <Section title="Người gửi / nhận" icon={User}>
                <Info label="Người gửi" value={displayValue(waybill.sender_info)} />
                <Info label="Người nhận" value={displayValue(waybill.receiver_info)} />
              </Section>
              <Section title="Bưu cục & hàng hóa" icon={Building2}>
                <Info label="Hub đi" value={formatHub(waybill.origin_hub, waybill.origin_hub_id)} />
                <Info label="Hub đến" value={formatHub(waybill.dest_hub, waybill.dest_hub_id)} />
                <Info label="Cân nặng" icon={Scale} value={displayValue(waybill.weight, ' kg')} />
                <Info label="Kích thước" icon={Ruler} value={`${displayValue(waybill.length)} × ${displayValue(waybill.width)} × ${displayValue(waybill.height)}`} />
                <Info label="Trọng lượng quy đổi" value={displayValue(waybill.volumetric_weight, ' kg')} />
                <Info label="Cước phí" icon={CreditCard} value={formatMoney(waybill.cost_amount)} />
              </Section>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card p-5"><button onClick={onClose} className="rounded-xl border border-border bg-white px-5 py-3 text-[13px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Đóng</button></div>
      </div>
    </div>,
    document.body,
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Package; children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-border bg-muted/5 px-5 py-3"><Icon size={16} className="text-primary" /><span className="text-[12px] font-bold uppercase tracking-wider text-primary">{title}</span></div><div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">{children}</div></div>;
}
function Info({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof Package }) {
  return <div className="rounded-xl border border-border bg-muted/5 p-3"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{Icon && <Icon size={14} />}{label}</div><p className="mt-1 text-[13px] font-bold leading-6 text-foreground">{value}</p></div>;
}
function Badge({ label, className }: { label: React.ReactNode; className: string }) {
  return <span className={clsx('inline-flex min-h-10 items-center justify-center rounded-xl border px-3 py-2 text-center text-[12px] font-black', className)}>{label}</span>;
}

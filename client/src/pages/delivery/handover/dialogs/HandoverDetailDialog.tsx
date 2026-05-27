import { X } from 'lucide-react';
import type { WaybillHandoverDetail } from '../types';

interface Props { isOpen: boolean; waybill: WaybillHandoverDetail | null; onClose: () => void }
const displayValue = (value: unknown, suffix = '') => value === null || value === undefined || value === '' ? '—' : `${value}${suffix}`;
const hubLabel = (hub: WaybillHandoverDetail['origin_hub'], id: WaybillHandoverDetail['origin_hub_id']) => hub ? [hub.code?.toUpperCase(), hub.name].filter(Boolean).join(' · ') || `Hub #${hub.id}` : displayValue(id);
const driverLabel = (waybill: WaybillHandoverDetail) => waybill.last_mile_driver?.name || waybill.driver?.name || waybill.last_mile_driver?.username || waybill.driver?.username || (waybill.last_mile_driver_id ? `Tài xế #${waybill.last_mile_driver_id}` : 'Chưa gán');

export default function HandoverDetailDialog({ isOpen, waybill, onClose }: Props) {
  if (!isOpen || !waybill) return null;
  const rows = [
    ['Mã vận đơn', waybill.waybill_code], ['Người gửi', waybill.sender_info], ['Người nhận', waybill.receiver_info],
    ['Trạng thái', waybill.current_state], ['Loại thanh toán', waybill.payment_type], ['Hub đi', hubLabel(waybill.origin_hub, waybill.origin_hub_id)],
    ['Hub đến', hubLabel(waybill.dest_hub, waybill.dest_hub_id)], ['Tài xế', driverLabel(waybill)], ['Chuyến xe', displayValue(waybill.trip_id)],
    ['Cân nặng', displayValue(waybill.weight, ' kg')], ['Kích thước', `${displayValue(waybill.length)} × ${displayValue(waybill.width)} × ${displayValue(waybill.height)} cm`],
    ['Trọng lượng quy đổi', displayValue(waybill.volumetric_weight, ' kg')], ['Cước phí', displayValue(waybill.cost_amount, ' đ')],
  ];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[12px] font-bold uppercase tracking-wider text-primary">Chi tiết vận đơn bàn giao</p><h2 className="text-lg font-black text-foreground">{waybill.waybill_code}</h2></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"><X size={18} /></button></div><div className="grid max-h-[70vh] gap-3 overflow-auto p-5 sm:grid-cols-2 custom-scrollbar">{rows.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/10 p-3"><p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-[13px] font-bold text-foreground">{value}</p></div>)}</div></div></div>;
}

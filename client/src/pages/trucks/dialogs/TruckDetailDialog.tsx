import { createPortal } from 'react-dom';
import { CalendarDays, Truck as TruckIcon, User, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Truck } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  truck: Truck | null;
  onClose: () => void;
  formatStatus: (status?: string | null) => string;
  formatTruckType: (type?: string | null) => string;
  getDriverName: (truck: Truck) => string;
  getHubName: (truck: Truck) => string;
}

const valueClass = 'text-[13px] font-extrabold text-foreground';

export default function TruckDetailDialog({ isOpen, isClosing, truck, onClose, formatStatus, formatTruckType, getDriverName, getHubName }: Props) {
  if ((!isOpen && !isClosing) || !truck) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div className={clsx('fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-300', isClosing ? 'opacity-0' : 'animate-in fade-in')} onClick={onClose} />
      <div className={clsx('relative h-screen w-full max-w-[620px] bg-[#f8fafc] shadow-2xl flex flex-col border-l border-border', isClosing ? 'dialog-slide-out' : 'dialog-slide-in')}>
        <div className="h-16 px-6 bg-card border-b border-border flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Chi tiết xe nội bộ</p>
            <h2 className="text-lg font-extrabold text-foreground">{truck.license_plate || 'Xe nội bộ'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <Info title="Thông tin xe" icon={<TruckIcon size={16} />} rows={[
            ['Biển số/mã xe', truck.license_plate || '—'],
            ['Loại xe', formatTruckType(truck.truck_type)],
            ['Hình thức sở hữu', truck.ownership_type || 'Xe nội bộ'],
            ['Trạng thái', formatStatus(truck.status)],
          ]} />
          <Info title="Điều phối" icon={<User size={16} />} rows={[
            ['Bưu cục/kho', getHubName(truck)],
            ['Tài xế chính', getDriverName(truck)],
            ['Tải trọng', truck.payload != null ? `${Number(truck.payload).toLocaleString('vi-VN')} kg` : '—'],
            ['Định mức dầu', truck.fuel_consumption_limit != null ? `${truck.fuel_consumption_limit} L/100km` : '—'],
          ]} />
          <Info title="Bảo trì / đăng kiểm" icon={<CalendarDays size={16} />} rows={[
            ['Hạn đăng kiểm', truck.registration_expiry ? new Date(truck.registration_expiry).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'],
            ['Hạn bảo trì', truck.maintenance_due_at ? new Date(truck.maintenance_due_at).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'],
            ['Khóa bảo trì', truck.maintenance_locked ? 'Có' : 'Không'],
          ]} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Info({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: Array<[string, string]> }) {
  return <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"><div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2 text-primary"><span>{icon}</span><span className="text-[12px] font-bold uppercase tracking-wider">{title}</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">{rows.map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-muted/10 p-3"><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div><div className={valueClass}>{value}</div></div>)}</div></section>;
}


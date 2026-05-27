import { createPortal } from 'react-dom';
import { AlertTriangle, Building2, CalendarClock, Edit, MapPin, Phone, User, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Hub } from '../types';

interface Props {
  hub: Hub | null;
  isClosing: boolean;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  formatStatus: (hub: Hub) => string;
  formatType: (type?: string | null) => string;
}

const getManagerName = (hub: Hub) => hub.manager_name || hub.manager?.name || hub.manager?.full_name || hub.manager?.username || 'Chưa phân công';
const getManagerPhone = (hub: Hub) => hub.manager_phone || hub.manager?.phone || hub.phone || '—';
const riskValue = (hub: Hub, key: 'waybills' | 'trips' | 'users') => {
  const direct = key === 'waybills' ? hub.active_waybills_count : key === 'trips' ? hub.active_trips_count : hub.active_users_count;
  const summary = key === 'waybills'
    ? hub.usage_summary?.active_waybills ?? hub.usage_summary?.waybills
    : key === 'trips'
      ? hub.usage_summary?.active_trips ?? hub.usage_summary?.trips
      : hub.usage_summary?.active_users ?? hub.usage_summary?.users;
  return direct ?? summary ?? 0;
};

export default function HubDetailDialog({ hub, isClosing, canManage, onClose, onEdit, formatStatus, formatType }: Props) {
  if (!hub && !isClosing) return null;
  if (!hub) return null;

  const risks = [
    { label: 'Vận đơn active', value: riskValue(hub, 'waybills') },
    { label: 'Chuyến xe active', value: riskValue(hub, 'trips') },
    { label: 'Nhân sự active', value: riskValue(hub, 'users') },
  ];
  const hasRisk = risks.some(item => item.value > 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div
        className={clsx('fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out', isClosing ? 'opacity-0' : 'animate-in fade-in duration-300')}
        onClick={onClose}
      />
      <div className={clsx('relative w-full max-w-[680px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border', isClosing ? 'dialog-slide-out' : 'dialog-slide-in')}>
        <div className="h-16 px-6 bg-card border-b border-border flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Chi tiết bưu cục</p>
            <h2 className="text-lg font-bold text-foreground">{hub.code?.toUpperCase()} · {hub.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {hasRisk && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex gap-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold">Hub còn dữ liệu đang hoạt động</p>
                <p className="text-[12px] mt-1">Cần kiểm tra vận đơn, chuyến xe hoặc nhân sự trước khi tắt/xóa bưu cục.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Tổng quan</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <Info label="Mã hub" value={hub.code?.toUpperCase()} />
              <Info label="Loại" value={formatType(hub.type)} />
              <Info label="Trạng thái" value={formatStatus(hub)} />
              <Info label="Ngày tạo" value={hub.created_at ? new Date(hub.created_at).toLocaleDateString('vi-VN') : '—'} icon={CalendarClock} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/5 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-[12px] font-bold text-primary uppercase tracking-wider">Địa chỉ & quản lý</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <Info label="Địa chỉ" value={hub.address || '—'} className="sm:col-span-2" />
              <Info label="Tỉnh/thành" value={hub.province || '—'} />
              <Info label="Quận/huyện" value={hub.district || '—'} />
              <Info label="Người quản lý" value={getManagerName(hub)} icon={User} />
              <Info label="Số điện thoại" value={getManagerPhone(hub)} icon={Phone} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {risks.map(item => (
              <div key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-card border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-[13px] font-bold text-muted-foreground hover:bg-muted transition-colors">Đóng</button>
          {canManage && <button onClick={onEdit} className="px-5 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm shadow-primary/20 flex items-center gap-2"><Edit size={16} /> Chỉnh sửa</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Info({ label, value, icon: Icon, className }: { label: string; value?: string | number | null; icon?: typeof Building2; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-border bg-muted/5 p-3', className)}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon size={14} />}
        {label}
      </div>
      <p className="mt-1 font-bold text-foreground">{value || '—'}</p>
    </div>
  );
}

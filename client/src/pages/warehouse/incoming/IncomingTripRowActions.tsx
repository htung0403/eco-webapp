import { Banknote, Edit, Eye, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IncomingTrip } from './types';
import { getManifestId } from './incomingTripUtils';

export function IncomingTripRowActions({
  trip,
  canDelete,
  canPay,
  onView,
  onEdit,
  onDelete,
  onPayment,
}: {
  trip: IncomingTrip;
  canDelete: boolean;
  canPay: boolean;
  onView: (trip: IncomingTrip) => void;
  onEdit: (trip: IncomingTrip) => void;
  onDelete: (trip: IncomingTrip) => void;
  onPayment: (trip: IncomingTrip) => void;
}) {
  const hasManifest = Boolean(getManifestId(trip));

  return (
    <div className="flex flex-wrap items-center gap-1">
      <ActionButton icon={<Eye size={13} />} label="Xem" onClick={() => onView(trip)} title="Xem chi tiết chuyến" />
      <ActionButton icon={<Edit size={13} />} label="Sửa" onClick={() => onEdit(trip)} disabled={!hasManifest} title={hasManifest ? 'Sửa bảng kê' : 'Chưa có bảng kê'} tone="amber" />
      <ActionButton icon={<Trash2 size={13} />} label="Xóa" onClick={() => onDelete(trip)} disabled={!canDelete || !hasManifest} title={canDelete ? 'Xóa bảng kê nháp' : 'Cần quyền quản lý'} tone="danger" />
      <ActionButton icon={<Banknote size={13} />} label="Thanh toán" onClick={() => onPayment(trip)} disabled={!canPay} title={canPay ? 'Cập nhật thanh toán NCC' : 'Cần quyền kế toán'} tone="emerald" />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  title,
  tone = 'primary',
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  tone?: 'primary' | 'amber' | 'danger' | 'emerald';
}) {
  const toneClass = tone === 'danger'
    ? 'text-red-600 hover:bg-red-50'
    : tone === 'amber'
      ? 'text-amber-700 hover:bg-amber-50'
      : tone === 'emerald'
        ? 'text-emerald-700 hover:bg-emerald-50'
        : 'text-primary hover:bg-blue-50';

  return (
    <button
      type="button"
      title={title || label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-white px-2 text-[11px] font-extrabold disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

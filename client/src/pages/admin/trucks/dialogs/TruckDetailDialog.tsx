import type { Truck } from '../types';

interface Props {
  truck: Truck | null;
  onClose: () => void;
}

export default function TruckDetailDialog({ truck, onClose }: Props) {
  if (!truck) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">{truck.license_plate}</h2>
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-1 text-[12px] font-bold text-muted-foreground">Đóng</button>
        </div>
        <div className="mt-4 space-y-2 text-[13px]">
          <p><b>Tải trọng:</b> {truck.payload} kg</p>
          <p><b>Tài xế:</b> {truck.driver?.name || truck.driver?.full_name || truck.driver?.username || truck.driver_id || 'Chưa gán'}</p>
          <p><b>Định mức dầu:</b> {truck.fuel_consumption_limit} L/100km</p>
          <p><b>Trạng thái:</b> {truck.status}</p>
        </div>
      </div>
    </div>
  );
}

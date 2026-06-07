import type { Truck as TruckRecord, TruckListResponse } from '../../trucks/types';
import type { OrderTruckOption } from './components/TruckCheckboxPicker';

export const normalizeTruckList = (response: TruckListResponse | TruckRecord[]) =>
  (Array.isArray(response) ? response : response.items || response.data || response.trucks || []);

export const truckPlate = (truck: TruckRecord) => (truck.bks || truck.license_plate || '').trim().toUpperCase();

export const toOrderTruckOption = (truck: TruckRecord): OrderTruckOption | null => {
  const plate = truckPlate(truck);
  if (!plate) return null;
  return {
    id: String(truck.id),
    plate,
    label: [plate, truck.nha_xe, truck.ten_lai_xe].filter(Boolean).join(' · '),
  };
};

export const parseSelectedTruckPlates = (value: string) =>
  value
    .split(/[,;|]/)
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

export const toggleTruckPlateSelection = (current: string, plate: string, checked: boolean) => {
  const normalized = plate.trim().toUpperCase();
  const set = new Set(parseSelectedTruckPlates(current));
  if (checked) set.add(normalized);
  else set.delete(normalized);
  return [...set].join(', ');
};

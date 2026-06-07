import { apiRequest } from './api';

export type VendorSelectOption = {
  value: string;
  label: string;
  name: string;
  code?: string | null;
};

type VendorRecord = {
  id: string | number;
  name?: string | null;
  code?: string | null;
  status?: string | null;
};

type VendorListResponse = {
  items?: VendorRecord[];
  data?: VendorRecord[];
};

export const vendorDisplayName = (vendor: VendorRecord) =>
  vendor.name?.trim() || vendor.code?.trim() || `NCC #${vendor.id}`;

export async function fetchVendorSelectOptions(activeOnly = true): Promise<VendorSelectOption[]> {
  const params = new URLSearchParams({ limit: '200', page: '1' });
  if (activeOnly) params.set('status', 'ACTIVE');

  const response = await apiRequest<VendorListResponse | VendorRecord[]>(`/vendors?${params.toString()}`);
  const list = Array.isArray(response) ? response : response.items || response.data || [];

  return list
    .filter(vendor => vendor?.id != null)
    .map(vendor => ({
      value: String(vendor.id),
      label: vendorDisplayName(vendor),
      name: vendor.name?.trim() || vendor.code?.trim() || '',
      code: vendor.code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

export const findVendorOption = (options: VendorSelectOption[], vendorId?: string | null, vendorName?: string | null) => {
  if (vendorId) {
    const byId = options.find(option => option.value === vendorId);
    if (byId) return byId;
  }
  const normalizedName = vendorName?.trim().toLowerCase();
  if (!normalizedName) return undefined;
  return options.find(
    option =>
      option.name.toLowerCase() === normalizedName ||
      option.label.toLowerCase() === normalizedName ||
      option.code?.toLowerCase() === normalizedName,
  );
};

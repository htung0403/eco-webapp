export type VendorRecord = Record<string, unknown> & { id?: string | number | null };

export interface VendorListResponse {
  data?: VendorRecord[];
  items?: VendorRecord[];
  vendors?: VendorRecord[];
  total?: number;
  page?: number;
  limit?: number;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    total_pages?: number;
  };
}

export interface VendorFilters {
  keyword: string;
  status: string[];
  service_type: string[];
  province: string[];
  contract_type: string[];
  page: number;
  limit: number;
}

export interface FilterOption {
  value: string;
  label: string;
}

export type VendorFormState = Record<string, string>;

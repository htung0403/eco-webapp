export type PaymentType = 'PP' | 'CC' | 'COD';
export type WaybillState = 'RECEIVED' | 'IN_WAREHOUSE' | 'MANIFEST_CLOSED' | 'IN_TRANSIT' | 'AT_DEST_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED';
export interface FilterOption { value: string; label: string; count?: number }
export interface BadgeConfig { label: string; className: string }
export interface HubSummary { id: string | number; code?: string | null; name?: string | null; address?: string | null; coordinates?: string | null }
export interface CodWaybill { id: string | number; waybill_code: string; sender_info: string; receiver_info: string; weight: number | string | null; length: number | string | null; width: number | string | null; height: number | string | null; volumetric_weight: number | string | null; payment_type: PaymentType | string; cost_amount?: number | string | null; current_state: WaybillState | string; origin_hub_id: string | number | null; dest_hub_id: string | number | null; origin_hub?: HubSummary | null; dest_hub?: HubSummary | null }
export type CodWaybillDetail = CodWaybill;
export interface ListResponse<T> { data?: T[]; items?: T[]; waybills?: T[]; hubs?: T[]; total?: number; meta?: { total?: number } }
export interface CodFilters { keyword: string; statuses: string[]; originHubIds: string[]; destHubIds: string[]; paymentTypes: string[]; page: number; limit: number }
export interface CodFeeFormState { cost_amount: string }

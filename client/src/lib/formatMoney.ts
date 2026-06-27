const LOCALE = 'vi-VN';

/** Chuẩn hóa số từ API / state. */
export const normalizeMoney = (value?: number | string | null) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

/** Hiển thị số tiền VNĐ — dấu chấm phân cách hàng nghìn (vd: 1.500.000 đ). */
export const formatMoney = (
  value?: number | string | null,
  options?: { empty?: string; suffix?: string },
) => {
  const empty = options?.empty ?? '—';
  const suffix = options?.suffix ?? ' đ';
  if (value == null || value === '') return empty;
  const amount = normalizeMoney(value);
  if (!amount && value !== 0 && value !== '0') return empty;
  return `${amount.toLocaleString(LOCALE)}${suffix}`;
};

/** Hiển thị tiền kèm ký hiệu ₫ (Intl currency). */
export const formatMoneyCurrency = (value?: number | string | null, empty = '—') => {
  if (value == null || value === '') return empty;
  return normalizeMoney(value).toLocaleString(LOCALE, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });
};

/** Parse chuỗi nhập liệu (có dấu chấm/phẩy) → số nguyên VNĐ. */
export const parseAmountInput = (value: string) => Number(String(value).replace(/\D/g, '') || 0);

/**
 * Format ô nhập tiền khi gõ — chỉ giữ chữ số, hiển thị dấu chấm phân cách.
 * @example formatAmountInput('1500000') → '1.500.000'
 */
export const formatAmountInput = (value: string) => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString(LOCALE);
};

/** Format giá trị số có sẵn để đưa vào ô nhập. */
export const formatAmountInputFromNumber = (value?: number | string | null) => {
  const amount = normalizeMoney(value);
  if (!amount) return '';
  return amount.toLocaleString(LOCALE);
};

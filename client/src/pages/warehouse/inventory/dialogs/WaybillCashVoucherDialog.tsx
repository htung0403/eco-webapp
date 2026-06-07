import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, ImagePlus, Loader2, Receipt, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ApiError, apiRequest } from '../../../../lib/api';
import type { AuthUserProfile } from '../../../login/types';
import type { WaybillInventoryItem } from '../types';

const USER_PROFILE_KEY = 'eco_user_profile';

export interface WaybillCashVoucher {
  id: string | number;
  waybill_id?: string | number;
  waybill_code?: string | null;
  voucher_type?: string | null;
  amount?: number | string | null;
  note?: string | null;
  image_url?: string | null;
  created_by_name?: string | null;
  created_at?: string | null;
}

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  waybill: WaybillInventoryItem | null;
  onClose: () => void;
}

const parseAmount = (value: string) => Number(String(value).replace(/\D/g, '') || 0);

const formatAmountInput = (value: string) => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
};

const formatMoney = (value?: number | string | null) =>
  value == null || value === '' ? '—' : `${Number(value).toLocaleString('vi-VN')} đ`;

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

function getStoredUser(): AuthUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
}

const displayCode = (waybill: WaybillInventoryItem | null) =>
  waybill?.waybill_code || waybill?.code || (waybill ? `#${waybill.id}` : '—');

export default function WaybillCashVoucherDialog({ isOpen, isClosing, waybill, onClose }: Props) {
  const user = useMemo(getStoredUser, []);
  const [voucherType, setVoucherType] = useState<'Thu' | 'Chi'>('Thu');
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [vouchers, setVouchers] = useState<WaybillCashVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setVoucherType('Thu');
    setAmountInput('');
    setNote('');
    setImageUrl('');
    setImageName('');
    setError('');
  }, []);

  const loadVouchers = useCallback(async () => {
    if (!waybill?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await apiRequest<WaybillCashVoucher[] | { items?: WaybillCashVoucher[]; data?: WaybillCashVoucher[] }>(
        `/waybills/${waybill.id}/cash-vouchers`,
      );
      const list = Array.isArray(response) ? response : response.items || response.data || [];
      setVouchers(list);
    } catch (err) {
      setVouchers([]);
      setError(err instanceof ApiError ? err.message : 'Không tải được phiếu thu/chi.');
    } finally {
      setLoading(false);
    }
  }, [waybill?.id]);

  useEffect(() => {
    if (!isOpen || !waybill?.id) return;
    resetForm();
    void loadVouchers();
  }, [isOpen, waybill?.id, loadVouchers, resetForm]);

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageUrl('');
      setImageName('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh.');
      return;
    }
    if (file.size > 1_500_000) {
      setError('Ảnh tối đa 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(String(reader.result || ''));
      setImageName(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!waybill?.id) return;
    const amount = parseAmount(amountInput);
    if (amount <= 0) {
      setError('Nhập số tiền lớn hơn 0.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiRequest(`/waybills/${waybill.id}/cash-vouchers`, {
        method: 'POST',
        body: {
          voucher_type: voucherType,
          amount,
          note: note.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không lưu được phiếu thu/chi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      <div
        className={clsx('absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity', isClosing ? 'opacity-0' : 'opacity-100')}
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl transition-all duration-200 sm:rounded-[28px]',
          isClosing ? 'translate-y-6 opacity-0 sm:scale-95' : 'translate-y-0 opacity-100 sm:scale-100',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Thu chi theo số bill</p>
            <h2 className="mt-1 text-xl font-black text-foreground">{displayCode(waybill)}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Người lập: <span className="font-bold text-foreground">{user?.full_name || user?.username || '—'}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-primary">Tạo phiếu mới</p>
            <div className="mb-3 flex gap-2">
              {(['Thu', 'Chi'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVoucherType(type)}
                  className={clsx(
                    'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-extrabold transition-colors',
                    voucherType === type
                      ? type === 'Thu'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-red-300 bg-red-50 text-red-700'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  Phiếu {type.toLowerCase()}
                </button>
              ))}
            </div>

            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Số tiền</span>
              <input
                value={amountInput}
                onChange={(event) => setAmountInput(formatAmountInput(event.target.value))}
                placeholder="1.000.000"
                className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[15px] font-extrabold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Ghi chú</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Nội dung phiếu..."
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="mb-3">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Ảnh đính kèm</span>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-muted/10 px-3 py-3 hover:bg-muted/30">
                <ImagePlus size={18} className="text-primary" />
                <span className="text-[13px] font-medium text-foreground">{imageName || 'Chọn ảnh từ máy...'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                />
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="Xem trước" className="mt-2 max-h-40 rounded-lg border border-border object-contain" />
              )}
            </div>

            {error && <p className="mb-3 text-[13px] font-bold text-red-600">{error}</p>}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-extrabold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Receipt size={16} />}
              Lưu phiếu {voucherType.toLowerCase()}
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-muted-foreground">
              Phiếu đã tạo ({vouchers.length})
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={22} />
              </div>
            ) : vouchers.length === 0 ? (
              <p className="py-6 text-center text-[13px] font-medium text-muted-foreground">Chưa có phiếu thu/chi cho bill này.</p>
            ) : (
              <div className="space-y-2">
                {vouchers.map((voucher) => {
                  const isThu = String(voucher.voucher_type).toLowerCase() === 'thu';
                  return (
                    <div key={String(voucher.id)} className="rounded-xl border border-border/80 bg-muted/10 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase',
                              isThu ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700',
                            )}
                          >
                            Phiếu {String(voucher.voucher_type || '').toLowerCase()}
                          </span>
                          <span className="text-[15px] font-extrabold text-foreground">{formatMoney(voucher.amount)}</span>
                        </div>
                        <div className="text-right text-[11px] font-medium text-muted-foreground">
                          <p>{formatDateTime(voucher.created_at)}</p>
                          <p className="font-bold text-foreground">{voucher.created_by_name || '—'}</p>
                        </div>
                      </div>
                      {voucher.note?.trim() && (
                        <p className="mt-2 text-[12px] text-foreground">
                          <span className="font-bold text-muted-foreground">Ghi chú: </span>
                          {voucher.note}
                        </p>
                      )}
                      {voucher.image_url && (
                        <a
                          href={voucher.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                        >
                          <Banknote size={12} />
                          Xem ảnh đính kèm
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import {
  buildManifestAddFormRows,
  buildManifestAddSubmitItems,
  type ManifestAddFormRow,
  type ManifestAddSubmitItem,
} from '../addManifestFormUtils';
import type { WaybillInventoryItem } from '../../inventory/types';
import type { AddWaybillsFormState, LoadPlanningManifest } from '../types';

interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string;
  originHubLabel?: string;
  manifest: LoadPlanningManifest | null;
  waybills: WaybillInventoryItem[];
  total: number;
  formState: AddWaybillsFormState;
  onChange: (patch: Partial<AddWaybillsFormState>) => void;
  onClose: () => void;
  onSubmit: (items: ManifestAddSubmitItem[]) => void;
}

export default function AddWaybillsToManifestDialog({
  isOpen,
  isClosing,
  isLoading,
  isSubmitting,
  error = '',
  originHubLabel = '—',
  manifest,
  waybills,
  total,
  formState,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  const [rows, setRows] = useState<ManifestAddFormRow[]>([]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRows((prev) => {
      const prevById = new Map(prev.map((row) => [row.waybill_id, row]));
      return buildManifestAddFormRows(waybills).map((row) => {
        const existing = prevById.get(row.waybill_id);
        if (!existing) return row;
        return {
          ...row,
          selected: existing.selected,
          package_count: existing.package_count,
          loading_position: existing.loading_position,
        };
      });
    });
    setLocalError('');
  }, [isOpen, waybills]);

  const selectedRows = useMemo(() => rows.filter((row) => row.selected), [rows]);
  const selectedPackageTotal = useMemo(
    () => selectedRows.reduce((sum, row) => sum + (Number(row.package_count) || 0), 0),
    [selectedRows],
  );
  const totalPages = Math.max(1, Math.ceil(total / formState.limit));
  const allSelected = rows.length > 0 && rows.every((row) => row.selected);

  if (!isOpen && !isClosing) return null;

  const manifestLabel = manifest?.manifest_code || manifest?.code || (manifest ? `BK #${manifest.id}` : '');

  const updateRow = (waybillId: string, patch: Partial<ManifestAddFormRow>) => {
    setRows((prev) => prev.map((row) => (row.waybill_id === waybillId ? { ...row, ...patch } : row)));
  };

  const toggleAll = () => {
    setRows((prev) => prev.map((row) => ({ ...row, selected: !allSelected })));
  };

  const handleSubmit = () => {
    setLocalError('');
    const items = buildManifestAddSubmitItems(rows);
    if (!items.length) {
      setLocalError('Chọn ít nhất một vận đơn để thêm vào bảng kê.');
      return;
    }
    const missingQty = selectedRows.find((row) => !String(row.package_count).trim());
    if (missingQty) {
      setLocalError(`Nhập số kiện cho ${missingQty.waybill_code}.`);
      return;
    }
    const invalid = rows.find((row) => {
      if (!row.selected) return false;
      const count = Number(row.package_count);
      return !Number.isFinite(count) || count < 1 || count > row.max_package_count;
    });
    if (invalid) {
      setLocalError(`Số kiện của ${invalid.waybill_code} phải từ 1 đến ${invalid.max_package_count}.`);
      return;
    }
    onSubmit(items);
  };

  const displayError = localError || error;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      <div
        className={clsx(
          'absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200',
          isClosing ? 'opacity-0' : 'opacity-100',
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative z-10 flex max-h-[96vh] min-h-[min(80vh,720px)] w-full max-w-[min(98vw,1100px)] flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-2xl sm:rounded-[28px] transition-all duration-200',
          isClosing ? 'translate-y-6 opacity-0 sm:scale-95' : 'translate-y-0 opacity-100',
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-[18px] font-black text-foreground">Thêm đơn tồn vào bảng kê</p>
            <p className="text-[13px] text-muted-foreground">
              {manifestLabel ? `${manifestLabel} · ` : ''}
              Chọn đơn và nhập số kiện
              {originHubLabel !== '—' ? ` · Xuất phát ${originHubLabel}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2.5 hover:bg-muted">
            <X size={22} />
          </button>
        </div>

        <div className="shrink-0 border-b border-border px-6 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={formState.keyword}
              onChange={(e) => onChange({ keyword: e.target.value, page: 1 })}
              placeholder="Tìm mã vận đơn, người gửi, người nhận..."
              className="h-11 w-full rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[14px] font-medium outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto custom-scrollbar p-6">
          {displayError ? (
            <div className="mb-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {displayError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-[13px] font-bold text-muted-foreground">
              <Loader2 className="animate-spin" size={18} />
              Đang tải đơn tồn...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <p className="text-[13px] font-extrabold text-muted-foreground">Chưa có đơn cần chia</p>
                <p className="mt-2 text-[12px] font-medium leading-5 text-muted-foreground">
                  Tất cả đơn tồn đã phân hết kiện lên xe, hoặc đã nằm trong bảng kê khác.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-100 text-[12px] font-bold uppercase tracking-wide text-slate-700">
                    <th className="w-10 border-b border-r border-border px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                        aria-label="Chọn tất cả"
                      />
                    </th>
                    <th className="border-b border-r border-border px-4 py-3 text-left">Mã vận đơn</th>
                    <th className="border-b border-r border-border px-4 py-3 text-left">Tỉnh đến</th>
                    <th className="border-b border-r border-border px-4 py-3 text-center">Số kiện</th>
                    <th className="border-b border-r border-border px-4 py-3 text-center">Vị trí xếp hàng</th>
                    <th className="border-b border-border px-4 py-3 text-center">Ngày tới</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.waybill_id} className="border-b border-border align-top">
                      <td className="border-r border-border px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={(e) => updateRow(row.waybill_id, { selected: e.target.checked })}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                          aria-label={`Chọn ${row.waybill_code}`}
                        />
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[15px] font-extrabold text-primary">
                        {row.waybill_code}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px] font-medium text-foreground">
                        {row.noi_den}
                      </td>
                      <td className="border-r border-border px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={row.max_package_count}
                          value={row.package_count}
                          disabled={!row.selected}
                          onChange={(e) => updateRow(row.waybill_id, { package_count: e.target.value })}
                          title={`Tối đa ${row.max_package_count} kiện`}
                          className="h-11 w-full min-w-[88px] rounded-lg border border-violet-300 bg-violet-50 px-2 text-center text-[15px] font-extrabold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="mt-1 text-center text-[11px] font-medium text-muted-foreground">/ {row.max_package_count}</p>
                      </td>
                      <td className="border-r border-border px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={row.loading_position}
                          disabled={!row.selected}
                          onChange={(e) => updateRow(row.waybill_id, { loading_position: e.target.value })}
                          placeholder="VT"
                          className="h-11 w-full min-w-[88px] rounded-lg border border-yellow-300 bg-yellow-50 px-2 text-center text-[15px] font-bold outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-[15px] font-bold text-emerald-800">
                        {row.expected_arrival_label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className="text-[12px] font-medium text-muted-foreground">
            Đã chọn {selectedRows.length} dòng · {selectedPackageTotal} kiện
            {rows.length ? ` · ${rows.length}/Tổng:${total}` : ` · 0/Tổng:${total}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={formState.limit}
              onChange={(e) => onChange({ limit: Number(e.target.value), page: 1 })}
              className="h-9 rounded-lg border border-border bg-white px-3 text-[13px] text-muted-foreground outline-none"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <button
              type="button"
              disabled={formState.page <= 1}
              onClick={() => onChange({ page: formState.page - 1 })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={formState.page >= totalPages}
              onClick={() => onChange({ page: formState.page + 1 })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2 text-[13px] font-bold text-white">
              {formState.page}
            </span>
            <span className="text-[13px] font-bold text-foreground">/ {totalPages}</span>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-border px-5 text-[14px] font-bold text-muted-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedRows.length || isSubmitting || isLoading}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-700 px-5 text-[14px] font-bold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Thêm vào bảng kê
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

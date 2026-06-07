import { clsx } from 'clsx';
import {
  DICH_VU_OPTIONS,
  DON_GIA_DON_VI_OPTIONS,
  GIAO_HANG_OPTIONS,
  GIO_OPTIONS,
  LOAI_BP_OPTIONS,
  ORDER_TABS,
  PHUONG_THUC_OPTIONS,
} from '../orderFormData';
import type { BillListItem, NewOrderFormState, OrderWorkbenchTab } from '../orderFormTypes';
import type { HubSummary } from '../types';
import { CompactField, CompactInput, CompactSelect, FormSection } from './CompactField';
import BillListSidebar from './BillListSidebar';
import CustomerMaKhCombobox from './CustomerMaKhCombobox';
import TruckCheckboxPicker, { type OrderTruckOption } from './TruckCheckboxPicker';

interface Props {
  form: NewOrderFormState;
  setField: <K extends keyof NewOrderFormState>(key: K, value: NewOrderFormState[K]) => void;
  patchForm: (patch: Partial<NewOrderFormState>) => void;
  activeTab: OrderWorkbenchTab;
  onTabChange: (tab: OrderWorkbenchTab) => void;
  bills: BillListItem[];
  selectedBillId: string | null;
  onSelectBill: (bill: BillListItem) => void;
  hubOptions: { value: string; label: string }[];
  hubs?: HubSummary[];
  pickupTrucks?: OrderTruckOption[];
  isPickupTrucksLoading?: boolean;
  onSave: () => void;
  onNew: () => void;
  onDelete: () => void;
  onPreviewA5: () => void;
  onPrintA5: () => void;
  canManage: boolean;
  isSubmitting: boolean;
  error?: string;
}

export default function NewOrderWorkbench({
  form,
  setField,
  patchForm,
  activeTab,
  onTabChange,
  bills,
  selectedBillId,
  onSelectBill,
  hubOptions,
  hubs = [],
  pickupTrucks = [],
  isPickupTrucksLoading = false,
  onSave,
  onNew,
  onDelete,
  onPreviewA5,
  onPrintA5,
  canManage,
  isSubmitting,
  error,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#e8eef5]">
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-slate-300 bg-slate-100 px-2 py-1.5">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'rounded border px-2.5 py-1 text-[12px] font-bold transition-colors',
              activeTab === tab.id
                ? 'border-primary bg-primary text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
          <div className="mb-2 rounded border border-slate-300 bg-slate-200/80 px-3 py-1.5 text-center text-[13px] font-extrabold text-slate-800">
            Thông tin đơn hàng
          </div>

          {error && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <FormSection title="Thông tin khách hàng">
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-4">
                <CompactField label="Mã KH">
                  <CustomerMaKhCombobox
                    value={form.maKh}
                    onValueChange={(code) => setField('maKh', code)}
                    onCustomerSelect={patchForm}
                    hubs={hubs}
                    disabled={isSubmitting}
                  />
                </CompactField>
                <CompactField label="Đ/thoại">
                  <CompactInput value={form.dienThoaiKh} onChange={(e) => setField('dienThoaiKh', e.target.value)} />
                </CompactField>
                <CompactField label="Người gửi">
                  <CompactInput value={form.nguoiGui} onChange={(e) => setField('nguoiGui', e.target.value)} />
                </CompactField>
                <CompactField label="Đ/c gửi">
                  <CompactInput value={form.diaChiGui} onChange={(e) => setField('diaChiGui', e.target.value)} />
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-4">
                <CompactField label="ĐT nhận">
                  <CompactInput value={form.dienThoaiNhan} onChange={(e) => setField('dienThoaiNhan', e.target.value)} />
                </CompactField>
                <CompactField label="Nơi đến">
                  <CompactSelect
                    value={form.destHubId}
                    onChange={(e) => {
                      const hub = hubOptions.find((o) => o.value === e.target.value);
                      const code = hub?.label.split(' · ')[0] || '';
                      patchForm({
                        destHubId: e.target.value,
                        noiDen: code,
                        huyen: hub?.label.split(' · ').slice(1).join(' · ') || form.huyen,
                      });
                    }}
                  >
                    <option value="">Chọn nơi đến</option>
                    {hubOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label.split(' · ')[0] || o.label}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="Huyện">
                  <CompactInput value={form.huyen} onChange={(e) => setField('huyen', e.target.value)} />
                </CompactField>
                <CompactField label="Người nhận">
                  <CompactInput value={form.nguoiNhan} onChange={(e) => setField('nguoiNhan', e.target.value)} />
                </CompactField>
              </div>
              <CompactField label="Đ/c nhận" labelWidth="w-[76px]">
                <CompactInput value={form.diaChiNhan} onChange={(e) => setField('diaChiNhan', e.target.value)} />
              </CompactField>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <CompactField label="BC gửi">
                  <CompactSelect value={form.originHubId} onChange={(e) => setField('originHubId', e.target.value)}>
                    <option value="">Chọn bưu cục gửi</option>
                    {hubOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="BC đến">
                  <CompactSelect value={form.destHubId} onChange={(e) => setField('destHubId', e.target.value)}>
                    <option value="">Chọn bưu cục đến</option>
                    {hubOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
              </div>
            </FormSection>

            <FormSection title="Thông tin hàng hóa">
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-5">
                <CompactField label="Số kiện">
                  <CompactInput value={form.soKien} onChange={(e) => setField('soKien', e.target.value)} />
                </CompactField>
                <CompactField label="Số bill">
                  <CompactInput
                    value={form.soBill}
                    onChange={(e) => setField('soBill', e.target.value.toUpperCase())}
                    placeholder="Nhập số bill..."
                    className="font-bold text-primary"
                  />
                </CompactField>
                <CompactField label="Loại BP">
                  <CompactSelect value={form.loaiBp} onChange={(e) => setField('loaiBp', e.target.value)}>
                    {LOAI_BP_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="Dịch vụ">
                  <CompactSelect value={form.dichVu} onChange={(e) => setField('dichVu', e.target.value)}>
                    {DICH_VU_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="Giờ">
                  <CompactSelect value={form.gio} onChange={(e) => setField('gio', e.target.value)}>
                    {GIO_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="Giao hàng">
                  <CompactSelect value={form.giaoHang} onChange={(e) => setField('giaoHang', e.target.value)}>
                    {GIAO_HANG_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-6">
                <CompactField label="KL (kg)">
                  <CompactInput value={form.klKg} onChange={(e) => setField('klKg', e.target.value)} />
                </CompactField>
                <CompactField label="NVGN">
                  <CompactInput value={form.nvgn} onChange={(e) => setField('nvgn', e.target.value)} />
                </CompactField>
                <CompactField label="K.thước D">
                  <CompactInput value={form.chieuDai} onChange={(e) => setField('chieuDai', e.target.value)} />
                </CompactField>
                <CompactField label="R">
                  <CompactInput value={form.chieuRong} onChange={(e) => setField('chieuRong', e.target.value)} />
                </CompactField>
                <CompactField label="C">
                  <CompactInput value={form.chieuCao} onChange={(e) => setField('chieuCao', e.target.value)} />
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                <CompactField label="KL QĐ">
                  <CompactInput value={form.klQuyDoi} readOnly className="bg-slate-50" title="Tự tính từ D×R×C ÷ 5000" />
                </CompactField>
                <CompactField label="M3">
                  <CompactInput
                    value={form.m3}
                    onChange={(e) => setField('m3', e.target.value)}
                    placeholder="Nhập m³"
                  />
                </CompactField>
                <CompactField label="Đơn giá">
                  <CompactInput
                    value={form.donGia}
                    onChange={(e) => setField('donGia', e.target.value)}
                    placeholder="0"
                  />
                </CompactField>
                <CompactField label="ĐVT">
                  <CompactInput
                    value={form.donGiaDonVi}
                    onChange={(e) => setField('donGiaDonVi', e.target.value)}
                    list="don-gia-don-vi-options"
                    placeholder="Kg, M3, Kiện..."
                  />
                  <datalist id="don-gia-don-vi-options">
                    {DON_GIA_DON_VI_OPTIONS.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-3">
                <CompactField label="D.vụ gtgt">
                  <CompactInput value={form.dichVuGiaTang} onChange={(e) => setField('dichVuGiaTang', e.target.value)} />
                </CompactField>
                <CompactField label="Số khoang">
                  <CompactInput value={form.soKhoang} onChange={(e) => setField('soKhoang', e.target.value)} />
                </CompactField>
                <CompactField label="N.dung">
                  <CompactInput value={form.noiDung} onChange={(e) => setField('noiDung', e.target.value)} />
                </CompactField>
              </div>
              <CompactField label="Ghi chú">
                <CompactInput value={form.ghiChu} onChange={(e) => setField('ghiChu', e.target.value)} />
              </CompactField>
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-2">
                <CompactField label="Xe lấy" className="items-start">
                  <TruckCheckboxPicker
                    options={pickupTrucks}
                    value={form.xeLay}
                    onChange={(value) => setField('xeLay', value)}
                    isLoading={isPickupTrucksLoading}
                    placeholder="Chọn xe lấy..."
                  />
                </CompactField>
                <CompactField label="Xe phát" className="items-start">
                  <TruckCheckboxPicker
                    options={pickupTrucks}
                    value={form.xePhat}
                    onChange={(value) => setField('xePhat', value)}
                    isLoading={isPickupTrucksLoading}
                    placeholder="Chọn xe phát..."
                  />
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <CompactField label="Bưu tá lấy">
                  <CompactInput value={form.buuTaLay} onChange={(e) => setField('buuTaLay', e.target.value)} />
                </CompactField>
                <CompactField label="Bưu tá phát">
                  <CompactInput value={form.buuTaPhat} onChange={(e) => setField('buuTaPhat', e.target.value)} />
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                <CompactField label="Phụ phí">
                  <CompactInput
                    value={form.dvdb}
                    onChange={(e) => setField('dvdb', e.target.value)}
                    placeholder="0"
                  />
                </CompactField>
                <CompactField label="Cước chính">
                  <CompactInput
                    value={form.cuocChinh}
                    readOnly
                    className="bg-amber-50/80 font-extrabold text-amber-900"
                    title="Tự tính: Đơn giá × số lượng (theo ĐVT)"
                  />
                </CompactField>
                <CompactField label="Ngày đi">
                  <CompactInput type="date" value={form.ngayDi} onChange={(e) => setField('ngayDi', e.target.value)} />
                </CompactField>
              </div>
            </FormSection>

            <FormSection title="Thanh toán">
              <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-4">
                <CompactField label="P.thức">
                  <CompactSelect value={form.phuongThuc} onChange={(e) => setField('phuongThuc', e.target.value)}>
                    {PHUONG_THUC_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </CompactSelect>
                </CompactField>
                <CompactField label="Thuế suất">
                  <CompactInput value={form.thueSuat} onChange={(e) => setField('thueSuat', e.target.value)} />
                </CompactField>
                <CompactField label="VAT">
                  <CompactInput
                    value={form.vat}
                    readOnly={form.coVat}
                    onChange={(e) => setField('vat', e.target.value)}
                    className={form.coVat ? 'bg-slate-50' : undefined}
                  />
                </CompactField>
                <CompactField label="COD">
                  <CompactInput value={form.cod} onChange={(e) => setField('cod', e.target.value)} />
                </CompactField>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                <CompactField label="Tổng cước">
                  <CompactInput
                    value={form.tongCuoc}
                    readOnly
                    className="bg-slate-50 font-bold"
                    title="Cước chính + Phụ phí"
                  />
                </CompactField>
                <CompactField label="Giảm giá">
                  <CompactInput value={form.giamGia} onChange={(e) => setField('giamGia', e.target.value)} />
                </CompactField>
                <CompactField label="Thanh toán">
                  <div className="flex items-center gap-2">
                    <CompactInput
                      value={form.thanhToan}
                      readOnly
                      className="flex-1 bg-slate-50 font-bold"
                      title="Tổng cước − Giảm giá (+ VAT nếu bật)"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.coVat}
                        onChange={(e) => setField('coVat', e.target.checked)}
                        className="rounded border-slate-300"
                      />
                      Vat
                    </label>
                  </div>
                </CompactField>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Cước chính = Đơn giá × SL (Kg: max KL/KL QĐ · M3: ô M3 · Kiện: số kiện). Tổng cước = Cước chính + Phụ phí.
              </p>
            </FormSection>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-slate-300 pt-3">
            <ActionButton label="Nhập" onClick={onSave} disabled={!canManage || isSubmitting} primary />
            <ActionButton label="Mới" onClick={onNew} disabled={isSubmitting} />
            <ActionButton label="Xóa" onClick={onDelete} disabled={!canManage || !selectedBillId || isSubmitting} danger />
            <ActionButton label="Xem A5" onClick={onPreviewA5} disabled={!selectedBillId} />
            <ActionButton label="in A5" onClick={onPrintA5} disabled={!selectedBillId} />
            <span className="text-[12px] font-bold text-slate-600">Bill thường</span>
          </div>
        </div>

        <BillListSidebar bills={bills} selectedId={selectedBillId} onSelect={onSelectBill} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  primary,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'min-w-[72px] rounded border px-4 py-1.5 text-[12px] font-extrabold shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
        primary && 'border-primary bg-primary text-white hover:bg-primary/90',
        danger && 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100',
        !primary && !danger && 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  );
}

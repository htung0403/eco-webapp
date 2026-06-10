import { AlertTriangle, Loader2, Plus, Search, X } from "lucide-react";
import type { AddWaybillsFormState, LoadPlanningManifest, ManifestWaybill } from "../types";
interface Props {
  isOpen: boolean;
  isClosing: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string;
  originHubLabel?: string;
  manifest: LoadPlanningManifest | null;
  waybills: ManifestWaybill[];
  total: number;
  formState: AddWaybillsFormState;
  onChange: (patch: Partial<AddWaybillsFormState>) => void;
  onClose: () => void;
  onSubmit: () => void;
}
const display = (v?: string | number | null, f = "—") =>
  v == null || v === "" ? f : String(v);
const num = (v?: string | number | null, s = "") =>
  v == null || v === "" ? "—" : `${Number(v).toLocaleString("vi-VN")}${s}`;
const hubLabel = (hub?: { code?: string | null; name?: string | null } | null, id?: string | number | null) =>
  hub?.code || hub?.name || (id ? `Hub #${id}` : "—");
const packageLabel = (waybill: ManifestWaybill) => {
  if (waybill.remaining_packages != null) {
    const total = waybill.order_total_packages ?? waybill.package_count;
    return total != null
      ? `${waybill.remaining_packages} / ${total}`
      : String(waybill.remaining_packages);
  }
  return display(waybill.package_count);
};
const statusLabel = (waybill: ManifestWaybill) => {
  const status = String(waybill.current_state || waybill.status || "").toUpperCase();
  if (status === "IN_WAREHOUSE") return "Trong kho";
  if (status === "RECEIVED") return "Đã tạo đơn";
  if (status === "MANIFEST_CLOSED") return "Chờ bốc";
  return status || "—";
};
export default function AddWaybillsToManifestDialog({
  isOpen,
  isClosing,
  isLoading,
  isSubmitting,
  error = "",
  originHubLabel = "—",
  manifest,
  waybills,
  total,
  formState,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;
  const toggle = (id: string) =>
    onChange({
      selectedIds: formState.selectedIds.includes(id)
        ? formState.selectedIds.filter((x) => x !== id)
        : [...formState.selectedIds, id],
    });
  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all duration-350 ease-out"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-[920px] bg-[#f8fafc] shadow-2xl flex flex-col h-screen border-l border-border ${isClosing ? "dialog-slide-out" : "dialog-slide-in"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Thêm đơn tồn
            </p>
            <h2 className="text-lg font-extrabold text-foreground">
              Chọn đơn để thêm vào bảng kê
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-border p-3">
          <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] font-semibold leading-5 text-blue-700">
            Danh sách <b>Đơn tồn</b> đang ở kho <b>{originHubLabel}</b> (mọi hub đến, còn kiện chưa xếp hết).
            Tích chọn đơn rồi bấm <b>Thêm vào bảng kê</b>.
          </div>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={formState.keyword}
              onChange={(e) => onChange({ keyword: e.target.value, page: 1 })}
              placeholder="Tìm mã vận đơn, người gửi, người nhận..."
              className="h-10 w-full rounded-lg border border-border bg-muted/10 pl-9 pr-3 text-[13px] font-medium outline-none"
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex min-h-[320px] items-center justify-center gap-2 text-[13px] font-bold text-muted-foreground">
              <Loader2 className="animate-spin" size={18} />
              Đang tải đơn tồn...
            </div>
          ) : (
            <>
              <table className="hidden md:table w-full min-w-[980px] text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600">
                  <tr>
                    {[
                      "Chọn",
                      "Mã vận đơn",
                      "Người gửi",
                      "Người nhận",
                      "Kiện còn",
                      "Trạng thái",
                      "TL",
                      "Thanh toán",
                      "Hub đi",
                      "Hub đến",
                      "Ghi chú tồn",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border-r border-border px-4 py-3 font-bold last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((w) => (
                    <tr key={w.id} className="border-b border-border">
                      <td className="border-r border-border px-4 py-3">
                        <input
                          type="checkbox"
                          checked={formState.selectedIds.includes(String(w.id))}
                          onChange={() => toggle(String(w.id))}
                        />
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px] font-bold text-primary">
                        {display(w.waybill_code)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {display(w.sender_info)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {display(w.receiver_info)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px] font-extrabold text-violet-700">
                        {packageLabel(w)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {statusLabel(w)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px] font-bold">
                        {num(w.weight, " kg")}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {display(w.payment_type)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {hubLabel(w.origin_hub, w.origin_hub_id)}
                      </td>
                      <td className="border-r border-border px-4 py-3 text-[13px]">
                        {hubLabel(w.dest_hub, w.dest_hub_id)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {display(w.trip_label)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid gap-3 p-3 md:hidden">
                {waybills.map((w) => (
                  <article
                    key={w.id}
                    className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formState.selectedIds.includes(String(w.id))}
                        onChange={() => toggle(String(w.id))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-primary">
                          {display(w.waybill_code)}
                        </div>
                        <div className="mt-2 grid gap-1 text-[13px] text-muted-foreground">
                          <span>
                            {display(w.sender_info)} →{" "}
                            {display(w.receiver_info)}
                          </span>
                          <span>
                            {statusLabel(w)} · Kiện còn {packageLabel(w)} · {num(w.weight, " kg")} ·{" "}
                            {display(w.payment_type)} · {hubLabel(w.origin_hub, w.origin_hub_id)} →{" "}
                            {hubLabel(w.dest_hub, w.dest_hub_id)}
                          </span>
                          {w.trip_label && (
                            <span className="text-[12px]">{w.trip_label}</span>
                          )}
                        </div>
                      </div>
                    </label>
                  </article>
                ))}
              </div>
              {!waybills.length && (
                <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
                  <div className="max-w-md">
                    <p className="text-[13px] font-extrabold text-muted-foreground">
                      Không có đơn tồn phù hợp.
                    </p>
                    <p className="mt-2 text-[12px] font-medium leading-5 text-muted-foreground">
                      Kiểm tra trang <b>Đơn tồn</b> — đơn đang ở kho <b>{originHubLabel}</b>, còn kiện chưa xếp hết lên xe.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/10 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[12px] font-bold text-muted-foreground">
              Đã chọn {formState.selectedIds.length} · Tổng:{total}
            </p>
            {error ? (
              <p className="flex items-start gap-1.5 text-[12px] font-semibold text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-xl border border-border bg-white px-4 text-[13px] font-bold text-muted-foreground"
            >
              Hủy
            </button>
            <button
              disabled={!formState.selectedIds.length || isSubmitting}
              onClick={onSubmit}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-white disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Thêm vào bảng kê
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

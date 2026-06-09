import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import DispatchPrintColumnDropdown from './DispatchPrintColumnDropdown';
import type { DispatchPrintColumnId } from './dispatchPrintColumns';
import { loadVisibleDispatchColumnIds, saveVisibleDispatchColumnIds } from './dispatchPrintColumns';
import LoadPlanningPrintTemplate from './LoadPlanningPrintTemplate';
import { loadLoadPlanningPrintPayload } from './loadPlanningPrintUtils';
import './inventory-stock-list.css';

export default function PrintLoadPlanningPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => loadLoadPlanningPrintPayload());
  const showPricing = Boolean(data?.showPricing);
  const [printColumnIds, setPrintColumnIds] = useState<DispatchPrintColumnId[]>(() =>
    data?.visibleColumnIds?.length
      ? data.visibleColumnIds
      : loadVisibleDispatchColumnIds(showPricing),
  );

  useEffect(() => {
    document.title = 'Bảng kê phát hàng ECO';
    const payload = loadLoadPlanningPrintPayload();
    if (payload?.groups?.some((group) => group.rows.length)) {
      setData(payload);
      setPrintColumnIds(
        payload.visibleColumnIds?.length
          ? payload.visibleColumnIds
          : loadVisibleDispatchColumnIds(Boolean(payload.showPricing)),
      );
    }
  }, []);

  const updatePrintColumnIds = (ids: DispatchPrintColumnId[]) => {
    saveVisibleDispatchColumnIds(ids);
    setPrintColumnIds(ids);
  };

  const printData = useMemo(
    () => (data ? { ...data, visibleColumnIds: printColumnIds } : null),
    [data, printColumnIds],
  );

  const hasRows = useMemo(() => Boolean(printData?.groups?.some((group) => group.rows.length)), [printData]);

  if (!printData || !hasRows) {
    return (
      <div className="inventory-stock-wrap flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto text-red-600" size={28} />
          <p className="mt-3 text-[14px] font-bold text-red-800">Không có dữ liệu in</p>
          <p className="mt-1 text-[13px] text-red-700">Quay lại trang xếp xe và bấm &quot;In phiếu&quot;.</p>
          <button
            type="button"
            onClick={() => navigate('/warehouse/priority')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white"
          >
            <ArrowLeft size={16} />
            Phân loại ưu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-stock-wrap">
      <div className="inventory-print-toolbar mx-auto mb-3 flex max-w-[297mm] flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/warehouse/priority')}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-[13px] font-bold"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <DispatchPrintColumnDropdown
            value={printColumnIds}
            canViewPricing={printData.showPricing}
            onChange={updatePrintColumnIds}
            className="w-[200px]"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-white"
          >
            <Printer size={16} />
            In bảng kê (A4 ngang)
          </button>
        </div>
      </div>
      <LoadPlanningPrintTemplate data={printData} />
    </div>
  );
}

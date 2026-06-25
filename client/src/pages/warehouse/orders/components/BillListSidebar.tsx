import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Fragment, useState } from 'react';
import type { BillListItem } from '../orderFormTypes';

interface Props {
  bills: BillListItem[];
  selectedId: string | null;
  onSelect: (bill: BillListItem) => void;
  onDelete?: (bill: BillListItem) => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

const formatMoney = (value: number) => (value ? value.toLocaleString('vi-VN') : '');
const UNKNOWN_DATE_KEY = '__unknown_date__';

export default function BillListSidebar({
  bills,
  selectedId,
  onSelect,
  onDelete,
  canDelete = false,
  isDeleting = false,
}: Props) {
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (date: string) => {
    const key = date || UNKNOWN_DATE_KEY;
    setCollapsedDates((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <aside className="flex w-[620px] shrink-0 flex-col border-l border-slate-300 bg-slate-50/90">
      <div className="border-b border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 px-2 py-1.5 text-center text-[12px] font-black text-slate-800">
        Danh sách theo ngày
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full min-w-[620px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-600">
            <tr>
              <th className="w-[128px] border-b border-r border-slate-300 px-2 py-1.5 text-left font-black">Số bill</th>
              <th className="w-12 border-b border-r border-slate-300 px-1.5 py-1.5 text-right font-black">Kiện</th>
              <th className="w-16 border-b border-r border-slate-300 px-2 py-1.5 text-left font-black">Nơi đến</th>
              <th className="w-[206px] border-b border-r border-slate-300 px-2 py-1.5 text-left font-black">Khách gửi / Mã KH</th>
              <th className="w-24 border-b border-r border-slate-300 px-2 py-1.5 text-right font-black">Phải thu</th>
              {onDelete && <th className="w-7 border-b border-slate-300" />}
            </tr>
          </thead>
          <tbody>
            {bills.map((bill, index) => {
              const active = selectedId === bill.id;
              const previousDate = index > 0 ? bills[index - 1]?.date : '';
              const dateKey = bill.date || UNKNOWN_DATE_KEY;
              const isCollapsed = collapsedDates[dateKey] === true;
              const showDateRow = bill.date !== previousDate;
              return (
                <Fragment key={bill.id}>
                  {showDateRow && (
                    <tr>
                      <td colSpan={onDelete ? 6 : 5} className="border-b border-r border-slate-300 bg-slate-200 p-0 text-[11px] font-black text-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleDate(bill.date)}
                          className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-slate-300"
                        >
                          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                          <span>Ngày {bill.date || 'Không rõ'}</span>
                        </button>
                      </td>
                    </tr>
                  )}
                  {!isCollapsed && <tr className={clsx(active ? 'bg-primary text-white' : 'bg-white hover:bg-blue-50')}>
                    <td className="border-b border-r border-slate-300 p-0">
                      <button type="button" onClick={() => onSelect(bill)} className="block w-full px-2 py-1.5 text-left font-black">
                        <span className="block truncate">{bill.waybill_code}</span>
                      </button>
                    </td>
                    <td className="border-b border-r border-slate-300 px-1.5 py-1.5 text-right font-black tabular-nums">
                      {bill.package_count}
                    </td>
                    <td className="border-b border-r border-slate-300 px-2 py-1.5 font-bold">
                      <span className="block max-w-14 truncate" title={bill.destination}>{bill.destination || '—'}</span>
                    </td>
                    <td className="border-b border-r border-slate-300 px-2 py-1.5 font-bold">
                      <span className="block max-w-[198px] truncate" title={[bill.senderName, bill.customerCode].filter(Boolean).join(' / ')}>
                        {bill.senderName || '—'}{bill.customerCode ? ` / ${bill.customerCode}` : ''}
                      </span>
                    </td>
                    <td className="border-b border-r border-slate-300 px-2 py-1.5 text-right font-black tabular-nums">
                      {formatMoney(bill.collectOnDelivery)}
                    </td>
                    {onDelete && (
                      <td className="border-b border-slate-300 p-0">
                        <button
                          type="button"
                          title={`Xóa ${bill.waybill_code}`}
                          disabled={!canDelete || isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(bill);
                          }}
                          className={clsx(
                            'flex h-full min-h-7 w-7 shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                            active ? 'text-white hover:bg-red-500' : 'text-red-500 hover:bg-red-50',
                          )}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>}
                </Fragment>
              );
            })}
            {Array.from({ length: Math.max(0, 18 - bills.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td colSpan={onDelete ? 6 : 5} className="h-7 border-b border-r border-slate-200 bg-white" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

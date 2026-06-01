import { clsx } from 'clsx';
import type { BillListItem } from '../orderFormTypes';

interface Props {
  bills: BillListItem[];
  selectedId: string | null;
  onSelect: (bill: BillListItem) => void;
}

export default function BillListSidebar({ bills, selectedId, onSelect }: Props) {
  return (
    <aside className="flex w-[148px] shrink-0 flex-col border-l border-slate-300 bg-slate-50">
      <div className="border-b border-slate-300 bg-slate-100 px-2 py-1.5 text-center text-[12px] font-extrabold text-slate-800">
        Số bill
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[12px]">
          <tbody>
            {bills.map((bill) => {
              const active = selectedId === bill.id;
              return (
                <tr key={bill.id}>
                  <td className="border-b border-r border-slate-300 p-0">
                    <button
                      type="button"
                      onClick={() => onSelect(bill)}
                      className={clsx(
                        'flex w-full items-center gap-1.5 px-2 py-1.5 text-left font-bold transition-colors',
                        active ? 'bg-primary text-white' : 'bg-white text-foreground hover:bg-blue-50',
                      )}
                    >
                      <span className={clsx('shrink-0 tabular-nums', active ? 'text-white/90' : 'text-muted-foreground')}>
                        {bill.package_count}
                      </span>
                      <span className="min-w-0 truncate">{bill.waybill_code}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {Array.from({ length: Math.max(0, 18 - bills.length) }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="h-8 border-b border-r border-slate-200 bg-white" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

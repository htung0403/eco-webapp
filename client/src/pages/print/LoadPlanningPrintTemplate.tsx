import type { LoadPlanningPrintPayload } from './loadPlanningPrintUtils';

interface Props {
  data: LoadPlanningPrintPayload;
}

export default function LoadPlanningPrintTemplate({ data }: Props) {
  const numericCols = new Set(['position', 'package_count', 'freight']);
  const firstDataCol = data.columns[0]?.id;

  return (
    <div className="inventory-stock-sheet">
      <h1 className="inventory-stock-title">{data.title}</h1>
      <p className="inventory-stock-meta">
        In lúc: {data.printedAt}
        {data.filterSummary ? ` · ${data.filterSummary}` : ''}
      </p>
      <table className="inventory-stock-table inventory-stock-table--dispatch">
        <thead>
          <tr>
            <th className="col-stt">STT</th>
            {data.columns.map((col) => (
              <th key={col.id} className={`col-${col.id}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={idx}>
              <td className="col-stt col-center">{idx + 1}</td>
              {data.columns.map((col) => (
                <td key={col.id} className={`col-${col.id} ${numericCols.has(col.id) ? 'col-right' : ''}`}>
                  {row[col.id] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="inventory-total-row">
            <td className="col-stt col-center font-bold">Σ</td>
            {data.columns.map((col) => {
              if (col.id === firstDataCol) return <td key={col.id} className="font-bold">Tổng cộng</td>;
              if (col.id === 'package_count') return <td key={col.id} className="col-right font-bold">{data.totals.package_count}</td>;
              if (col.id === 'freight' && data.showPricing) return <td key={col.id} className="col-right font-bold">{data.totals.freight}</td>;
              return <td key={col.id} />;
            })}
          </tr>
        </tfoot>
      </table>
      <p className="inventory-stock-footer">
        Tổng kiện: {data.totals.package_count} · Tổng kg: {data.totals.weight_kg}
        {data.showPricing && data.totals.freight ? ` · Tổng cước: ${data.totals.freight} đ` : ''}
      </p>
    </div>
  );
}

import type { InventoryPrintPayload } from './inventoryPrintUtils';

interface Props {
  data: InventoryPrintPayload;
}

const HEADERS = [
  'Vị trí hàng',
  'Ngày bốc',
  'Mã Tỉnh',
  'Tên CTY',
  'DV',
  'Mặt Hàng',
  'Nơi Trả',
  'Số Lượng',
  '',
  'Người nhận',
  'Kế hoạch',
  'Tổng bộ thu khách',
  'Cước',
  'Lái xe thu hộ',
  'BC thu hộ',
  'Mã Bill',
  'Ghi chú',
  'kg',
  'm3',
] as const;

const COLUMNS = [
  'col-location',
  'col-date',
  'col-province',
  'col-company',
  'col-service',
  'col-item',
  'col-place',
  'col-qty',
  'col-unit',
  'col-recipient',
  'col-plan',
  'col-money',
  'col-fee',
  'col-driver',
  'col-post',
  'col-bill',
  'col-note',
  'col-kg',
  'col-m3',
] as const;

export default function InventoryStockListTemplate({ data }: Props) {
  const { rows, totals, showPricing } = data;

  return (
    <div className="inventory-stock-sheet">
      <h1 className="inventory-stock-title">Bảng kê phát hàng ECO</h1>
      <p className="inventory-stock-meta">
        In lúc: {data.printedAt}
        {data.filterSummary ? ` · ${data.filterSummary}` : ''}
      </p>
      <table className="inventory-stock-table">
        <colgroup>
          {COLUMNS.map((column) => (
            <col key={column} className={column} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {HEADERS.map((h, i) => (
              <th key={`${h}-${i}`} className={COLUMNS[i]}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.maBill}-${idx}`}>
              <td className={COLUMNS[0]}>{row.viTriHang}</td>
              <td className={`${COLUMNS[1]} col-center`}>{row.ngayBoc}</td>
              <td className={COLUMNS[2]}>{row.maTinh}</td>
              <td className={COLUMNS[3]}>{row.tenCty}</td>
              <td className={`${COLUMNS[4]} col-center`}>{row.dv}</td>
              <td className={COLUMNS[5]}>{row.matHang}</td>
              <td className={COLUMNS[6]}>{row.noiTra}</td>
              <td className={`${COLUMNS[7]} col-center`}>{row.soLuong}</td>
              <td className={`${COLUMNS[8]} col-center`}>{row.donVi}</td>
              <td className={`${COLUMNS[9]} recipient-cell`}>
                {row.nguoiNhanPhone ? <div className="phone">{row.nguoiNhanPhone}</div> : null}
                <div>{row.nguoiNhanDiaChi}</div>
              </td>
              <td className={COLUMNS[10]}>{row.keHoach}</td>
              <td className={`${COLUMNS[11]} col-right`}>{row.tongBoThuKhach}</td>
              <td className={`${COLUMNS[12]} col-right`}>{showPricing ? row.cuoc : ''}</td>
              <td className={COLUMNS[13]}>{row.laiXeThuHo}</td>
              <td className={COLUMNS[14]}>{row.bcThuHo}</td>
              <td className={`${COLUMNS[15]} col-center`}>{row.maBill}</td>
              <td className={COLUMNS[16]}>{row.ghiChu}</td>
              <td className={`${COLUMNS[17]} col-right`}>{row.kg}</td>
              <td className={`${COLUMNS[18]} col-right`}>{row.m3}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7} className="col-right">
              Tổng
            </td>
            <td className="col-center">{totals.soLuong}</td>
            <td className="col-center">kiện</td>
            <td />
            <td />
            <td className="col-right">{totals.tongBoThuKhach.toLocaleString('vi-VN')}</td>
            <td className="col-right">{showPricing ? totals.cuoc.toLocaleString('vi-VN') : ''}</td>
            <td colSpan={2} />
            <td />
            <td />
            <td className="col-right">{Math.round(totals.kg)}</td>
            <td className="col-right">{totals.m3.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

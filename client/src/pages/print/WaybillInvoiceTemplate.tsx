import type { WaybillPrintData } from './waybillPrintUtils';

export const WAYBILL_PRINT_LOGO_SRC = '/z7901426682318_7c6139835f49e94fff8a3f239aaea0b8.jpg';

interface Props {
  data: WaybillPrintData;
}

const value = (text?: string) => text || '\u00A0';

function Line({ label, value: text, strong }: { label: string; value?: string; strong?: boolean }) {
  return (
    <div className="bill-line">
      <span className="bill-label">{label}</span>
      <span className={strong ? 'bill-value bill-value-strong' : 'bill-value'}>{value(text)}</span>
    </div>
  );
}

function PairLine({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue?: string;
  rightLabel: string;
  rightValue?: string;
}) {
  return (
    <div className="bill-pair-line">
      <Line label={leftLabel} value={leftValue} />
      <Line label={rightLabel} value={rightValue} />
    </div>
  );
}

export default function WaybillInvoiceTemplate({ data }: Props) {
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(data.waybillCode)}&scale=2&height=8&includetext=false`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=78x78&data=${encodeURIComponent(data.waybillCode)}`;
  const hasPricing = data.showPricing;

  return (
    <section className="waybill-invoice">
      <header className="bill-header">
        <div className="bill-brand">
          <img src={WAYBILL_PRINT_LOGO_SRC} alt="ECO Express" className="bill-logo" />
        </div>
        <div className="bill-title-block">
          <h1>VẬN TẢI ECO</h1>
          <p>VẬN CHUYỂN HÀNG HOÁ BẮC - NAM</p>
          <b>Hotline 0946 936 999 - 0888.805.625</b>
        </div>
        <div className="bill-barcode">
          <img src={barcodeUrl} alt="" />
          <strong>{data.waybillCode}</strong>
        </div>
      </header>

      <main className="bill-grid">
        <section className="bill-panel">
          <div className="bill-two-cols">
            <Line label="Mã KH gửi:" value={data.maKhGui} strong />
            <Line label="Mã BC gửi:" value={data.maBcGui} strong />
          </div>
          <Line label="Tên khách gửi:" value={data.tenKhGui} />
          <Line label="Địa chỉ:" value={data.diaChiGui} />
          <PairLine leftLabel="Quận/ Huyện:" leftValue={data.quanHuyenGui} rightLabel="Tỉnh/ TP:" rightValue={data.tinhGui} />
          <PairLine leftLabel="Số điện thoại:" leftValue={data.sdtGui} rightLabel="Tên liên hệ:" rightValue={data.lienHeGui} />

          <div className="goods-title">
            <span>Mô tả hàng hoá:</span>
            <strong>{value(data.moTaHang)}</strong>
          </div>

          <table className="goods-table">
            <thead>
              <tr>
                <th>Số kiện</th>
                <th>Trọng lượng thực</th>
                <th>Trọng lượng quy đổi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.soKien}</td>
                <td>{data.trongLuongThuc}</td>
                <td>{data.trongLuongQuyDoi}</td>
              </tr>
            </tbody>
          </table>

          <div className="goods-note-row">
            <div className="note-box">
              <span>Ghi chú</span>
              <div className="paid-stamp">ECO</div>
            </div>
            <div className="content-box">
              <span>Nội dung hàng hoá</span>
              <strong>{value(data.noiDungHang)}</strong>
            </div>
          </div>
        </section>

        <section className="bill-panel">
          <div className="bill-two-cols">
            <Line label="Mã KH nhận:" value={data.maKhNhan} />
            <Line label="Mã BC nhận:" value={data.maBcNhan} strong />
          </div>
          <Line label="Tên khách nhận:" value={data.tenKhNhan} />
          <Line label="Địa chỉ:" value={data.diaChiNhan} />
          <PairLine leftLabel="Quận/ Huyện:" leftValue={data.quanHuyenNhan} rightLabel="Tỉnh/ TP:" rightValue={data.tinhNhan} />
          <PairLine leftLabel="Số điện thoại:" leftValue={data.sdtNhan} rightLabel="Tên liên hệ:" rightValue={data.lienHeNhan} />

          <div className="right-body-grid">
            <div className="payment-box">
              <div className="payment-heading">Hình thức thanh toán</div>
              <div className="payment-value">{value(data.hinhThucThanhToan)}</div>
              <Line label="Thu hộ:" value={data.thuHo || '0'} />
              <Line label="Khai giá:" value={data.khaiGia} />
              <Line label="Ngày giờ gửi:" value={data.ngayGioGui} />
              <div className="sender-sign">
                <span>Họ tên và chữ ký người gửi</span>
              </div>
            </div>

            <div className="fee-box">
              <Line label="Cước chính:" value={hasPricing ? data.cuocChinh : ''} />
              <Line label="Dịch vụ cộng thêm:" value={hasPricing ? data.dichVuCongThem : ''} />
              <Line label="Tổng cước:" value={hasPricing ? data.tongCuoc : ''} />
              <div className="collect-box">
                <span>Tổng phải thu khi phát thư</span>
                <strong>{hasPricing ? data.tongPhaiThuPhat : ''}</strong>
              </div>
              <Line label="Ngày giờ nhận:" value="" />
              <div className="receiver-sign">
                <span>Họ tên và chữ ký người nhận</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bill-footer">
        <div className="service-box">
          <Line label="Dịch vụ:" value={data.dichVu} strong />
          <Line label="D.vụ gtgt:" value={data.dvGtgt} />
          <p>Quý khách vui lòng quét mã QR để xem chính sách đền bù và điều kiện chuyển phát</p>
        </div>
        <div className="qr-box">
          <img src={qrUrl} alt="QR" />
        </div>
        <div className="employee-box">
          <div>Mã nhân viên nhận</div>
          <label><span /> Chuyển hoàn</label>
        </div>
        <div className="employee-box">
          <div>Mã nhân viên phát</div>
          <label><span /> Huỷ</label>
        </div>
      </footer>
    </section>
  );
}

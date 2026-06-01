import type { WaybillPrintData } from './waybillPrintUtils';

const Cell = ({ label, value, colSpan }: { label: string; value?: string; colSpan?: number }) => (
  <td colSpan={colSpan}>
    <span className="cell-label">{label}</span>{' '}
    <span className="cell-value">{value || '\u00A0'}</span>
  </td>
);

interface Props {
  data: WaybillPrintData;
}

export default function WaybillInvoiceTemplate({ data }: Props) {
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(data.waybillCode)}&scale=2&height=8&includetext=false`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(data.waybillCode)}`;

  return (
    <div className="waybill-invoice">
      <table>
        <tbody>
          {/* Header */}
          <tr>
            <td style={{ width: '16%' }}>
              <div style={{ padding: 4 }}>
                <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>ECO</div>
                <div className="logo-tagline">Express &amp; Exacting</div>
              </div>
            </td>
            <td colSpan={4}>
              <div className="header-title">VẬN TẢI ECO</div>
              <div className="header-sub">VẬN CHUYỂN HÀNG HOÁ BẮC - NAM</div>
              <div className="header-hotline">Hotline 0946 936 999 - 0888.805.625</div>
            </td>
            <td style={{ width: '20%' }}>
              <div className="barcode-box">
                <img src={barcodeUrl} alt="" className="barcode-img" />
                <div className="barcode-text">{data.waybillCode}</div>
              </div>
            </td>
          </tr>

          {/* Gửi / Nhận */}
          <tr>
            <td colSpan={3} className="section-title">
              Gửi
            </td>
            <td colSpan={3} className="section-title">
              Nhận
            </td>
          </tr>
          <tr>
            <Cell label="Mã KH gửi:" value={data.maKhGui} colSpan={1} />
            <Cell label="Mã BC gửi:" value={data.maBcGui} colSpan={2} />
            <Cell label="Mã KH nhận:" value={data.maKhNhan} colSpan={1} />
            <Cell label="Mã BC nhận:" value={data.maBcNhan} colSpan={2} />
          </tr>
          <tr>
            <td colSpan={3}>
              <span className="cell-label">Tên khách gửi:</span>{' '}
              <span className="cell-value">{data.tenKhGui || '\u00A0'}</span>
            </td>
            <td colSpan={3}>
              <span className="cell-label">Tên khách nhận:</span>{' '}
              <span className="cell-value">{data.tenKhNhan || '\u00A0'}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <span className="cell-label">Địa chỉ:</span> <span className="cell-value">{data.diaChiGui || '\u00A0'}</span>
            </td>
            <td colSpan={3}>
              <span className="cell-label">Địa chỉ:</span>{' '}
              <span className="cell-value">{data.diaChiNhan || '\u00A0'}</span>
            </td>
          </tr>
          <tr>
            <Cell label="Quận/ Huyện:" value={data.quanHuyenGui} />
            <Cell label="Tỉnh/ TP:" value={data.tinhGui} colSpan={2} />
            <Cell label="Quận/ Huyện:" value={data.quanHuyenNhan} />
            <Cell label="Tỉnh/ TP:" value={data.tinhNhan} colSpan={2} />
          </tr>
          <tr>
            <Cell label="Số điện thoại:" value={data.sdtGui} />
            <Cell label="Tên liên hệ:" value={data.lienHeGui} colSpan={2} />
            <Cell label="Số điện thoại:" value={data.sdtNhan} />
            <Cell label="Tên liên hệ:" value={data.lienHeNhan} colSpan={2} />
          </tr>

          {/* Hàng hóa */}
          <tr>
            <td colSpan={3}>
              <span className="cell-label">Mô tả hàng hoá:</span>{' '}
              <span className="cell-value">{data.moTaHang || '\u00A0'}</span>
            </td>
            <td rowSpan={6} colSpan={3} style={{ padding: 0, verticalAlign: 'top' }}>
              <table style={{ width: '100%', height: '100%', border: 'none' }}>
                <tbody>
                  <tr>
                    <td colSpan={2} className="pay-banner" style={{ border: '1px solid #000' }}>
                      Hình thức thanh toán
                      <br />
                      {data.hinhThucThanhToan}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Thu hộ:</span>{' '}
                      <span className="cell-value">{data.thuHo}</span>
                    </td>
                    <td style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Khai giá:</span> <span className="cell-value">{data.khaiGia || '\u00A0'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Ngày giờ gửi:</span>{' '}
                      <span className="cell-value">{data.ngayGioGui || '\u00A0'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', minHeight: 36 }} className="sign-area">
                      <span className="cell-label">Họ tên và chữ ký người gửi:</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Cước chính:</span>{' '}
                      <span className="cell-value">{data.showPricing ? data.cuocChinh : '\u00A0'}</span>
                    </td>
                    <td style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Dịch vụ cộng thêm:</span>{' '}
                      <span className="cell-value">{data.dichVuCongThem || '\u00A0'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Tổng cước:</span>{' '}
                      <span className="cell-value">{data.showPricing ? data.tongCuoc : '\u00A0'}</span>
                    </td>
                    <td style={{ border: '1px solid #000' }} className="total-collect">
                      Tổng phải thu khi phát thư
                      <br />
                      <span style={{ fontSize: '12pt' }}>{data.tongPhaiThuPhat}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000' }}>
                      <span className="cell-label">Ngày giờ nhận:</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', minHeight: 32 }} className="sign-area">
                      <span className="cell-label">Họ tên và chữ ký người nhận:</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <th>Số kiện</th>
            <th>Trọng lượng thực</th>
            <th>Trọng lượng quy đổi</th>
          </tr>
          <tr>
            <td className="cell-value" style={{ textAlign: 'center' }}>
              {data.soKien}
            </td>
            <td className="cell-value" style={{ textAlign: 'center' }}>
              {data.trongLuongThuc}
            </td>
            <td className="cell-value" style={{ textAlign: 'center' }}>
              {data.trongLuongQuyDoi}
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <span className="cell-label">Ghi chú:</span> <span className="cell-value">{data.ghiChu || '\u00A0'}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <span className="cell-label">Nội dung hàng hoá:</span>{' '}
              <span className="cell-value">{data.noiDungHang || '\u00A0'}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ height: 8, border: 'none' }} />
          </tr>

          {/* Footer */}
          <tr>
            <td colSpan={2} style={{ verticalAlign: 'top' }}>
              <div>
                <span className="cell-label">Dịch vụ:</span> <span className="cell-value">{data.dichVu}</span>
              </div>
              <div>
                <span className="cell-label">D.vụ gtgt:</span> <span className="cell-value">{data.dvGtgt}</span>
              </div>
              <p className="footer-small">
                Quý khách vui lòng quét mã QR để xem chính sách đền bù và điều kiện chuyển phát
              </p>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
              <img src={qrUrl} alt="QR" width={72} height={72} />
            </td>
            <td colSpan={3}>
              <div>
                <span className="cell-label">Mã nhân viên nhận:</span>
              </div>
              <div className="checkbox-line">[ ] Chuyển hoàn</div>
              <div className="checkbox-line">[ ] Huỷ</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

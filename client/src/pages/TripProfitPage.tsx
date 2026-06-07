import FinanceCashJournalPage from './FinanceCashJournalPage';

export default function TripProfitPage() {
  return (
    <FinanceCashJournalPage
      defaultTab="bill"
      hideTabs
      accessMode="bill"
      pageTitle="Lãi/lỗ tạm tính chuyến"
      pageSubtitle="Theo dõi hiệu quả chi phí chuyến xe từ phiếu thu/chi bill."
      netSummaryLabel="Lãi/lỗ tạm tính"
    />
  );
}

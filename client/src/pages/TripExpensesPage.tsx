import { useParams } from 'react-router-dom';
import FinanceCashJournalPage from './FinanceCashJournalPage';

export default function TripExpensesPage() {
  const { id } = useParams();
  const tripId = id?.trim() || undefined;

  return (
    <FinanceCashJournalPage
      defaultTab="vendor"
      hideTabs
      accessMode="vendor"
      enableVendorBulkDelete
      tripId={tripId}
      pageTitle="Chi phí phát sinh chuyến"
      pageSubtitle="Ghi nhận dầu và chi phí dọc đường từ phiếu chi NCC."
    />
  );
}

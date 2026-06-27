import { useMemo } from 'react';
import { IncomingTripTable } from './warehouse/incoming/IncomingTripTable';
import { IncomingTripsPageLayout } from './warehouse/incoming/IncomingTripsPageLayout';
import { IncomingTripDeleteDialog } from './warehouse/incoming/dialogs/IncomingTripDeleteDialog';
import { IncomingTripDetailDialog } from './warehouse/incoming/dialogs/IncomingTripDetailDialog';
import { IncomingTripPaymentDialog } from './warehouse/incoming/dialogs/IncomingTripPaymentDialog';
import {
  filterArrivedTripsByOrigin,
  isArrivedTrip,
} from './warehouse/incoming/incomingTripUtils';
import { useIncomingTripActions } from './warehouse/incoming/useIncomingTripActions';
import { useIncomingTrips } from './warehouse/incoming/useIncomingTrips';

export default function WarehouseIncomingHcmPage() {
  const { trips, isLoading, error, updatedAt, refresh } = useIncomingTrips({ queryHubCode: 'HCM' });
  const actions = useIncomingTripActions(refresh);
  const arrivedTrips = useMemo(() => trips.filter(isArrivedTrip), [trips]);
  const tripsFromHcm = useMemo(() => filterArrivedTripsByOrigin(arrivedTrips, 'HCM'), [arrivedTrips]);
  const viewTrip = useMemo(() => {
    if (!actions.viewTrip) return null;
    return tripsFromHcm.find((item) => String(item.id) === String(actions.viewTrip?.id)) ?? actions.viewTrip;
  }, [actions.viewTrip, tripsFromHcm]);

  return (
    <>
      <IncomingTripsPageLayout
        title="incoming_hcm"
        subtitle="Xe đã đến tại bưu cục TP.HCM, xuất phát từ TP.HCM."
        isLoading={isLoading}
        error={error}
        updatedAt={updatedAt}
      >
        <IncomingTripTable
          trips={tripsFromHcm}
          emptyText="Chưa có xe đã đến từ TP.HCM."
          showOriginColumn={false}
          canDelete={actions.canDelete}
          canPay={actions.canPay}
          onView={actions.handleView}
          onEdit={actions.handleEdit}
          onDelete={actions.handleDelete}
          onPayment={actions.handlePayment}
        />
      </IncomingTripsPageLayout>

      <IncomingTripDeleteDialog
        trip={actions.deleteTrip}
        isSubmitting={actions.isSubmitting}
        error={actions.actionError}
        onClose={actions.closeDelete}
        onConfirm={() => void actions.confirmDelete()}
      />
      <IncomingTripPaymentDialog
        trip={actions.paymentTrip}
        isSubmitting={actions.isSubmitting}
        error={actions.actionError}
        onClose={actions.closePayment}
        onConfirm={(payload) => void actions.confirmPayment(payload)}
      />
      <IncomingTripDetailDialog
        trip={viewTrip}
        onClose={actions.closeView}
      />
    </>
  );
}

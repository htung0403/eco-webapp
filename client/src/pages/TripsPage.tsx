import LoadPlanningBoardPanel from './warehouse/load-planning/LoadPlanningBoardPanel';

export default function TripsPage() {
  return (
    <LoadPlanningBoardPanel
      bannerTitle="Danh sách chuyến xe"
      bannerDescription="Theo dõi hàng đã phân lên từng xe, cập nhật trạng thái bốc hàng (Chờ bốc → Đã bốc → Đã di chuyển → Đã tới)."
    />
  );
}

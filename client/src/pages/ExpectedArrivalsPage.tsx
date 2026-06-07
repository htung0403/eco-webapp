import LoadPlanningBoardPanel from './warehouse/load-planning/LoadPlanningBoardPanel';

export default function ExpectedArrivalsPage() {
  return (
    <LoadPlanningBoardPanel
      bannerTitle="Dự kiến hàng đến · đang vận chuyển"
      bannerDescription="Dùng cùng view phân loại ưu tiên, chỉ hiển thị các dòng có trạng thái Đang vận chuyển. Bấm trạng thái trên từng dòng để chuyển sang trạng thái tiếp theo khi cần."
      forcedLoadStatuses={['IN_TRANSIT']}
    />
  );
}

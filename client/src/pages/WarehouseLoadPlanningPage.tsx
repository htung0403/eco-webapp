import { useMemo } from 'react';
import type { AuthUserProfile } from './login/types';
import LoadPlanningBoardPanel from './warehouse/load-planning/LoadPlanningBoardPanel';

const USER_PROFILE_KEY = 'eco_user_profile';
const MANAGER = 32;
const DIRECTOR = 64;

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUserProfile; } catch { return null; }
};

export default function WarehouseLoadPlanningPage() {
  const user = useMemo(getStoredUser, []);
  const allowed = ((user?.role_mask ?? 0) & (MANAGER | DIRECTOR)) !== 0;

  if (!allowed) return null;

  return (
    <LoadPlanningBoardPanel
      bannerTitle="Đóng xếp hàng theo xe"
      bannerDescription="Đơn đã phân xe tại tiếp nhận / tồn kho sẽ hiện theo từng biển số bên dưới."
      showManifestButton
    />
  );
}

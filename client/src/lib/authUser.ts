import type { AuthUserProfile } from '../pages/login/types';

export const USER_PROFILE_KEY = 'eco_user_profile';

export function getStoredAuthUser(): AuthUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
}

/** Tên đăng nhập (username), không dùng họ tên hiển thị. */
export function getLoginDisplayName(user: AuthUserProfile | null): string {
  return user?.username?.trim() || user?.email?.trim() || 'bạn';
}

export function getGreetingPeriod(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'buổi sáng';
  if (hour < 18) return 'buổi chiều';
  return 'buổi tối';
}

export type AttendanceRecord = {
  userId: string;
  checkIn?: string;
  checkOut?: string;
};

export type AttendanceDayStore = Record<string, AttendanceRecord>;

const storageKey = (date: string) => `eco_hr_attendance_${date}`;

export const loadAttendanceForDate = (date: string): AttendanceDayStore => {
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (!raw) return {};
    return JSON.parse(raw) as AttendanceDayStore;
  } catch {
    return {};
  }
};

export const saveAttendanceForDate = (date: string, store: AttendanceDayStore) => {
  localStorage.setItem(storageKey(date), JSON.stringify(store));
};

export const formatTimeNow = () => {
  const now = new Date();
  return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

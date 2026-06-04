import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { apiRequest, ApiError } from '../../lib/api';
import type { AuthUserProfile } from '../login/types';
import type { UserAccount } from '../admin/users/types';
import { hasManagerRole, normalizeUserList } from '../../lib/userNormalize';
import { HubBadgeList } from '../admin/users/UserDisplay';
import {
  formatTimeNow,
  loadAttendanceForDate,
  saveAttendanceForDate,
  type AttendanceDayStore,
} from './attendanceStorage';

const USER_PROFILE_KEY = 'eco_user_profile';

const getStoredUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(USER_PROFILE_KEY) || sessionStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
};

const todayIso = () => new Date().toISOString().slice(0, 10);

type AttendanceStatus = 'present' | 'partial' | 'absent';

const getStatus = (record?: { checkIn?: string; checkOut?: string }): AttendanceStatus => {
  if (record?.checkIn && record?.checkOut) return 'present';
  if (record?.checkIn || record?.checkOut) return 'partial';
  return 'absent';
};

const statusLabel: Record<AttendanceStatus, string> = {
  present: 'Đủ công',
  partial: 'Chưa đủ',
  absent: 'Vắng',
};

const statusClass: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  absent: 'bg-slate-100 text-slate-600',
};

export default function HrAttendancePage() {
  const currentUser = useMemo(getStoredUser, []);
  const canView = hasManagerRole(currentUser?.role_mask);
  const [workDate, setWorkDate] = useState(todayIso);
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDayStore>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiRequest<unknown>('/users?limit=100');
      setUsers(normalizeUserList(payload).users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    void loadUsers();
  }, [canView, loadUsers]);

  useEffect(() => {
    setAttendance(loadAttendanceForDate(workDate));
  }, [workDate]);

  const persist = (next: AttendanceDayStore) => {
    setAttendance(next);
    saveAttendanceForDate(workDate, next);
  };

  const recordCheckIn = (userId: string | number) => {
    const key = String(userId);
    const current = attendance[key];
    if (current?.checkIn) return;
    persist({
      ...attendance,
      [key]: { userId: key, checkIn: formatTimeNow(), checkOut: current?.checkOut },
    });
  };

  const recordCheckOut = (userId: string | number) => {
    const key = String(userId);
    const current = attendance[key];
    if (!current?.checkIn) return;
    if (current.checkOut) return;
    persist({
      ...attendance,
      [key]: { userId: key, checkIn: current.checkIn, checkOut: formatTimeNow() },
    });
  };

  const clearRecord = (userId: string | number) => {
    const key = String(userId);
    const next = { ...attendance };
    delete next[key];
    persist(next);
  };

  const filteredUsers = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q) ||
        user.phone?.toLowerCase().includes(q),
    );
  }, [users, keyword]);

  const stats = useMemo(() => {
    let present = 0;
    let partial = 0;
    let absent = 0;
    filteredUsers.forEach((user) => {
      const status = getStatus(attendance[String(user.id)]);
      if (status === 'present') present += 1;
      else if (status === 'partial') partial += 1;
      else absent += 1;
    });
    return { present, partial, absent, total: filteredUsers.length };
  }, [filteredUsers, attendance]);

  if (!canView) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <div className="bg-white rounded-2xl border border-border shadow-sm flex-1 min-h-0 flex flex-col">
          <StateBlock
            icon={<AlertTriangle size={24} />}
            title="Không có quyền truy cập"
            description="Chấm công chỉ dành cho MANAGER hoặc DIRECTOR."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Tổng nhân sự" value={stats.total} tone="blue" />
        <StatCard icon={<CheckCircle2 size={18} />} label="Đủ công" value={stats.present} tone="green" />
        <StatCard icon={<Clock size={18} />} label="Chưa đủ" value={stats.partial} tone="amber" />
        <StatCard icon={<UserCheck size={18} />} label="Chưa chấm" value={stats.absent} tone="slate" />
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-3 border-b border-border shrink-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => history.back()}
              className="h-10 rounded-xl border border-border px-3 text-[13px] font-bold hover:bg-muted"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-[15px] font-extrabold text-foreground">Chấm công</h1>
            <label className="flex items-center gap-2 h-10 rounded-xl border border-border px-3 text-[13px] font-medium">
              <Calendar size={16} className="text-muted-foreground shrink-0" />
              <input
                type="date"
                value={workDate}
                max={todayIso()}
                onChange={(e) => setWorkDate(e.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm tên, username..."
                className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-[13px] font-medium outline-none focus:border-primary"
              />
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Dữ liệu chấm công lưu tạm trên trình duyệt theo ngày. Khi có bảng attendance trên server sẽ đồng bộ API.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {loading ? (
            <StateBlock
              icon={<Loader2 className="animate-spin" size={24} />}
              title="Đang tải nhân sự"
              description="Đang cập nhật danh sách nhân sự mới nhất."
            />
          ) : error ? (
            <StateBlock icon={<AlertTriangle size={24} />} title="Không tải được dữ liệu" description={error} />
          ) : !filteredUsers.length ? (
            <StateBlock
              icon={<Users size={24} />}
              title="Không có nhân sự"
              description="Thử đổi từ khóa tìm kiếm."
            />
          ) : (
            <>
              <table className="hidden md:table w-full min-w-[960px] text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {['Nhân viên', 'Bưu cục', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="border-b border-border px-4 py-3 font-extrabold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[13px]">
                  {filteredUsers.map((user) => {
                    const record = attendance[String(user.id)];
                    const status = getStatus(record);
                    return (
                      <tr key={user.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-foreground">{user.name}</div>
                          <div className="text-[12px] text-muted-foreground">{user.username}</div>
                        </td>
                        <td className="px-4 py-3">
                          <HubBadgeList user={user} />
                        </td>
                        <td className="px-4 py-3 font-bold">{record?.checkIn || '—'}</td>
                        <td className="px-4 py-3 font-bold">{record?.checkOut || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              'inline-flex rounded-full px-2 py-1 text-[11px] font-extrabold',
                              statusClass[status],
                            )}
                          >
                            {statusLabel[status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <ActionButton
                              icon={<LogIn size={14} />}
                              label="Vào"
                              disabled={!!record?.checkIn}
                              onClick={() => recordCheckIn(user.id)}
                            />
                            <ActionButton
                              icon={<LogOut size={14} />}
                              label="Ra"
                              disabled={!record?.checkIn || !!record?.checkOut}
                              onClick={() => recordCheckOut(user.id)}
                            />
                            {(record?.checkIn || record?.checkOut) && (
                              <ActionButton
                                icon={<Clock size={14} />}
                                label="Xóa"
                                danger
                                onClick={() => clearRecord(user.id)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="grid gap-3 p-3 md:hidden">
                {filteredUsers.map((user) => {
                  const record = attendance[String(user.id)];
                  const status = getStatus(record);
                  return (
                    <div key={user.id} className="rounded-2xl border border-border p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[15px] font-extrabold">{user.name}</div>
                          <div className="text-[12px] text-muted-foreground">{user.username}</div>
                        </div>
                        <span
                          className={clsx(
                            'rounded-full px-2 py-1 text-[11px] font-extrabold',
                            statusClass[status],
                          )}
                        >
                          {statusLabel[status]}
                        </span>
                      </div>
                      <div className="mt-2 text-[13px]">
                        <span className="text-muted-foreground">Vào:</span>{' '}
                        <b>{record?.checkIn || '—'}</b>
                        <span className="mx-2 text-border">|</span>
                        <span className="text-muted-foreground">Ra:</span>{' '}
                        <b>{record?.checkOut || '—'}</b>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <ActionButton
                          icon={<LogIn size={14} />}
                          label="Vào"
                          disabled={!!record?.checkIn}
                          onClick={() => recordCheckIn(user.id)}
                          full
                        />
                        <ActionButton
                          icon={<LogOut size={14} />}
                          label="Ra"
                          disabled={!record?.checkIn || !!record?.checkOut}
                          onClick={() => recordCheckOut(user.id)}
                          full
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'amber' | 'slate';
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className={clsx('inline-flex h-9 w-9 items-center justify-center rounded-xl', toneClass)}>
        {icon}
      </div>
      <div className="mt-2 text-[12px] font-bold text-muted-foreground">{label}</div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  disabled,
  danger,
  full,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  full?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2 text-[12px] font-bold disabled:opacity-40',
        full && 'flex-1',
        danger
          ? 'border-red-200 text-red-500 hover:bg-red-50'
          : 'border-border text-primary hover:bg-muted',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StateBlock({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-[13px] max-w-md">{description}</p>
    </div>
  );
}

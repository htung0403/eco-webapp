import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, LogIn, LogOut, MapPin, Navigation } from 'lucide-react';
import { ApiError, apiRequest } from '../../lib/api';

type AttendanceLog = {
  id: string;
  type: 'check_in' | 'check_out';
  status: 'success' | 'failed';
  distance_meters: number | null;
  accuracy: number | null;
  accuracy_warning: boolean;
  created_at: string;
  location?: AttendanceLocation | null;
};

type AttendanceLocation = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

type TodayStatus = {
  date: string;
  check_in: AttendanceLog | null;
  check_out: AttendanceLog | null;
};

type CheckResponse = {
  success: boolean;
  message: string;
  accuracy_warning: boolean;
  distance_meters: number;
  location: AttendanceLocation;
};

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

const formatTime = (value?: string | null) => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const logTypeLabel = (type: AttendanceLog['type']) => type === 'check_in' ? 'Check-in' : 'Check-out';

const gpsErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) return 'Trình duyệt đã từ chối quyền GPS. Vui lòng cấp quyền vị trí rồi thử lại.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Không lấy được vị trí hiện tại. Vui lòng kiểm tra GPS/mạng.';
  if (error.code === error.TIMEOUT) return 'Lấy vị trí quá thời gian chờ. Vui lòng thử lại ở nơi tín hiệu tốt hơn.';
  return 'Không thể lấy vị trí GPS.';
};

export default function HrAttendancePage() {
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [activeLocations, setActiveLocations] = useState<AttendanceLocation[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<AttendanceLog['type'] | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const nextAction = useMemo<AttendanceLog['type'] | null>(() => {
    if (!today?.check_in) return 'check_in';
    if (!today.check_out) return 'check_out';
    return null;
  }, [today]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [todayRes, locationsRes, logsRes] = await Promise.all([
        apiRequest<TodayStatus>('/attendance/today'),
        apiRequest<AttendanceLocation[]>('/attendance/locations/active'),
        apiRequest<{ items: AttendanceLog[] }>('/attendance/my-logs?limit=10'),
      ]);
      setToday(todayRes);
      setActiveLocations(locationsRes);
      setLogs(logsRes.items ?? []);
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ApiError ? error.message : 'Không tải được dữ liệu chấm công.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ GPS.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, geolocationOptions);
  });

  async function submitCheck(type: AttendanceLog['type']) {
    setChecking(type);
    setMessage({ tone: 'warning', text: 'Đang xin quyền GPS và lấy tọa độ hiện tại...' });
    try {
      const position = await getPosition();
      const res = await apiRequest<CheckResponse>('/attendance/check', {
        method: 'POST',
        body: {
          type,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
      });
      setMessage({
        tone: res.accuracy_warning ? 'warning' : 'success',
        text: `${res.message} Địa điểm: ${res.location.name}, khoảng cách ${Math.round(res.distance_meters)}m.`,
      });
      await loadData();
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        setMessage({ tone: 'error', text: gpsErrorMessage(error) });
      } else if (error instanceof Error && error.message === 'Trình duyệt không hỗ trợ GPS.') {
        setMessage({ tone: 'error', text: error.message });
      } else if (error instanceof ApiError) {
        const payload = error.payload as { nearestLocation?: string; nearestDistanceMeters?: number } | null;
        const nearest = payload?.nearestLocation ? ` Gần nhất: ${payload.nearestLocation} (${payload.nearestDistanceMeters}m).` : '';
        setMessage({ tone: 'error', text: `${error.message}${nearest}` });
        await loadData();
      } else {
        setMessage({ tone: 'error', text: 'Chấm công thất bại. Vui lòng thử lại.' });
      }
    } finally {
      setChecking(null);
    }
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4 md:p-6 overflow-auto custom-scrollbar">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-primary">GPS Attendance</p>
          <h1 className="text-2xl font-black text-foreground">Chấm công theo vị trí</h1>
          <p className="text-sm text-muted-foreground">Hệ thống lấy GPS trực tiếp, không dùng vị trí cache.</p>
        </div>
        <button type="button" onClick={() => void loadData()} className="h-11 rounded-xl border border-border px-4 text-[13px] font-bold hover:bg-muted sm:h-10">
          Làm mới
        </button>
      </div>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : message.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Clock size={24} /></div>
            <div>
              <h2 className="text-lg font-black">Trạng thái hôm nay</h2>
              <p className="text-sm text-muted-foreground">Mỗi ngày chỉ check-in và check-out một lần.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <StatusCard title="Check-in" value={formatTime(today?.check_in?.created_at)} done={Boolean(today?.check_in)} />
            <StatusCard title="Check-out" value={formatTime(today?.check_out?.created_at)} done={Boolean(today?.check_out)} />
          </div>

          <div className="mt-6 space-y-3">
            {nextAction ? (
              <button
                type="button"
                disabled={loading || checking !== null}
                onClick={() => void submitCheck(nextAction)}
                className="group flex min-h-[72px] w-full items-center gap-4 rounded-3xl bg-primary px-5 py-4 text-left text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 group-disabled:bg-white/40 group-disabled:ring-white/20">
                  {checking ? <Loader2 className="animate-spin" size={24} /> : nextAction === 'check_in' ? <LogIn size={24} /> : <LogOut size={24} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-white/75 group-disabled:text-slate-500">{nextAction === 'check_in' ? 'Bước 1' : 'Bước 2'}</span>
                  <span className="block text-lg font-black leading-tight">{checking ? 'Đang lấy vị trí GPS...' : nextAction === 'check_in' ? 'Check-in ngay' : 'Check-out ngay'}</span>
                  <span className="mt-1 block text-xs font-semibold text-white/80 group-disabled:text-slate-500">Hệ thống sẽ xin quyền vị trí và kiểm tra bán kính tự động.</span>
                </span>
              </button>
            ) : (
              <div className="flex min-h-[72px] items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100"><CheckCircle2 size={24} /></span>
                <span>
                  <span className="block text-lg font-black leading-tight">Đã hoàn tất hôm nay</span>
                  <span className="mt-1 block text-xs font-semibold text-emerald-700/80">Bạn đã check-in và check-out thành công.</span>
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <StepPill label="Check-in" done={Boolean(today?.check_in)} active={nextAction === 'check_in'} />
              <StepPill label="Check-out" done={Boolean(today?.check_out)} active={nextAction === 'check_out'} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><MapPin size={24} /></div>
            <div>
              <h2 className="text-lg font-black">Điểm đang hoạt động</h2>
              <p className="text-sm text-muted-foreground">Cần nằm trong bán kính của một điểm.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {activeLocations.length ? activeLocations.map((location) => (
              <div key={location.id} className="rounded-2xl border border-border p-3">
                <p className="font-bold text-foreground">{location.name}</p>
                <p className="text-xs text-muted-foreground">{location.address || 'Chưa có địa chỉ'} · Bán kính {location.radius_meters}m</p>
              </div>
            )) : <EmptyState text="Chưa có điểm chấm công hoạt động." />}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-black">Lịch sử gần đây</h2>
        </div>
        {logs.length ? (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {logs.map((log) => <LogCard key={log.id} log={log} />)}
            </div>
            <div className="hidden overflow-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>{['Thời gian', 'Loại', 'Địa điểm', 'Khoảng cách', 'GPS', 'Trạng thái'].map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => <LogRow key={log.id} log={log} />)}
                </tbody>
              </table>
            </div>
          </>
        ) : <EmptyState text="Chưa có lịch sử chấm công." />}
      </section>
    </div>
  );
}


function StepPill({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : active ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-slate-50 text-muted-foreground'}`}>
      {done ? <CheckCircle2 size={17} /> : active ? <Clock size={17} /> : <AlertTriangle size={17} />}
      {label}
    </div>
  );
}

function StatusCard({ title, value, done }: { title: string; value: string; done: boolean }) {
  return <div className="rounded-2xl border border-border bg-slate-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">{done ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertTriangle className="text-amber-500" size={18} />}{title}</div><p className="mt-2 text-2xl font-black text-foreground">{value}</p></div>;
}


function LogCard({ log }: { log: AttendanceLog }) {
  const success = log.status === 'success';
  return (
    <article className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-foreground">{logTypeLabel(log.type)}</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">{new Date(log.created_at).toLocaleString('vi-VN')}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{success ? 'Thành công' : 'Thất bại'}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoChip label="Địa điểm" value={log.location?.name ?? '—'} />
        <InfoChip label="Khoảng cách" value={log.distance_meters == null ? '—' : `${Math.round(log.distance_meters)}m`} />
        <InfoChip label="GPS" value={log.accuracy == null ? '—' : `${Math.round(log.accuracy)}m`} />
        <InfoChip label="Cảnh báo" value={log.accuracy_warning ? 'Có' : 'Không'} />
      </div>
    </article>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-white px-3 py-2"><p className="font-bold text-muted-foreground">{label}</p><p className="mt-0.5 truncate font-black text-foreground">{value}</p></div>;
}

function LogRow({ log }: { log: AttendanceLog }) {
  return <tr className="hover:bg-muted/40"><td className="px-4 py-3 font-semibold">{new Date(log.created_at).toLocaleString('vi-VN')}</td><td className="px-4 py-3">{logTypeLabel(log.type)}</td><td className="px-4 py-3">{log.location?.name ?? '—'}</td><td className="px-4 py-3">{log.distance_meters == null ? '—' : `${Math.round(log.distance_meters)}m`}</td><td className="px-4 py-3">{log.accuracy == null ? '—' : `${Math.round(log.accuracy)}m`}{log.accuracy_warning ? ' · cảnh báo' : ''}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{log.status === 'success' ? 'Thành công' : 'Thất bại'}</span></td></tr>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex items-center justify-center gap-2 p-6 text-sm font-semibold text-muted-foreground"><Navigation size={18} />{text}</div>;
}

import { clsx } from 'clsx';
import { ROLE_BITS, type UserAccount } from './types';

export function RoleBadgeList({ roleMask }: { roleMask: number }) {
  const roles = ROLE_BITS.filter(role => (roleMask & role.value) !== 0);
  return <div className="flex flex-wrap gap-1.5">{roles.length ? roles.map(role => <span key={role.value} className={clsx('rounded-full px-2 py-1 text-[11px] font-extrabold', role.value >= 32 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-700')}>{role.label}</span>) : <span className="text-muted-foreground">—</span>}</div>;
}

export function StatusBadge({ status }: { status: string | boolean }) {
  const active = status === true || String(status).toUpperCase() === 'ACTIVE' || String(status).toUpperCase() === 'ENABLED';
  return <span className={clsx('inline-flex rounded-full px-2 py-1 text-[11px] font-extrabold', active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600')}>{typeof status === 'boolean' ? (status ? 'ACTIVE' : 'INACTIVE') : status}</span>;
}

export function HubBadgeList({ user }: { user: UserAccount }) {
  const hubs = user.hubs?.length ? user.hubs : user.hub ? [user.hub] : [];
  return <div className="flex flex-wrap gap-1.5">{hubs.length ? hubs.map(hub => <span key={hub.id} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-extrabold text-amber-700">{hub.code || hub.name || hub.id}</span>) : <span className="text-muted-foreground">—</span>}</div>;
}

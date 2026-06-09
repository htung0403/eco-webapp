import type { ReactNode } from 'react';
import { clsx } from 'clsx';

const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-[13px] font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export function CompactInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}

export function CompactSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputClass, props.className)} />;
}

export function CompactField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  labelWidth?: string;
}) {
  return (
    <div className={clsx('flex min-w-0 flex-col gap-1', className)}>
      <label className="min-h-[18px] text-[12px] font-bold leading-tight text-slate-700">{label}</label>
      <div className="min-h-9 min-w-0">{children}</div>
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-300/80 bg-white p-3 shadow-sm">
      <h3 className="mb-3 border-b border-slate-200 pb-2 text-[13px] font-extrabold uppercase tracking-wide text-slate-800">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

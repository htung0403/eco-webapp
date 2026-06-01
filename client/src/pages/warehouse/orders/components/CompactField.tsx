import type { ReactNode } from 'react';
import { clsx } from 'clsx';

const inputClass =
  'h-7 w-full min-w-0 rounded border border-slate-300 bg-white px-2 text-[12px] font-medium text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20';

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
  labelWidth = 'w-[76px]',
}: {
  label: string;
  children: ReactNode;
  className?: string;
  labelWidth?: string;
}) {
  return (
    <div className={clsx('flex min-w-0 items-center gap-1.5', className)}>
      <span className={clsx('shrink-0 text-[12px] font-bold text-slate-700', labelWidth)}>{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-300/80 bg-white/95 p-2.5 shadow-sm">
      <h3 className="mb-2 border-b border-slate-200 pb-1 text-[12px] font-extrabold uppercase tracking-wide text-slate-800">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

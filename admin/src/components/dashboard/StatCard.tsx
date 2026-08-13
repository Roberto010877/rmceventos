import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: 'neutral' | 'urgent' | 'success';
  helper: string;
}

export default function StatCard({ icon: Icon, label, value, tone = 'neutral', helper }: StatCardProps) {
  const toneClasses = {
    neutral: 'bg-dorado/10 text-dorado',
    urgent: 'bg-red-500/10 text-red-500',
    success: 'bg-emerald-500/10 text-emerald-500',
  };

  const valueClass = tone === 'urgent' && value > 0 ? 'text-red-500' : 'text-[var(--text-primary)]';

  return (
    <article className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </p>
          <p className={`mt-2 font-poppins text-3xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{helper}</p>
    </article>
  );
}

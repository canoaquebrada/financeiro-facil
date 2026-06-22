export default function StatCard({ title, value, description, tone = 'blue' }) {
  const tones = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-green-500',
    red: 'from-rose-500 to-red-500',
    violet: 'from-violet-500 to-purple-600',
    slate: 'from-slate-500 to-slate-700'
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>
        <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tones[tone] || tones.blue}`} />
      </div>
      {description && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}

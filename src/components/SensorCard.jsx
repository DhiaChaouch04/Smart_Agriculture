import React from 'react';

export function SensorCard({
  title,
  sensorModel,
  value,
  unit,
  icon,
  min = 0,
  max = 100,
  status = 'normal', // 'idle' | 'normal' | 'warning' | 'critical'
  accentClass = 'bg-emerald-500/15 text-emerald-300',
  barClass = 'bg-emerald-400',
  subtitle,
}) {
  const hasValue = value !== null && value !== undefined;
  const pct = hasValue
    ? Math.min(100, Math.max(0, ((Number(value) - min) / (max - min)) * 100))
    : 0;

  const statusBadge = {
    idle: {
      label: 'En attente',
      cls: 'bg-emerald-950/80 text-emerald-200/70 border-emerald-800/70',
    },
    normal: {
      label: 'Optimal',
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    warning: {
      label: 'Attention',
      cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    critical: {
      label: 'Critique',
      cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
  }[hasValue ? status : 'idle'];

  return (
    <div className="rounded-2xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-lg shadow-black/25 transition-colors hover:border-emerald-700/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClass}`}>
            {React.createElement(icon, { className: 'h-5 w-5' })}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <span className="inline-block text-[11px] font-mono text-emerald-200/60">
              {sensorModel}
            </span>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white tabular-nums">
          {hasValue ? value : '--'}
        </span>
        <span className="text-sm font-medium text-emerald-200/70">{unit}</span>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-950">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-200/50">
          <span>{min} {unit}</span>
          <span>{subtitle}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}

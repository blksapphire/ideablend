import React from 'react';

export default function StatsGrid({ stats, columns = 4 }) {
  const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns] || 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3`}>
      {stats.map((s, i) => (
        <div key={i} className="rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark p-4 text-center">
          <div className="font-display font-bold text-xl">{s.value}</div>
          <div className="text-xs text-ink/50 dark:text-ink-dark/50 mt-1">{s.label}</div>
          {s.subtext && <div className="text-[10px] text-green-text dark:text-green-textdark mt-0.5">{s.subtext}</div>}
        </div>
      ))}
    </div>
  );
}

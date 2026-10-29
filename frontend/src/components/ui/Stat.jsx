import React from 'react';
import { cn } from '../../lib/cn';

const GRID_COLUMNS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
};

export function Stat({ value, label, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="font-display text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-2xs uppercase tracking-[0.12em] text-ui-subtle">{label}</div>
    </div>
  );
}

export function StatGroup({ children, columns = 3, className }) {
  return (
    <div className={cn('grid gap-5', GRID_COLUMNS[columns] || GRID_COLUMNS[3], className)}>
      {children}
    </div>
  );
}

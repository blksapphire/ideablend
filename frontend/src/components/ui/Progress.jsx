import React from 'react';
import { cn } from '../../lib/cn';

const TONES = {
  blue: 'bg-blue dark:bg-blue-dark',
  green: 'bg-green dark:bg-green-dark',
  neutral: 'bg-ui-fg/60'
};

const SIZES = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2'
};

export default function Progress({
  value = 0,
  max = 100,
  tone = 'blue',
  size = 'md',
  label,
  showValue = false,
  className
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between gap-3 text-xs">
          {label && <span className="text-ui-muted">{label}</span>}
          {showValue && (
            <span className="font-mono text-2xs text-ui-subtle">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={typeof label === 'string' ? label : undefined}
        className={cn('w-full overflow-hidden rounded-full bg-ui-line/10', SIZES[size] || SIZES.md)}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-ib',
            TONES[tone] || TONES.blue
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

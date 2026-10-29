import React from 'react';
import { cn } from '../../lib/cn';

export default function EmptyState({ icon, title, description, action, compact = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-ui-line/15 bg-ui-surface/50 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-ui-raised text-ui-muted [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ui-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

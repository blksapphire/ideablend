import React from 'react';
import { cn } from '../../lib/cn';

export default function SectionHeader({
  kicker,
  title,
  description,
  action,
  level = 2,
  id,
  className
}) {
  const Heading = `h${level}`;

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 max-w-prose">
        {kicker && <div className="ib-kicker mb-1.5">{kicker}</div>}
        <Heading id={id} className="font-display text-lg font-bold tracking-tight sm:text-xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ui-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

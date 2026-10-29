import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { ChevronLeft } from './icons';

export default function PageHeader({ kicker, title, description, actions, back, className }) {
  return (
    <header className={cn('space-y-4', className)}>
      {back && (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1 text-xs font-medium text-ui-muted transition-colors hover:text-ui-fg"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {back.label || 'Back'}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 max-w-prose">
          {kicker && <div className="ib-kicker mb-2">{kicker}</div>}
          <h1 className="font-display text-display-sm font-bold text-balance sm:text-display-md">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-sm leading-relaxed text-ui-muted sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

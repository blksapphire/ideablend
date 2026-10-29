import React from 'react';
import Badge from './ui/Badge';
import { Check } from './ui/icons';

const SIGNALS = [
  'Projects with real room to contribute',
  'People who build, not just talk',
  'Work you can point to when it ships'
];

export default function AuthLayout({ kicker, title, description, children, footer, panel = true }) {
  return (
    <main className="mx-auto max-w-shell px-5 py-12 md:py-20">
      <div
        className={
          panel
            ? 'mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[.95fr_1.05fr]'
            : 'mx-auto max-w-form'
        }
      >
        {panel && (
          <aside className="hidden lg:block">
            <div className="ib-kicker mb-4">Idea Blend</div>
            <h2 className="max-w-md font-display text-display-sm font-bold text-balance">
              Good ideas get better when the right people show up.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ui-muted">
              Find projects with room to contribute, meet collaborators who follow through, and
              leave with something you can point to.
            </p>
            <ul className="mt-8 space-y-3">
              {SIGNALS.map(signal => (
                <li key={signal} className="flex items-center gap-2.5 text-sm text-ui-muted">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-soft text-green-text dark:bg-green-softdark dark:text-green-textdark">
                    <Check className="h-3 w-3" />
                  </span>
                  {signal}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Badge tone="green" mono size="sm" dot>
                Open collaboration
              </Badge>
            </div>
          </aside>
        )}

        <div className="mx-auto w-full max-w-form">
          <div className="ib-card p-6 sm:p-8">
            {kicker && <div className="ib-kicker mb-2">{kicker}</div>}
            <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-ui-muted">{description}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
          {footer}
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import { cn } from '../../lib/cn';

const TONES = {
  info: 'border-blue/20 bg-blue-soft/70 text-blue-text dark:border-blue-dark/30 dark:bg-blue-softdark/50 dark:text-blue-textdark',
  success:
    'border-green/20 bg-green-soft/70 text-green-text dark:border-green-dark/30 dark:bg-green-softdark/50 dark:text-green-textdark',
  error:
    'border-red-500/25 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300'
};

export default function Notice({ tone = 'info', title, children, role, className }) {
  return (
    <div
      role={role || (tone === 'error' ? 'alert' : 'status')}
      className={cn('rounded-xl border px-4 py-3 text-sm', TONES[tone] || TONES.info, className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && (
        <div className={cn('leading-relaxed', title && 'mt-0.5 opacity-90')}>{children}</div>
      )}
    </div>
  );
}

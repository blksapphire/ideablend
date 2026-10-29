import React from 'react';
import { cn } from '../../lib/cn';

const TONES = {
  neutral: 'bg-ui-line/[0.05] text-ui-muted',
  blue: 'bg-blue-soft text-blue-text dark:bg-blue-softdark dark:text-blue-textdark',
  green: 'bg-green-soft text-green-text dark:bg-green-softdark dark:text-green-textdark',
  outline: 'border border-ui-line/15 text-ui-muted'
};

const SIZES = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-1 text-xs'
};

export default function Badge({
  tone = 'neutral',
  size = 'sm',
  mono = false,
  dot = false,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium leading-tight',
        TONES[tone],
        SIZES[size],
        mono && 'font-mono uppercase tracking-[0.08em]',
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

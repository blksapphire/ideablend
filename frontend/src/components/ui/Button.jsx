import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Spinner } from './icons';

const VARIANTS = {
  primary:
    'bg-blue text-white shadow-sm hover:bg-blue/90 hover:shadow-lg hover:shadow-blue/20 dark:bg-blue-dark dark:hover:bg-blue-dark/90',
  secondary:
    'border border-ui-line/15 bg-ui-surface text-ui-fg hover:border-ui-line/30 hover:bg-ui-raised/60',
  ghost: 'text-ui-muted hover:bg-ui-line/[0.06] hover:text-ui-fg',
  inverse: 'bg-white text-ink shadow-lg shadow-black/20 hover:bg-white/90',
  danger: 'bg-red-600 text-white hover:bg-red-500'
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
  icon: 'h-9 w-9 rounded-full'
};

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cn(
    'inline-flex select-none items-center justify-center font-semibold transition-all duration-200 ease-ib focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-busy={loading || undefined} {...props}>
        {content}
      </Link>
    );
  }

  if (href || as === 'a') {
    return (
      <a href={href} className={classes} aria-busy={loading || undefined} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}

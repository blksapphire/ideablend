import React from 'react';
import { cn } from '../../lib/cn';

const TONES = {
  default: 'ib-card',
  inset: 'rounded-card border border-ui-line/10 bg-ui-raised/50',
  hero: 'rounded-panel border border-ui-line/10 bg-ui-surface shadow-panel'
};

const PADDING = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6 md:p-7'
};

export default function Card({
  as: Tag = 'div',
  tone = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        TONES[tone],
        PADDING[padding],
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-250 ease-ib hover:-translate-y-0.5 hover:border-ui-line/20 hover:shadow-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

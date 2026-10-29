import React from 'react';
import { cn } from '../../lib/cn';

export function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn('ib-skeleton', className)} {...props} />;
}

export function SkeletonText({ lines = 2, className }) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="ib-skeleton h-3"
          style={{ width: index === lines - 1 ? '62%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('ib-card space-y-4 p-5', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/5" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

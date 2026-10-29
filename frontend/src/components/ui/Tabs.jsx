import React, { useRef } from 'react';
import { cn } from '../../lib/cn';

const VARIANTS = {
  pill: {
    list: 'inline-flex rounded-xl border border-ui-line/10 bg-ui-raised/60 p-1',
    tab: 'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-200',
    active: 'bg-ui-surface text-ui-fg shadow-sm',
    inactive: 'text-ui-muted hover:text-ui-fg'
  },
  underline: {
    list: 'flex gap-6 border-b border-ui-line/10',
    tab: '-mb-px border-b-2 pb-2 text-sm font-medium transition-colors duration-200',
    active: 'border-blue text-ui-fg dark:border-blue-dark',
    inactive: 'border-transparent text-ui-muted hover:text-ui-fg'
  }
};

export default function Tabs({ tabs, value, onChange, variant = 'pill', label = 'View', className }) {
  const refs = useRef([]);
  const styles = VARIANTS[variant];
  const activeIndex = tabs.findIndex(tab => tab.value === value);

  function handleKeyDown(event) {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    onChange(tabs[nextIndex].value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={cn(styles.list, className)}>
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={element => (refs.current[index] = element)}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              styles.tab,
              selected ? styles.active : styles.inactive,
              'whitespace-nowrap focus-visible:outline-none'
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'ml-1.5 font-mono text-2xs',
                  selected ? 'text-ui-subtle' : 'text-ui-subtle/80'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

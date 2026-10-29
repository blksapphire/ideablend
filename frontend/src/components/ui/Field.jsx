import React, { createContext, useContext, useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { ChevronDown, Eye, EyeOff } from './icons';

const FieldContext = createContext(null);

export function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: !!error, required }}>
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold tracking-wide text-ui-muted">
            {label}
            {required && (
              <span aria-hidden className="ml-0.5 text-red-500">
                *
              </span>
            )}
          </label>
        )}
        {children}
        {hint && !error && (
          <p id={hintId} className="text-xs leading-relaxed text-ui-subtle">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

function useFieldProps(explicitId, explicitDescribedBy, explicitInvalid) {
  const field = useContext(FieldContext);
  return {
    id: explicitId ?? field?.id,
    'aria-describedby': explicitDescribedBy ?? field?.describedBy,
    'aria-invalid': explicitInvalid ?? (field?.invalid || undefined),
    required: field?.required || undefined
  };
}

export const Input = React.forwardRef(function Input(
  { className, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...props },
  ref
) {
  const fieldProps = useFieldProps(id, describedBy, invalid);
  return <input ref={ref} {...fieldProps} {...props} className={cn('ib-input', className)} />;
});

export const PasswordInput = React.forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(current => !current)}
        onMouseDown={event => event.preventDefault()}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ui-subtle transition-colors hover:bg-ui-raised/60 hover:text-ui-fg"
      >
        {visible ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
});

export const Textarea = React.forwardRef(function Textarea(
  { className, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, rows = 4, ...props },
  ref
) {
  const fieldProps = useFieldProps(id, describedBy, invalid);
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...fieldProps}
      {...props}
      className={cn('ib-input resize-y leading-relaxed', className)}
    />
  );
});

export const Select = React.forwardRef(function Select(
  { className, id, 'aria-describedby': describedBy, 'aria-invalid': invalid, children, ...props },
  ref
) {
  const fieldProps = useFieldProps(id, describedBy, invalid);
  return (
    <div className="relative">
      <select
        ref={ref}
        {...fieldProps}
        {...props}
        className={cn('ib-input appearance-none pr-9', className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ui-subtle" />
    </div>
  );
});

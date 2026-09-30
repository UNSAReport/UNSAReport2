import { type ChangeEvent, useId } from 'react';

export interface TextInputProps {
  label: string;
  name: string;
  id?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  error?: string | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function TextInput({
  label,
  name,
  id,
  value,
  onChange,
  hint,
  error,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wider text-slate-400"
      >
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:ring-2 disabled:opacity-50 ${
          error
            ? 'border-rose-500/60 focus-visible:ring-rose-500/50'
            : 'border-slate-800 focus-visible:ring-indigo-500/50'
        }`}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

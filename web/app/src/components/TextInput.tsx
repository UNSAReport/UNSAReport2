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
        className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]"
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
        className={`w-full px-3.5 py-2 rounded-none bg-transparent border text-sm text-[#141414] placeholder-[#7A7A7A] focus:outline-none focus-visible:ring-2 disabled:opacity-50 ${
          error
            ? 'border-red-600 focus-visible:ring-red-600/50'
            : 'border-[#C7C7C7] focus-visible:ring-[#1351AA]/50'
        }`}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-[#7A7A7A]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

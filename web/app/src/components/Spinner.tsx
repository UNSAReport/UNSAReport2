export interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Spinner({
  label = 'Cargando…',
  size = 'md',
  className = '',
}: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-slate-400 ${className}`}
    >
      <svg
        className={`${sizeClass} animate-spin text-indigo-400`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </span>
  );
}

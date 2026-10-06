import { SlideSection } from '@/primitives/SlideSection';

export interface QuoteGhostNumeralProps {
  /** Numeral gigante de fondo */
  numeral: string;
  /** Kicker superior con letterspacing */
  kicker?: string;
  /** Título o cita principal */
  title: string;
  /** Cuerpo secundario o atribución */
  body?: string;
}

/**
 * Cita con numeral fantasma oversized de fondo y barra de acento.
 */
export function QuoteGhostNumeral({
  numeral,
  kicker,
  title,
  body,
}: QuoteGhostNumeralProps) {
  return (
    <SlideSection withGradientBar={false}>
      <div className="relative flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-4xl mx-auto px-8 overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute -top-6 right-0 font-black leading-none select-none pointer-events-none line-clamp-1 overflow-hidden"
          style={{
            fontSize: '16rem',
            opacity: 'var(--slide-ghost-numeral-opacity, 0.07)',
            fontFamily: 'var(--slide-heading-font-family, inherit)',
          }}
        >
          {numeral}
        </span>

        <div className="relative min-w-0">
          {kicker && (
            <p
              className="text-sm font-bold uppercase mb-4 line-clamp-1 break-words"
              style={{
                letterSpacing: 'var(--slide-kicker-tracking, 0.2em)',
                color: 'var(--slide-kicker-color, var(--slide-accent))',
              }}
            >
              {kicker}
            </p>
          )}

          <blockquote
            className="text-4xl font-bold leading-snug mb-6 line-clamp-5 break-words min-w-0"
            style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
          >
            {title}
          </blockquote>

          <div
            className="h-1 w-24 mb-6 shrink-0"
            style={{
              background: 'var(--slide-accent-bar, var(--slide-accent))',
            }}
          />

          {body && (
            <p className="text-xl opacity-80 leading-relaxed line-clamp-3 break-words min-w-0">
              {body}
            </p>
          )}
        </div>
      </div>
    </SlideSection>
  );
}

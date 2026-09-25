import { SlideSection } from '../../primitives/SlideSection';

export interface QuoteCenteredLargeProps {
  tag?: string;
  quote: string;
  author: string;
  role?: string;
  source?: string;
}

/**
 * Layout de cita memorable o testimonio con tipografía sobria y gran impacto visual.
 */
export function QuoteCenteredLarge({
  tag = 'Reflexión',
  quote,
  author,
  role,
  source,
}: QuoteCenteredLargeProps) {
  return (
    <SlideSection tag={tag} withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto px-8">
        <span className="text-8xl leading-none text-[var(--slide-accent-secondary,#D4AF37)] font-serif opacity-40 select-none mb-2">
          “
        </span>
        <blockquote
          className="text-4xl md:text-5xl font-medium text-[var(--slide-text,#f1f5f9)] mb-8 leading-snug italic"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {quote}
        </blockquote>
        <div className="flex flex-col items-center">
          <cite className="not-italic text-2xl font-bold text-[var(--slide-accent-secondary,#D4AF37)]">
            {author}
          </cite>
          {(role || source) && (
            <p className="text-base text-[var(--slide-text-muted,#94a3b8)] mt-1">
              {role} {role && source && '—'} {source}
            </p>
          )}
        </div>
      </div>
    </SlideSection>
  );
}

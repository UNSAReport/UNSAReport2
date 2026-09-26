import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface QuoteCenteredLargeProps {
  quote: string;
  author: string;
  role?: string;
  tag?: string;
}

/**
 * Cita célebre o declaración académica destacada en tipografía monumental centrada.
 */
export function QuoteCenteredLarge({
  quote,
  author,
  role,
  tag = 'Cita Destacada',
}: QuoteCenteredLargeProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto px-8">
        {tag && (
          <div className="mb-6">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <span className="text-8xl leading-none font-serif opacity-30 select-none mb-2">
          “
        </span>

        <blockquote
          className="text-4xl md:text-5xl font-medium mb-8 leading-snug italic"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {quote}
        </blockquote>

        <div className="pt-4 border-t border-current/10 w-full max-w-xs">
          <cite className="not-italic text-2xl font-bold block">{author}</cite>
          {role && <p className="text-base opacity-70 mt-1">{role}</p>}
        </div>
      </div>
    </SlideSection>
  );
}

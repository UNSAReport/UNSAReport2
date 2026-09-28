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
      <div className="flex-1 min-h-0 min-w-0 w-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto overflow-hidden px-8">
        {tag && (
          <div className="mb-6 shrink-0">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <span className="text-8xl leading-none font-serif opacity-30 select-none mb-2 shrink-0">
          “
        </span>

        <blockquote
          className="text-4xl md:text-5xl font-medium mb-8 leading-snug italic min-w-0 break-words line-clamp-6 overflow-hidden"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {quote}
        </blockquote>

        <div className="pt-4 border-t border-current/10 w-full max-w-xs shrink-0 min-w-0">
          <cite className="not-italic text-2xl font-bold block min-w-0 break-words line-clamp-2 overflow-hidden">
            {author}
          </cite>
          {role && (
            <p className="text-base opacity-70 mt-1 min-w-0 break-words line-clamp-1 overflow-hidden">
              {role}
            </p>
          )}
        </div>
      </div>
    </SlideSection>
  );
}

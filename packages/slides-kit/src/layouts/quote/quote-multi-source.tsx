import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface SourceQuote {
  quote: string;
  author: string;
  source: string;
}

export interface QuoteMultiSourceProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  quotes: SourceQuote[];
}

/**
 * Múltiples citas de fuentes o autores concurrentes para contrastar opiniones teóricas.
 */
export function QuoteMultiSource({
  tag = 'Revisión Bibliográfica',
  title = 'Contraste de Fuentes Teóricas',
  subtitle = 'Diversas posturas de la literatura académica sobre el problema en estudio.',
  quotes = [],
}: QuoteMultiSourceProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col justify-center overflow-hidden">
        <SlideGrid
          columns={quotes.length > 2 ? 3 : 2}
          gap="1.5rem"
          className="min-h-0 overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${quotes.length > 2 ? 3 : 2}, minmax(0, 1fr))`,
          }}
        >
          {quotes.slice(0, 6).map((item, idx) => (
            <SlideCard
              key={`multi-quote-${item.author || idx}`}
              variant="default"
              className="p-8 justify-between h-full min-h-0 min-w-0 overflow-hidden border-t-2 border-t-current"
            >
              <div className="min-w-0 overflow-hidden">
                <span className="text-5xl font-serif opacity-30 select-none block mb-2 shrink-0">
                  “
                </span>
                <blockquote className="text-lg md:text-xl italic leading-relaxed mb-6 min-w-0 break-words line-clamp-6 overflow-hidden">
                  {item.quote}
                </blockquote>
              </div>
              <div className="pt-4 border-t border-current/10 shrink-0 min-w-0">
                <cite className="not-italic font-bold text-base block min-w-0 break-words line-clamp-1 overflow-hidden">
                  {item.author}
                </cite>
                <span className="text-xs opacity-60 block font-mono mt-1 min-w-0 break-words line-clamp-1 overflow-hidden">
                  {item.source}
                </span>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

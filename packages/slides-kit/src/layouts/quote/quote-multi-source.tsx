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
      <div className="my-auto w-full">
        <SlideGrid columns={quotes.length > 2 ? 3 : 2} gap="2rem">
          {quotes.map((item, idx) => (
            <SlideCard
              key={`multi-quote-${item.author || idx}`}
              variant="default"
              className="p-8 justify-between h-full border-t-2 border-t-current"
            >
              <div>
                <span className="text-5xl font-serif opacity-30 select-none block mb-2">
                  “
                </span>
                <blockquote className="text-lg md:text-xl italic leading-relaxed mb-6">
                  {item.quote}
                </blockquote>
              </div>
              <div className="pt-4 border-t border-current/10">
                <cite className="not-italic font-bold text-base block">
                  {item.author}
                </cite>
                <span className="text-xs opacity-60 block font-mono mt-1">
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

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitQuoteContextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  contextTitle: string;
  contextText: string;
  quote: string;
  quoteAuthor: string;
  quoteSource?: string;
}

/**
 * Contexto analítico formal a la izquierda con testimonio o cita clave enmarcada a la derecha.
 */
export function SplitQuoteContext({
  tag,
  title,
  subtitle,
  contextTitle,
  contextText,
  quote,
  quoteAuthor,
  quoteSource,
}: SplitQuoteContextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2.5rem"
        left={
          <div className="flex flex-col justify-center h-full p-4">
            <h3 className="text-2xl font-bold mb-4">{contextTitle}</h3>
            <p className="text-base opacity-85 leading-relaxed whitespace-pre-line">
              {contextText}
            </p>
          </div>
        }
        right={
          <SlideCard
            variant="glow"
            className="h-full justify-between p-8 border-l-4 border-l-current"
          >
            <div>
              <div className="mb-4">
                <SlideBadge variant="secondary">Cita Relevante</SlideBadge>
              </div>
              <blockquote className="text-2xl italic leading-relaxed mb-6 font-medium">
                “{quote}”
              </blockquote>
            </div>
            <div className="pt-4 border-t border-current/10">
              <cite className="not-italic font-bold text-lg block">
                {quoteAuthor}
              </cite>
              {quoteSource && (
                <span className="text-xs opacity-60 font-mono block mt-1">
                  {quoteSource}
                </span>
              )}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

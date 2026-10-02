import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
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
          <div className="flex flex-col justify-center h-full min-h-0 min-w-0 p-4 overflow-hidden">
            <h3 className="text-2xl font-bold mb-4 truncate">{contextTitle}</h3>
            <p className="text-base opacity-85 leading-relaxed whitespace-pre-line line-clamp-6 break-words">
              {contextText}
            </p>
          </div>
        }
        right={
          <SlideCard
            variant="glow"
            className="h-full min-h-0 min-w-0 justify-between p-8 border-l-4 border-l-current overflow-hidden"
          >
            <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
              <div className="mb-4 shrink-0">
                <SlideBadge variant="secondary">Cita Relevante</SlideBadge>
              </div>
              <blockquote className="text-2xl italic leading-relaxed mb-6 font-medium line-clamp-5 break-words min-h-0 flex-1">
                “{quote}”
              </blockquote>
            </div>
            <div className="shrink-0 min-w-0">
              <SlideDivider thickness="1px" opacity={0.12} />
              <div className="pt-4">
                <cite className="not-italic font-bold text-lg block truncate">
                  {quoteAuthor}
                </cite>
                {quoteSource && (
                  <span className="text-xs opacity-60 font-mono block mt-1 truncate">
                    {quoteSource}
                  </span>
                )}
              </div>
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

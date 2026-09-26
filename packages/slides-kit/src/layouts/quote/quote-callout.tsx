import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface QuoteCalloutProps {
  tag?: string;
  title?: string;
  contextText: string;
  quote: string;
  author: string;
  source?: string;
}

/**
 * Cita tipo callout integrada con contexto explicativo previo.
 */
export function QuoteCallout({
  tag = 'Marco Teórico',
  title = 'Perspectiva Crítica',
  contextText,
  quote,
  author,
  source,
}: QuoteCalloutProps) {
  return (
    <SlideSection tag={tag} title={title}>
      <div className="max-w-4xl mx-auto w-full my-auto flex flex-col gap-6">
        <div>
          <p className="text-xl opacity-80 leading-relaxed">{contextText}</p>
        </div>

        <SlideCard variant="glow" className="p-8 border-l-4 border-l-current">
          <blockquote className="text-2xl md:text-3xl font-medium italic leading-relaxed mb-4">
            “{quote}”
          </blockquote>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-current/10">
            <span className="font-bold">— {author}</span>
            {source && (
              <span className="text-xs font-mono opacity-60">{source}</span>
            )}
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

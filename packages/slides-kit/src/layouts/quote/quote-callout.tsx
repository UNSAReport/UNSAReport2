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
      <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col justify-center gap-6 overflow-hidden">
        <div className="min-w-0 shrink-0">
          <p className="text-xl opacity-80 leading-relaxed min-w-0 break-words line-clamp-3 overflow-hidden">
            {contextText}
          </p>
        </div>
        <SlideCard
          variant="glow"
          className="p-8 border-l-4 border-l-current min-h-0 min-w-0 overflow-hidden"
        >
          <blockquote className="text-2xl md:text-3xl font-medium italic leading-relaxed mb-4 min-w-0 break-words line-clamp-6 overflow-hidden">
            “{quote}”
          </blockquote>
          <div className="flex justify-between items-center gap-4 text-sm pt-2 border-t border-current/10 shrink-0 min-w-0">
            <span className="font-bold min-w-0 break-words line-clamp-1 overflow-hidden">
              — {author}
            </span>
            {source && (
              <span className="text-xs font-mono opacity-60 shrink-0 min-w-0 break-words line-clamp-1 overflow-hidden">
                {source}
              </span>
            )}
          </div>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

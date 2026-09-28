import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface QuoteSidebarHighlightProps {
  tag?: string;
  title?: string;
  quote: string;
  author: string;
  role?: string;
  contextText: string;
}

/**
 * Cita destacada en barra lateral con cuerpo de texto analítico al lado derecho.
 */
export function QuoteSidebarHighlight({
  tag = 'Análisis Crítico',
  title = 'Fundamento Teórico y Discusión',
  quote,
  author,
  role,
  contextText,
}: QuoteSidebarHighlightProps) {
  return (
    <SlideSection tag={tag} title={title}>
      <SlideSplit
        ratio="40-60"
        gap="1.5rem"
        className="flex-1 min-h-0"
        style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,3fr)' }}
        left={
          <SlideCard
            variant="glow"
            className="p-6 justify-between h-full min-h-0 min-w-0 overflow-hidden border-l-4 border-l-current"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <span className="text-4xl font-serif opacity-30 select-none block mb-2 leading-none">
                “
              </span>
              <blockquote className="text-lg italic leading-relaxed mb-6 break-words line-clamp-[6] min-w-0">
                {quote}
              </blockquote>
            </div>
            <div className="pt-4 border-t border-current/10 min-w-0">
              <div className="font-bold text-sm truncate">{author}</div>
              {role && (
                <div className="text-xs opacity-60 truncate">{role}</div>
              )}
            </div>
          </SlideCard>
        }
        right={
          <div className="flex flex-col justify-center h-full min-h-0 min-w-0 overflow-hidden text-base opacity-90 leading-relaxed">
            <p className="break-words line-clamp-[8] min-w-0">{contextText}</p>
          </div>
        }
      />
    </SlideSection>
  );
}

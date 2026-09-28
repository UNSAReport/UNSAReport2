import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface AgendaItem {
  timeSlot?: string;
  topic: string;
  speaker?: string;
  tag?: string;
}

export interface ListAgendaBadgesProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  items: AgendaItem[];
}

/**
 * Agenda de presentación o tabla de contenidos con insignias temáticas y marcas temporales.
 */
export function ListAgendaBadges({
  tag = 'Agenda',
  title = 'Cronograma y Temario',
  subtitle = 'Estructura cronológica de los puntos a tratar en la sesión.',
  items = [],
}: ListAgendaBadgesProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full max-w-4xl mx-auto flex-1 min-h-0 min-w-0 overflow-hidden">
        <SlideStack spacing="1rem" className="h-full min-h-0 overflow-hidden">
          {items.slice(0, 6).map((item, idx) => (
            <SlideCard
              key={`agenda-${item.topic || idx}`}
              variant="default"
              className="p-4 flex-row items-center justify-between gap-4 min-w-0 min-h-0 overflow-hidden"
            >
              <div className="flex items-center gap-6 min-w-0 flex-1">
                {item.timeSlot && (
                  <span className="text-xs font-mono opacity-70 w-20 shrink-0 font-semibold truncate">
                    {item.timeSlot}
                  </span>
                )}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h4 className="text-base font-bold line-clamp-1 break-words min-w-0">
                    {item.topic}
                  </h4>
                  {item.speaker && (
                    <span className="text-xs opacity-60 block mt-0.5 truncate">
                      Ponente: {item.speaker}
                    </span>
                  )}
                </div>
              </div>
              {item.tag && (
                <SlideBadge variant="secondary" className="text-xs shrink-0">
                  {item.tag}
                </SlideBadge>
              )}
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

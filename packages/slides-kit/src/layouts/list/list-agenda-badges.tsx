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
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1rem">
          {items.map((item, idx) => (
            <SlideCard
              key={`agenda-${item.topic || idx}`}
              variant="default"
              className="p-4 flex-row items-center justify-between"
            >
              <div className="flex items-center gap-6">
                {item.timeSlot && (
                  <span className="text-xs font-mono opacity-70 w-20 shrink-0 font-semibold">
                    {item.timeSlot}
                  </span>
                )}
                <div>
                  <h4 className="text-base font-bold">{item.topic}</h4>
                  {item.speaker && (
                    <span className="text-xs opacity-60 block mt-0.5">
                      Ponente: {item.speaker}
                    </span>
                  )}
                </div>
              </div>
              {item.tag && (
                <SlideBadge variant="secondary" className="text-xs">
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

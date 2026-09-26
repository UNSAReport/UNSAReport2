import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface ListTimelineVerticalProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  events: TimelineEvent[];
}

/**
 * Línea de tiempo vertical con nodos cronológicos e hitos históricos o de desarrollo.
 */
export function ListTimelineVertical({
  tag = 'Evolución Histórica',
  title = 'Línea de Tiempo del Proyecto',
  subtitle = 'Hitos cronológicos alcanzados en las diversas etapas.',
  events = [],
}: ListTimelineVerticalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative max-w-3xl mx-auto w-full my-auto pl-8">
        {/* Línea vertical continua */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-current opacity-20" />

        <div className="space-y-6">
          {events.map((ev) => (
            <div
              key={`timeline-ev-${ev.date}-${ev.title}`}
              className="relative flex items-start gap-6"
            >
              {/* Nodo circular */}
              <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-bold font-mono">
                ●
              </div>

              <SlideCard variant="default" className="flex-1 p-4">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-base font-bold">{ev.title}</h4>
                  <span className="text-xs font-mono opacity-60 font-semibold">
                    {ev.date}
                  </span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed">
                  {ev.description}
                </p>
              </SlideCard>
            </div>
          ))}
        </div>
      </div>
    </SlideSection>
  );
}

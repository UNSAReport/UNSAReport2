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
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center overflow-hidden">
        <div className="flex flex-col gap-6 min-h-0 min-w-0">
          {events.slice(0, 5).map((ev, idx, arr) => (
            <div
              key={`timeline-ev-${ev.date}-${ev.title}`}
              className="flex items-stretch gap-4 min-w-0"
            >
              {/* Marker column: bounded rail, no absolute bleed */}
              <div className="flex flex-col items-center shrink-0 w-6 min-w-0">
                <span className="w-4 h-4 mt-1.5 rounded-full border-2 border-current flex shrink-0 items-center justify-center text-[10px] font-bold font-mono" />
                <span
                  className={`w-0.5 flex-1 min-h-4 bg-current opacity-20 ${idx === arr.length - 1 ? 'invisible' : ''}`}
                />
              </div>

              <SlideCard
                variant="default"
                className="flex-1 min-w-0 overflow-hidden p-4"
              >
                <div className="flex justify-between items-baseline gap-2 mb-1 min-w-0">
                  <h4 className="text-base font-bold break-words min-w-0 line-clamp-1">
                    {ev.title}
                  </h4>
                  <span className="text-xs font-mono opacity-60 font-semibold shrink-0">
                    {ev.date}
                  </span>
                </div>
                <p className="text-xs opacity-75 leading-relaxed break-words min-w-0 line-clamp-3">
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

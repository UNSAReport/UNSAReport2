import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface SwimlaneLane {
  laneName: string;
  actor: string;
  steps: string[];
}

export interface ProcessSwimlaneProps {
  tag?: string;
  title: string;
  subtitle?: string;
  lanes: SwimlaneLane[];
}

/**
 * Diagrama de carriles (Swimlane) para visualizar procesos distribuidos entre múltiples actores o capas.
 */
export function ProcessSwimlane({
  tag = 'Flujo Distribuido',
  title,
  subtitle,
  lanes = [],
}: ProcessSwimlaneProps) {
  const visible = lanes.slice(0, 4);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center max-w-5xl mx-auto">
        <SlideStack
          spacing="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {visible.map((lane, idx) => (
            <SlideCard
              key={`lane-${lane.laneName || idx}`}
              variant="default"
              className="p-4 flex-row items-center gap-6 flex-1 min-h-0 min-w-0 overflow-hidden"
            >
              <div className="w-36 shrink-0 border-r border-current/10 pr-4 min-w-0 overflow-hidden">
                <h4 className="text-sm font-bold truncate min-w-0">
                  {lane.laneName}
                </h4>
                <span className="text-[10px] uppercase font-mono opacity-60 truncate min-w-0 max-w-full mt-0.5">
                  {lane.actor}
                </span>
              </div>
              <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex items-center gap-3 py-1">
                {lane.steps.slice(0, 5).map((st, sIdx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: steps are plain strings; index disambiguates duplicates
                    key={`st-${sIdx}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span className="flex-1 min-w-0 truncate text-xs px-3 py-1.5 rounded border border-current/20 font-medium break-words">
                      {st}
                    </span>
                    {sIdx !== Math.min(lane.steps.length, 5) - 1 && (
                      <span className="text-xs opacity-40 font-mono shrink-0">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

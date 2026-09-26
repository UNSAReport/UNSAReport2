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
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-5xl mx-auto w-full my-auto">
        <SlideStack spacing="1rem">
          {lanes.map((lane, idx) => (
            <SlideCard
              key={`lane-${lane.laneName || idx}`}
              variant="default"
              className="p-4 flex-row items-center gap-6"
            >
              <div className="w-36 shrink-0 border-r border-current/10 pr-4">
                <h4 className="text-sm font-bold">{lane.laneName}</h4>
                <span className="text-[10px] uppercase font-mono opacity-60 block mt-0.5">
                  {lane.actor}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1">
                {lane.steps.map((st) => (
                  <div
                    key={`st-${st}`}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <span className="text-xs px-3 py-1.5 rounded border border-current/20 font-medium">
                      {st}
                    </span>
                    {st !== lane.steps[lane.steps.length - 1] && (
                      <span className="text-xs opacity-40 font-mono">→</span>
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

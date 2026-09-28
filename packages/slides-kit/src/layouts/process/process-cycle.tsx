import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface CyclePhase {
  phase: string;
  name: string;
  description: string;
}

export interface ProcessCycleProps {
  tag?: string;
  title: string;
  subtitle?: string;
  centerText?: string;
  phases: CyclePhase[];
}

/**
 * Ciclo cerrado de retroalimentación continua (ej: PDCA, Scrum Sprint, DevOps Loop).
 */
export function ProcessCycle({
  tag = 'Ciclo Iterativo',
  title,
  subtitle,
  centerText = 'Iteración Continua',
  phases = [],
}: ProcessCycleProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center max-w-4xl mx-auto flex-1">
        <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden grid grid-cols-2 gap-4">
          {phases.slice(0, 4).map((p, idx) => (
            <SlideCard
              key={`cycle-${p.phase || idx}`}
              variant="default"
              className="p-4 min-w-0 min-h-0 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                <span className="text-xs font-mono font-bold uppercase opacity-60 truncate">
                  Fase {p.phase}
                </span>
                <span className="text-base opacity-40 font-mono shrink-0">
                  ↻
                </span>
              </div>
              <h4 className="text-base font-bold mb-1 truncate break-words min-w-0">
                {p.name}
              </h4>
              <p className="text-xs opacity-75 leading-relaxed line-clamp-3 break-words min-w-0">
                {p.description}
              </p>
            </SlideCard>
          ))}
        </div>

        {/* Insignia central del ciclo: in-flow, bounded, non-overlapping */}
        <div className="shrink-0 mt-4 flex items-center justify-center px-4 py-1.5 rounded-full border border-current text-[11px] font-mono font-bold text-center truncate max-w-full">
          {centerText}
        </div>
      </div>
    </SlideSection>
  );
}

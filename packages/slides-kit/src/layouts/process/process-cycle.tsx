import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
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
      <div className="relative w-full max-w-4xl mx-auto my-auto">
        <SlideGrid cols={2} gap="2rem">
          {phases.slice(0, 4).map((p, idx) => (
            <SlideCard
              key={`cycle-${p.phase || idx}`}
              variant="default"
              className="p-6 justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase opacity-60">
                  Fase {p.phase}
                </span>
                <span className="text-lg opacity-40 font-mono">↻</span>
              </div>
              <h4 className="text-lg font-bold mb-1">{p.name}</h4>
              <p className="text-xs opacity-75 leading-relaxed">
                {p.description}
              </p>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Insignia central del ciclo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center p-3 rounded-full border-2 border-current bg-[var(--slide-bg)] text-xs font-mono font-bold text-center w-28 h-28 shadow-xl">
          {centerText}
        </div>
      </div>
    </SlideSection>
  );
}

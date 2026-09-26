import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface MilestoneItem {
  quarter: string;
  title: string;
  description: string;
  isCompleted?: boolean;
}

export interface ProcessMilestoneBarProps {
  tag?: string;
  title: string;
  subtitle?: string;
  milestones: MilestoneItem[];
}

/**
 * Barra de hitos trimestrales o compuertas de decisión de un cronograma de investigación.
 */
export function ProcessMilestoneBar({
  tag = 'Hitos del Cronograma',
  title,
  subtitle,
  milestones = [],
}: ProcessMilestoneBarProps) {
  const cols =
    milestones.length <= 4 ? (milestones.length as 1 | 2 | 3 | 4) : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative w-full my-auto">
        <div className="absolute left-[10%] right-[10%] top-6 border-t-2 border-current/20 z-0" />

        <div className="relative z-10">
          <SlideGrid cols={cols} gap="1.5rem">
            {milestones.map((m, idx) => (
              <SlideCard
                key={`mile-bar-${m.quarter || idx}`}
                variant={m.isCompleted ? 'glow' : 'default'}
                className="p-6 text-center items-center justify-between h-full"
              >
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center font-mono font-bold text-xs mb-3 bg-[var(--slide-bg)]">
                  {m.quarter}
                </div>
                <div>
                  <h4 className="text-base font-bold mb-1">{m.title}</h4>
                  <p className="text-xs opacity-75">{m.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-current/10">
                  <SlideBadge
                    variant={m.isCompleted ? 'success' : 'secondary'}
                    className="text-[10px]"
                  >
                    {m.isCompleted ? 'Completado' : 'Planificado'}
                  </SlideBadge>
                </div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

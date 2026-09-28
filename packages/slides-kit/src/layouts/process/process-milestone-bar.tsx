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
  const visible = milestones.slice(0, 4);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex items-center">
        <SlideGrid
          cols={4}
          gap="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {visible.map((m, idx) => (
            <SlideCard
              key={`mile-bar-${m.quarter || idx}`}
              variant={m.isCompleted ? 'glow' : 'default'}
              className="p-6 text-center items-center justify-between h-full min-h-0 min-w-0 overflow-hidden"
            >
              <div className="w-12 h-12 shrink-0 rounded-full border-2 border-current flex items-center justify-center font-mono font-bold text-xs mb-3 bg-[var(--slide-bg)]">
                {m.quarter}
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
                <h4 className="text-base font-bold mb-1 line-clamp-2 break-words min-w-0">
                  {m.title}
                </h4>
                <p className="text-xs opacity-75 line-clamp-3 break-words min-w-0 overflow-hidden">
                  {m.description}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-current/10 shrink-0">
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
    </SlideSection>
  );
}

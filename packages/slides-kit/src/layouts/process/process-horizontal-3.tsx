import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ProcessStepItem {
  step: number | string;
  title: string;
  description: string;
  badge?: string;
}

export interface ProcessHorizontal3Props {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: ProcessStepItem[];
}

/**
 * Layout de proceso horizontal secuencial de 3 etapas con indicadores numerados.
 */
export function ProcessHorizontal3({
  tag,
  title,
  subtitle,
  steps = [],
}: ProcessHorizontal3Props) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex items-center">
        <SlideGrid
          columns={3}
          gap="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {steps.slice(0, 3).map((item, idx) => (
            <SlideCard
              key={`process-step-${item.step || idx}-${item.title}`}
              variant="elevated"
              className="p-8 text-center items-center justify-between h-full min-h-0 min-w-0 overflow-hidden relative"
            >
              {/* Círculo indicador del paso */}
              <div className="w-14 h-14 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-2xl font-black mb-4 shadow-md">
                {item.step || idx + 1}
              </div>

              <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center">
                {item.badge && (
                  <div className="mb-2 shrink-0">
                    <SlideBadge variant="secondary">{item.badge}</SlideBadge>
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-3 line-clamp-2 break-words min-w-0">
                  {item.title}
                </h3>
                <p className="text-base opacity-75 leading-relaxed line-clamp-3 break-words min-w-0 overflow-hidden">
                  {item.description}
                </p>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

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

export interface ProcessHorizontal4Props {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: ProcessStepItem[];
}

/**
 * Proceso horizontal secuencial de 4 fases con indicadores de progreso ordenados.
 */
export function ProcessHorizontal4({
  tag,
  title,
  subtitle,
  steps = [],
}: ProcessHorizontal4Props) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative w-full h-full flex items-center">
        {/* Línea conectora */}
        <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-8 border-t border-current/20 z-0" />

        <div className="relative z-10 w-full">
          <SlideGrid cols={4} gap="1.5rem">
            {steps.slice(0, 4).map((item, idx) => (
              <SlideCard
                key={`proc-h4-${item.step || idx}-${item.title}`}
                variant="elevated"
                className="p-6 text-center items-center justify-between h-full relative"
              >
                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center text-xl font-black mb-3 shadow">
                  {item.step || idx + 1}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {item.badge && (
                    <div className="mb-2">
                      <SlideBadge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </SlideBadge>
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

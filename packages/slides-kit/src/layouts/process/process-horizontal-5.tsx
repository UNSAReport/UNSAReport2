import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ProcessHorizontal5Props {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: Array<{ step: number | string; title: string; description: string }>;
}

/**
 * Cadena secuencial compacta de 5 pasos para pipelines continuos o ciclos de vida de software.
 */
export function ProcessHorizontal5({
  tag,
  title,
  subtitle,
  steps = [],
}: ProcessHorizontal5Props) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative w-full h-full flex items-center">
        <div className="absolute left-[8%] right-[8%] top-1/2 -translate-y-8 border-t border-current/20 z-0" />

        <div className="relative z-10 w-full">
          <SlideGrid cols={5} gap="1rem">
            {steps.slice(0, 5).map((item, idx) => (
              <SlideCard
                key={`proc-h5-${item.step || idx}-${item.title}`}
                variant="default"
                className="p-4 text-center items-center justify-between h-full relative"
              >
                <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center text-sm font-bold font-mono mb-3">
                  0{item.step || idx + 1}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-bold mb-1">{item.title}</h4>
                  <p className="text-[11px] opacity-75 leading-tight">
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

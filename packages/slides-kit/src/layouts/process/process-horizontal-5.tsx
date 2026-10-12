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
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex items-center">
        <SlideGrid
          cols={5}
          gap="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {steps.slice(0, 5).map((item, idx) => (
            <SlideCard
              key={`proc-h5-${item.step || idx}-${item.title}`}
              variant="default"
              className="p-4 text-center items-center justify-between h-full min-h-0 min-w-0 overflow-hidden relative"
            >
              <div className="w-10 h-10 shrink-0 rounded-full border border-current flex items-center justify-center text-sm font-bold font-mono mb-3">
                0{item.step || idx + 1}
              </div>
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center">
                <h4 className="text-sm font-bold mb-1 line-clamp-2 break-words min-w-0">
                  {item.title}
                </h4>
                <p className="text-[11px] opacity-75 leading-tight line-clamp-3 break-words min-w-0 overflow-hidden">
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

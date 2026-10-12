import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface ZigzagStep {
  step: number;
  title: string;
  description: string;
}

export interface ProcessZigzagProps {
  tag?: string;
  title: string;
  subtitle?: string;
  steps: ZigzagStep[];
}

/**
 * Trayectoria en zigzag alternando bloques a izquierda y derecha con marcadores de enlace.
 */
export function ProcessZigzag({
  tag = 'Evolución Metodológica',
  title,
  subtitle,
  steps = [],
}: ProcessZigzagProps) {
  const visible = steps.slice(0, 4);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center gap-6 max-w-4xl mx-auto">
        {visible.map((st, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={`zigzag-${st.step || idx}`}
              className={`flex items-center gap-6 flex-1 min-h-0 min-w-0 overflow-hidden ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className="w-12 h-12 shrink-0 rounded-full border-2 border-current flex items-center justify-center font-bold font-mono text-base">
                0{st.step}
              </div>
              <SlideCard
                variant="default"
                className="flex-1 p-4 min-h-0 min-w-0 overflow-hidden justify-center"
              >
                <h4 className="text-base font-bold mb-1 truncate min-w-0">
                  {st.title}
                </h4>
                <p className="text-xs opacity-75 line-clamp-2 break-words min-w-0 overflow-hidden">
                  {st.description}
                </p>
              </SlideCard>
            </div>
          );
        })}
      </div>
    </SlideSection>
  );
}

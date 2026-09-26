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
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto space-y-4">
        {steps.map((st, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={`zigzag-${st.step || idx}`}
              className={`flex items-center gap-4 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center font-bold font-mono text-base shrink-0">
                0{st.step}
              </div>
              <SlideCard variant="default" className="flex-1 p-4">
                <h4 className="text-base font-bold mb-1">{st.title}</h4>
                <p className="text-xs opacity-75">{st.description}</p>
              </SlideCard>
            </div>
          );
        })}
      </div>
    </SlideSection>
  );
}

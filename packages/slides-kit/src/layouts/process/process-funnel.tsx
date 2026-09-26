import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface FunnelStage {
  stage: string;
  countOrMetric?: string;
  description: string;
  widthPercentage: string; // ej: '100%', '80%', '60%', '40%'
}

export interface ProcessFunnelProps {
  tag?: string;
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
}

/**
 * Diagrama de embudo (Funnel) para modelar filtrado de requisitos o conversión de usuarios.
 */
export function ProcessFunnel({
  tag = 'Embudo de Selección',
  title,
  subtitle,
  stages = [],
}: ProcessFunnelProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center justify-center h-full my-auto w-full">
        <SlideStack spacing="0.75rem" className="w-full items-center">
          {stages.map((st, idx) => (
            <div
              key={`funnel-${st.stage || idx}`}
              className="flex justify-center transition-all"
              style={{ width: st.widthPercentage || '100%' }}
            >
              <SlideCard
                variant="default"
                className="w-full p-4 flex-row items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold">{st.stage}</h4>
                  <p className="text-xs opacity-75">{st.description}</p>
                </div>
                {st.countOrMetric && (
                  <span className="font-mono text-lg font-black shrink-0 ml-4">
                    {st.countOrMetric}
                  </span>
                )}
              </SlideCard>
            </div>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

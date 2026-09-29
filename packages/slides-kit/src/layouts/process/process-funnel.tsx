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
      <div className="w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col items-center justify-center gap-3 flex-1">
        <SlideStack
          spacing="0.75rem"
          className="w-full min-h-0 overflow-hidden items-center flex-1 justify-center"
        >
          {stages.slice(0, 5).map((st, idx) => (
            <div
              key={`funnel-${st.stage || idx}`}
              className="flex justify-center min-w-0 max-w-full mx-auto"
              style={{
                width: `min(${st.widthPercentage || '100%'}, 100%)`,
                maxWidth: '36rem',
              }}
            >
              <SlideCard
                variant="default"
                className="w-full p-3 flex-row items-center justify-between min-w-0 overflow-hidden gap-2"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold truncate break-words">
                    {st.stage}
                  </h4>
                  <p className="text-xs opacity-75 truncate break-words">
                    {st.description}
                  </p>
                </div>
                {st.countOrMetric && (
                  <span className="font-mono text-base font-black shrink-0 ml-4 truncate">
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

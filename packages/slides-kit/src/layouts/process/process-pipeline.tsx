import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface PipelineStage {
  name: string;
  tool?: string;
  status: 'passed' | 'running' | 'failed' | 'queued';
  duration?: string;
}

export interface ProcessPipelineProps {
  tag?: string;
  title: string;
  subtitle?: string;
  pipelineName?: string;
  stages: PipelineStage[];
}

/**
 * Visualizador de pipeline de integración o procesamiento de datos con estados temáticos.
 */
export function ProcessPipeline({
  tag = 'Automatización CI/CD',
  title,
  subtitle,
  pipelineName = 'Release Pipeline',
  stages = [],
}: ProcessPipelineProps) {
  const getStatusVariant = (status: PipelineStage['status']) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'running':
        return 'accent';
      case 'failed':
        return 'error';
      default:
        return 'muted';
    }
  };

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col justify-between h-full my-auto gap-6 max-w-5xl mx-auto w-full">
        <SlideCard
          variant="default"
          className="p-4 flex-row items-center justify-between"
        >
          <span className="font-mono text-sm font-bold">{pipelineName}</span>
          <SlideBadge variant="secondary" className="text-xs">
            Pipeline Activo
          </SlideBadge>
        </SlideCard>

        <div className="relative">
          <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 border-t border-current/20 z-0" />

          <div className="relative z-10">
            <SlideGrid cols={stages.length <= 4 ? 4 : 5} gap="1rem">
              {stages.map((st, idx) => (
                <SlideCard
                  key={`pipe-st-${st.name || idx}`}
                  variant="elevated"
                  className="p-4 text-center items-center"
                >
                  <SlideBadge
                    variant={getStatusVariant(st.status)}
                    className="text-[10px] uppercase mb-2"
                  >
                    {st.status}
                  </SlideBadge>
                  <h4 className="text-sm font-bold mb-1">{st.name}</h4>
                  {st.tool && (
                    <span className="text-[10px] opacity-60 font-mono block">
                      {st.tool}
                    </span>
                  )}
                  {st.duration && (
                    <span className="text-[10px] opacity-75 font-mono block mt-2">
                      {st.duration}
                    </span>
                  )}
                </SlideCard>
              ))}
            </SlideGrid>
          </div>
        </div>
      </div>
    </SlideSection>
  );
}

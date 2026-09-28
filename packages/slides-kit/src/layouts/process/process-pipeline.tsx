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
  const visible = stages.slice(0, 5);

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center gap-6 max-w-5xl mx-auto">
        <SlideCard
          variant="default"
          className="p-4 flex-row items-center justify-between shrink-0 min-w-0 overflow-hidden"
        >
          <span className="font-mono text-sm font-bold truncate min-w-0">
            {pipelineName}
          </span>
          <SlideBadge variant="secondary" className="text-xs shrink-0">
            Pipeline Activo
          </SlideBadge>
        </SlideCard>

        <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 border-t border-current/20 z-0 pointer-events-none" />

          <div className="relative z-10 h-full min-h-0 min-w-0 overflow-hidden">
            <SlideGrid
              cols={visible.length <= 4 ? 4 : 5}
              gap="1.5rem"
              className="flex-1 min-h-0 min-w-0 overflow-hidden"
            >
              {visible.map((st, idx) => (
                <SlideCard
                  key={`pipe-st-${st.name || idx}`}
                  variant="elevated"
                  className="p-4 text-center items-center justify-between h-full min-h-0 min-w-0 overflow-hidden"
                >
                  <div className="min-h-0 min-w-0 overflow-hidden flex flex-col items-center">
                    <SlideBadge
                      variant={getStatusVariant(st.status)}
                      className="text-[10px] uppercase mb-2 shrink-0"
                    >
                      {st.status}
                    </SlideBadge>
                    <h4 className="text-sm font-bold mb-1 line-clamp-2 break-words min-w-0">
                      {st.name}
                    </h4>
                    {st.tool && (
                      <span className="text-[10px] opacity-60 font-mono truncate min-w-0 max-w-full">
                        {st.tool}
                      </span>
                    )}
                  </div>
                  {st.duration && (
                    <span className="text-[10px] opacity-75 font-mono truncate min-w-0 max-w-full shrink-0">
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

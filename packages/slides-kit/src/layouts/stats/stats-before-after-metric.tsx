import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface BeforeAfterMetricItem {
  metricName: string;
  beforeVal: string;
  afterVal: string;
  improvement: string;
}

export interface StatsBeforeAfterMetricProps {
  tag?: string;
  title: string;
  subtitle?: string;
  summaryTitle?: string;
  summaryText?: string;
  metrics: BeforeAfterMetricItem[];
}

/**
 * Comparación directa del impacto cuantitativo antes y después de la intervención técnica.
 */
export function StatsBeforeAfterMetric({
  tag = 'Resultados Comparativos',
  title,
  subtitle,
  summaryTitle = 'Mejora Integral de Desempeño',
  summaryText,
  metrics = [],
}: StatsBeforeAfterMetricProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full justify-between my-auto gap-6">
        {summaryText && (
          <SlideCard
            variant="default"
            className="p-4 flex-row items-center justify-between"
          >
            <h4 className="text-lg font-bold">{summaryTitle}</h4>
            <p className="text-sm opacity-80">{summaryText}</p>
          </SlideCard>
        )}

        <SlideGrid
          cols={metrics.length > 2 ? 3 : 2}
          gap="1.5rem"
          className="flex-1"
        >
          {metrics.map((m, idx) => (
            <SlideCard
              key={`bam-${m.metricName || idx}`}
              variant="elevated"
              className="p-6 justify-between h-full"
            >
              <h4 className="text-base font-bold mb-4 border-b border-current/10 pb-2">
                {m.metricName}
              </h4>
              <SlideSplit
                ratio="50-50"
                gap="1rem"
                left={
                  <div className="opacity-60 text-center">
                    <span className="text-[10px] uppercase font-mono block">
                      Antes
                    </span>
                    <span className="text-2xl font-black font-mono">
                      {m.beforeVal}
                    </span>
                  </div>
                }
                right={
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-mono block opacity-80">
                      Después
                    </span>
                    <span className="text-2xl font-black font-mono">
                      {m.afterVal}
                    </span>
                  </div>
                }
              />
              <div className="mt-4 pt-3 border-t border-current/10 flex justify-center">
                <SlideBadge variant="success" className="font-mono text-xs">
                  {m.improvement}
                </SlideBadge>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

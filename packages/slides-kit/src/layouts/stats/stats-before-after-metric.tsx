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
  const colCount = metrics.length > 2 ? 3 : 2;
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4 overflow-hidden">
        {summaryText && (
          <SlideCard
            variant="default"
            className="p-4 flex-row items-center justify-between gap-4 shrink-0 min-w-0"
          >
            <h4 className="text-lg font-bold line-clamp-2 break-words min-w-0">
              {summaryTitle}
            </h4>
            <p className="text-sm opacity-80 line-clamp-2 break-words min-w-0 text-right">
              {summaryText}
            </p>
          </SlideCard>
        )}

        <SlideGrid
          cols={colCount}
          gap="1.5rem"
          className="flex-1 min-h-0 items-stretch"
          style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
        >
          {metrics.map((m, idx) => (
            <SlideCard
              key={`bam-${m.metricName || idx}`}
              variant="elevated"
              className="p-6 justify-center min-w-0 min-h-0 overflow-hidden"
            >
              <h4 className="text-base font-bold mb-3 border-b border-current/10 pb-2 line-clamp-2 break-words min-w-0">
                {m.metricName}
              </h4>
              <SlideSplit
                ratio="50-50"
                gap="1rem"
                left={
                  <div className="opacity-60 text-center min-w-0">
                    <span className="text-[10px] uppercase font-mono block">
                      Antes
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums truncate block">
                      {m.beforeVal}
                    </span>
                  </div>
                }
                right={
                  <div className="text-center min-w-0">
                    <span className="text-[10px] uppercase font-mono block opacity-80">
                      Después
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums truncate block">
                      {m.afterVal}
                    </span>
                  </div>
                }
              />
              <div className="mt-3 pt-3 border-t border-current/10 flex justify-center shrink-0">
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

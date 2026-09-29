import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface FooterMetric {
  label: string;
  value: string;
}

export interface StatsSummaryFooterProps {
  tag?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  metrics: FooterMetric[];
}

/**
 * Diapositiva de contenido analítico superior con barra de resumen de KPIs anclada en el pie.
 */
export function StatsSummaryFooter({
  tag,
  title,
  subtitle,
  children,
  metrics = [],
}: StatsSummaryFooterProps) {
  const cols = metrics.length <= 3 ? 3 : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-between gap-6">
        {/* Contenido principal superior */}
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center">
          {children}
        </div>

        {/* Barra inferior anclada de métricas */}
        <SlideCard
          variant="glow"
          padding={0}
          className="overflow-hidden shrink-0 min-w-0"
        >
          <SlideGrid cols={cols as 3 | 4} gap={0}>
            {metrics.map((m, idx) => (
              <div
                key={`footer-metric-${m.label || idx}`}
                className={`p-4 text-center min-w-0 min-h-0 overflow-hidden ${idx !== 0 ? 'border-l border-current/10' : ''}`}
              >
                <div className="text-xs uppercase font-mono opacity-60 font-semibold truncate min-w-0">
                  {m.label}
                </div>
                <div className="text-3xl font-black font-mono mt-1 truncate min-w-0">
                  {m.value}
                </div>
              </div>
            ))}
          </SlideGrid>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

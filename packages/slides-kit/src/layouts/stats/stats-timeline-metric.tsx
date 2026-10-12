import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface MilestoneMetric {
  period: string;
  metric: string;
  label: string;
  highlight?: boolean;
}

export interface StatsTimelineMetricProps {
  tag?: string;
  title: string;
  subtitle?: string;
  milestones: MilestoneMetric[];
}

/**
 * Evolución cronológica de un indicador a lo largo de hitos o periodos secuenciales.
 */
export function StatsTimelineMetric({
  tag = 'Evolución de Indicadores',
  title,
  subtitle,
  milestones = [],
}: StatsTimelineMetricProps) {
  const cols =
    milestones.length <= 4 ? (milestones.length as 1 | 2 | 3 | 4) : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="relative w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col justify-center">
        {/* Línea conectora */}
        <div className="absolute left-[10%] right-[10%] top-6 h-0.5 bg-current opacity-20 z-0 pointer-events-none" />

        <div className="relative z-10 min-h-0 min-w-0 overflow-hidden">
          <SlideGrid cols={cols} gap="1.5rem" className="min-h-0">
            {milestones.map((m, idx) => (
              <SlideCard
                key={`mile-${m.period || idx}`}
                variant={m.highlight ? 'glow' : 'default'}
                className="p-6 text-center items-center justify-between min-h-0 min-w-0 overflow-hidden gap-2"
              >
                <div className="w-12 h-12 shrink-0 rounded-full border-2 border-current font-mono font-bold text-xs flex items-center justify-center bg-[var(--slide-bg)] overflow-hidden">
                  <span className="truncate px-1">{m.period}</span>
                </div>
                <div className="text-4xl font-black font-mono truncate min-w-0 max-w-full">
                  {m.metric}
                </div>
                <span className="text-xs opacity-75 line-clamp-2 break-words min-w-0">
                  {m.label}
                </span>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

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
      <div className="relative w-full my-auto">
        {/* Línea conectora */}
        <div className="absolute left-[10%] right-[10%] top-6 h-0.5 bg-current opacity-20 z-0" />

        <div className="relative z-10">
          <SlideGrid cols={cols} gap="1.5rem">
            {milestones.map((m, idx) => (
              <SlideCard
                key={`mile-${m.period || idx}`}
                variant={m.highlight ? 'glow' : 'default'}
                className="p-6 text-center items-center justify-between"
              >
                <div className="w-12 h-12 rounded-full border-2 border-current font-mono font-bold text-xs flex items-center justify-center mb-4 bg-[var(--slide-bg)]">
                  {m.period}
                </div>
                <div className="text-4xl font-black font-mono mb-2">
                  {m.metric}
                </div>
                <span className="text-xs opacity-75">{m.label}</span>
              </SlideCard>
            ))}
          </SlideGrid>
        </div>
      </div>
    </SlideSection>
  );
}

import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSparkline } from '@/primitives/SlideSparkline';

export interface SparklineItem {
  metric: string;
  label: string;
  trend: 'al alza' | 'estable' | 'a la baja';
  trendValue: string;
  summary: string;
}

export interface StatsSparklineCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  cards: SparklineItem[];
}

/**
 * Tarjetas de métricas con indicador de tendencia y resumen contextual.
 */
export function StatsSparklineCards({
  tag = 'Análisis de Tendencias',
  title,
  subtitle,
  cards = [],
}: StatsSparklineCardsProps) {
  const cols = cards.length <= 3 ? 3 : 4;

  const getTrendVariant = (trend: SparklineItem['trend']) => {
    switch (trend) {
      case 'al alza':
        return 'success';
      case 'a la baja':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={cols as 3 | 4}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {cards.map((c, idx) => (
          <SlideCard
            key={`spark-${c.label || idx}`}
            variant="default"
            className="p-6 justify-between min-h-0 min-w-0 overflow-hidden"
          >
            <div className="min-w-0 min-h-0 overflow-hidden">
              <div className="flex justify-between items-start gap-2 mb-2 min-w-0">
                <span className="text-xs uppercase font-mono opacity-60 font-semibold truncate min-w-0 flex-1">
                  {c.label}
                </span>
                <SlideBadge
                  variant={getTrendVariant(c.trend)}
                  className="text-[10px] shrink-0"
                >
                  {c.trendValue}
                </SlideBadge>
              </div>
              <div className="text-4xl font-black font-mono tracking-tight my-2 truncate min-w-0">
                {c.metric}
              </div>
            </div>
            <div className="shrink-0 min-w-0 overflow-hidden">
              <SlideDivider thickness="1px" opacity={0.12} />
              <div className="pt-3">
                {/* Línea simulada de sparkline */}
                <SlideSparkline
                  values={[8, 12, 10, 16, 20, 24]}
                  tone={c.trend === 'a la baja' ? 'error' : c.trend === 'al alza' ? 'success' : 'accent'}
                  maxHeight="1.5rem"
                  label={`Tendencia ${c.label}`}
                />
                <p className="text-xs opacity-75 line-clamp-3 break-words min-w-0 mt-2">
                  {c.summary}
                </p>
              </div>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

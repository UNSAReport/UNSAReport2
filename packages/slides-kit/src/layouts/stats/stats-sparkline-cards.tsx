import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

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
            <div className="pt-3 border-t border-current/10 shrink-0 min-w-0 overflow-hidden">
              {/* Línea simulada de sparkline */}
              <div className="min-h-0 flex items-end gap-1 mb-2 opacity-60 overflow-hidden">
                <span className="flex-1 min-w-0 h-2 bg-current rounded-t" />
                <span className="flex-1 min-w-0 h-3 bg-current rounded-t" />
                <span className="flex-1 min-w-0 h-2.5 bg-current rounded-t" />
                <span className="flex-1 min-w-0 h-4 bg-current rounded-t" />
                <span className="flex-1 min-w-0 h-5 bg-current rounded-t" />
                <span className="flex-1 min-w-0 h-6 max-h-full bg-current rounded-t" />
              </div>
              <p className="text-xs opacity-75 line-clamp-3 break-words min-w-0">
                {c.summary}
              </p>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

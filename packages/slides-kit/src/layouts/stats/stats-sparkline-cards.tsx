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
      <SlideGrid cols={cols as 3 | 4} gap="1.5rem" className="my-auto">
        {cards.map((c, idx) => (
          <SlideCard
            key={`spark-${c.label || idx}`}
            variant="default"
            className="p-6 justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs uppercase font-mono opacity-60 font-semibold">
                  {c.label}
                </span>
                <SlideBadge
                  variant={getTrendVariant(c.trend)}
                  className="text-[10px]"
                >
                  {c.trendValue}
                </SlideBadge>
              </div>
              <div className="text-4xl font-black font-mono tracking-tight my-2">
                {c.metric}
              </div>
            </div>
            <div className="pt-3 border-t border-current/10">
              {/* Línea simulada de sparkline */}
              <div className="h-6 flex items-end gap-1 mb-2 opacity-60">
                <span className="w-1/6 h-2 bg-current rounded-t" />
                <span className="w-1/6 h-3 bg-current rounded-t" />
                <span className="w-1/6 h-2.5 bg-current rounded-t" />
                <span className="w-1/6 h-4 bg-current rounded-t" />
                <span className="w-1/6 h-5 bg-current rounded-t" />
                <span className="w-1/6 h-6 bg-current rounded-t" />
              </div>
              <p className="text-xs opacity-75">{c.summary}</p>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

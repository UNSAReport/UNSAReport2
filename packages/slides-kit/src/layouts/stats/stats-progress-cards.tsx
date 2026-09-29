import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ProgressCardItem {
  goal: string;
  current: string;
  percentage: number;
  status: 'completado' | 'en camino' | 'retrasado';
}

export interface StatsProgressCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: ProgressCardItem[];
}

/**
 * Cuadrícula de tarjetas de avance de metas con barras de progreso y estado.
 */
export function StatsProgressCards({
  tag = 'Cumplimiento de Metas',
  title,
  subtitle,
  items = [],
}: StatsProgressCardsProps) {
  const getBadgeVariant = (status: ProgressCardItem['status']) => {
    switch (status) {
      case 'completado':
        return 'success';
      case 'en camino':
        return 'accent';
      default:
        return 'warning';
    }
  };

  return (
    <SlideSection
      tag={tag}
      title={title}
      subtitle={subtitle}
      className="w-full h-full overflow-hidden"
    >
      <div className="w-full min-h-0 min-w-0 flex-1 overflow-hidden flex flex-col">
        <SlideGrid
          cols={items.length > 2 ? 3 : 2}
          gap="1.5rem"
          className="flex-1 min-h-0 overflow-hidden"
        >
          {items.map((item, idx) => (
            <SlideCard
              key={`prog-${item.goal || idx}`}
              variant="default"
              className="p-6 justify-between h-full min-h-0 min-w-0 overflow-hidden"
            >
              <div className="min-w-0 min-h-0 overflow-hidden">
                <div className="flex justify-between items-start gap-3 mb-3 min-w-0">
                  <SlideBadge
                    variant={getBadgeVariant(item.status)}
                    className="text-[10px] uppercase shrink-0 max-w-full"
                  >
                    {item.status}
                  </SlideBadge>
                  <span className="font-mono text-xl font-bold truncate min-w-0">
                    {item.percentage}%
                  </span>
                </div>
                <h4 className="text-lg font-bold mb-2 line-clamp-2 break-words min-w-0">
                  {item.goal}
                </h4>
                <p className="text-xs opacity-75 line-clamp-2 break-words min-w-0">
                  {item.current}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-current/10 shrink-0 min-w-0">
                <div className="w-full max-w-full h-2 rounded-full border border-current/20 overflow-hidden">
                  <div
                    className="h-full bg-current opacity-80 rounded-full max-w-full overflow-hidden"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                    }}
                  />
                </div>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

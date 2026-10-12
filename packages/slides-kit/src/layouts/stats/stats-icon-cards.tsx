import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface IconStatItem {
  icon: string;
  metric: string;
  label: string;
  description: string;
}

export interface StatsIconCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: IconStatItem[];
}

/**
 * Cuadrícula de tarjetas de métricas emparejadas con símbolos e iconos visuales.
 */
export function StatsIconCards({
  tag = 'Indicadores Clave',
  title,
  subtitle,
  items = [],
}: StatsIconCardsProps) {
  const cols = items.length <= 3 ? 3 : 4;

  return (
    <SlideSection
      tag={tag}
      title={title}
      subtitle={subtitle}
      className="w-full h-full overflow-hidden"
    >
      <div className="w-full min-h-0 min-w-0 flex-1 overflow-hidden flex flex-col">
        <SlideGrid
          cols={cols as 3 | 4}
          gap="1.5rem"
          className="flex-1 min-h-0 overflow-hidden"
        >
          {items.map((item, idx) => (
            <SlideCard
              key={`icon-stat-${item.label || idx}`}
              variant="default"
              className="p-6 justify-between h-full min-h-0 min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-4 min-w-0 shrink-0">
                <span className="w-10 h-10 shrink-0 rounded-lg border border-current flex items-center justify-center text-lg font-bold opacity-80 overflow-hidden">
                  {item.icon}
                </span>
                <span className="text-3xl font-black font-mono truncate min-w-0 max-w-full">
                  {item.metric}
                </span>
              </div>
              <div className="min-w-0 min-h-0 overflow-hidden">
                <h4 className="text-base font-bold mb-1 line-clamp-2 break-words min-w-0">
                  {item.label}
                </h4>
                <p className="text-xs opacity-75 leading-relaxed line-clamp-3 break-words min-w-0">
                  {item.description}
                </p>
              </div>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

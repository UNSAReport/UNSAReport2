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
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={cols as 3 | 4} gap="1.5rem" className="my-auto">
        {items.map((item, idx) => (
          <SlideCard
            key={`icon-stat-${item.label || idx}`}
            variant="default"
            className="p-6 justify-between h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="w-10 h-10 rounded-lg border border-current flex items-center justify-center text-lg font-bold opacity-80">
                {item.icon}
              </span>
              <span className="text-3xl font-black font-mono">
                {item.metric}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold mb-1">{item.label}</h4>
              <p className="text-xs opacity-75 leading-relaxed">
                {item.description}
              </p>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

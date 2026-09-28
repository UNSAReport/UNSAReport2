import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface ComparisonBarItem {
  label: string;
  value: string;
  percentage: number; // 0 a 100
  note?: string;
}

export interface StatsComparisonBarProps {
  tag?: string;
  title: string;
  subtitle?: string;
  bars: ComparisonBarItem[];
}

/**
 * Comparación cuantitativa mediante barras de progreso horizontales proporcionadas.
 */
export function StatsComparisonBar({
  tag = 'Comparativa Proporcional',
  title,
  subtitle,
  bars = [],
}: StatsComparisonBarProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="w-full flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
        <SlideCard
          variant="default"
          className="p-6 w-full max-w-full min-w-0 min-h-0 overflow-hidden"
        >
          <SlideStack spacing="1rem">
            {bars.slice(0, 5).map((bar, idx) => (
              <div
                key={`comp-bar-${bar.label || idx}`}
                className="min-w-0 space-y-1.5"
              >
                <div className="flex justify-between items-baseline gap-3 min-w-0">
                  <span className="text-sm font-bold line-clamp-1 break-words min-w-0 truncate">
                    {bar.label}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums shrink-0">
                    {bar.value}
                  </span>
                </div>
                {/* Contenedor de la barra */}
                <div className="w-full max-w-full min-w-0 h-3 rounded-full border border-current/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-current opacity-80"
                    style={{
                      width: `${Math.min(100, Math.max(0, bar.percentage))}%`,
                    }}
                  />
                </div>
                {bar.note && (
                  <span className="text-[10px] opacity-60 block line-clamp-1 break-words min-w-0">
                    {bar.note}
                  </span>
                )}
              </div>
            ))}
          </SlideStack>
        </SlideCard>
      </div>
    </SlideSection>
  );
}

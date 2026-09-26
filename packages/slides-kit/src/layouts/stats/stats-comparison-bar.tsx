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
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideCard variant="default" className="p-8">
          <SlideStack spacing="1.5rem">
            {bars.map((bar, idx) => (
              <div key={`comp-bar-${bar.label || idx}`} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold">{bar.label}</span>
                  <span className="font-mono text-base font-bold">
                    {bar.value}
                  </span>
                </div>
                {/* Contenedor de la barra */}
                <div className="w-full h-3 rounded-full border border-current/20 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-current opacity-80 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, bar.percentage))}%`,
                    }}
                  />
                </div>
                {bar.note && (
                  <span className="text-[10px] opacity-60 block">
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

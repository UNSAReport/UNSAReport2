import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface GaugeMetric {
  label: string;
  value: number; // 0 a 100
  unit?: string;
  statusNote: string;
}

export interface StatsGaugeRowProps {
  tag?: string;
  title: string;
  subtitle?: string;
  gauges: GaugeMetric[];
}

/**
 * Fila de medidores porcentuales de capacidad o utilización de recursos del sistema.
 */
export function StatsGaugeRow({
  tag = 'Monitorización de Recursos',
  title,
  subtitle,
  gauges = [],
}: StatsGaugeRowProps) {
  const cols = gauges.length <= 3 ? 3 : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={cols as 3 | 4} gap="1.5rem" className="my-auto">
        {gauges.map((g, idx) => (
          <SlideCard
            key={`gauge-${g.label || idx}`}
            variant="default"
            className="p-6 text-center items-center justify-between"
          >
            <span className="text-xs uppercase font-mono opacity-60 font-semibold mb-2">
              {g.label}
            </span>
            <div className="relative w-36 h-36 rounded-full border-4 border-current/20 flex flex-col items-center justify-center my-3">
              <span className="text-4xl font-black font-mono">
                {g.value}
                {g.unit || '%'}
              </span>
              <div
                className="absolute inset-0 rounded-full border-4 border-current border-t-transparent transition-all"
                style={{ transform: `rotate(${(g.value / 100) * 360}deg)` }}
              />
            </div>
            <span className="text-xs opacity-75 font-mono">{g.statusNote}</span>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

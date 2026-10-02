import { SlideCard } from '@/primitives/SlideCard';
import { SlideGauge } from '@/primitives/SlideGauge';
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
          {gauges.map((g, idx) => (
            <SlideCard
              key={`gauge-${g.label || idx}`}
              variant="default"
              className="p-6 text-center items-center justify-between min-w-0 min-h-0 overflow-hidden"
            >
              <span className="text-xs uppercase font-mono opacity-60 font-semibold mb-2 truncate max-w-full min-w-0">
                {g.label}
              </span>
              <div className="flex-1 min-h-0 max-h-full overflow-hidden flex items-center justify-center w-full my-3">
                <SlideGauge
                  value={g.value}
                  max={100}
                  tone={g.value >= 80 ? 'warning' : 'accent'}
                  size="8rem"
                  unit={g.unit || '%'}
                  label={g.label}
                />
              </div>
              <span className="text-xs opacity-75 font-mono line-clamp-2 break-words max-w-full min-w-0">
                {g.statusNote}
              </span>
            </SlideCard>
          ))}
        </SlideGrid>
      </div>
    </SlideSection>
  );
}

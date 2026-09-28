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
                <div className="relative w-32 h-32 max-w-full max-h-full aspect-square shrink-0 rounded-full border-4 border-current/20 flex flex-col items-center justify-center overflow-hidden p-2">
                  <span className="text-4xl font-black font-mono truncate max-w-full min-w-0">
                    {g.value}
                    {g.unit || '%'}
                  </span>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-current border-t-transparent transition-all"
                    style={{ transform: `rotate(${(g.value / 100) * 360}deg)` }}
                  />
                </div>
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

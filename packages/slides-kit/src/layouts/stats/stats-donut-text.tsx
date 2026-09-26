import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DonutSegment {
  label: string;
  percentage: string;
  detail: string;
}

export interface StatsDonutTextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  mainPercentage: string;
  mainLabel: string;
  segments: DonutSegment[];
}

/**
 * Métrica circular central con desglose analítico en lista detallada a la derecha.
 */
export function StatsDonutText({
  tag = 'Distribución Proporcional',
  title,
  subtitle,
  mainPercentage,
  mainLabel,
  segments = [],
}: StatsDonutTextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="40-60"
        gap="2.5rem"
        left={
          <SlideCard
            variant="glow"
            className="h-full items-center justify-center text-center p-8"
          >
            <div className="w-48 h-48 rounded-full border-8 border-current flex flex-col items-center justify-center shadow-xl">
              <span className="text-5xl font-black font-mono">
                {mainPercentage}
              </span>
              <span className="text-xs uppercase font-mono tracking-wider opacity-60 mt-1">
                {mainLabel}
              </span>
            </div>
          </SlideCard>
        }
        right={
          <div className="flex flex-col justify-center h-full space-y-4">
            {segments.map((seg, idx) => (
              <SlideCard
                key={`seg-${seg.label || idx}`}
                variant="default"
                className="p-4 flex-row items-center justify-between"
              >
                <div>
                  <h4 className="text-base font-bold">{seg.label}</h4>
                  <p className="text-xs opacity-75">{seg.detail}</p>
                </div>
                <SlideBadge
                  variant="secondary"
                  className="font-mono font-bold text-sm"
                >
                  {seg.percentage}
                </SlideBadge>
              </SlideCard>
            ))}
          </div>
        }
      />
    </SlideSection>
  );
}

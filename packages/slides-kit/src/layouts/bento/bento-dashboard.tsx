import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface DashboardMetric {
  label: string;
  value: string;
}

export interface BentoDashboardProps {
  tag?: string;
  title: string;
  subtitle?: string;
  metrics: DashboardMetric[];
  chartTitle: string;
  chartContent: ReactNode;
  activityTitle: string;
  activities: string[];
}

/**
 * Panel de control integral estilo Dashboard con KPIs superiores, gráfico central y actividad lateral.
 */
export function BentoDashboard({
  tag = 'Panel de Control',
  title,
  subtitle,
  metrics = [],
  chartTitle,
  chartContent,
  activityTitle = 'Actividad Reciente',
  activities = [],
}: BentoDashboardProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="flex flex-col h-full gap-4 my-auto">
        {/* Top 4 KPI Metrics */}
        <SlideGrid cols={4} gap="1rem">
          {metrics.slice(0, 4).map((m, idx) => (
            <SlideCard
              key={`dash-kpi-${m.label || idx}`}
              variant="default"
              className="p-3 text-center"
            >
              <span className="text-[10px] uppercase font-mono opacity-60 block">
                {m.label}
              </span>
              <span className="text-xl font-black font-mono mt-0.5 block">
                {m.value}
              </span>
            </SlideCard>
          ))}
        </SlideGrid>

        {/* Main Chart + Side Widget */}
        <div className="flex-1 min-h-0">
          <SlideSplit
            ratio="70-30"
            gap="1rem"
            left={
              <SlideCard
                variant="elevated"
                className="h-full justify-between p-6"
              >
                <div className="flex justify-between items-center mb-2 border-b border-current/10 pb-2">
                  <h4 className="text-sm font-bold font-mono">{chartTitle}</h4>
                  <SlideBadge variant="secondary" className="text-[10px]">
                    Gráfico en Tiempo Real
                  </SlideBadge>
                </div>
                <div className="flex-1 flex items-center justify-center p-2">
                  {chartContent}
                </div>
              </SlideCard>
            }
            right={
              <SlideCard variant="default" className="h-full justify-start p-5">
                <h4 className="text-xs uppercase font-mono font-bold mb-3 border-b border-current/10 pb-2">
                  {activityTitle}
                </h4>
                <ul className="space-y-2">
                  {activities.map((act) => (
                    <li
                      key={`act-${act}`}
                      className="text-xs opacity-75 border-b border-current/5 pb-1"
                    >
                      {act}
                    </li>
                  ))}
                </ul>
              </SlideCard>
            }
          />
        </div>
      </div>
    </SlideSection>
  );
}

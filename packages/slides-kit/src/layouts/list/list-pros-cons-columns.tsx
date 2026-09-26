import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ProsConsCategory {
  title: string;
  badge?: string;
  points: Array<{ text: string; isPro: boolean }>;
}

export interface ListProsConsColumnsProps {
  tag?: string;
  title?: string;
  subtitle?: string;
  columns: ProsConsCategory[];
}

/**
 * Matriz comparativa de múltiples columnas evaluando fortalezas y debilidades.
 */
export function ListProsConsColumns({
  tag = 'Evaluación Comparativa',
  title = 'Balance de Fortalezas y Debilidades',
  subtitle = 'Análisis multidimensional de las alternativas consideradas.',
  columns = [],
}: ListProsConsColumnsProps) {
  const cols = columns.length <= 2 ? 2 : columns.length === 3 ? 3 : 4;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={cols as 2 | 3 | 4} gap="1.5rem" className="my-auto">
        {columns.map((col, idx) => (
          <SlideCard
            key={`col-${col.title || idx}`}
            variant="default"
            className="p-6 justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-center mb-4 border-b border-current/10 pb-2">
                <h4 className="text-lg font-bold">{col.title}</h4>
                {col.badge && (
                  <SlideBadge variant="secondary" className="text-[10px]">
                    {col.badge}
                  </SlideBadge>
                )}
              </div>
              <ul className="space-y-3">
                {col.points.map((pt) => (
                  <li
                    key={`pt-${pt.text}`}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                  >
                    <span className="font-bold opacity-80 shrink-0">
                      {pt.isPro ? '✓' : '✕'}
                    </span>
                    <span className={pt.isPro ? 'opacity-90' : 'opacity-70'}>
                      {pt.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

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
      <SlideGrid
        cols={cols as 2 | 3 | 4}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {columns.slice(0, 4).map((col, idx) => (
          <SlideCard
            key={`col-${col.title || idx}`}
            variant="default"
            className="p-6 justify-start min-h-0 min-w-0 overflow-hidden"
          >
            <div>
              <div className="flex justify-between items-center gap-2 mb-4 border-b border-current/10 pb-2 min-w-0">
                <h4 className="text-lg font-bold break-words min-w-0 line-clamp-1">
                  {col.title}
                </h4>
                {col.badge && (
                  <SlideBadge
                    variant="secondary"
                    className="text-[10px] shrink-0"
                  >
                    {col.badge}
                  </SlideBadge>
                )}
              </div>
              <ul className="space-y-3 min-w-0 overflow-hidden">
                {col.points.slice(0, 6).map((pt) => (
                  <li
                    key={`pt-${pt.text}`}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                  >
                    <span className="font-bold opacity-80 shrink-0">
                      {pt.isPro ? '✓' : '✕'}
                    </span>
                    <span
                      className={`${pt.isPro ? 'opacity-90' : 'opacity-70'} break-words min-w-0 line-clamp-2`}
                    >
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

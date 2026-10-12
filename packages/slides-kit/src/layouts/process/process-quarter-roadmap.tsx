import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface QuarterRoadmapItem {
  /** Etiqueta del trimestre (ej: 'Q1') */
  label: string;
  /** Título del hito del trimestre */
  title: string;
  /** Descripción del hito */
  text: string;
}

export interface ProcessQuarterRoadmapProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal */
  title: string;
  /** Trimestres del roadmap (máximo 4) */
  quarters: QuarterRoadmapItem[];
  /** Lavado claro/oscuro */
  tone?: 'light' | 'dark';
}

/**
 * Roadmap trimestral con chips Q sobre 4 tarjetas de hitos.
 */
export function ProcessQuarterRoadmap({
  tag,
  title,
  quarters,
  tone = 'light',
}: ProcessQuarterRoadmapProps) {
  const cards = quarters.slice(0, 4);
  return (
    <SlideSection withGradientBar={false} tone={tone}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-5xl mx-auto px-8 overflow-hidden">
        {tag && (
          <div className="mb-5 shrink-0">
            <SlideBadge variant="secondary">{tag}</SlideBadge>
          </div>
        )}

        <h2
          className="text-4xl font-extrabold tracking-tight mb-8 line-clamp-2 break-words min-w-0"
          style={{ fontFamily: 'var(--slide-heading-font-family, inherit)' }}
        >
          {title}
        </h2>

        <ol className="grid grid-cols-2 lg:grid-cols-4 gap-5 w-full min-w-0 overflow-hidden">
          {cards.map((q) => (
            <li
              key={`quarter-${q.label}-${q.title}`}
              className="flex flex-col min-w-0 rounded-2xl border p-6 overflow-hidden"
              style={{
                borderColor: 'var(--slide-border)',
                background: 'var(--slide-surface)',
              }}
            >
              <span
                className="self-start px-4 py-1 text-sm font-black uppercase tracking-widest rounded-full mb-4 shrink-0"
                style={{
                  background: 'var(--slide-accent)',
                  color: 'var(--slide-accent-contrast, #fff)',
                }}
              >
                {q.label}
              </span>
              <p className="text-lg font-bold mb-2 line-clamp-2 break-words min-w-0">
                {q.title}
              </p>
              <p className="text-sm opacity-70 leading-relaxed line-clamp-4 break-words min-w-0">
                {q.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </SlideSection>
  );
}

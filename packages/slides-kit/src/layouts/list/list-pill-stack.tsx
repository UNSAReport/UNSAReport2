import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';

export interface ListPillStackProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal */
  title: string;
  /** Píldoras de texto (máximo 5) */
  items: string[];
}

/**
 * Pila vertical de píldoras uppercase de ancho completo.
 */
export function ListPillStack({ tag, title, items }: ListPillStackProps) {
  const pills = items.slice(0, 5);
  return (
    <SlideSection withGradientBar={false}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col justify-center max-w-4xl mx-auto px-8 overflow-hidden">
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

        <ul className="flex flex-col gap-4 w-full min-w-0 overflow-hidden">
          {pills.map((item) => (
            <li
              key={`pill-${item}`}
              className="w-full px-8 py-4 text-center text-lg font-bold uppercase tracking-widest line-clamp-2 break-words min-w-0"
              style={{
                borderRadius: 'var(--slide-pill-radius, 999px)',
                letterSpacing: 'var(--slide-kicker-tracking, 0.2em)',
                border: '1px solid var(--slide-border)',
                background: 'var(--slide-surface)',
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </SlideSection>
  );
}

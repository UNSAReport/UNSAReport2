import { SlideSection } from '@/primitives/SlideSection';

export interface TocNumberedItem {
  /** Número de sección */
  n: string | number;
  /** Título de la sección */
  title: string;
  /** Número de página */
  page: string | number;
}

export interface ListTocNumberedProps {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título del índice */
  title: string;
  /** Entradas del índice (máx. ~10) */
  items: TocNumberedItem[];
}

/**
 * Índice numerado con líderes punteados y números de página.
 */
export function ListTocNumbered({
  tag = 'Índice',
  title,
  items = [],
}: ListTocNumberedProps) {
  const shown = items.slice(0, 10);
  const twoCol = shown.length >= 6;
  return (
    <SlideSection tag={tag} title={title}>
      <div
        className={`mx-auto flex w-full min-w-0 max-w-4xl flex-1 min-h-0 flex-col justify-center gap-x-10 gap-y-4 overflow-hidden ${
          twoCol ? 'sm:grid sm:grid-cols-2' : ''
        }`}
      >
        {shown.map((item) => (
          <div
            key={`toc-${item.n}-${item.title}`}
            className="flex items-baseline gap-3 min-w-0 overflow-hidden"
          >
            <span
              className="text-xl font-black shrink-0 w-10 text-right"
              style={{ color: 'var(--slide-accent)' }}
            >
              {typeof item.n === 'number' && item.n < 10
                ? `0${item.n}`
                : item.n}
            </span>
            <span className="text-base font-semibold line-clamp-1 break-words min-w-0 flex-shrink">
              {item.title}
            </span>
            <span
              aria-hidden="true"
              className="mx-1 flex-1 min-w-6 shrink-0 -translate-y-1 border-b-2 border-dotted"
              style={{
                borderColor: 'var(--slide-divider-color, currentColor)',
                opacity: 0.5,
              }}
            />
            <span className="text-sm font-medium opacity-60 shrink-0">
              {item.page}
            </span>
          </div>
        ))}
      </div>
    </SlideSection>
  );
}

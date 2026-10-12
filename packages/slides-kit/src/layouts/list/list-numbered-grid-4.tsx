import { SlideSection } from '@/primitives/SlideSection';

export interface NumberedGrid4Item {
  /** Numeral del elemento */
  n: string | number;
  /** Texto del elemento */
  text: string;
}

export interface ListNumberedGrid4Props {
  /** Etiqueta superior o categoría */
  tag?: string;
  /** Título principal */
  title: string;
  /** Cuatro elementos numerados */
  items: NumberedGrid4Item[];
}

/**
 * Cuadrícula 2x2 de cuatro elementos con numerales grandes como ancla visual.
 */
export function ListNumberedGrid4({
  tag,
  title,
  items = [],
}: ListNumberedGrid4Props) {
  const visible = items.slice(0, 4);
  return (
    <SlideSection tag={tag} title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 min-h-0 min-w-0 w-full max-w-4xl mx-auto content-center overflow-hidden">
        {visible.map((item, idx) => (
          <div
            key={`num-grid-${item.n || idx}`}
            className="flex items-start gap-4 min-w-0 overflow-hidden"
          >
            <span
              className="text-5xl font-black leading-none shrink-0"
              style={{
                fontFamily: 'var(--slide-heading-font-family, inherit)',
              }}
            >
              {item.n}
            </span>
            <p className="text-base leading-relaxed line-clamp-4 break-words min-w-0 pt-1">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </SlideSection>
  );
}

import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface IconListItem {
  icon: string;
  title: string;
  description: string;
}

export interface ListIconItemsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: IconListItem[];
}

/**
 * Lista en cuadrícula con iconos estructurales y descripciones explicativas.
 */
export function ListIconItems({
  tag = 'Características',
  title,
  subtitle,
  items = [],
}: ListIconItemsProps) {
  const cols = items.length <= 4 ? 2 : 3;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={cols as 2 | 3} gap="1.5rem">
        {items.map((item, idx) => (
          <SlideCard
            key={`icon-item-${item.title || idx}`}
            variant="default"
            className="p-6"
          >
            <div className="flex items-center gap-4 mb-3">
              <span className="w-10 h-10 rounded-full border border-current flex items-center justify-center text-lg font-bold shrink-0 opacity-80">
                {item.icon}
              </span>
              <h4 className="text-xl font-bold">{item.title}</h4>
            </div>
            <p className="text-sm opacity-75 leading-relaxed">
              {item.description}
            </p>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

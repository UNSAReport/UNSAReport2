import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface BulletCardItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ListBulletCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  items: BulletCardItem[];
}

/**
 * Layout de lista estructurada con tarjetas informativas y viñetas visuales.
 */
export function ListBulletCards({
  tag,
  title,
  subtitle,
  items = [],
}: ListBulletCardsProps) {
  const cols = items.length <= 4 ? 2 : 3;

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid
        cols={cols as 2 | 3}
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0 overflow-hidden"
      >
        {items.slice(0, 6).map((item, idx) => (
          <SlideCard
            key={`bullet-${item.title || idx}`}
            variant="default"
            className="p-6 justify-start min-w-0 min-h-0 overflow-hidden"
          >
            <div className="flex items-start gap-4 min-w-0 overflow-hidden">
              <span className="w-8 h-8 rounded-lg border border-current font-bold flex items-center justify-center shrink-0 text-sm opacity-80">
                {item.icon || '→'}
              </span>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h4 className="text-xl font-bold mb-2 line-clamp-2 break-words min-w-0">
                  {item.title}
                </h4>
                <p className="text-sm opacity-75 leading-relaxed line-clamp-4 break-words overflow-hidden">
                  {item.description}
                </p>
              </div>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

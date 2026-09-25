import { SlideCard } from '../../primitives/SlideCard';
import { SlideGrid } from '../../primitives/SlideGrid';
import { SlideSection } from '../../primitives/SlideSection';

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
      <SlideGrid cols={cols as 2 | 3} gap="1.5rem">
        {items.map((item, idx) => (
          <SlideCard key={idx} variant="default" className="p-6 justify-start">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-[var(--slide-accent,#800020)] text-[var(--slide-accent-secondary,#D4AF37)] font-bold flex items-center justify-center shrink-0 text-sm">
                {item.icon || '→'}
              </span>
              <div>
                <h4 className="text-xl font-bold text-[var(--slide-text,#f1f5f9)] mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-[var(--slide-text-muted,#94a3b8)] leading-relaxed">
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

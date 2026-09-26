import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideGrid } from '@/primitives/SlideGrid';
import { SlideSection } from '@/primitives/SlideSection';

export interface ColumnCard {
  title: string;
  badge?: string;
  content: ReactNode;
  featured?: boolean;
}

export interface Bento3HorizontalProps {
  tag?: string;
  title: string;
  subtitle?: string;
  columns: ColumnCard[];
}

/**
 * 3 columnas verticales equivalentes en disposición horizontal balanceada.
 */
export function Bento3Horizontal({
  tag,
  title,
  subtitle,
  columns = [],
}: Bento3HorizontalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideGrid cols={3} gap="2rem" className="h-full my-auto">
        {columns.slice(0, 3).map((col, idx) => (
          <SlideCard
            key={`bento-3h-${col.title || idx}`}
            variant={col.featured ? 'glow' : 'default'}
            className="p-8 justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{col.title}</h3>
                {col.badge && (
                  <SlideBadge variant="secondary">{col.badge}</SlideBadge>
                )}
              </div>
              <div className="text-sm opacity-85 leading-relaxed">
                {col.content}
              </div>
            </div>
          </SlideCard>
        ))}
      </SlideGrid>
    </SlideSection>
  );
}

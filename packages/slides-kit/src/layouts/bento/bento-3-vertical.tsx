import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideStack } from '@/primitives/SlideStack';

export interface RowCard {
  title: string;
  badge?: string;
  content: ReactNode;
}

export interface Bento3VerticalProps {
  tag?: string;
  title: string;
  subtitle?: string;
  rows: RowCard[];
}

/**
 * 3 tarjetas horizontales apiladas verticalmente para flujos o capas de alto nivel.
 */
export function Bento3Vertical({
  tag,
  title,
  subtitle,
  rows = [],
}: Bento3VerticalProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto w-full my-auto">
        <SlideStack spacing="1.25rem">
          {rows.slice(0, 3).map((r, idx) => (
            <SlideCard
              key={`bento-3v-${r.title || idx}`}
              variant="default"
              className="p-5 flex-row items-center justify-between"
            >
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-lg font-bold">{r.title}</h4>
                  {r.badge && (
                    <SlideBadge variant="secondary" className="text-xs">
                      {r.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-75">{r.content}</div>
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

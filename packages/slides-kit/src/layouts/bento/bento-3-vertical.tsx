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
      <div className="w-full flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
        <SlideStack
          spacing="1.5rem"
          className="flex-1 min-h-0 min-w-0 overflow-hidden"
        >
          {rows.slice(0, 3).map((r, idx) => (
            <SlideCard
              key={`bento-3v-${r.title || idx}`}
              variant="default"
              className="p-5 flex-1 min-h-0 min-w-0 flex-row items-center overflow-hidden"
            >
              <div className="flex-1 pr-6 min-w-0 min-h-0 overflow-hidden">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-lg font-bold line-clamp-2 break-words min-w-0">
                    {r.title}
                  </h4>
                  {r.badge && (
                    <SlideBadge
                      variant="secondary"
                      className="text-xs shrink-0"
                    >
                      {r.badge}
                    </SlideBadge>
                  )}
                </div>
                <div className="text-xs opacity-75 line-clamp-2 break-words overflow-hidden">
                  {r.content}
                </div>
              </div>
            </SlideCard>
          ))}
        </SlideStack>
      </div>
    </SlideSection>
  );
}

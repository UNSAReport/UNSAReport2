import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface ComparisonSide {
  title: string;
  badge?: string;
  features?: string[];
  items?: string[];
  summary?: string;
}

export interface SplitComparisonCardsProps {
  tag?: string;
  title: string;
  subtitle?: string;
  left: ComparisonSide;
  right: ComparisonSide;
  children?: ReactNode;
}

/**
 * Layout de comparación directa entre dos alternativas o tecnologías con tarjetas balanceadas.
 */
export function SplitComparisonCards({
  tag,
  title,
  subtitle,
  left,
  right,
  children,
}: SplitComparisonCardsProps) {
  const leftFeatures = left.features || left.items || [];
  const rightFeatures = right.features || right.items || [];

  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-8"
          >
            <div>
              <div className="flex justify-between items-center gap-3 mb-4 shrink-0">
                <h3 className="text-2xl font-bold truncate min-w-0">
                  {left.title}
                </h3>
                {left.badge && (
                  <SlideBadge variant="secondary">{left.badge}</SlideBadge>
                )}
              </div>
              <ul className="space-y-3 mb-6 min-h-0 overflow-hidden">
                {leftFeatures.slice(0, 6).map((feat) => (
                  <li
                    key={`left-feat-${feat}`}
                    className="flex items-start gap-2 text-base opacity-85 leading-relaxed"
                  >
                    <span className="font-bold opacity-60 shrink-0">•</span>
                    <span className="min-w-0 break-words line-clamp-2">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {left.summary && (
              <div className="shrink-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <p className="text-sm opacity-70 pt-4 line-clamp-2 break-words">
                  {left.summary}
                </p>
              </div>
            )}
          </SlideCard>
        }
        right={
          <SlideCard
            variant="elevated"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-between p-8"
          >
            <div>
              <div className="flex justify-between items-center gap-3 mb-4 shrink-0">
                <h3 className="text-2xl font-bold truncate min-w-0">
                  {right.title}
                </h3>
                {right.badge && (
                  <SlideBadge variant="accent">{right.badge}</SlideBadge>
                )}
              </div>
              <ul className="space-y-3 mb-6 min-h-0 overflow-hidden">
                {rightFeatures.slice(0, 6).map((feat) => (
                  <li
                    key={`right-feat-${feat}`}
                    className="flex items-start gap-2 text-base opacity-85 leading-relaxed"
                  >
                    <span className="font-bold opacity-60 shrink-0">•</span>
                    <span className="min-w-0 break-words line-clamp-2">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {right.summary && (
              <div className="shrink-0">
                <SlideDivider thickness="1px" opacity={0.12} />
                <p className="text-sm opacity-70 pt-4 line-clamp-2 break-words">
                  {right.summary}
                </p>
              </div>
            )}
          </SlideCard>
        }
      />
      {children}
    </SlideSection>
  );
}

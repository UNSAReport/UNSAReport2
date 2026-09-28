import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
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
          <SlideCard variant="default" className="h-full justify-between p-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{left.title}</h3>
                {left.badge && (
                  <SlideBadge variant="secondary">{left.badge}</SlideBadge>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {leftFeatures.map((feat) => (
                  <li
                    key={`left-feat-${feat}`}
                    className="flex items-start gap-2 text-base opacity-85"
                  >
                    <span className="font-bold opacity-60">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            {left.summary && (
              <p className="text-sm opacity-70 border-t border-current/10 pt-4">
                {left.summary}
              </p>
            )}
          </SlideCard>
        }
        right={
          <SlideCard variant="elevated" className="h-full justify-between p-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{right.title}</h3>
                {right.badge && (
                  <SlideBadge variant="accent">{right.badge}</SlideBadge>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {rightFeatures.map((feat) => (
                  <li
                    key={`right-feat-${feat}`}
                    className="flex items-start gap-2 text-base opacity-85"
                  >
                    <span className="font-bold opacity-60">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            {right.summary && (
              <p className="text-sm opacity-70 border-t border-current/10 pt-4">
                {right.summary}
              </p>
            )}
          </SlideCard>
        }
      />
      {children}
    </SlideSection>
  );
}

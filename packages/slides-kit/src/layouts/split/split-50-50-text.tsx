import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface Split5050TextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  leftTitle?: string;
  leftContent?: string | ReactNode;
  rightTitle?: string;
  rightContent?: string | ReactNode;
}

/**
 * Layout de dos columnas 50/50 balanceadas para comparaciones estructurales de conceptos.
 */
export function Split5050Text({
  tag,
  title,
  subtitle,
  leftTitle = 'Enfoque A',
  leftContent,
  rightTitle = 'Enfoque B',
  rightContent,
}: Split5050TextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2rem"
        left={
          <SlideCard className="h-full justify-start p-8">
            <h3 className="text-2xl font-bold mb-4">{leftTitle}</h3>
            <div className="text-base leading-relaxed opacity-90">
              {typeof leftContent === 'string' ? (
                <p className="whitespace-pre-line">{leftContent}</p>
              ) : (
                leftContent
              )}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard className="h-full justify-start p-8">
            <h3 className="text-2xl font-bold mb-4">{rightTitle}</h3>
            <div className="text-base leading-relaxed opacity-90">
              {typeof rightContent === 'string' ? (
                <p className="whitespace-pre-line">{rightContent}</p>
              ) : (
                rightContent
              )}
            </div>
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

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
        gap="1.5rem"
        className="flex-1 min-h-0 min-w-0"
        left={
          <SlideCard className="h-full min-h-0 min-w-0 overflow-hidden justify-start p-8">
            <h3 className="text-2xl font-bold mb-4 line-clamp-2 break-words">
              {leftTitle}
            </h3>
            <div className="text-base leading-relaxed opacity-90 min-w-0 min-h-0 overflow-hidden break-words line-clamp-[10]">
              {typeof leftContent === 'string' ? (
                <p className="whitespace-pre-line line-clamp-[10] break-words">
                  {leftContent}
                </p>
              ) : (
                leftContent
              )}
            </div>
          </SlideCard>
        }
        right={
          <SlideCard className="h-full min-h-0 min-w-0 overflow-hidden justify-start p-8">
            <h3 className="text-2xl font-bold mb-4 line-clamp-2 break-words">
              {rightTitle}
            </h3>
            <div className="text-base leading-relaxed opacity-90 min-w-0 min-h-0 overflow-hidden break-words line-clamp-[10]">
              {typeof rightContent === 'string' ? (
                <p className="whitespace-pre-line line-clamp-[10] break-words">
                  {rightContent}
                </p>
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

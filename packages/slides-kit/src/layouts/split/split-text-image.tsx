import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitTextImageProps {
  tag?: string;
  title: string;
  subtitle?: string;
  contentTitle?: string;
  paragraphs: string[];
  imageUrl: string;
  imageAlt?: string;
  children?: ReactNode;
}

/**
 * Texto argumentativo en columna izquierda e imagen complementaria en columna derecha.
 */
export function SplitTextImage({
  tag,
  title,
  subtitle,
  contentTitle,
  paragraphs = [],
  imageUrl,
  imageAlt = 'Ilustración descriptiva',
  children,
}: SplitTextImageProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2.5rem"
        left={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 justify-center p-8 space-y-4 overflow-hidden"
          >
            {contentTitle && (
              <h3 className="text-2xl font-bold mb-2 truncate shrink-0">
                {contentTitle}
              </h3>
            )}
            <div className="min-h-0 flex flex-col gap-4 overflow-hidden">
              {paragraphs.slice(0, 3).map((p) => (
                <p
                  key={`p-txt-img-${p}`}
                  className="text-base opacity-85 leading-relaxed line-clamp-4 break-words min-w-0"
                >
                  {p}
                </p>
              ))}
            </div>
            {children}
          </SlideCard>
        }
        right={
          <div className="h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full min-h-0 max-h-full rounded-[var(--slide-radius,12px)] overflow-hidden border border-current/10 shadow-lg shrink-0">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        }
      />
    </SlideSection>
  );
}

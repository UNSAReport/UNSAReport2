import type { ReactNode } from 'react';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface SplitImageTextProps {
  tag?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAlt?: string;
  contentTitle?: string;
  paragraphs: string[];
  children?: ReactNode;
}

/**
 * Imagen en columna izquierda y texto explicativo estructurado en la derecha.
 */
export function SplitImageText({
  tag,
  title,
  subtitle,
  imageUrl,
  imageAlt = 'Ilustración explicativa',
  contentTitle,
  paragraphs = [],
  children,
}: SplitImageTextProps) {
  return (
    <SlideSection tag={tag} title={title} subtitle={subtitle}>
      <SlideSplit
        ratio="50-50"
        gap="2.5rem"
        left={
          <div className="h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full min-h-0 min-w-0 max-h-full rounded-[var(--slide-radius,12px)] overflow-hidden border border-current/10 shadow-lg">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="w-full h-full min-w-0 object-cover"
              />
            </div>
          </div>
        }
        right={
          <SlideCard
            variant="default"
            className="h-full min-h-0 min-w-0 overflow-hidden justify-center p-8 space-y-4"
          >
            {contentTitle && (
              <h3 className="text-2xl font-bold mb-2 truncate">
                {contentTitle}
              </h3>
            )}
            <div className="min-h-0 overflow-hidden space-y-4">
              {paragraphs.slice(0, 3).map((p) => (
                <p
                  key={`p-img-txt-${p}`}
                  className="text-base opacity-85 leading-relaxed break-words line-clamp-4"
                >
                  {p}
                </p>
              ))}
            </div>
            {children}
          </SlideCard>
        }
      />
    </SlideSection>
  );
}

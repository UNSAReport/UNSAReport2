import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface HeroSplitImageProps {
  tag?: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  imageUrl?: string;
  imageAlt?: string;
  children?: ReactNode;
}

/**
 * Portada con texto principal a la izquierda e imagen representativa a la derecha.
 */
export function HeroSplitImage({
  tag = 'Presentación',
  title,
  subtitle,
  author,
  date,
  imageUrl = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  imageAlt = 'Ilustración de la presentación',
  children,
}: HeroSplitImageProps) {
  return (
    <SlideSection withGradientBar={true}>
      <SlideSplit
        ratio="60-40"
        gap="2rem"
        className="min-h-0 min-w-0 overflow-hidden"
        left={
          <div className="flex flex-col justify-center items-start text-left min-w-0 min-h-0 h-full overflow-hidden">
            {tag && (
              <div className="mb-4 shrink-0">
                <SlideBadge variant="accent">{tag}</SlideBadge>
              </div>
            )}
            <h1
              className="text-5xl font-black tracking-tight mb-4 leading-tight line-clamp-2 break-words"
              style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl opacity-80 mb-6 leading-relaxed line-clamp-3 break-words">
                {subtitle}
              </p>
            )}
            {(author || date) && (
              <div className="flex items-center gap-3 text-sm font-medium opacity-75 pt-4 border-t border-current/10 w-full shrink-0 min-w-0 overflow-hidden">
                {author && <span className="truncate">{author}</span>}
                {author && date && <span className="shrink-0">•</span>}
                {date && (
                  <span className="opacity-70 shrink-0 truncate">{date}</span>
                )}
              </div>
            )}
            {children}
          </div>
        }
        right={
          <div className="w-full h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full max-h-full rounded-[var(--slide-radius,12px)] overflow-hidden border border-current/10 shadow-2xl min-h-0">
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

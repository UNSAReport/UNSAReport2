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
        gap="3rem"
        left={
          <div className="flex flex-col justify-center items-start text-left">
            {tag && (
              <div className="mb-4">
                <SlideBadge variant="accent">{tag}</SlideBadge>
              </div>
            )}
            <h1
              className="text-5xl font-black tracking-tight text-[var(--slide-text,#f1f5f9)] mb-4 leading-tight"
              style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xl text-[var(--slide-text-muted,#94a3b8)] mb-6 leading-relaxed">
                {subtitle}
              </p>
            )}
            {(author || date) && (
              <div className="flex items-center gap-3 text-sm text-[var(--slide-accent-secondary,#D4AF37)] font-medium pt-4 border-t border-[var(--slide-border,rgba(255,255,255,0.1))] w-full">
                {author && <span>{author}</span>}
                {author && date && <span>•</span>}
                {date && (
                  <span className="text-[var(--slide-text-muted,#94a3b8)]">
                    {date}
                  </span>
                )}
              </div>
            )}
            {children}
          </div>
        }
        right={
          <div className="h-full flex items-center justify-center">
            <div className="w-full h-80 rounded-[var(--slide-radius,12px)] overflow-hidden border border-[var(--slide-border,rgba(255,255,255,0.1))] shadow-2xl">
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

import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideDivider } from '@/primitives/SlideDivider';
import { SlideSection } from '@/primitives/SlideSection';
import { SlideSplit } from '@/primitives/SlideSplit';

export interface HeroSplitWordmark {
  /** Línea pequeña superior (p. ej. 'HARPER RUSSO', Roboto 15pt) */
  eyebrow: string;
  /** Línea serif inferior (p. ej. 'Ingoude Company', PT Serif 32pt) */
  company: string;
}

export interface HeroSplitImageProps {
  tag?: string;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Wordmark pequeño bajo el título gigante (portadas Harper S1/S12). */
  wordmark?: HeroSplitWordmark;
  /** Color de la regla fina sobre el wordmark (PPTX: #FF5347, 7.5pt). */
  ruleColor?: string;
  /** Cuando es portada, el panel foto va full-bleed al borde derecho (~36%). */
  coverBleed?: boolean;
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
  wordmark,
  ruleColor = 'var(--slide-accent-bar,#FF5347)',
  coverBleed = false,
  children,
}: HeroSplitImageProps) {
  const mark = wordmark;
  const isCover = coverBleed || mark !== undefined;
  if (isCover) {
    return (
      <div className="relative w-full h-full flex flex-row overflow-hidden">
        <div
          className="relative flex flex-col justify-center items-start text-left min-w-0 h-full overflow-hidden"
          style={{ width: '64%', padding: '4rem 3rem 4rem 4rem' }}
        >
          <h1
            className="font-black tracking-tight mb-8 leading-none break-words"
            style={{
              fontFamily: 'var(--slide-font-family, inherit)',
              fontSize: 'clamp(3rem, 8vw, 7.5rem)',
            }}
          >
            {title}
          </h1>
          {mark && (
            <div className="w-full shrink-0 min-w-0 overflow-hidden">
              <div
                aria-hidden="true"
                className="mb-6 shrink-0"
                style={{ background: ruleColor, height: '7px', width: '4.5rem' }}
              />
              {mark.company && (
                <p
                  className="leading-tight mb-2 break-words"
                  style={{
                    fontFamily: 'var(--slide-heading-font-family, Georgia, serif)',
                    fontSize: '2rem',
                  }}
                >
                  {mark.company}
                </p>
              )}
              <p
                className="font-normal uppercase break-words"
                style={{ letterSpacing: '0.08em', fontSize: '1rem' }}
              >
                {mark.eyebrow}
              </p>
            </div>
          )}
          {children}
        </div>
        <div className="relative h-full min-h-0 min-w-0 overflow-hidden" style={{ width: '36%' }}>
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }
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
              <div className="w-full shrink-0 min-w-0 overflow-hidden">
                <SlideDivider thickness="1px" opacity={0.12} />
                <div className="flex items-center gap-3 text-sm font-medium opacity-75 pt-4">
                  {author && <span className="truncate">{author}</span>}
                  {author && date && <span className="shrink-0">•</span>}
                  {date && (
                    <span className="opacity-70 shrink-0 truncate">{date}</span>
                  )}
                </div>
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

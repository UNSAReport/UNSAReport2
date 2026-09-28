import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideCard } from '@/primitives/SlideCard';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroKPIBannerProps {
  tag?: string;
  title: string;
  subtitle?: string;
  kpiNumber: string;
  kpiLabel: string;
  author?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada con bloque o banner de métrica clave integrada para presentaciones de resultados.
 */
export function HeroKPIBanner({
  tag = 'Resultados Clave',
  title,
  subtitle,
  kpiNumber,
  kpiLabel,
  author,
  date,
  children,
}: HeroKPIBannerProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-col justify-between w-full h-full min-h-0 min-w-0 overflow-hidden">
        <div className="min-w-0 shrink-0">
          {tag && (
            <div className="mb-3">
              <SlideBadge variant="secondary">{tag}</SlideBadge>
            </div>
          )}
          <h1
            className="text-5xl font-black mb-3 max-w-4xl leading-tight line-clamp-2 break-words"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl opacity-80 max-w-2xl line-clamp-2 break-words">
              {subtitle}
            </p>
          )}
        </div>

        <SlideCard
          variant="glow"
          className="p-6 my-4 flex-row items-center justify-between gap-6 shrink-0 min-w-0 overflow-hidden"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase font-mono tracking-wider opacity-60 mb-1">
              Indicador Principal
            </div>
            <div className="text-2xl font-bold truncate">{kpiLabel}</div>
          </div>
          <div className="text-6xl font-black shrink-0 truncate">
            {kpiNumber}
          </div>
        </SlideCard>

        <div className="flex justify-between items-center gap-4 text-xs opacity-60 pt-3 border-t border-current/10 shrink-0 min-w-0">
          <div className="min-w-0 truncate">
            {author && <span>Expositor: {author}</span>}
          </div>
          <div className="shrink-0">{date && <span>{date}</span>}</div>
        </div>

        {children}
      </div>
    </SlideSection>
  );
}

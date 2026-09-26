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
      <div className="flex flex-col justify-between h-full p-6">
        <div>
          {tag && (
            <div className="mb-4">
              <SlideBadge variant="secondary">{tag}</SlideBadge>
            </div>
          )}
          <h1
            className="text-5xl font-black mb-4 max-w-4xl leading-tight"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl opacity-80 max-w-2xl">{subtitle}</p>
          )}
        </div>

        <SlideCard
          variant="glow"
          className="p-8 my-6 flex-row items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase font-mono tracking-wider opacity-60 mb-1">
              Indicador Principal
            </div>
            <div className="text-2xl font-bold">{kpiLabel}</div>
          </div>
          <div className="text-6xl font-black">{kpiNumber}</div>
        </SlideCard>

        <div className="flex justify-between items-center text-xs opacity-60 pt-4 border-t border-current/10">
          <div>{author && <span>Expositor: {author}</span>}</div>
          <div>{date && <span>{date}</span>}</div>
        </div>

        {children}
      </div>
    </SlideSection>
  );
}

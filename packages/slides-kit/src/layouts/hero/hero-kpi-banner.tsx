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
            className="text-5xl font-black text-[var(--slide-text,#f1f5f9)] mb-4 max-w-4xl leading-tight"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-[var(--slide-text-muted,#94a3b8)] max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        <SlideCard
          variant="glow"
          className="p-8 my-6 flex-row items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-[var(--slide-text-muted,#94a3b8)] mb-1">
              Indicador Principal
            </div>
            <div className="text-2xl font-bold text-[var(--slide-text,#f1f5f9)]">
              {kpiLabel}
            </div>
          </div>
          <div className="text-6xl font-black text-[var(--slide-accent-secondary,#D4AF37)]">
            {kpiNumber}
          </div>
        </SlideCard>

        <div className="flex justify-between items-center text-xs text-[var(--slide-text-muted,#94a3b8)] pt-4 border-t border-white/10">
          <div>{author && <span>Expositor: {author}</span>}</div>
          <div>{date && <span>{date}</span>}</div>
        </div>

        {children}
      </div>
    </SlideSection>
  );
}

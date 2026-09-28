import type { ReactNode } from 'react';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroMinimalProps {
  title: string;
  subtitle?: string;
  category?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada ultraminimalista con abundante espacio en blanco (o negro) y tipografía cuidada.
 */
export function HeroMinimal({
  title,
  subtitle,
  category,
  date,
  children,
}: HeroMinimalProps) {
  return (
    <SlideSection withGradientBar={false}>
      <div className="flex flex-col justify-center w-full h-full min-h-0 min-w-0 overflow-hidden max-w-4xl">
        <div className="flex-1 min-h-0 flex flex-col justify-center min-w-0 overflow-hidden">
          {category && (
            <span className="text-xs uppercase font-mono tracking-widest opacity-70 mb-4 truncate shrink-0">
              {category}
            </span>
          )}
          <h1
            className="text-6xl font-light tracking-tight mb-6 leading-tight line-clamp-2 break-words"
            style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-2xl font-light opacity-80 max-w-2xl mb-8 line-clamp-3 break-words">
              {subtitle}
            </p>
          )}
          {date && (
            <div className="text-sm font-mono opacity-60 truncate shrink-0">
              {date}
            </div>
          )}
        </div>
        {children}
      </div>
    </SlideSection>
  );
}

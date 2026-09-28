import type { ReactNode } from 'react';
import { SlideSection } from '@/primitives/SlideSection';

export interface HeroCenteredSubtitleProps {
  pretitle?: string;
  title: string;
  subtitle: string;
  author?: string;
  children?: ReactNode;
}

/**
 * Portada con énfasis equilibrado entre título y un subtítulo explicativo amplio.
 */
export function HeroCenteredSubtitle({
  pretitle,
  title,
  subtitle,
  author,
  children,
}: HeroCenteredSubtitleProps) {
  return (
    <SlideSection withGradientBar={true}>
      <div className="flex flex-1 min-h-0 min-w-0 w-full flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 overflow-hidden">
        {pretitle && (
          <span className="text-sm font-mono tracking-widest uppercase opacity-75 mb-4 truncate max-w-full shrink-0">
            {pretitle}
          </span>
        )}
        <h1
          className="text-5xl font-extrabold mb-6 leading-tight line-clamp-2 break-words min-w-0"
          style={{ fontFamily: 'var(--slide-font-family, inherit)' }}
        >
          {title}
        </h1>
        <p className="text-xl opacity-80 leading-relaxed max-w-3xl mb-8 line-clamp-3 break-words min-w-0">
          {subtitle}
        </p>
        {author && (
          <div className="text-sm font-semibold tracking-wide uppercase opacity-75 truncate max-w-full shrink-0">
            {author}
          </div>
        )}
        {children}
      </div>
    </SlideSection>
  );
}

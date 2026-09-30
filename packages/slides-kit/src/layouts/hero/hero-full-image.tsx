import type { ReactNode } from 'react';
import { SlideBackground } from '@/primitives/SlideBackground';
import { SlideBadge } from '@/primitives/SlideAccent';
import { SlideDivider } from '@/primitives/SlideDivider';

export interface HeroFullImageProps {
  tag?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  overlayOpacity?: number;
  author?: string;
  date?: string;
  children?: ReactNode;
}

/**
 * Portada a pantalla completa con imagen de fondo y overlay de contraste estructural.
 */
export function HeroFullImage({
  tag,
  title,
  subtitle,
  imageUrl = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
  overlayOpacity = 0.75,
  author,
  date,
  children,
}: HeroFullImageProps) {
  return (
    <div className="relative w-full h-full flex flex-col p-12 overflow-hidden">
      <SlideBackground
        imageUrl={imageUrl}
        overlayOpacity={overlayOpacity}
      />


      {/* Cabecera con tag */}
      <div className="relative z-10 shrink-0 min-w-0">
        {tag && <SlideBadge variant="secondary">{tag}</SlideBadge>}
      </div>

      {/* Contenido central */}
      <div className="relative z-10 flex flex-1 min-h-0 min-w-0 flex-col justify-center max-w-4xl w-full overflow-hidden">
        <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight drop-shadow-md line-clamp-2 break-words min-w-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-2xl opacity-85 leading-relaxed max-w-2xl drop-shadow-sm line-clamp-3 break-words min-w-0">
            {subtitle}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 shrink-0 min-w-0 overflow-hidden">
        <SlideDivider thickness="1px" opacity={0.2} />
        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-between items-center text-sm font-medium opacity-80 pt-4">
          {author && <span className="truncate max-w-full">{author}</span>}
          {date && <span className="truncate max-w-full">{date}</span>}
        </div>
      </div>

      {children}
    </div>
  );
}

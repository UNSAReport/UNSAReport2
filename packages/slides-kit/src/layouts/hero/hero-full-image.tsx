import type { ReactNode } from 'react';
import { SlideBadge } from '@/primitives/SlideAccent';

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
 * Portada a pantalla completa con imagen fotográfica de fondo y overlay oscuro de alto contraste.
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
    <div className="relative w-full h-full flex flex-col justify-between p-12 text-white overflow-hidden">
      {/* Imagen de fondo */}
      <img
        src={imageUrl}
        alt="Fondo de portada"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Capa oscura de contraste */}
      <div
        className="absolute inset-0 bg-[#0b0f19] z-0"
        style={{ opacity: overlayOpacity }}
      />

      {/* Cabecera con tag */}
      <div className="relative z-10">
        {tag && <SlideBadge variant="secondary">{tag}</SlideBadge>}
      </div>

      {/* Contenido central */}
      <div className="relative z-10 max-w-4xl my-auto">
        <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-2xl text-slate-200/90 leading-relaxed max-w-2xl drop-shadow">
            {subtitle}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between items-center text-sm font-medium text-slate-300 pt-4 border-t border-white/20">
        {author && <span>{author}</span>}
        {date && <span>{date}</span>}
      </div>

      {children}
    </div>
  );
}

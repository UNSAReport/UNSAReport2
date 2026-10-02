import type { CSSProperties, ReactNode } from 'react';

export interface SlideBackgroundProps {
  /** URL de imagen de fondo */
  imageUrl?: string;
  /** Gradiente CSS personalizado (se aplica sobre la imagen) */
  gradient?: string;
  /** Opacidad del overlay de contraste (0 a 1) */
  overlayOpacity?: number;
  /** Contenido que se renderiza sobre el fondo */
  children?: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
  /** Estilos inline adicionales */
  style?: CSSProperties;
}

/**
 * Fondo de diapositiva con imagen, gradiente y overlay de contraste.
 * La marca de agua institucional usa `--slide-watermark-opacity` del tema.
 */
export function SlideBackground({
  imageUrl,
  gradient,
  overlayOpacity = 0.75,
  children,
  className = '',
  style = {},
}: SlideBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 'var(--slide-watermark-opacity, 1)' }}
        />
      )}
      {gradient && (
        <div className="absolute inset-0" style={{ background: gradient }} />
      )}
      <div
        className="absolute inset-0 bg-[var(--slide-bg)]"
        style={{ opacity: overlayOpacity }}
      />
      {children}
    </div>
  );
}

export interface QuoteBackgroundImageProps {
  quote: string;
  author: string;
  role?: string;
  imageUrl?: string;
  overlayOpacity?: number;
}

/**
 * Cita a pantalla completa sobre fotografía de fondo con contraste estructural.
 */
export function QuoteBackgroundImage({
  quote,
  author,
  role,
  imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
  overlayOpacity = 0.8,
}: QuoteBackgroundImageProps) {
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col justify-center items-center p-10 box-border">
      {/* Imagen de fondo */}
      <img
        src={imageUrl}
        alt="Fondo de cita"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Capa de contraste que usa el color de fondo del tema */}
      <div
        className="absolute inset-0 bg-[var(--slide-bg)]"
        style={{ opacity: overlayOpacity }}
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full flex-1 min-h-0 min-w-0 flex flex-col justify-center items-center text-center overflow-hidden px-8">
        <span className="text-8xl leading-none font-serif opacity-30 select-none block mb-2 shrink-0">
          “
        </span>
        <blockquote className="text-4xl md:text-5xl font-light italic leading-snug mb-8 drop-shadow-sm min-w-0 break-words line-clamp-6 overflow-hidden">
          {quote}
        </blockquote>
        <cite className="not-italic text-2xl font-bold block min-w-0 break-words line-clamp-2 overflow-hidden shrink-0">
          {author}
        </cite>
        {role && (
          <span className="text-sm opacity-70 block mt-1 min-w-0 break-words line-clamp-1 overflow-hidden shrink-0">
            {role}
          </span>
        )}
      </div>
    </div>
  );
}

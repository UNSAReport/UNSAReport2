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
    <div className="relative w-full h-full flex flex-col justify-center items-center p-12 overflow-hidden">
      {/* Imagen de fondo */}
      <img
        src={imageUrl}
        alt="Fondo de cita"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Capa de contraste que usa el color de fondo del tema */}
      <div
        className="absolute inset-0 bg-[var(--slide-bg)] z-0"
        style={{ opacity: overlayOpacity }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center my-auto">
        <span className="text-8xl leading-none font-serif opacity-30 select-none block mb-2">
          “
        </span>
        <blockquote className="text-4xl md:text-5xl font-light italic leading-snug mb-8 drop-shadow-sm">
          {quote}
        </blockquote>
        <cite className="not-italic text-2xl font-bold block">{author}</cite>
        {role && <span className="text-sm opacity-70 block mt-1">{role}</span>}
      </div>
    </div>
  );
}

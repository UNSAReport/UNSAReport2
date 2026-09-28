import { Deck, Slide } from '@revealjs/react';
import { SlideRenderer } from '@/renderer/SlideRenderer';
import { ThemeProvider } from '@/renderer/ThemeProvider';
import type { DeckConfig } from '@/types';
import 'reveal.js/reveal.css';

export interface DeckRendererProps {
  /** Configuración completa del deck de diapositivas */
  config?: DeckConfig;
  deck?: DeckConfig;
  /** Clases CSS adicionales para el contenedor exterior */
  className?: string;
}

/**
 * Componente raíz de presentación: inicializa Reveal.js, aplica el ThemeProvider
 * y renderiza la lista de diapositivas declarativas.
 */
export function DeckRenderer({
  config,
  deck,
  className = '',
}: DeckRendererProps) {
  const activeConfig = config || deck;
  const {
    theme = 'unsa-dark',
    transition = 'slide',
    width = 1280,
    height = 720,
    margin = 0.04,
    autoSlide = 0,
    loop = false,
    slides = [],
  } = activeConfig || {};

  return (
    <ThemeProvider
      theme={theme}
      className={`w-full h-full relative ${className}`}
    >
      <Deck
        config={{
          width,
          height,
          margin,
          minScale: 0.1,
          maxScale: 2.0,
          transition,
          autoSlide,
          loop,
          hash: true,
          controls: true,
          progress: true,
          center: false,
          overview: true,
          slideNumber: 'c/t',
        }}
      >
        {slides.map((slide, index) => (
          <Slide key={`slide-${slide.layout}-${slide.title || index}`}>
            <SlideRenderer slide={slide} index={index} />
          </Slide>
        ))}
      </Deck>
    </ThemeProvider>
  );
}

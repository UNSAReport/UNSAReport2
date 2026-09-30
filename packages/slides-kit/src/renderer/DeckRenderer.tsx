import { Deck, Slide } from '@revealjs/react';
import { SlideRenderer } from '@/renderer/SlideRenderer';
import { ThemeProvider } from '@/renderer/ThemeProvider';
import type { DeckConfig } from '@/types';
import 'reveal.js/reveal.css';

const REVEAL_OVERRIDE_STYLES = `
@layer base {
  /* Reverts a preflight rule on hidden that breaks some reveal.js */
  [hidden] {
    display: revert !important;
  }
}
[hidden] {
  display: revert !important;
}
html.reveal-print,
html.reveal-print body,
html.reveal-print #root,
html.reveal-print #root > div,
html.print-pdf,
html.print-pdf body,
html.print-pdf #root,
html.print-pdf #root > div {
  height: auto !important;
  min-height: 100% !important;
  overflow: visible !important;
}
@media print {
  html,
  body,
  #root,
  #root > div {
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
  }
}
html.reveal-print,
html.reveal-print body,
html.reveal-print .reveal,
html.reveal-print .reveal .slides,
html.reveal-print .reveal .slides .pdf-page {
  background: var(--slide-bg, #0b0f19) !important;
  background-color: var(--slide-bg, #0b0f19) !important;
}
.reveal .slides section,
.reveal .slides > section,
.reveal .slides > section > section,
.reveal .slides .pdf-page section {
  height: 100% !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  display: block !important;
}
`;

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
    margin = 0,
    autoSlide = 0,
    loop = false,
    slideNumber = 'c/t',
    center = false,
    controls = true,
    progress = true,
    hash = true,
    slides = [],
  } = activeConfig || {};

  return (
    <ThemeProvider
      theme={theme}
      className={`w-full h-full relative ${className}`}
    >
      <style dangerouslySetInnerHTML={{ __html: REVEAL_OVERRIDE_STYLES }} />
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
          hash,
          controls,
          progress,
          center,
          overview: true,
          slideNumber,
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

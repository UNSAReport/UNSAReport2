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

// Singleton guard: the global Reveal-override stylesheet must be injected once
// per app, not once per deck render — StrictMode remounts and pages rendering
// N decks would otherwise duplicate the tag. The claim is scoped to a single
// synchronous render pass (reset on microtask) so later independent renders
// still emit their own copy.
let revealOverrideClaimed = false;

function claimRevealOverride(): boolean {
  if (revealOverrideClaimed) return false;
  revealOverrideClaimed = true;
  queueMicrotask(() => {
    revealOverrideClaimed = false;
  });
  return true;
}

function RevealOverrideStyles() {
  if (!claimRevealOverride()) return null;
  return (
    <style
      data-reveal-override
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static in-repo Reveal override CSS constant, no user input
      dangerouslySetInnerHTML={{ __html: REVEAL_OVERRIDE_STYLES }}
    />
  );
}

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
    center = false,
    hash = true,
    slides = [],
  } = activeConfig || {};

  const themeKey: string =
    typeof theme === 'string'
      ? theme
      : String(
          (theme as unknown as { id?: unknown } | undefined)?.id ?? 'custom',
        );

  // No config and no deck (or an empty slides array): render a helpful empty
  // state instead of a silent blank Reveal viewport. When both props are
  // provided, `config` wins silently (activeConfig above).
  if (!activeConfig || slides.length === 0) {
    return (
      <ThemeProvider
        theme={theme}
        className={`w-full h-full relative ${className}`}
      >
        <RevealOverrideStyles />
        <Deck
          key={`deck-empty-${themeKey}-${width}x${height}-${transition}`}
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
            // UNSA viewer owns all chrome (custom footer/Header controls).
            // Reveal chrome disabled so only one control set ever renders.
            controls: false,
            controlsTutorial: false,
            progress: false,
            slideNumber: false,
            showSlideNumber: 'speaker',
            center,
            overview: false,
            help: false,
            pause: false,
            touch: false,
            jumpToSlide: false,
            keyboard: false,
            embedded: true,
          }}
        >
          <Slide key="slide-empty">
            <div
              className="w-full h-full flex items-center justify-center p-12"
              style={{
                backgroundColor: 'var(--slide-bg, #0b0f19)',
                color: 'var(--slide-text, #f8fafc)',
              }}
            >
              <div className="max-w-xl text-center">
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{ color: 'var(--slide-text, #f8fafc)' }}
                >
                  {activeConfig?.title ?? 'Sin diapositivas'}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: 'var(--slide-text-muted, #94a3b8)' }}
                >
                  No slides defined. Add slides to your deck config to get
                  started.
                </p>
              </div>
            </div>
          </Slide>
        </Deck>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      theme={theme}
      className={`w-full h-full relative ${className}`}
    >
      <RevealOverrideStyles />
      <Deck
        key={`deck-${slides.length}-${themeKey}-${width}x${height}-${transition}`}
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
          // UNSA viewer owns all chrome (custom footer/Header controls).
          // Reveal chrome disabled so only one control set ever renders.
          controls: false,
          controlsTutorial: false,
          progress: false,
          slideNumber: false,
          showSlideNumber: 'speaker',
          center,
          overview: false,
          help: false,
          pause: false,
          touch: false,
          jumpToSlide: false,
          keyboard: false,
          embedded: true,
        }}
      >
        {slides.map((slide, index) => (
          <Slide
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the stable identity here — duplicate layout+title slides must keep distinct keys and order is author-defined
            key={`slide-${index}-${slide.layout}-${slide.title ?? 'untitled'}`}
          >
            <SlideRenderer slide={slide} index={index} />
          </Slide>
        ))}
      </Deck>
    </ThemeProvider>
  );
}

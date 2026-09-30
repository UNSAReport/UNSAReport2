import {
  type DeckConfig,
  PresentationVisibility,
  SlideTransition,
} from '@/types';

/**
 * Función canónica para definir la configuración tipada de una presentación.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@unsa/slides-kit';
 *
 * export default defineConfig({
 *   title: 'Sistemas Distribuidos',
 *   theme: 'unsa-dark',
 *   slides: [
 *     { layout: 'hero-centered-bold', title: 'Introducción' }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: DeckConfig): DeckConfig {
  return {
    width: 1280,
    height: 720,
    margin: 0.04,
    theme: 'unsa-dark',
    transition: SlideTransition.SLIDE,
    visibility: PresentationVisibility.PRIVATE,
    autoSlide: 0,
    loop: false,
    slideNumber: 'c/t',
    center: false,
    controls: true,
    progress: true,
    hash: true,
    ...config,
  };
}

export type { DeckConfig, SlideDefinition } from '@/types';

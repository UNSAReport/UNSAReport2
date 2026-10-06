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
  const merged: DeckConfig = {
    width: 1280,
    height: 720,
    margin: 0.04,
    theme: 'unsa-dark',
    transition: SlideTransition.SLIDE,
    visibility: PresentationVisibility.PRIVATE,
    autoSlide: 0,
    loop: false,
    // UNSA viewer owns all chrome: Reveal arrows/progress/counter off.
    slideNumber: false,
    center: false,
    controls: false,
    progress: false,
    hash: true,
    ...config,
  };

  if (typeof merged.title !== 'string' || merged.title.trim().length === 0) {
    throw new Error('defineConfig: title must be a non-empty string.');
  }
  if (!Array.isArray(merged.slides)) {
    throw new Error('defineConfig: slides must be an array.');
  }
  for (const slide of merged.slides) {
    if (
      typeof slide !== 'object' ||
      slide === null ||
      typeof slide.layout !== 'string' ||
      slide.layout.trim().length === 0
    ) {
      throw new Error(
        'defineConfig: every slide must define a non-empty layout string.',
      );
    }
  }
  if (
    merged.slides.length === 0 &&
    (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production')
  ) {
    console.warn('defineConfig: slides is empty; rendering an empty deck.');
  }
  if (
    typeof process === 'undefined' ||
    process.env?.NODE_ENV !== 'production'
  ) {
    const chromeKnobs = [
      'controls',
      'progress',
      'slideNumber',
      'center',
      'hash',
    ] as const;
    const touched = chromeKnobs.filter((key) => key in config);
    if (touched.length > 0) {
      console.warn(
        `defineConfig: chrome option${touched.length > 1 ? 's' : ''} (${touched.join(', ')}) set by author but the renderer intentionally disables chrome; values pass through untouched.`,
      );
    }
  }
  if (
    typeof merged.width !== 'number' ||
    !Number.isFinite(merged.width) ||
    merged.width <= 0
  ) {
    throw new Error('defineConfig: width must be a positive number.');
  }
  if (
    typeof merged.height !== 'number' ||
    !Number.isFinite(merged.height) ||
    merged.height <= 0
  ) {
    throw new Error('defineConfig: height must be a positive number.');
  }
  if (
    typeof merged.margin !== 'number' ||
    !Number.isFinite(merged.margin) ||
    merged.margin < 0 ||
    merged.margin >= 1
  ) {
    throw new Error('defineConfig: margin must be a number in [0, 1).');
  }
  if (
    typeof merged.autoSlide !== 'number' ||
    !Number.isFinite(merged.autoSlide) ||
    merged.autoSlide < 0
  ) {
    throw new Error('defineConfig: autoSlide must be a non-negative number.');
  }

  return merged;
}

export type { DeckConfig, SlideDefinition } from '@/types';

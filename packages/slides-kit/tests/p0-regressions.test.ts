import { describe, expect, it } from 'bun:test';
import type { ReactElement, ReactNode } from 'react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { defineConfig } from '@/config';
import { registerLayout } from '@/layouts/registry';
import { LayoutCategory } from '@/layouts/types';
import { DeckRenderer } from '@/renderer/DeckRenderer';
import { SlideRenderer } from '@/renderer/SlideRenderer';
import type { DeckConfig } from '@/types';

/**
 * Regresiones P0 del kit: fijan el comportamiento ya corregido sin red.
 */

function deckMargin(element: ReactElement): unknown {
  const raw: unknown = element.props.children;
  const list: unknown[] = Array.isArray(raw) ? raw : [raw];
  for (const child of list) {
    if (child !== null && typeof child === 'object' && 'props' in child) {
      const props: unknown = child.props;
      if (props !== null && typeof props === 'object' && 'config' in props) {
        const config: unknown = props.config;
        if (
          config !== null &&
          typeof config === 'object' &&
          'margin' in config
        ) {
          return config.margin;
        }
      }
    }
  }
  throw new Error('p0: no se encontró el <Deck> interno.');
}

function P0RequiredComp(props: { title?: unknown }): ReactNode {
  const text =
    typeof props.title === 'string' ? props.title : 'p0-fallback-rendered';
  return createElement('div', null, text);
}

describe('slides-kit p0 regressions', () => {
  it('unknown theme id renders fallback deck without throwing', () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      let joined = '';
      for (const arg of args) {
        joined += String(arg);
      }
      warnings.push(joined);
    };
    try {
      let html = '';
      html = renderToString(
        DeckRenderer({
          config: defineConfig({
            title: 'Tema desconocido',
            theme: 'p0-tema-que-no-existe',
            slides: [{ layout: 'hero-centered-bold', title: 'Hola P0' }],
          }),
        }),
      );
      expect(html).toContain('Hola P0');
      let warned = false;
      for (const message of warnings) {
        if (message.includes('p0-tema-que-no-existe')) {
          warned = true;
        }
      }
      expect(warned).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('duplicate same-layout+same-title slides render without duplicate-key warnings and both appear', () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      let joined = '';
      for (const arg of args) {
        joined += String(arg);
      }
      errors.push(joined);
    };
    try {
      const html = renderToString(
        DeckRenderer({
          config: defineConfig({
            title: 'Duplicadas',
            slides: [
              { layout: 'hero-centered-bold', title: 'Mismo Título' },
              { layout: 'hero-centered-bold', title: 'Mismo Título' },
            ],
          }),
        }),
      );
      const occurrences = html.split('Mismo Título').length - 1;
      expect(occurrences).toBeGreaterThanOrEqual(2);
      let dupKey = false;
      for (const message of errors) {
        if (message.includes('same key')) {
          dupKey = true;
        }
      }
      expect(dupKey).toBe(false);
    } finally {
      console.error = originalError;
    }
  });

  it('DeckRenderer default margin is 0.04', () => {
    const bare: ReactElement = DeckRenderer({});
    expect(deckMargin(bare)).toBe(0.04);

    const withDeck: ReactElement = DeckRenderer({
      config: defineConfig({
        title: 'Margen',
        slides: [{ layout: 'hero-centered-bold', title: 'H' }],
      }),
    });
    expect(deckMargin(withDeck)).toBe(0.04);

    expect(
      defineConfig({
        title: 'Margen',
        slides: [{ layout: 'hero-centered-bold', title: 'H' }],
      }).margin,
    ).toBe(0.04);
  });

  it('missing required slot dev-warns but still renders', () => {
    registerLayout({
      id: 'p0-required-slot-layout',
      name: 'P0 Required Slot',
      category: LayoutCategory.HERO,
      description: 'Layout de prueba con un slot requerido',
      tags: ['p0-test'],
      slots: [
        {
          name: 'mustHave',
          type: 'string',
          required: true,
          description: 'Slot requerido para la regresión P0',
        },
      ],
      component: P0RequiredComp,
    });

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      let joined = '';
      for (const arg of args) {
        joined += String(arg);
      }
      warnings.push(joined);
    };
    try {
      const html = renderToString(
        SlideRenderer({
          slide: { layout: 'p0-required-slot-layout', title: 'P0 Título' },
          index: 0,
        }),
      );
      expect(html).toContain('P0 Título');
      let warned = false;
      for (const message of warnings) {
        if (
          message.includes('missing required slot') &&
          message.includes('mustHave')
        ) {
          warned = true;
        }
      }
      expect(warned).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('defineConfig throws on empty title / missing slide layout / negative width / margin>=1 / negative autoSlide', () => {
    expect(() => defineConfig({ title: '', slides: [] })).toThrow(/title/);
    expect(() =>
      defineConfig({
        title: 'T',
        slides: [
          { title: 'sin layout' } as unknown as DeckConfig['slides'][number],
        ],
      }),
    ).toThrow(/layout/);
    expect(() => defineConfig({ title: 'T', slides: [], width: -100 })).toThrow(
      /width/,
    );
    expect(() => defineConfig({ title: 'T', slides: [], margin: 1 })).toThrow(
      /margin/,
    );
    expect(() =>
      defineConfig({ title: 'T', slides: [], autoSlide: -1 }),
    ).toThrow(/autoSlide/);
  });

  it('defineConfig accepts empty slides array', () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      let joined = '';
      for (const arg of args) {
        joined += String(arg);
      }
      warnings.push(joined);
    };
    try {
      const cfg = defineConfig({ title: 'Vacío', slides: [] });
      expect(cfg.slides).toEqual([]);
    } finally {
      console.warn = originalWarn;
    }
  });
});

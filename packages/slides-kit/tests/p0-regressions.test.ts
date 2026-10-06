import { describe, expect, it } from 'bun:test';
import type { ReactElement, ReactNode } from 'react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { defineConfig } from '@/config';
import {
  listCategories,
  listLayouts,
  registerLayout,
  unregisterLayout,
} from '@/layouts/registry';
import { LayoutCategory } from '@/layouts/types';
import { DeckRenderer } from '@/renderer/DeckRenderer';
import { SlideRenderer } from '@/renderer/SlideRenderer';
import { ThemeProvider } from '@/renderer/ThemeProvider';
import type { ThemeDefinition } from '@/themes/types';
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
      // The registry is global: unregister so layout-count pins stay
      // order-independent across test files.
      unregisterLayout('p0-required-slot-layout');
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

describe('slides-kit p1/p2 regressions', () => {
  function captureWarns(): { messages: string[]; restore: () => void } {
    const messages: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      let joined = '';
      for (const arg of args) {
        joined += String(arg);
      }
      messages.push(joined);
    };
    return {
      messages,
      restore: () => {
        console.warn = originalWarn;
      },
    };
  }

  function deckKey(element: ReactElement): unknown {
    const raw: unknown = element.props.children;
    const list: unknown[] = Array.isArray(raw) ? raw : [raw];
    for (const child of list) {
      if (child !== null && typeof child === 'object' && 'props' in child) {
        const props: unknown = child.props;
        if (props !== null && typeof props === 'object' && 'config' in props) {
          return 'key' in child ? child.key : null;
        }
      }
    }
    throw new Error('p1: no se encontró el <Deck> interno.');
  }

  it('layout id with mixed case and trailing space resolves without error card', () => {
    const html = renderToString(
      SlideRenderer({
        slide: { layout: 'Hero-Centered-Bold ', title: 'Normalizado P1' },
        index: 0,
      }),
    );
    expect(html).toContain('Normalizado P1');
    expect(html).not.toContain('Layout no encontrado');
  });

  it('notes render as a direct aside.notes sibling of the layout div', () => {
    const html = renderToString(
      createElement(
        'section',
        null,
        SlideRenderer({
          slide: {
            layout: 'hero-centered-bold',
            title: 'Con notas',
            notes: 'nota-p1-unica',
          },
          index: 0,
        }),
      ),
    );
    expect(html).toContain('<aside class="notes">nota-p1-unica</aside>');
    expect(html).toContain('</div><aside class="notes">');
  });

  it('deck remount key changes with slides.length and theme', () => {
    const one = DeckRenderer({
      config: defineConfig({
        title: 'Uno',
        slides: [{ layout: 'hero-centered-bold', title: 'A' }],
      }),
    });
    const two = DeckRenderer({
      config: defineConfig({
        title: 'Uno',
        slides: [
          { layout: 'hero-centered-bold', title: 'A' },
          { layout: 'hero-centered-bold', title: 'B' },
        ],
      }),
    });
    const otherTheme = DeckRenderer({
      config: defineConfig({
        title: 'Uno',
        theme: 'unsa-classic',
        slides: [{ layout: 'hero-centered-bold', title: 'A' }],
      }),
    });
    expect(deckKey(one)).not.toBeNull();
    expect(deckKey(one)).not.toBe(deckKey(two));
    expect(deckKey(one)).not.toBe(deckKey(otherTheme));
  });

  it('--slide-bg collision in customVariables is ignored with dev warn while custom keys apply', () => {
    const theme: ThemeDefinition = {
      id: 'p1-vars',
      name: 'P1 Vars',
      description: 'Tema de prueba para colisiones de variables',
      tags: ['p1-test'],
      colors: {
        background: '#0b0f19',
        surface: '#131b2e',
        surfaceMuted: '#0f172a',
        text: '#f1f5f9',
        textMuted: '#94a3b8',
        accent: '#800020',
        accentSecondary: '#D4AF37',
        border: 'rgba(255, 255, 255, 0.08)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        fontFamily: 'system-ui, sans-serif',
        monoFamily: 'ui-monospace, monospace',
        headingWeight: 700,
      },
      effects: {
        cardBorderRadius: '12px',
        glowEnabled: false,
        glassmorphism: false,
        slideBorderGradient: false,
      },
      customVariables: {
        '--slide-bg': '#ff0000',
        '--brand-x': '#123456',
      },
    };
    const { messages, restore } = captureWarns();
    try {
      const html = renderToString(
        createElement(ThemeProvider, {
          theme,
          children: createElement('span', null, 'vars-probe'),
        }),
      );
      expect(html).toContain('vars-probe');
      expect(html).toContain('--brand-x');
      expect(html).toContain('#123456');
      expect(html).toContain('--slide-bg');
      expect(html).toContain('#0b0f19');
      expect(html).not.toContain('#ff0000');
      let warned = false;
      for (const message of messages) {
        if (message.includes('--slide-bg') && message.includes('collides')) {
          warned = true;
        }
      }
      expect(warned).toBe(true);
    } finally {
      restore();
    }
  });

  it('empty slides array renders the guidance state, not a blank viewport', () => {
    const html = renderToString(
      DeckRenderer({
        config: defineConfig({ title: 'Vacío P1', slides: [] }),
      }),
    );
    expect(html).toContain('No slides defined');
  });

  it('listCategories reflects the registered map (every category has layouts)', () => {
    const categories = listCategories();
    expect(categories).toContain(LayoutCategory.HERO);
    for (const category of categories) {
      expect(listLayouts({ category }).length).toBeGreaterThan(0);
    }
  });

  it("bare {layout:'custom'} warns and renders the fallback card", () => {
    const { messages, restore } = captureWarns();
    try {
      const html = renderToString(
        SlideRenderer({ slide: { layout: 'custom' }, index: 0 }),
      );
      expect(html).toContain('Layout no encontrado');
      let warned = false;
      for (const message of messages) {
        if (message.includes("layout 'custom'")) {
          warned = true;
        }
      }
      expect(warned).toBe(true);
    } finally {
      restore();
    }
  });
});

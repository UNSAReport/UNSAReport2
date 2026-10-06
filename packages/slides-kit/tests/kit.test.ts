import { describe, expect, it } from 'bun:test';
import { defineConfig } from '@/config';
import {
  getLayout,
  layoutRegistry,
  listCategories,
  listLayouts,
  registerLayout,
  unregisterLayout,
} from '@/layouts/registry';
import { LayoutCategory } from '@/layouts/types';
import {
  getTheme,
  listThemes,
  registerTheme,
  themeRegistry,
} from '@/themes/registry';
import { ThemeId } from '@/themes/types';

describe('packages/slides-kit: Core Kit & Registries', () => {
  it('defineConfig asigna valores por defecto correctamente', () => {
    const config = defineConfig({
      title: 'Presentación de Prueba',
      slides: [{ layout: 'hero-centered-bold', title: 'Hola Mundo' }],
    });

    expect(config.title).toBe('Presentación de Prueba');
    expect(config.width).toBe(1280);
    expect(config.height).toBe(720);
    expect(config.theme).toBe('unsa-dark');
    expect(config.slides.length).toBe(1);
    expect(config.visibility).toBe('private');
    expect(config.slideNumber).toBe(false);
    expect(config.center).toBe(false);
    expect(config.controls).toBe(false);
    expect(config.progress).toBe(false);
    expect(config.hash).toBe(true);
  });

  it('defineConfig respeta los knobs de renderer cuando se configuran', () => {
    const config = defineConfig({
      title: 'Knobs',
      slides: [],
      slideNumber: 'c/t',
      center: true,
      controls: true,
      progress: true,
      hash: false,
    });

    expect(config.slideNumber).toBe('c/t');
    expect(config.center).toBe(true);
    expect(config.controls).toBe(true);
    expect(config.progress).toBe(true);
    expect(config.hash).toBe(false);
  });

  it('DeckRenderer desactiva el chrome de Reveal aunque el deck lo pida', async () => {
    const { DeckRenderer } = await import('@/renderer/DeckRenderer');
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      DeckRenderer({
        config: defineConfig({
          title: 'Chrome',
          controls: true,
          progress: true,
          slideNumber: 'c/t',
          slides: [{ layout: 'hero-centered-bold', title: 'Hola' }],
        }),
      }),
    );
    // Sin flechas de navegación ni barra de progreso de Reveal en el HTML.
    expect(html).not.toContain('class="controls"');
    expect(html).not.toContain('class="progress"');
    expect(html).not.toContain('slide-number');
  });

  describe('LayoutRegistry', () => {
    it('contiene las 9 familias de layout en listCategories', () => {
      const categories = listCategories();
      expect(categories).toContain(LayoutCategory.HERO);
      expect(categories).toContain(LayoutCategory.SPLIT);
      expect(categories).toContain(LayoutCategory.BENTO);
      expect(categories).toContain(LayoutCategory.STATS);
      expect(categories).toContain(LayoutCategory.PROCESS);
      expect(categories).toContain(LayoutCategory.CODE);
      expect(categories).toContain(LayoutCategory.LIST);
      expect(categories).toContain(LayoutCategory.QUOTE);
      expect(categories).toContain(LayoutCategory.CLOSING);
    });

    it('registra los 110 layouts oficiales distribuidos en las 9 familias', () => {
      const layouts = listLayouts();
      expect(layouts.length).toBe(110);

      expect(listLayouts({ category: LayoutCategory.HERO }).length).toBe(10);
      expect(listLayouts({ category: LayoutCategory.SPLIT }).length).toBe(15);
      expect(listLayouts({ category: LayoutCategory.BENTO }).length).toBe(20);
      expect(listLayouts({ category: LayoutCategory.STATS }).length).toBe(15);
      expect(listLayouts({ category: LayoutCategory.PROCESS }).length).toBe(15);
      expect(listLayouts({ category: LayoutCategory.CODE }).length).toBe(10);
      expect(listLayouts({ category: LayoutCategory.LIST }).length).toBe(10);
      expect(listLayouts({ category: LayoutCategory.QUOTE }).length).toBe(8);
      expect(listLayouts({ category: LayoutCategory.CLOSING }).length).toBe(7);

      const hero = getLayout('hero-centered-bold');
      expect(hero).toBeDefined();
      expect(hero?.category).toBe(LayoutCategory.HERO);

      const bento = getLayout('bento-4-featured-left');
      expect(bento).toBeDefined();
      expect(bento?.category).toBe(LayoutCategory.BENTO);

      const split = getLayout('split-50-50-text');
      expect(split).toBeDefined();
      expect(split?.category).toBe(LayoutCategory.SPLIT);
    });

    it('permite filtrar layouts por categoría y búsqueda textual', () => {
      const bentoLayouts = listLayouts({ category: LayoutCategory.BENTO });
      expect(bentoLayouts.length).toBe(20);
      expect(
        bentoLayouts.every((l) => l.category === LayoutCategory.BENTO),
      ).toBe(true);

      const searchResults = listLayouts({ search: 'dashboard' });
      expect(searchResults.some((l) => l.id === 'bento-dashboard')).toBe(true);
    });

    it('permite registrar layouts personalizados en caliente', () => {
      registerLayout({
        id: 'test-custom-layout',
        name: 'Test Layout',
        category: LayoutCategory.HERO,
        description: 'Layout para pruebas unitarias',
        tags: ['test'],
        slots: [],
        component: () => null,
      });

      try {
        expect(layoutRegistry.hasLayout('test-custom-layout')).toBe(true);
        expect(getLayout('test-custom-layout')?.name).toBe('Test Layout');
      } finally {
        // The registry is global: unregister so layout-count pins stay
        // order-independent across test files.
        unregisterLayout('test-custom-layout');
      }
    });
  });

  describe('ThemeRegistry', () => {
    it('contiene los 5 temas oficiales con thumbnails', () => {
      const themes = listThemes();
      expect(themes.length).toBeGreaterThanOrEqual(5);

      const unsaDark = getTheme(ThemeId.UNSA_DARK);
      expect(unsaDark.id).toBe('unsa-dark');
      expect(unsaDark.colors.accent).toBe('#800020'); // Granate UNSA
      expect(unsaDark.thumbnail).toBeDefined();

      const unsaClassic = getTheme(ThemeId.UNSA_CLASSIC);
      expect(unsaClassic.id).toBe('unsa-classic');
      expect(unsaClassic.colors.background).toBe('#f8f9fa');
      expect(unsaClassic.thumbnail).toBeDefined();

      const episTech = getTheme(ThemeId.EPIS_TECH);
      expect(episTech.id).toBe('epis-tech');
      expect(episTech.colors.accent).toBe('#06b6d4'); // Cian
      expect(episTech.thumbnail).toBeDefined();

      const fipsLight = getTheme(ThemeId.FIPS_LIGHT);
      expect(fipsLight.id).toBe('fips-light');
      expect(fipsLight.thumbnail).toBeDefined();

      const episNight = getTheme(ThemeId.EPIS_NIGHT);
      expect(episNight.id).toBe('epis-night');
      expect(episNight.thumbnail).toBeDefined();
    });

    it('lanza un error descriptivo si se solicita un tema inexistente', () => {
      expect(() => getTheme('tema-que-no-existe')).toThrow(
        /not found in ThemeRegistry/,
      );
    });

    it('permite registrar temas personalizados', () => {
      registerTheme({
        id: 'custom-theme-test',
        name: 'Custom Test Theme',
        description: 'Tema personalizado para pruebas',
        tags: ['test'],
        colors: {
          background: '#000000',
          surface: '#111111',
          surfaceMuted: '#222222',
          text: '#ffffff',
          textMuted: '#aaaaaa',
          accent: '#ff0000',
          accentSecondary: '#ffff00',
          border: 'rgba(255,255,255,0.1)',
          success: '#00ff00',
          warning: '#ffaa00',
          error: '#ff0000',
        },
        typography: {
          fontFamily: 'sans-serif',
          monoFamily: 'monospace',
          headingWeight: 700,
        },
        effects: {
          cardBorderRadius: '4px',
          glowEnabled: false,
          glassmorphism: false,
          slideBorderGradient: false,
        },
      });

      expect(themeRegistry.hasTheme('custom-theme-test')).toBe(true);
      expect(getTheme('custom-theme-test').name).toBe('Custom Test Theme');
    });
  });
});

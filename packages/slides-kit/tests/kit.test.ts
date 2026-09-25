import { describe, expect, it } from 'bun:test';
import { defineConfig } from '@/config';
import {
  getLayout,
  layoutRegistry,
  listCategories,
  listLayouts,
  registerLayout,
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

    it('registra los 9 layouts fundacionales iniciales', () => {
      const layouts = listLayouts();
      expect(layouts.length).toBeGreaterThanOrEqual(9);

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
      expect(bentoLayouts.length).toBeGreaterThanOrEqual(1);
      expect(
        bentoLayouts.every((l) => l.category === LayoutCategory.BENTO),
      ).toBe(true);

      const searchResults = listLayouts({ search: 'dashboard' });
      expect(searchResults.some((l) => l.id === 'bento-4-featured-left')).toBe(
        true,
      );
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

      expect(layoutRegistry.hasLayout('test-custom-layout')).toBe(true);
      expect(getLayout('test-custom-layout')?.name).toBe('Test Layout');
    });
  });

  describe('ThemeRegistry', () => {
    it('contiene los 3 temas oficiales', () => {
      const themes = listThemes();
      expect(themes.length).toBeGreaterThanOrEqual(3);

      const unsaDark = getTheme(ThemeId.UNSA_DARK);
      expect(unsaDark.id).toBe('unsa-dark');
      expect(unsaDark.colors.accent).toBe('#800020'); // Granate UNSA

      const unsaClassic = getTheme(ThemeId.UNSA_CLASSIC);
      expect(unsaClassic.id).toBe('unsa-classic');
      expect(unsaClassic.colors.background).toBe('#f8f9fa');

      const episTech = getTheme(ThemeId.EPIS_TECH);
      expect(episTech.id).toBe('epis-tech');
      expect(episTech.colors.accent).toBe('#06b6d4'); // Cian
    });

    it('realiza fallback seguro a unsa-dark si se solicita un tema inexistente', () => {
      const fallback = getTheme('tema-que-no-existe');
      expect(fallback.id).toBe('unsa-dark');
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

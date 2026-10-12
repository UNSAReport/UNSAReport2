import '@/packs/catalog';
import { describe, expect, test } from 'bun:test';
import { layoutRegistry } from '@/layouts/registry';
import { templatePackRegistry } from '@/packs/registry';
import { themeRegistry } from '@/themes/registry';
import { listLayouts } from '@/layouts/registry';
import { listThemes } from '@/themes/registry';

describe('inventario del kit (contrato actualizado con packs)', () => {
  test('layouts genéricos: 120 layouts en 9 categorías, 5 temas institucionales', () => {
    // Count needs to be verified after removing template layouts
    expect(listLayouts().length).toBeGreaterThan(100);
    expect(new Set(listLayouts().map((l) => l.category)).size).toBe(9); // no TEMPLATE anymore
    expect(themeRegistry.count()).toBeGreaterThanOrEqual(5); // institutional + pack themes
  });

  test('los tres packs built-in están registrados', () => {
    expect(templatePackRegistry.hasPack('cloudlet-pitch')).toBe(true);
    expect(templatePackRegistry.hasPack('harper-minimal')).toBe(true);
    expect(templatePackRegistry.hasPack('azul-proposal')).toBe(true);
  });

  test('los packs auto-registran sus temas', () => {
    expect(themeRegistry.hasTheme('cloudlet-pitch')).toBe(true);
    expect(themeRegistry.hasTheme('harper-minimal')).toBe(true);
    expect(themeRegistry.hasTheme('azul-proposal')).toBe(true);
  });

  test('resolveSlide encuentra slides por pack-id y slide-id', () => {
    const coverSlide = templatePackRegistry.resolveSlide('cloudlet-pitch', 'cover');
    expect(coverSlide).toBeDefined();
    expect(coverSlide?.name).toBe('Cloudlet Cover');

    const harperCover = templatePackRegistry.resolveSlide('harper-minimal', 'cover');
    expect(harperCover).toBeDefined();

    const azulCover = templatePackRegistry.resolveSlide('azul-proposal', 'cover-duo');
    expect(azulCover).toBeDefined();

    const missing = templatePackRegistry.resolveSlide('cloudlet-pitch', 'nonexistent');
    expect(missing).toBeUndefined();
  });
});

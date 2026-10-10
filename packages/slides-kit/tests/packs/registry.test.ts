import '@/packs/catalog';
import { describe, expect, it } from 'bun:test';
import { TemplatePackRegistry, templatePackRegistry } from '@/packs/registry';
import type { TemplatePack } from '@/packs/types';

const mockSlide = {
  id: 'cover',
  name: 'Test Cover',
  description: 'Portada de prueba',
  slots: [],
  component: () => null,
};

const mockTheme = {
  id: 'test-pack-theme',
  name: 'Test Pack Theme',
  description: 'Tema de prueba para pack',
  tags: ['test'],
  colors: {
    background: '#000', surface: '#111', surfaceMuted: '#222',
    text: '#fff', textMuted: '#aaa', accent: '#f00',
    accentSecondary: '#ff0', border: 'rgba(255,255,255,0.1)',
    success: '#0f0', warning: '#fa0', error: '#f00',
  },
  typography: {
    fontFamily: 'sans-serif', monoFamily: 'monospace', headingWeight: 700,
  },
  effects: {
    cardBorderRadius: '4px', glowEnabled: false,
    glassmorphism: false, slideBorderGradient: false,
  },
};

const mockPack: TemplatePack = {
  id: 'test-pack',
  name: 'Test Pack',
  description: 'Pack de prueba',
  tags: ['test'],
  theme: mockTheme as any,
  slides: [mockSlide as any],
};

describe('TemplatePackRegistry', () => {
  it('registra y recupera un pack', () => {
    const registry = new TemplatePackRegistry();
    registry.registerPack(mockPack);
    expect(registry.hasPack('test-pack')).toBe(true);
    expect(registry.getPack('test-pack')?.name).toBe('Test Pack');
    expect(registry.count()).toBe(1);
  });

  it('resolveSlide encuentra la slide por pack-id y slide-id', () => {
    const registry = new TemplatePackRegistry();
    registry.registerPack(mockPack);
    const slide = registry.resolveSlide('test-pack', 'cover');
    expect(slide).toBeDefined();
    expect(slide?.name).toBe('Test Cover');
  });

  it('resolveSlide devuelve undefined para pack o slide inexistente', () => {
    const registry = new TemplatePackRegistry();
    expect(registry.resolveSlide('no-pack', 'cover')).toBeUndefined();
    registry.registerPack(mockPack);
    expect(registry.resolveSlide('test-pack', 'nonexistent')).toBeUndefined();
  });

  it('listPacks devuelve todos los packs registrados', () => {
    const registry = new TemplatePackRegistry();
    registry.registerPack(mockPack);
    expect(registry.listPacks().length).toBe(1);
    expect(registry.listPacks()[0].id).toBe('test-pack');
  });

  it('unregisterPack elimina el pack', () => {
    const registry = new TemplatePackRegistry();
    registry.registerPack(mockPack);
    expect(registry.unregisterPack('test-pack')).toBe(true);
    expect(registry.hasPack('test-pack')).toBe(false);
    expect(registry.unregisterPack('test-pack')).toBe(false);
  });

  it('lanza TypeError para packs inválidos', () => {
    const registry = new TemplatePackRegistry();
    expect(() => registry.registerPack(null as unknown as TemplatePack)).toThrow(TypeError);
    expect(() => registry.registerPack({ id: 'Bad ID', name: '', description: '', tags: [], theme: mockTheme, slides: [] } as any)).toThrow(/kebab-case/);
  });

  it('los tres packs built-in están registrados en la instancia global', () => {
    // Requires importing the catalog, but if they are built-in they should be auto-loaded if SlideRenderer or similar is imported
    // Wait, let's explicitly import catalog here just in case, or test it.
    // I'll test it, if it fails I'll add the import.
    expect(templatePackRegistry.hasPack('cloudlet-pitch')).toBe(true);
    expect(templatePackRegistry.hasPack('harper-minimal')).toBe(true);
    expect(templatePackRegistry.hasPack('azul-proposal')).toBe(true);
  });
});

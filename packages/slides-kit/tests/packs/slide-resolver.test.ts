import { describe, expect, it } from 'bun:test';
import { renderToString } from 'react-dom/server';
import { SlideRenderer } from '@/renderer/SlideRenderer';
import '@/packs/catalog';

describe('SlideRenderer: resolución pack/slide', () => {
  it('resuelve notación pack/slide para cloudlet-pitch/cover', () => {
    const html = renderToString(
      SlideRenderer({
        slide: { layout: 'cloudlet-pitch/cover' },
        index: 0,
      }),
    );
    // Should render without error card
    expect(html).not.toContain('Pack slide no encontrado');
    expect(html).not.toContain('Layout no encontrado');
  });

  it('muestra error card para pack inexistente', () => {
    const html = renderToString(
      SlideRenderer({
        slide: { layout: 'no-existe-pack/cover' },
        index: 0,
      }),
    );
    expect(html).toContain('Pack slide no encontrado');
  });

  it('muestra error card para slide inexistente en pack válido', () => {
    const html = renderToString(
      SlideRenderer({
        slide: { layout: 'cloudlet-pitch/no-existe-slide' },
        index: 0,
      }),
    );
    expect(html).toContain('Pack slide no encontrado');
  });

  it('layouts genéricos siguen funcionando sin notación de pack', () => {
    const html = renderToString(
      SlideRenderer({
        slide: { layout: 'hero-centered-bold', title: 'Funciona' },
        index: 0,
      }),
    );
    expect(html).toContain('Funciona');
    expect(html).not.toContain('Layout no encontrado');
  });
});

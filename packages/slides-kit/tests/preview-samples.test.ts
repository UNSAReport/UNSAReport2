import { describe, expect, it } from 'bun:test';
import { defaultLayouts } from '@/layouts/catalog';
import { listThemes } from '@/themes/registry';
import { previewSamples } from '../../../web/app/src/lib/catalog-preview-samples';

/**
 * Contrato catálogo ↔ muestras de vista previa (DT-3, DT-9).
 *
 * `catalog.tsx` renderiza cada layout con props planas
 * `{ tag, title, subtitle, ...previewSamples[def.id] }`; si un layout no
 * tiene muestra, la miniatura sale vacía, y si una muestra trae una ruta
 * local (`/img.png`) el catálogo emite un 404 en consola. Estos tests fijan
 * el contrato a nivel de datos, sin harness web.
 */

function walkStrings(
  value: unknown,
  visit: (key: string, str: string) => void,
  key = '',
): void {
  if (typeof value === 'string') {
    visit(key, value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkStrings(item, visit, key);
    return;
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(record)) walkStrings(v, visit, k);
  }
}

/** Claves cuyos valores se resuelven como assets/red (no texto mostrado). */
const URL_LIKE_KEY = /(url|src|image|img|thumb|logo|background|href)$/i;

describe('preview-samples: contrato con el catálogo del kit', () => {
  it('cubre los 110 layouts del catálogo, sin muestras huérfanas', () => {
    const layoutById: Record<string, true> = {};
    for (const def of defaultLayouts) layoutById[def.id] = true;
    const sampleById: Record<string, true> = {};
    for (const id of Object.keys(previewSamples)) sampleById[id] = true;

    const missing = defaultLayouts
      .map((def) => def.id)
      .filter((id) => !sampleById[id]);
    expect(missing).toEqual([]);

    const orphan = Object.keys(previewSamples).filter((id) => !layoutById[id]);
    expect(orphan).toEqual([]);

    expect(defaultLayouts.length).toBe(110);
  });

  it('ninguna muestra de imagen usa rutas locales (DT-3 /img.png 404)', () => {
    const violations: string[] = [];
    for (const [layoutId, sample] of Object.entries(previewSamples)) {
      walkStrings(sample, (key, str) => {
        if (URL_LIKE_KEY.test(key) && str.startsWith('/')) {
          violations.push(`${layoutId}.${key} = ${str}`);
        }
      });
    }
    expect(violations).toEqual([]);
  });

  it('los layouts con imagen traen imageUrl + paragraphs', () => {
    for (const id of ['split-image-text', 'split-text-image']) {
      const sample = previewSamples[id];
      expect(typeof sample.imageUrl).toBe('string');
      expect((sample.imageUrl as string).length).toBeGreaterThan(0);
      expect(Array.isArray(sample.paragraphs)).toBe(true);
      expect((sample.paragraphs as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it('los 5 ids de tema oficiales existen (contrato con tui/internal/slides)', () => {
    const byId: Record<string, true> = {};
    for (const t of listThemes()) byId[t.id] = true;
    // Contención y no igualdad exacta: kit.test.ts registra un tema
    // custom en el registro global compartido.
    for (const id of [
      'epis-night',
      'epis-tech',
      'fips-light',
      'unsa-classic',
      'unsa-dark',
    ]) {
      expect(byId[id]).toBe(true);
    }
  });
});

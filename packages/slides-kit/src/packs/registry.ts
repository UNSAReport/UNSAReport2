import { themeRegistry } from '@/themes/registry';
import type { TemplatePack, TemplateSlide } from '@/packs/types';

export type { TemplatePack, TemplateSlide };

const PACK_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertValidPack(pack: TemplatePack): void {
  if (typeof pack !== 'object' || pack === null) {
    throw new TypeError('Invalid pack: expected a TemplatePack object.');
  }
  if (typeof pack.id !== 'string' || !PACK_ID_PATTERN.test(pack.id)) {
    throw new TypeError(
      `Invalid pack "id": expected a non-empty kebab-case string, got ${JSON.stringify(pack.id)}.`,
    );
  }
  if (typeof pack.theme !== 'object' || pack.theme === null) {
    throw new TypeError(`Invalid pack "theme" for id '${pack.id}': expected a ThemeDefinition object.`);
  }
  if (!Array.isArray(pack.slides)) {
    throw new TypeError(`Invalid pack "slides" for id '${pack.id}': expected an array.`);
  }
}

/**
 * Registro dinámico de template packs.
 *
 * Registrar un pack con registerPack() tiene dos efectos:
 * 1. El pack queda disponible para resolver slides con notación 'pack-id/slide-id'.
 * 2. El tema del pack se auto-registra en ThemeRegistry.
 */
export class TemplatePackRegistry {
  private packs = new Map<string, TemplatePack>();

  /**
   * Registra un pack y auto-registra su tema en ThemeRegistry.
   * Last-wins (HMR-safe): re-registrar sobrescribe y avisa en dev.
   */
  registerPack(pack: TemplatePack): void {
    assertValidPack(pack);
    if (
      this.packs.has(pack.id) &&
      (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production')
    ) {
      console.warn(
        `TemplatePackRegistry: overwriting existing pack '${pack.id}'. Last registration wins.`,
      );
    }
    this.packs.set(pack.id, pack);
    // Auto-registrar el tema del pack en ThemeRegistry
    themeRegistry.registerTheme(pack.theme);
  }

  /**
   * Resuelve una TemplateSlide dado el packId y slideId.
   * Devuelve undefined si el pack o la slide no están registrados.
   */
  resolveSlide(packId: string, slideId: string): TemplateSlide | undefined {
    return this.packs.get(packId)?.slides.find((s) => s.id === slideId);
  }

  /** Obtiene un pack por su id. Devuelve undefined si no existe. */
  getPack(id: string): TemplatePack | undefined {
    return this.packs.get(id);
  }

  /** Comprueba si un pack está registrado. */
  hasPack(id: string): boolean {
    return this.packs.has(id);
  }

  /** Lista todos los packs registrados. */
  listPacks(): TemplatePack[] {
    return Array.from(this.packs.values());
  }

  /** Elimina un pack del registro. Devuelve true si existía. */
  unregisterPack(id: string): boolean {
    return this.packs.delete(id);
  }

  /** Devuelve la cantidad de packs registrados. */
  count(): number {
    return this.packs.size;
  }
}

/** Instancia única global del registro de template packs */
export const templatePackRegistry = new TemplatePackRegistry();

/** Registra un pack y auto-registra su tema */
export const registerPack = (pack: TemplatePack): void =>
  templatePackRegistry.registerPack(pack);

/** Obtiene un pack por id */
export const getPack = (id: string): TemplatePack | undefined =>
  templatePackRegistry.getPack(id);

/** Lista todos los packs registrados */
export const listPacks = (): TemplatePack[] =>
  templatePackRegistry.listPacks();

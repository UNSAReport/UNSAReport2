import { defaultThemes } from '@/themes/catalog';
import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export type { ThemeDefinition };
export { ThemeId };

const THEME_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertValidTheme(theme: ThemeDefinition): void {
  if (typeof theme !== 'object' || theme === null) {
    throw new TypeError(
      'Invalid theme "theme": expected a ThemeDefinition object.',
    );
  }
  if (typeof theme.id !== 'string' || !THEME_ID_PATTERN.test(theme.id)) {
    throw new TypeError(
      `Invalid theme "id": expected a non-empty kebab-case string, got ${JSON.stringify((theme as ThemeDefinition | undefined)?.id)}.`,
    );
  }
  for (const field of ['colors', 'typography', 'effects'] as const) {
    const value = theme[field];
    if (typeof value !== 'object' || value === null) {
      throw new TypeError(
        `Invalid theme "${field}" for id '${theme.id}': expected an object.`,
      );
    }
  }
}

/**
 * Registro dinámico de temas visuales para la plataforma de diapositivas.
 */
export class ThemeRegistry {
  private themes = new Map<string, ThemeDefinition>();

  constructor() {
    for (const theme of defaultThemes) {
      this.registerTheme(theme);
    }
  }

  /**
   * Registra un tema nuevo o sobrescribe uno existente.
   * Last-wins (HMR-safe): el re-registro sobrescribe y avisa solo en dev.
   */
  registerTheme(theme: ThemeDefinition): void {
    assertValidTheme(theme);
    if (
      this.themes.has(theme.id) &&
      (typeof process === 'undefined' || process.env?.NODE_ENV !== 'production')
    ) {
      console.warn(
        `ThemeRegistry: overwriting existing theme '${theme.id}'. Last registration wins.`,
      );
    }
    this.themes.set(theme.id, theme);
  }
  /**
   * Obtiene un tema por su id. Lanza un error descriptivo si no existe.
   */
  getTheme(id: string): ThemeDefinition {
    const theme = this.themes.get(id);
    if (!theme) {
      const known = Array.from(this.themes.keys()).sort().join(', ');
      throw new Error(
        `Theme '${id}' not found in ThemeRegistry. Available themes: ${known}. Register it with registerTheme() or use one of the listed ids.`,
      );
    }
    return theme;
  }

  /**
   * Lista todos los temas registrados en el catálogo.
   */
  listThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  /**
   * Comprueba si un tema existe registrado en el catálogo.
   */
  hasTheme(id: string): boolean {
    return this.themes.has(id);
  }

  /**
   * Devuelve la cantidad de temas registrados.
   */
  count(): number {
    return this.themes.size;
  }

  /**
   * Elimina un tema del registro. Devuelve true si existía.
   */
  unregisterTheme(id: string): boolean {
    return this.themes.delete(id);
  }

  /**
   * Limpia el registro y lo re-siembras desde el catálogo por defecto.
   */
  resetThemes(): void {
    this.themes.clear();
    for (const theme of defaultThemes) {
      this.registerTheme(theme);
    }
  }
}

/** Instancia única global del registro de temas */
export const themeRegistry = new ThemeRegistry();

/** Función helper para obtener un tema rápidamente */
export const getTheme = (id: string): ThemeDefinition =>
  themeRegistry.getTheme(id);

/** Función helper para listar todos los temas disponibles */
export const listThemes = (): ThemeDefinition[] => themeRegistry.listThemes();

/** Función helper para registrar un tema personalizado */
export const registerTheme = (theme: ThemeDefinition): void =>
  themeRegistry.registerTheme(theme);

/** Elimina un tema del registro */
export const unregisterTheme = (id: string): boolean =>
  themeRegistry.unregisterTheme(id);

/** Restablece el registro al catálogo por defecto */
export const resetThemes = (): void => themeRegistry.resetThemes();

import { defaultThemes } from './catalog';
import type { ThemeDefinition } from './types';
import { ThemeId } from './types';

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
   */
  registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Obtiene un tema por su id. Si no existe, realiza fallback a 'unsa-dark'.
   */
  getTheme(id: string): ThemeDefinition {
    const theme = this.themes.get(id);
    if (!theme) {
      const fallback = this.themes.get(ThemeId.UNSA_DARK);
      if (fallback) return fallback;
      throw new Error(
        `Theme '${id}' not found and default '${ThemeId.UNSA_DARK}' is missing.`
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

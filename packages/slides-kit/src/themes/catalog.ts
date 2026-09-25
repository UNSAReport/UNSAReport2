import { episTechTheme } from './epis-tech';
import type { ThemeDefinition } from './types';
import { unsaClassicTheme } from './unsa-classic';
import { unsaDarkTheme } from './unsa-dark';

/**
 * Catálogo predeterminado de temas institucionales de UNSAReport
 */
export const defaultThemes: ThemeDefinition[] = [
  unsaDarkTheme,
  unsaClassicTheme,
  episTechTheme,
];

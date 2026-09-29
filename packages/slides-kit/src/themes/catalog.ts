import { episTechTheme } from '@/themes/epis-tech';
import type { ThemeDefinition } from '@/themes/types';
import { unsaClassicTheme } from '@/themes/unsa-classic';
import { unsaDarkTheme } from '@/themes/unsa-dark';

/**
 * Catálogo predeterminado de temas institucionales de UNSAReport
 */
export const defaultThemes: ThemeDefinition[] = [
  unsaDarkTheme,
  unsaClassicTheme,
  episTechTheme,
];

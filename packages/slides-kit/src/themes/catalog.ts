import { azulProposalTheme } from '@/themes/azul-proposal';
import { cloudletPitchTheme } from '@/themes/cloudlet-pitch';
import { episNightTheme } from '@/themes/epis-night';
import { episTechTheme } from '@/themes/epis-tech';
import { fipsLightTheme } from '@/themes/fips-light';
import { harperMinimalTheme } from '@/themes/harper-minimal';
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
  fipsLightTheme,
  episNightTheme,
  cloudletPitchTheme,
  azulProposalTheme,
  harperMinimalTheme,
];

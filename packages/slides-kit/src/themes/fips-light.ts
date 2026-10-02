import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export const fipsLightTheme: ThemeDefinition = {
  id: ThemeId.FIPS_LIGHT,
  name: 'FIPS Light',
  description:
    'Tema claro institucional de la Facultad de Ingeniería de Producción y Servicios, fondo cálido con acentos azul FIPS. Ideal para sustentaciones diurnas y actos formales.',
  tags: ['formal', 'light', 'fips', 'institucional'],
  colors: {
    background: '#faf7f2',
    surface: '#ffffff',
    surfaceMuted: '#f1ece3',
    text: '#1a2332',
    textMuted: '#5b6b82',
    accent: '#0b3d91',
    accentSecondary: '#c9a227',
    border: 'rgba(11, 61, 145, 0.14)',
    borderGlow: 'rgba(11, 61, 145, 0.25)',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.01em',
  },
  effects: {
    cardBorderRadius: '10px',
    glowEnabled: false,
    glassmorphism: false,
    slideBorderGradient: true,
    watermarkOpacity: 0.03,
  },
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23faf7f2'/%3E%3Crect x='24' y='24' width='120' height='16' fill='%230b3d91'/%3E%3Crect x='24' y='48' width='200' height='10' fill='%231a2332'/%3E%3Crect x='24' y='66' width='160' height='10' fill='%235b6b82'/%3E%3Ccircle cx='272' cy='140' r='24' fill='%23c9a227'/%3E%3C/svg%3E",
  facultyName: 'Facultad de Ingeniería de Producción y Servicios',
};

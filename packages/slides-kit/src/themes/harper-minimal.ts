import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export const harperMinimalTheme: ThemeDefinition = {
  id: ThemeId.HARPER_MINIMAL,
  name: 'Harper Minimal',
  description:
    'Pitch minimalista en negro y rojo coral con titulares PT Serif, kickers rojos en versalitas, numerales fantasma y reglas finas. Ideal para presentaciones de empresa y portfolios sobrios.',
  tags: ['pitch', 'minimalist', 'light', 'harper', 'imported'],
  colors: {
    background: '#fafafa',
    surface: '#ffffff',
    surfaceMuted: '#f5f5f5',
    text: '#000000',
    textMuted: '#4d4d4d',
    accent: '#ff5347',
    accentSecondary: '#000000',
    border: 'rgba(0,0,0,0.12)',
    borderGlow: 'rgba(255,83,71,0.28)',
    success: '#2e7d4f',
    warning: '#b45309',
    error: '#ff5347',
  },
  typography: {
    fontFamily: "'Roboto', system-ui, sans-serif",
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.01em',
  },
  effects: {
    cardBorderRadius: '10px',
    glowEnabled: false,
    glassmorphism: false,
    slideBorderGradient: false,
    watermarkOpacity: 0.05,
  },
  customVariables: {
    '--slide-heading-font-family': "'PT Serif', Georgia, serif",
    '--slide-kicker-tracking': '0.22em',
    '--slide-kicker-color': '#ff5347',
    '--slide-ghost-numeral-opacity': '0.07',
    '--slide-accent-bar': '#ff5347',
    '--slide-pill-radius': '999px',
    '--slide-stat-divider': 'rgba(0,0,0,0.12)',
  },
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23fafafa'/%3E%3Crect x='0' y='0' width='320' height='56' fill='%23000000'/%3E%3Crect x='24' y='76' width='72' height='8' fill='%23ff5347'/%3E%3Crect x='24' y='92' width='200' height='12' fill='%23000000'/%3E%3Crect x='24' y='112' width='160' height='9' fill='%234d4d4d'/%3E%3Ccircle cx='276' cy='128' r='26' fill='%23ff5347'/%3E%3C/svg%3E",
};

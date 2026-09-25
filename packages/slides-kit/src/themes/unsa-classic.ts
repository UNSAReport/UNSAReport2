import type { ThemeDefinition } from './types';
import { ThemeId } from './types';

export const unsaClassicTheme: ThemeDefinition = {
  id: ThemeId.UNSA_CLASSIC,
  name: 'UNSA Classic',
  description:
    'Estilo formal claro con tipografía editorial y azul marino. Diseñado para sustentaciones formales de grado, defensas de tesis y eventos protocolares.',
  tags: ['formal', 'light', 'tesis', 'académico'],
  colors: {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceMuted: '#edf2f7',
    text: '#0f172a',
    textMuted: '#475569',
    accent: '#1e3a8a', // Azul Marino
    accentSecondary: '#800020', // Granate sobrio
    border: 'rgba(0, 0, 0, 0.08)',
    borderGlow: 'rgba(30, 58, 138, 0.2)',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  },
  typography: {
    fontFamily:
      'Georgia, Cambria, "Times New Roman", Times, serif',
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.01em',
  },
  effects: {
    cardBorderRadius: '8px',
    glowEnabled: false,
    glassmorphism: false,
    slideBorderGradient: false,
    watermarkOpacity: 0.02,
  },
};

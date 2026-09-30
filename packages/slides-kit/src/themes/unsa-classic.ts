import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

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
    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
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
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23f8f9fa'/%3E%3Crect x='24' y='24' width='120' height='16' fill='%231e3a8a'/%3E%3Crect x='24' y='48' width='200' height='10' fill='%230f172a'/%3E%3Crect x='24' y='66' width='160' height='10' fill='%23475569'/%3E%3Ccircle cx='272' cy='140' r='24' fill='%23800020'/%3E%3C/svg%3E",
};

import type { ThemeDefinition } from './types';
import { ThemeId } from './types';

export const unsaDarkTheme: ThemeDefinition = {
  id: ThemeId.UNSA_DARK,
  name: 'UNSA Dark',
  description:
    'Estilo institucional oscuro con tonos granate y dorado UNSA. Ideal para informes de laboratorio, proyectos y defensas técnicas.',
  tags: ['institucional', 'dark', 'unsa', 'oficial'],
  colors: {
    background: '#0b0f19',
    surface: '#131b2e',
    surfaceMuted: '#0f172a',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    accent: '#800020', // Granate UNSA
    accentSecondary: '#D4AF37', // Dorado UNSA
    border: 'rgba(255, 255, 255, 0.08)',
    borderGlow: 'rgba(128, 0, 32, 0.35)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.025em',
  },
  effects: {
    cardBorderRadius: '12px',
    glowEnabled: true,
    glassmorphism: true,
    slideBorderGradient: true,
    watermarkOpacity: 0.04,
  },
};

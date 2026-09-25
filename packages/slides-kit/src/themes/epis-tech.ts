import type { ThemeDefinition } from './types';
import { ThemeId } from './types';

export const episTechTheme: ThemeDefinition = {
  id: ThemeId.EPIS_TECH,
  name: 'EPIS Tech',
  description:
    'Estilo oscuro futurista con acentos cian y verde esmeralda. Recomendado para Ciencias de la Computación, arquitectura de software, demos y hackathons.',
  tags: ['tech', 'dark', 'glow', 'computación', 'epis'],
  colors: {
    background: '#050811',
    surface: '#0d1322',
    surfaceMuted: '#090d18',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#06b6d4', // Cian brillante
    accentSecondary: '#10b981', // Verde esmeralda
    border: 'rgba(6, 182, 212, 0.25)',
    borderGlow: 'rgba(6, 182, 212, 0.45)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#f43f5e',
  },
  typography: {
    fontFamily:
      '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
    monoFamily:
      '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.03em',
  },
  effects: {
    cardBorderRadius: '10px',
    glowEnabled: true,
    glassmorphism: true,
    slideBorderGradient: true,
    watermarkOpacity: 0.05,
  },
};

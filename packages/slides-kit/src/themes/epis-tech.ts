import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

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
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23050811'/%3E%3Crect x='24' y='24' width='120' height='16' fill='%2306b6d4'/%3E%3Crect x='24' y='48' width='200' height='10' fill='%23e2e8f0'/%3E%3Crect x='24' y='66' width='160' height='10' fill='%2394a3b8'/%3E%3Ccircle cx='272' cy='140' r='24' fill='%2310b981'/%3E%3C/svg%3E",
};

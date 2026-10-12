import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export const episNightTheme: ThemeDefinition = {
  id: ThemeId.EPIS_NIGHT,
  name: 'EPIS Night',
  description:
    'Tema nocturno azul profundo de EPIS con acentos cian y violeta. Ideal para demos en vivo, live coding y charlas técnicas nocturnas.',
  tags: ['tech', 'dark', 'night', 'epis', 'demo'],
  colors: {
    background: '#060b18',
    surface: '#0c1428',
    surfaceMuted: '#080e1e',
    text: '#e8eefc',
    textMuted: '#8ea0c2',
    accent: '#22d3ee',
    accentSecondary: '#a78bfa',
    border: 'rgba(34, 211, 238, 0.18)',
    borderGlow: 'rgba(34, 211, 238, 0.4)',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#fb7185',
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoFamily:
      '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
    headingWeight: 700,
    headingLetterSpacing: '-0.02em',
  },
  effects: {
    cardBorderRadius: '12px',
    glowEnabled: true,
    glassmorphism: true,
    slideBorderGradient: true,
    watermarkOpacity: 0.05,
  },
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23060b18'/%3E%3Crect x='24' y='24' width='120' height='16' fill='%2322d3ee'/%3E%3Crect x='24' y='48' width='200' height='10' fill='%23e8eefc'/%3E%3Crect x='24' y='66' width='160' height='10' fill='%238ea0c2'/%3E%3Ccircle cx='272' cy='140' r='24' fill='%23a78bfa'/%3E%3C/svg%3E",
  facultyName: 'Escuela Profesional de Ingeniería de Sistemas',
};

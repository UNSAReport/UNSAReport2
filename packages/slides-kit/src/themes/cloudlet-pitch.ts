import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export const cloudletPitchTheme: ThemeDefinition = {
  id: ThemeId.CLOUDLET_PITCH,
  name: 'Cloudlet Pitch',
  description:
    'Pitch claro de startup Cloudlet Tech con lavados grises y oscuros alternados, paneles degradados celestes y tipografía Open Sauce. Ideal para presentaciones de emprendimiento, rondas de inversión y demos de producto.',
  tags: ['pitch', 'startup', 'light', 'cloudlet', 'imported'],
  colors: {
    background: '#d0d7dd',
    surface: '#ffffff',
    surfaceMuted: '#e4f2ff',
    text: '#424242',
    textMuted: '#6b6f76',
    accent: '#4f81bd', // scheme accent1
    accentSecondary: '#a0cefd',
    border: 'rgba(66,66,66,0.12)',
    borderGlow: 'rgba(79,129,189,0.35)',
    success: '#2e7d4f',
    warning: '#b45309',
    error: '#c0504d', // scheme accent2
  },
  typography: {
    // Nota: el importador reporta Calibri/Calibri (tema Office stock); la fuente real del deck es Open Sauce.
    fontFamily: "'Open Sauce', 'Open Sans', system-ui, sans-serif",
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 800,
    headingLetterSpacing: '-0.02em',
  },
  effects: {
    cardBorderRadius: '16px',
    glowEnabled: false,
    glassmorphism: false,
    slideBorderGradient: true,
    watermarkOpacity: 0.04,
  },
  customVariables: {
    '--slide-panel-gradient': 'linear-gradient(180deg,#A0CEFD,#E4F2FF)',
    '--slide-panel-border': 'rgba(255,255,255,0.9)',
    '--slide-eyebrow-color': '#424242',
    '--slide-eyebrow-tracking': '0.22em',
    '--slide-wash-dark': '#424242',
    '--slide-divider-color': 'rgba(66,66,66,0.25)',
    '--slide-heading-font-family':
      "'Open Sauce', 'Open Sans', system-ui, sans-serif",
  },
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23d0d7dd'/%3E%3Crect x='24' y='24' width='160' height='14' fill='%23424242'/%3E%3Crect x='24' y='46' width='200' height='6' fill='%23ffffff'/%3E%3Crect x='196' y='24' width='100' height='132' fill='%23a0cefd'/%3E%3Crect x='24' y='70' width='160' height='8' fill='%23424242'/%3E%3C/svg%3E",
};

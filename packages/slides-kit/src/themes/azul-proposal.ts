import type { ThemeDefinition } from '@/themes/types';
import { ThemeId } from '@/themes/types';

export const azulProposalTheme: ThemeDefinition = {
  id: ThemeId.AZUL_PROPOSAL,
  name: 'Azul Proposal',
  description:
    'Propuesta de negocio sobre azul corporativo profundo #185079 en fondo cálido marfil, títulos apilados en dos líneas, pasos numerados y doble franja de pie. Ideal para propuestas comerciales y presentaciones corporativas.',
  tags: ['proposal', 'business', 'light', 'azul', 'imported'],
  colors: {
    background: '#F6F2EF',
    surface: '#ffffff',
    surfaceMuted: '#bbd6e1',
    text: '#185079',
    textMuted: '#4e7590',
    accent: '#185079',
    accentSecondary: '#3885ab',
    border: 'rgba(24,80,121,0.16)',
    borderGlow: 'rgba(24,80,121,0.30)',
    success: '#2e7d4f',
    warning: '#b45309',
    error: '#c0504d',
  },
  typography: {
    // Fuente real de la plantilla ('Open Sauce Semi-Bold/Bold/Medium' en los
    // runs de texto); el importador reporta Calibri porque el theme.xml de
    // Office conserva los valores de fábrica.
    fontFamily: "'Open Sauce', 'Open Sans', system-ui, sans-serif",
    monoFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
    headingWeight: 800,
    headingLetterSpacing: '-0.015em',
  },
  effects: {
    cardBorderRadius: '14px',
    glowEnabled: false,
    glassmorphism: false,
    slideBorderGradient: true,
    watermarkOpacity: 0.03,
  },
  customVariables: {
    '--slide-heading-font-family':
      "'Open Sauce', 'Open Sans', system-ui, sans-serif",
    '--slide-cover-navy': '#185079',
    '--slide-tint-ramp': '#BBD6E1,#95BFD1,#3885AB',
    '--slide-footer-rule': 'rgba(24,80,121,0.35)',
    '--slide-number-disc': '#185079',
    '--slide-wash-base': '#F6F2EF',
    '--slide-blob-gradient':
      'radial-gradient(closest-side, rgba(72,170,198,0.95) 0%, rgba(48,153,181,0.9) 45%, rgba(24,80,121,0.55) 68%, rgba(24,80,121,0) 82%)',
    '--slide-paper-tint': 'rgba(246,242,239,0.6)',
  },
  thumbnail:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23fbf6f1'/%3E%3Crect width='56' height='180' fill='%23185079'/%3E%3Crect x='76' y='44' width='180' height='18' fill='%23185079'/%3E%3Crect x='76' y='70' width='140' height='18' fill='%23185079'/%3E%3Crect x='76' y='104' width='200' height='10' fill='%233885ab'/%3E%3Crect x='76' y='122' width='160' height='10' fill='%2395bfd1'/%3E%3Ccircle cx='272' cy='140' r='18' fill='%23185079'/%3E%3C/svg%3E",
};

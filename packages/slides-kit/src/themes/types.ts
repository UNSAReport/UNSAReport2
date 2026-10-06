/**
 * Paleta de colores para temas de presentación
 */
export interface ColorPalette {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  border: string;
  borderGlow?: string;
  success: string;
  warning: string;
  error: string;
}

/**
 * Configuración tipográfica del tema
 */
export interface TypographyConfig {
  fontFamily: string;
  monoFamily: string;
  headingWeight: number;
  headingLetterSpacing?: string;
}

/**
 * Efectos visuales de superficie y bordes
 */
export interface ThemeEffects {
  cardBorderRadius: string;
  glowEnabled: boolean;
  glassmorphism: boolean;
  slideBorderGradient: boolean;
  watermarkOpacity?: number;
}

/**
 * Identificadores de temas oficiales preinstalados
 */
export const ThemeId = {
  UNSA_DARK: 'unsa-dark',
  UNSA_CLASSIC: 'unsa-classic',
  EPIS_TECH: 'epis-tech',
  FIPS_LIGHT: 'fips-light',
  EPIS_NIGHT: 'epis-night',
  CLOUDLET_PITCH: 'cloudlet-pitch',
  AZUL_PROPOSAL: 'azul-proposal',
  HARPER_MINIMAL: 'harper-minimal',
} as const;

export type ThemeId = (typeof ThemeId)[keyof typeof ThemeId];

/**
 * Definición completa de un tema visual en el ThemeRegistry
 */
export interface ThemeDefinition {
  /** Identificador único del tema (ej: 'unsa-dark') */
  id: string;
  /** Nombre amigable para el usuario */
  name: string;
  /** Descripción del estilo y sugerencia de uso */
  description: string;
  /** Tags temáticos */
  tags: string[];
  /** Paleta de colores aplicada */
  colors: ColorPalette;
  /** Configuración tipográfica */
  typography: TypographyConfig;
  /** Efectos visuales de componentes */
  effects: ThemeEffects;
  /** Variables CSS adicionales personalizadas */
  customVariables?: Record<string, string>;
  /** Ruta o URI del thumbnail para la galería web */
  thumbnail?: string;
  /** URL del logotipo institucional o de facultad (marca opcional) */
  logoUrl?: string;
  /** Nombre de la facultad o escuela propietaria de la marca (opcional) */
  facultyName?: string;
}

import {
  type CSSProperties,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { themeRegistry } from '../themes/registry';
import type { ThemeDefinition } from '../themes/types';

interface ThemeContextValue {
  theme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** Nombre del tema (id en ThemeRegistry) o definición directa */
  theme?: string | ThemeDefinition;
  /** Elementos hijos */
  children: ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Proveedor de contexto y variables CSS institucionales para diapositivas.
 */
export function ThemeProvider({
  theme = 'unsa-dark',
  children,
  className = '',
}: ThemeProviderProps) {
  const resolvedTheme = useMemo<ThemeDefinition>(() => {
    if (typeof theme === 'string') {
      return themeRegistry.getTheme(theme);
    }
    return theme;
  }, [theme]);

  const cssVariables = useMemo<CSSProperties>(() => {
    const { colors, typography, effects, customVariables } = resolvedTheme;

    return {
      '--slide-bg': colors.background,
      '--slide-surface': colors.surface,
      '--slide-surface-muted': colors.surfaceMuted,
      '--slide-text': colors.text,
      '--slide-text-muted': colors.textMuted,
      '--slide-accent': colors.accent,
      '--slide-accent-secondary': colors.accentSecondary,
      '--slide-border': colors.border,
      '--slide-border-glow': colors.borderGlow || colors.accent,
      '--slide-success': colors.success,
      '--slide-warning': colors.warning,
      '--slide-error': colors.error,
      '--slide-font-family': typography.fontFamily,
      '--slide-mono-family': typography.monoFamily,
      '--slide-heading-weight': String(typography.headingWeight),
      '--slide-radius': effects.cardBorderRadius,
      ...customVariables,
    } as CSSProperties;
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div
        className={`w-full h-full text-[var(--slide-text)] bg-[var(--slide-bg)] select-none ${className}`}
        style={{
          fontFamily: 'var(--slide-font-family)',
          ...cssVariables,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook para consumir el tema activo dentro de cualquier componente o slide personalizada.
 */
export function useTheme(): ThemeDefinition {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un <ThemeProvider>');
  }
  return context.theme;
}

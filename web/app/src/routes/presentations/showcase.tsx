import { createFileRoute } from '@tanstack/react-router';
import {
  type LayoutDefinition,
  listLayouts,
} from '@unsa/slides-kit/layouts';
import { ThemeProvider } from '@unsa/slides-kit/renderer/ThemeProvider';
import { listThemes, type ThemeDefinition } from '@unsa/slides-kit/themes';
import { Component, type ReactNode, useMemo, useState } from 'react';
import { previewSamples } from '@/lib/catalog-preview-samples';

export const Route = createFileRoute('/presentations/showcase')({
  component: ShowcasedThemes,
});

const SHOWCASE_THEME_IDS = ['cloudlet-pitch', 'azul-proposal', 'harper-minimal'];
const THEME_FALLBACK_ID = 'unsa-dark';

class ThemePreviewBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { children: ReactNode }) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ThemeProvider theme={THEME_FALLBACK_ID}>
          <div className="w-full h-full flex items-center justify-center p-3 text-[9px] leading-tight">
            Vista previa no disponible para este tema.
          </div>
        </ThemeProvider>
      );
    }
    return this.props.children;
  }
}

function ShowcaseCard({
  def,
  selectedThemeId,
  themes,
}: {
  def: LayoutDefinition;
  selectedThemeId: string;
  themes: ThemeDefinition[];
}) {
  const LayoutComponent = def.component;
  const sample = previewSamples[def.id] ?? {};

  const previewProps: Record<string, unknown> = {
    tag: 'Demo',
    title: 'Titulo de ejemplo',
    subtitle: 'Subtitulo de ejemplo',
    ...sample,
  };

  return (
    <article className="rounded-none border border-[#C7C7C7] bg-[#E3E2DE] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#C7C7C7]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E3E2DE] bg-[#141414] px-2 py-0.5">
          {def.id}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1351AA]">
          {def.category}
        </span>
      </div>
      <div className="h-[480px] overflow-hidden border-t border-[#C7C7C7] select-none">
        <ThemePreviewBoundary key={`${selectedThemeId}:${def.id}`}>
          <ThemeProvider
            theme={
              themes.some((t) => t.id === selectedThemeId)
                ? selectedThemeId
                : THEME_FALLBACK_ID
            }
          >
            <div className="w-full h-full flex flex-col justify-center overflow-hidden text-[9px] leading-tight p-3 text-[var(--slide-text)] bg-[var(--slide-bg)]">
              <LayoutComponent {...previewProps} />
            </div>
          </ThemeProvider>
        </ThemePreviewBoundary>
      </div>
    </article>
  );
}

function ShowcasedThemes() {
  const themes = useMemo(() => listThemes(), []);
  const layouts = useMemo(() => listLayouts(), []);

  const showcaseThemes = useMemo(() => {
    const wanted = SHOWCASE_THEME_IDS.map((id) =>
      themes.find((t) => t.id === id),
    ).filter((t): t is ThemeDefinition => t !== undefined);
    if (wanted.length === SHOWCASE_THEME_IDS.length) return wanted;
    return themes;
  }, [themes]);

  const [selectedThemeId, setSelectedThemeId] = useState<string>(
    showcaseThemes[0]?.id ?? THEME_FALLBACK_ID,
  );
  const activeThemeId = showcaseThemes.some((t) => t.id === selectedThemeId)
    ? selectedThemeId
    : (showcaseThemes[0]?.id ?? THEME_FALLBACK_ID);

  return (
    <div className="min-h-screen bg-[#E3E2DE] text-[#141414] p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          Nuevos temas PPTX — showcase 120 layouts x 3 temas
        </h1>
        <p className="text-sm text-[#444343]">
          {layouts.length} layouts × {showcaseThemes.length} temas
        </p>
      </header>

      <nav aria-label="Temas" className="flex flex-wrap gap-2">
        {showcaseThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => setSelectedThemeId(theme.id)}
            aria-pressed={theme.id === activeThemeId}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] border border-[#C7C7C7] transition-colors duration-300 ${
              theme.id === activeThemeId
                ? 'bg-[#1351AA] text-[#E3E2DE]'
                : 'bg-[#141414] text-[#E3E2DE] hover:bg-[#1351AA]'
            }`}
          >
            {theme.id.toUpperCase()}
          </button>
        ))}
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {layouts.map((def) => (
          <ShowcaseCard
            key={def.id}
            def={def}
            selectedThemeId={activeThemeId}
            themes={themes}
          />
        ))}
      </div>
    </div>
  );
}

import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import {
  getPresentationServerFn,
  type SlidesPresentation,
  type SlidesPresentationVersion,
} from '@/lib/slides/client';
import { presentations as localDecks } from '@/lib/slides-gallery';

export const Route = createFileRoute('/presentations/$slug')({
  validateSearch: (search: Record<string, unknown>) => search,
  loader: async ({ params }) => {
    const { slug } = params;
    if (!slug) {
      throw new Error('Slug de presentación requerido');
    }

    const localMatch = localDecks.find((p) => p.slug === slug);
    if (localMatch) {
      return {
        isLocal: true,
        localTitle: localMatch.title,
        localDesc: localMatch.description,
        presentation: null,
        versions: [],
      };
    }

    try {
      const data = await getPresentationServerFn({ data: { id: slug } });
      return {
        isLocal: false,
        localTitle: '',
        localDesc: '',
        presentation: data.presentation,
        versions: data.versions,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`No se pudo cargar la presentación: ${msg}`);
    }
  },
  errorComponent: PresentationErrorComponent,
  component: PresentationViewer,
});

function PresentationErrorComponent({ error }: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 mb-4">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Error"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        Error al Cargar Presentación
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Link
        to="/presentations"
        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
      >
        ← Volver al Listado
      </Link>
    </div>
  );
}

function PresentationViewer() {
  const data = Route.useLoaderData();
  const { slug } = Route.useParams();
  const search = Route.useSearch() as Record<string, unknown>;
  const navigate = useNavigate();
  const isPresent =
    search.present === '1' || search.present === 1 || search.present === true;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notesPanelId = useId();

  const [selectedVersion, setSelectedVersion] = useState<number>(() => {
    if (data.presentation) {
      return data.presentation.activeVersion;
    }
    return 1;
  });

  const [showNotes, setShowNotes] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [tokenQuery] = useState(() => {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
    const value = match ? decodeURIComponent(match[1]) : '';
    return value ? `?token=${encodeURIComponent(value)}` : '';
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ method: 'prev' }),
          '*',
        );
        setCurrentSlideIndex((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ method: 'next' }),
          '*',
        );
        setCurrentSlideIndex((prev) => prev + 1);
      } else if (e.key === 'Escape' && isPresent) {
        navigate({ to: '/presentations/$slug', params: { slug } });
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPresent, navigate, slug]);

  if (data.isLocal) {
    const LocalComp = localDecks.find((p) => p.slug === slug)?.component;
    if (!LocalComp) return null;
    return <LocalComp />;
  }

  const presentation = data.presentation as SlidesPresentation;
  const versions = data.versions as SlidesPresentationVersion[];

  const currentVersionRecord = versions.find(
    (v) => v.versionNumber === selectedVersion,
  );

  const notesText =
    currentVersionRecord?.manifest &&
    typeof currentVersionRecord.manifest === 'object'
      ? JSON.stringify(currentVersionRecord.manifest, null, 2)
      : 'No hay notas de orador registradas para esta versión.';

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePrevSlide = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ method: 'prev' }),
        '*',
      );
      setCurrentSlideIndex((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextSlide = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ method: 'next' }),
        '*',
      );
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const embedSrc = `/api/slides/embed/${presentation.id}/v${selectedVersion}/index.html${tokenQuery}`;

  if (isPresent) {
    return (
      <div
        ref={containerRef}
        className="relative h-full w-full bg-black text-slate-100 font-sans overflow-hidden"
      >
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title={presentation.title}
          sandbox="allow-scripts allow-same-origin"
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700/60 text-xs z-10">
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Diapositiva anterior"
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            ◀
          </button>
          <span className="text-slate-300 font-mono px-1">
            {currentSlideIndex}
          </span>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Diapositiva siguiente"
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            ▶
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
            className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ⛶
          </button>
          <Link
            to="/presentations/$slug"
            params={{ slug }}
            aria-label="Salir del modo presentación"
            className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕ Salir
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-slate-950 text-slate-100 font-sans overflow-hidden"
    >
      {/* Shell Institucional Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/presentations"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors shrink-0"
          >
            ← Volver
          </Link>
          <div className="h-4 w-px bg-slate-700 shrink-0" />
          <h1 className="text-sm font-bold text-white truncate max-w-md">
            {presentation.title}
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            {presentation.ownerType === 'organization' ? 'Org' : 'Personal'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Version Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Versión:</span>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {versions.length > 0 ? (
                versions.map((v) => (
                  <option key={v.id} value={v.versionNumber}>
                    v{v.versionNumber}{' '}
                    {v.versionNumber === presentation.activeVersion
                      ? '(activa)'
                      : ''}
                  </option>
                ))
              ) : (
                <option value={presentation.activeVersion}>
                  v{presentation.activeVersion}
                </option>
              )}
            </select>
          </div>
          <Link
            to="/presentations/$slug"
            params={{ slug }}
            search={{ present: 1 }}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            ▶ Presentar
          </Link>
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Pantalla completa"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Slide Sandbox Viewport */}
      <main className="flex-1 relative w-full h-full bg-black min-h-[500px]">
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title={presentation.title}
          sandbox="allow-scripts allow-same-origin"
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="no-referrer"
        />
      </main>

      {/* Navigation and Speaker Notes Bar */}
      <footer className="border-t border-slate-800 bg-slate-900/80 px-6 py-2 shrink-0">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              ◀ Anterior
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Siguiente ▶
            </button>
            <span className="text-slate-400 font-mono ml-2">
              Slide {currentSlideIndex}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              aria-expanded={showNotes}
              aria-controls={notesPanelId}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <span>
                {showNotes ? '▾ Ocultar Notas' : '▸ Ver Notas del Orador'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Speaker Notes Panel */}
        {showNotes && (
          <section
            id={notesPanelId}
            aria-label="Notas del orador"
            className="mt-3 p-3 bg-slate-950/90 rounded-lg border border-slate-800 text-xs text-slate-300 max-h-40 overflow-y-auto font-mono"
          >
            <p className="font-semibold text-slate-400 mb-1">
              Notas del Orador:
            </p>
            <pre className="whitespace-pre-wrap">{notesText}</pre>
          </section>
        )}
      </footer>
    </div>
  );
}

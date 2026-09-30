import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  useNavigate,
} from '@tanstack/react-router';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  getEmbedTokenServerFn,
  getPresentationServerFn,
  type SlidesPresentation,
  type SlidesPresentationVersion,
} from '@/lib/slides/client';

export const Route = createFileRoute('/presentations/$slug')({
  validateSearch: (search: Record<string, unknown>) => search,
  loader: async ({ params }) => {
    const { slug } = params;
    if (!slug) {
      throw new Error('Slug de presentación requerido');
    }

    try {
      const data = await getPresentationServerFn({ data: { id: slug } });
      return {
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
  const versionSelectId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const notesCloseRef = useRef<HTMLButtonElement>(null);
  const notesToggleRef = useRef<HTMLButtonElement>(null);

  const [selectedVersion, setSelectedVersion] = useState<number>(() => {
    if (data.presentation) {
      return data.presentation.activeVersion;
    }
    return 1;
  });

  const [showNotes, setShowNotes] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  // Token is read client-side after hydration so SSR and first client render
  // agree on the iframe src (avoids a hydration mismatch); the effect below
  // fills it in, triggering one iframe load with ?token= when logged in.
  // The auth cookie is HttpOnly (invisible to document.cookie), so ask the
  // server for a short-lived embed token instead of reading cookies here.
  const [tokenQuery, setTokenQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getEmbedTokenServerFn()
      .then(({ token }) => {
        if (!cancelled && token)
          setTokenQuery(`?token=${encodeURIComponent(token)}`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
      } else if (e.key === 'Escape' && showNotes) {
        setShowNotes(false);
        notesToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPresent, navigate, showNotes, slug]);

  useEffect(() => {
    if (showNotes) notesCloseRef.current?.focus();
  }, [showNotes]);

  const presentation = data.presentation as SlidesPresentation;
  const versions = data.versions as SlidesPresentationVersion[];

  const currentVersionRecord = versions.find(
    (v) => v.versionNumber === selectedVersion,
  );

  // S1 notes contract: versions carry optional `notes: Record<string,string>`
  // (slideId -> notes). Read-only display; schema owned by S1.
  const notesRaw =
    currentVersionRecord &&
    typeof currentVersionRecord === 'object' &&
    'notes' in currentVersionRecord
      ? currentVersionRecord.notes
      : null;
  const notesEntries =
    notesRaw && typeof notesRaw === 'object' && !Array.isArray(notesRaw)
      ? Object.entries(notesRaw).filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === 'string' && typeof entry[1] === 'string',
        )
      : [];
  const hasVersionNotes = notesEntries.length > 0;
  const notesText = hasVersionNotes
    ? notesEntries
        .map(([slideId, note]) => `[${slideId}]\n${note}`)
        .join('\n\n')
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
        className="fixed inset-0 z-50 bg-black text-slate-100 font-sans overflow-hidden"
      >
        <iframe
          ref={iframeRef}
          src={embedSrc}
          title={presentation.title}
          sandbox="allow-scripts allow-same-origin"
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700/60 text-xs z-10 max-w-[calc(100vw-2rem)]">
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Diapositiva anterior"
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ◀
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="text-slate-300 font-mono px-1"
          >
            {currentSlideIndex}
          </span>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Diapositiva siguiente"
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ▶
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
            className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ⛶
          </button>
          <Link
            to="/presentations/$slug"
            params={{ slug }}
            aria-label="Salir del modo presentación"
            className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10 shrink-0">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <Link
            to="/presentations"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
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

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Version Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <label htmlFor={versionSelectId}>Versión:</label>
            <select
              id={versionSelectId}
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(Number(e.target.value))}
              className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400 shrink-0"
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
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ▶ Presentar
          </Link>
          <a
            href={`${embedSrc}${tokenQuery ? '&print-pdf' : '?print-pdf'}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Exportar a PDF (abre en pestaña nueva)"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            ⬇ PDF
          </a>
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            aria-label="Pantalla completa"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Diapositiva anterior"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              ◀ Anterior
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Diapositiva siguiente"
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Siguiente ▶
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="text-slate-400 font-mono ml-2"
            >
              Slide {currentSlideIndex}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              ref={notesToggleRef}
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              aria-expanded={showNotes}
              aria-controls={notesPanelId}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              <span>
                {showNotes ? '▾ Ocultar Notas' : '▸ Ver Notas del Orador'}
              </span>
            </button>
          </div>
        </div>

        {/* Speaker Notes Modal */}
        {showNotes && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4">
            <button
              type="button"
              aria-label="Cerrar notas del orador"
              onClick={() => {
                setShowNotes(false);
                notesToggleRef.current?.focus();
              }}
              tabIndex={-1}
              className="absolute inset-0 cursor-default focus-visible:outline-none"
            />
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Notas del orador"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                if (e.key !== 'Tab') return;
                const root = modalRef.current;
                if (!root) return;
                const focusables = Array.from(
                  root.querySelectorAll<HTMLElement>(
                    'button, [href], select, textarea, input, [tabindex]:not([tabindex="-1"])',
                  ),
                ).filter(
                  (el) =>
                    !el.hasAttribute('disabled') &&
                    el.getAttribute('aria-hidden') !== 'true',
                );
                if (focusables.length === 0) {
                  e.preventDefault();
                  return;
                }
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }}
              className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-slate-200">Notas del Orador</p>
                <button
                  ref={notesCloseRef}
                  type="button"
                  onClick={() => {
                    setShowNotes(false);
                    notesToggleRef.current?.focus();
                  }}
                  aria-label="Cerrar notas del orador"
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  ✕ Cerrar
                </button>
              </div>
              <section
                id={notesPanelId}
                aria-label="Notas del orador"
                className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 max-h-60 overflow-y-auto font-mono"
              >
                <pre className="whitespace-pre-wrap">{notesText}</pre>
              </section>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

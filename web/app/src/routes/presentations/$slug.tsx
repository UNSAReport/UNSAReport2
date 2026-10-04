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
  SlidesApiError,
  type SlidesPresentation,
  type SlidesPresentationVersion,
  slidesErrorStatus,
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
      const status = slidesErrorStatus(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (status !== null) {
        throw new SlidesApiError(
          'No se pudo cargar la presentación',
          status,
          msg,
        );
      }
      throw new Error(`No se pudo cargar la presentación: ${msg}`);
    }
  },
  errorComponent: PresentationErrorComponent,
  component: PresentationViewer,
});

function PresentationErrorComponent({ error }: ErrorComponentProps) {
  const status = slidesErrorStatus(error);
  const copy =
    status === 401
      ? {
          title: 'Inicia sesión para ver esta presentación',
          message:
            'No has iniciado sesión. Inicia sesión y vuelve a intentarlo.',
        }
      : status === 403
        ? {
            title: 'Sin acceso a esta presentación',
            message:
              'Tu cuenta no tiene acceso: la presentación es privada o pertenece a una organización de la que no eres miembro. Solicita acceso al propietario u organización.',
          }
        : status === 404
          ? {
              title: 'Presentación no encontrada',
              message:
                'No existe una presentación con ese identificador. Revisa el enlace o vuelve al listado.',
            }
          : {
              title: 'Error al Cargar Presentación',
              message: error instanceof Error ? error.message : String(error),
            };
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[#E3E2DE] text-[#141414]">
      <div className="p-3 rounded-none bg-transparent border border-[#C7C7C7] text-[#444343] mb-4">
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
      <h2 className="text-xl font-bold text-[#141414] mb-2">{copy.title}</h2>
      <p className="text-sm text-[#444343] max-w-md mb-6">{copy.message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === 401 ? (
          <Link
            to="/auth/login"
            className="px-4 py-2 rounded-none bg-[#1351AA] text-[#E3E2DE] text-sm font-semibold transition-colors duration-300 hover:bg-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
          >
            Iniciar sesión
          </Link>
        ) : null}
        <Link
          to="/presentations"
          className="px-4 py-2 rounded-none bg-[#141414] text-[#E3E2DE] text-sm font-semibold transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
        >
          ← Volver al Listado
        </Link>
      </div>
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
  const printIframeRef = useRef<HTMLIFrameElement>(null);
  const printModalRef = useRef<HTMLDivElement>(null);
  const printCloseRef = useRef<HTMLButtonElement>(null);
  const pdfButtonRef = useRef<HTMLButtonElement>(null);
  const handlePrevSlideRef = useRef(() => {});
  const handleNextSlideRef = useRef(() => {});
  const [selectedVersion, setSelectedVersion] = useState<number>(() => {
    if (data.presentation) {
      return data.presentation.activeVersion;
    }
    return 1;
  });

  const [showNotes, setShowNotes] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(1);
  const [iframeFailed, setIframeFailed] = useState(false);
  const presentation = data.presentation as SlidesPresentation;
  const versions = data.versions as SlidesPresentationVersion[];
  // Public/unlisted decks need no token: checkAccess() in
  // slides/src/routes/embed.ts returns early for them. Private/org decks
  // need ?token= on the first (and only) iframe load — sub-asset requests
  // inside the bundle carry no query string, so they authenticate via the
  // session cookie through the web proxy (see sandbox comment on the
  // iframes below). The iframe renders only after this resolves, so there
  // is exactly one load and never a token-less 401 flash.
  const needsToken =
    presentation.visibility !== 'public' &&
    presentation.visibility !== 'unlisted';
  const [tokenQuery, setTokenQuery] = useState<string | null>(() =>
    needsToken ? null : '',
  );

  useEffect(() => {
    if (!needsToken) {
      setTokenQuery('');
      return;
    }
    let cancelled = false;
    getEmbedTokenServerFn()
      .then(({ token }) => {
        if (!cancelled)
          setTokenQuery(token ? `?token=${encodeURIComponent(token)}` : '');
      })
      .catch(() => {
        if (!cancelled) setTokenQuery('');
      });
    return () => {
      cancelled = true;
    };
  }, [needsToken]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Reveal keyboard is disabled (keyboard: false); the viewer is the
      // only navigation driver. Skip editable targets so typing never
      // flips slides.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevSlideRef.current();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextSlideRef.current();
      } else if (e.key === 'Escape' && isPresent) {
        navigate({ to: '/presentations/$slug', params: { slug } });
      } else if (e.key === 'Escape' && showPrint) {
        setShowPrint(false);
        pdfButtonRef.current?.focus();
      } else if (e.key === 'Escape' && showNotes) {
        setShowNotes(false);
        notesToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPresent, navigate, showNotes, showPrint, slug]);

  useEffect(() => {
    if (showNotes) notesCloseRef.current?.focus();
  }, [showNotes]);

  useEffect(() => {
    if (showPrint) printCloseRef.current?.focus();
  }, [showPrint]);

  const versionExists = versions.some(
    (v) => v.versionNumber === selectedVersion,
  );

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
  const manifestValue: unknown = currentVersionRecord?.manifest ?? null;
  const manifestSlides =
    manifestValue &&
    typeof manifestValue === 'object' &&
    !Array.isArray(manifestValue) &&
    'slides' in manifestValue &&
    Array.isArray(manifestValue.slides)
      ? manifestValue.slides
      : null;
  const slideCount =
    manifestSlides && manifestSlides.length > 0 ? manifestSlides.length : null;
  const clampSlide = (n: number) =>
    slideCount === null ? Math.max(1, n) : Math.min(slideCount, Math.max(1, n));
  const embedOrigin =
    typeof window === 'undefined' ? '' : window.location.origin;
  const handlePrevSlide = () => {
    if (iframeRef.current?.contentWindow && embedOrigin) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ method: 'prev' }),
        embedOrigin,
      );
      setCurrentSlideIndex((prev) => clampSlide(prev - 1));
    }
  };

  const handleNextSlide = () => {
    if (iframeRef.current?.contentWindow && embedOrigin) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ method: 'next' }),
        embedOrigin,
      );
      setCurrentSlideIndex((prev) => clampSlide(prev + 1));
    }
  };

  useEffect(() => {
    handlePrevSlideRef.current = handlePrevSlide;
    handleNextSlideRef.current = handleNextSlide;
  });

  const embedSrc =
    tokenQuery === null
      ? null
      : `/api/slides/embed/${presentation.id}/v${selectedVersion}/index.html${tokenQuery}`;
  const printSrc =
    embedSrc === null
      ? null
      : `${embedSrc}${tokenQuery ? '&print-pdf' : '?print-pdf'}`;

  if (isPresent) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black text-[#E3E2DE] font-sans overflow-hidden"
      >
        {embedSrc === null || !versionExists ? (
          <div
            role={!versionExists ? 'alert' : 'status'}
            className="absolute inset-0 flex items-center justify-center p-8 text-center"
          >
            <p className="text-sm text-[#E3E2DE]">
              {!versionExists
                ? `La versión v${selectedVersion} no existe para esta presentación.`
                : 'Resolviendo acceso al contenido…'}
            </p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedSrc}
            title={presentation.title}
            // Trust decision: bundles are first-party build output served from
            // our own embed endpoint, and sub-asset requests inside the bundle
            // carry no ?token= query — they authenticate via the session
            // cookie through the web proxy, which requires a same-origin
            // context. Hence allow-same-origin stays alongside allow-scripts.
            sandbox="allow-scripts allow-same-origin"
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer"
            onError={() => setIframeFailed(true)}
          />
        )}
        {iframeFailed && embedSrc !== null && versionExists && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <p className="text-sm text-[#E3E2DE]">
              No se pudo cargar el contenido embebido. Revisa tu sesión e
              inténtalo de nuevo.
            </p>
          </div>
        )}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 px-3 py-1.5 rounded-none bg-[#141414] border border-[#C7C7C7] text-xs z-10 max-w-[calc(100vw-2rem)]">
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Diapositiva anterior"
            className="px-2.5 py-1 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] transition-colors duration-300 hover:bg-[#1351AA] hover:text-[#E3E2DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
          >
            ◀
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="text-[#E3E2DE] font-mono px-1"
          >
            {currentSlideIndex}
          </span>
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Diapositiva siguiente"
            className="px-2.5 py-1 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] transition-colors duration-300 hover:bg-[#1351AA] hover:text-[#E3E2DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
          >
            ▶
          </button>
          <div className="w-px h-4 bg-[#C7C7C7]" />
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Pantalla completa"
            className="px-2.5 py-1 rounded-none text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] hover:text-[#E3E2DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
          >
            ⛶
          </button>
          <Link
            to="/presentations/$slug"
            params={{ slug }}
            aria-label="Salir del modo presentación"
            className="px-2.5 py-1 rounded-none text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] hover:text-[#E3E2DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
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
      className="flex flex-col h-full w-full bg-[#E3E2DE] text-[#141414] font-sans overflow-hidden"
    >
      {/* Shell Institucional Header */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3 bg-[#E3E2DE] border-b border-[#C7C7C7] z-10 shrink-0">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <Link
            to="/presentations"
            className="text-xs font-semibold text-[#444343] transition-colors duration-300 hover:text-[#1351AA] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA] rounded-none"
          >
            ← Volver
          </Link>
          <div className="h-4 w-px bg-[#C7C7C7] shrink-0" />
          <h1 className="text-sm font-bold text-[#141414] truncate max-w-md">
            {presentation.title}
          </h1>
          <span className="px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] shrink-0">
            {presentation.ownerType === 'organization' ? 'Org' : 'Personal'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Version Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#444343]">
            <label htmlFor={versionSelectId}>Versión:</label>
            <select
              id={versionSelectId}
              value={selectedVersion}
              onChange={(e) => {
                setSelectedVersion(Number(e.target.value));
                setCurrentSlideIndex(1);
                setIframeFailed(false);
                setShowPrint(false);
              }}
              className="bg-transparent text-[#141414] text-xs rounded-none px-2 py-1 border border-[#C7C7C7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA] shrink-0"
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
            className="px-2.5 py-1.5 rounded-none bg-[#1351AA] text-[#E3E2DE] text-xs font-semibold transition-colors duration-300 hover:bg-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
          >
            ▶ Presentar
          </Link>
          {embedSrc !== null && versionExists ? (
            <button
              ref={pdfButtonRef}
              type="button"
              onClick={() => setShowPrint(true)}
              aria-label="Exportar a PDF (abre diálogo de impresión)"
              aria-haspopup="dialog"
              className="px-2.5 py-1.5 rounded-none bg-[#141414] text-[#E3E2DE] text-xs font-semibold transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
            >
              ⬇ PDF
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Pantalla Completa"
            aria-label="Pantalla completa"
            className="p-1.5 rounded-none bg-[#141414] text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
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
        {embedSrc === null ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <p className="text-sm text-[#E3E2DE]">
              Resolviendo acceso al contenido…
            </p>
          </div>
        ) : !versionExists ? (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center"
          >
            <p className="text-sm font-semibold text-[#E3E2DE]">
              La versión v{selectedVersion} no existe para esta presentación.
            </p>
            <p className="text-xs text-[#C7C7C7]">
              Selecciona una versión disponible en el menú superior.
            </p>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedSrc}
            title={presentation.title}
            // Trust decision: bundles are first-party build output served from
            // our own embed endpoint, and sub-asset requests inside the bundle
            // carry no ?token= query — they authenticate via the session
            // cookie through the web proxy, which requires a same-origin
            // context. Hence allow-same-origin stays alongside allow-scripts.
            sandbox="allow-scripts allow-same-origin"
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer"
            onError={() => setIframeFailed(true)}
          />
        )}
        {iframeFailed && embedSrc !== null && versionExists && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
            <p className="text-sm text-[#E3E2DE]">
              No se pudo cargar el contenido embebido. Revisa tu sesión e
              inténtalo de nuevo.
            </p>
          </div>
        )}
      </main>

      {/* Navigation and Speaker Notes Bar */}
      <footer className="border-t border-[#C7C7C7] bg-[#E3E2DE] px-6 py-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Diapositiva anterior"
              className="px-2.5 py-1 rounded-none bg-[#141414] text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
            >
              ◀ Anterior
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Diapositiva siguiente"
              className="px-2.5 py-1 rounded-none bg-[#141414] text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
            >
              Siguiente ▶
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="text-[#7A7A7A] font-mono ml-2"
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
              className="inline-flex items-center gap-1.5 text-[#444343] transition-colors duration-300 hover:text-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA] rounded-none"
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
              className="relative w-full max-w-lg rounded-none border border-[#C7C7C7] bg-[#E3E2DE] p-4 text-xs text-[#141414]"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-semibold text-[#141414]">Notas del Orador</p>
                <button
                  ref={notesCloseRef}
                  type="button"
                  onClick={() => {
                    setShowNotes(false);
                    notesToggleRef.current?.focus();
                  }}
                  aria-label="Cerrar notas del orador"
                  className="px-2 py-1 rounded-none bg-[#141414] text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
                >
                  ✕ Cerrar
                </button>
              </div>
              <section
                id={notesPanelId}
                aria-label="Notas del orador"
                className="p-3 bg-[#141414] text-[#E3E2DE] font-mono rounded-none border border-[#C7C7C7] max-h-60 overflow-y-auto"
              >
                <pre className="whitespace-pre-wrap">{notesText}</pre>
              </section>
            </div>
          </div>
        )}
        {/* Print PDF Modal */}
        {showPrint && printSrc !== null && versionExists ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
            <button
              type="button"
              aria-label="Cerrar vista de impresión"
              onClick={() => {
                setShowPrint(false);
                pdfButtonRef.current?.focus();
              }}
              tabIndex={-1}
              className="absolute inset-0 cursor-default focus-visible:outline-none"
            />
            <div
              ref={printModalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Exportar a PDF"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
                if (e.key !== 'Tab') return;
                const root = printModalRef.current;
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
              className="relative flex flex-col w-full max-w-5xl h-[90vh] rounded-none border border-[#C7C7C7] bg-[#E3E2DE] p-4 text-xs text-[#141414]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-semibold text-[#141414]">
                  Exportar a PDF — {presentation.title} v{selectedVersion}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      printIframeRef.current?.contentWindow?.print()
                    }
                    className="px-3 py-1.5 rounded-none bg-[#1351AA] text-[#E3E2DE] text-xs font-semibold transition-colors duration-300 hover:bg-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
                  >
                    ⎙ Imprimir
                  </button>
                  <button
                    ref={printCloseRef}
                    type="button"
                    onClick={() => {
                      setShowPrint(false);
                      pdfButtonRef.current?.focus();
                    }}
                    aria-label="Cerrar vista de impresión"
                    className="px-2 py-1 rounded-none bg-[#141414] text-[#E3E2DE] transition-colors duration-300 hover:bg-[#1351AA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]"
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>
              <iframe
                ref={printIframeRef}
                src={printSrc}
                title={`${presentation.title} — vista de impresión`}
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="no-referrer"
                className="flex-1 w-full min-h-0 border border-[#C7C7C7] bg-white"
              />
            </div>
          </div>
        ) : null}
      </footer>
    </div>
  );
}

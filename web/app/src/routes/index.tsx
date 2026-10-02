import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

const features = [
  {
    index: '01',
    anchor: 'informes',
    title: 'Informes de laboratorio',
    body: 'Informes reproducibles en Typst desde plantillas oficiales. Inicializa con docs init, previsualiza en vivo con docs watch y compila el PDF final con docs build.',
    code: 'unsarep docs init @unsareport/epis-lab --report lab-01',
  },
  {
    index: '02',
    anchor: 'paquetes',
    title: 'Paquetes y registro',
    body: 'Publica plantillas y paquetes Typst con scopes versionados. Inicia sesión, valida tu paquete y publícalo para reutilizarlo en cualquier informe.',
    code: 'unsarep registry publish ./mi-paquete',
  },
  {
    index: '03',
    anchor: 'slides',
    title: 'Slides académicas',
    body: 'Inicializa un deck con el kit oficial, previsualiza en vivo con unsarep slides dev y despliega versiones inmutables para presentar o exportar a PDF.',
    code: 'unsarep slides init mi-presentacion',
  },
];

const differences = [
  {
    index: '001',
    title: 'Plantillas que no se rompen',
    body: 'Scopes versionados con manifiesto unsareport.toml. Lo que compila hoy compila en la defensa.',
  },
  {
    index: '002',
    title: 'PDFs que se pueden citar',
    body: 'Versiones inmutables con install reproducible. Nada de final-v3-real.pdf por Drive.',
  },
  {
    index: '003',
    title: 'Defensas con sello UNSA',
    body: 'Kit oficial de slides, portada EPIS y export a PDF. Del informe al deck sin reescribir nada.',
  },
];

function IndexComponent() {
  return (
    <div className="min-h-screen bg-[#E3E2DE] text-[#141414] font-sans">
      {/* HERO — 85vh, label rail + massive headline */}
      <section className="min-h-[85vh] grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 md:border-r border-b md:border-b-0 border-[#C7C7C7] p-6 flex md:flex-col flex-row items-center md:items-start gap-4">
          <span aria-hidden="true" className="block w-4 h-4 bg-[#141414]" />
          <p className="grid-label">Manifiesto</p>
          <p className="md:mt-auto font-mono text-[11px] text-[#7A7A7A]">
            UNSA / EPIS
            <br />
            001 — 2026
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 flex flex-col justify-center gap-10">
          <h1 className="poster-headline uppercase text-6xl md:text-8xl xl:text-9xl">
            Escribe.
            <br />
            Publica.
            <br />
            <span className="text-[#1351AA]">Defiende.</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <p className="max-w-[400px] text-lg text-[#444343] leading-relaxed">
              Informes de laboratorio reproducibles, paquetes y plantillas
              versionados, y slides académicas: todo el flujo institucional en
              una sola plataforma.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link to="/dashboard" className="poster-button poster-button-primary">
                Mi dashboard
              </Link>
              <Link
                to="/registry"
                search={{ search: undefined, tag: undefined }}
                className="text-sm font-bold uppercase tracking-wider underline decoration-[#1351AA] decoration-2 underline-offset-4 transition-colors duration-300 hover:text-[#1351AA]"
              >
                Explorar paquetes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM GRID */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">System</p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 space-y-10">
          <h2 className="poster-section-headline uppercase text-5xl md:text-7xl">
            Todo.
            <br />
            Versionado.
            <br />
            Reproducible.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.anchor}
                id={f.anchor}
                className="poster-cell p-6 flex flex-col gap-4 scroll-mt-28"
              >
                <p className="font-mono text-xs text-[#7A7A7A]">{f.index}</p>
                <h3 className="text-xl font-bold leading-tight">{f.title}</h3>
                <p className="text-sm text-[#444343] leading-relaxed flex-1">
                  {f.body}
                </p>
                <code className="block p-3 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] font-mono text-xs overflow-x-auto">
                  {f.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">Why different</p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12">
          <div>
            {differences.map((d) => (
              <div
                key={d.index}
                className="poster-row min-h-[100px] md:min-h-[150px] items-start"
              >
                <p className="font-mono text-xs text-[#7A7A7A] pt-2 shrink-0 w-10">
                  {d.index}
                </p>
                <div className="flex-1">
                  <h3 className="poster-row-title text-3xl md:text-5xl font-bold leading-none tracking-tight">
                    {d.title}
                  </h3>
                  <p className="text-sm text-[#444343] leading-relaxed mt-3 max-w-xl">
                    {d.body}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-b border-[#C7C7C7]" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ACCESS */}
      <section className="grid grid-cols-12 min-h-[50vh]">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">Access</p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 flex flex-col gap-6">
          <h2 className="poster-headline uppercase text-6xl md:text-8xl">
            Empieza a explorar
          </h2>
          <p className="text-lg text-[#444343] leading-relaxed max-w-xl">
            Del informe al paquete reutilizable y a la defensa final.
            <br />
            Copia el patrón y publícalo.
          </p>
          <div className="mt-auto flex md:justify-end pt-10">
            <Link
              to="/dashboard"
              className="poster-button poster-button-dark px-10 py-5"
            >
              Ir a mi dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#C7C7C7]">
        <div className="grid grid-cols-12 px-6 py-8 gap-4 items-center">
          <p className="col-span-12 md:col-span-3 text-sm">
            <span className="font-black uppercase tracking-tight">
              UNSAReport
            </span>{' '}
            <span className="text-[#7A7A7A]">· UNSA / 2026</span>
          </p>
          <nav
            aria-label="Enlaces de pie"
            className="col-span-12 md:col-span-9 flex flex-wrap items-center gap-6 md:justify-end"
          >
            {[
              { label: 'Informes', href: '#informes' },
              { label: 'Paquetes', href: '#paquetes' },
              { label: 'Slides', href: '#slides' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs font-bold uppercase tracking-[0.2em] text-[#444343] transition-colors duration-300 hover:text-[#1351AA]"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/auth/login"
              className="text-xs font-bold uppercase tracking-[0.2em] text-[#444343] transition-colors duration-300 hover:text-[#1351AA]"
            >
              Acceso
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

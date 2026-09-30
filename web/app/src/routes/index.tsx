import { createFileRoute, Link } from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

const features = [
  {
    anchor: 'informes',
    title: 'Informes de laboratorio',
    body: 'Informes reproducibles en Typst desde plantillas oficiales. Inicializa con docs init, previsualiza en vivo con docs watch y compila el PDF final con docs build.',
    code: 'unsarep docs init @unsareport/epis-lab --report lab-01',
  },
  {
    anchor: 'paquetes',
    title: 'Paquetes y registro',
    body: 'Publica plantillas y paquetes Typst con scopes versionados. Inicia sesión, valida tu paquete y publícalo para reutilizarlo en cualquier informe.',
    code: 'unsarep registry publish ./mi-paquete',
  },
  {
    anchor: 'slides',
    title: 'Slides académicas',
    body: 'Inicializa un deck con el kit oficial, previsualiza en vivo con unsarep slides dev y despliega versiones inmutables para presentar o exportar a PDF.',
    code: 'unsarep slides init mi-presentacion',
  },
];

const showcase = [
  {
    tag: 'Informe',
    title: 'Informe de laboratorio',
    body: 'Estructura lab-01 con portada EPIS, figuras y bibliografía lista para compilar con docs build.',
  },
  {
    tag: 'Paquete',
    title: 'Paquete de plantilla',
    body: 'Plantilla versionada con scope propio que tus compañeros instalan con docs add en segundos.',
  },
  {
    tag: 'Defensa',
    title: 'Deck de defensa',
    body: 'Portada institucional, metodología y resultados con temas de facultad, listo para presentar.',
  },
];

function IndexComponent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16 text-center space-y-6">
        <Chip status="public" className="mx-auto">
          Plataforma institucional UNSA
        </Chip>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight text-balance">
          UNSAReport
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Informes de laboratorio reproducibles, paquetes y plantillas
          versionados, y slides académicas: todo el flujo institucional en una
          sola plataforma.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a href="#informes" className={buttonClasses('primary', 'md')}>
            Informes
            <span aria-hidden="true">→</span>
          </a>
          <a href="#paquetes" className={buttonClasses('secondary', 'md')}>
            Paquetes
          </a>
          <a href="#slides" className={buttonClasses('secondary', 'md')}>
            Slides
          </a>
          <Link to="/dashboard" className={buttonClasses('ghost', 'md')}>
            Ir a mi dashboard
          </Link>
        </div>
      </section>

      <section
        aria-label="Pilares de la plataforma"
        className="max-w-7xl mx-auto px-4 pb-12 md:pb-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} id={f.anchor} className="scroll-mt-20">
              <Card padding="md" className="flex flex-col gap-3 h-full">
                <h2 className="text-lg font-bold text-white text-balance">
                  {f.title}
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">
                  {f.body}
                </p>
                <code className="block p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                  {f.code}
                </code>
                {f.anchor === 'paquetes' ? (
                  <Link
                    to="/registry"
                    search={{ search: undefined, tag: undefined }}
                    className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Explorar paquetes publicados →
                  </Link>
                ) : null}
                {f.anchor === 'slides' ? (
                  <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Ver mis slides publicadas →
                  </Link>
                ) : null}
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Casos de uso"
        className="border-t border-slate-800/80 bg-slate-900/30"
      >
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white text-balance">
              Un flujo para todo tu trabajo académico
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Del informe al paquete reutilizable y a la defensa final: copia el
              patrón y publícalo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcase.map((s) => (
              <Card key={s.title} padding="md" className="space-y-3">
                <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {s.tag}
                </span>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {s.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>
            <span className="font-semibold text-slate-300">UNSAReport</span> ·
            Plataforma institucional UNSA
          </p>
          <nav aria-label="Enlaces de pie" className="flex items-center gap-5">
            <a href="#informes" className="hover:text-slate-300">
              Informes
            </a>
            <a href="#paquetes" className="hover:text-slate-300">
              Paquetes
            </a>
            <a href="#slides" className="hover:text-slate-300">
              Slides
            </a>
            <Link to="/auth/login" className="hover:text-slate-300">
              Acceso
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

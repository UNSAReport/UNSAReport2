import { createFileRoute, Link } from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

const features = [
  {
    title: 'Crea con el CLI',
    body: 'Inicializa un deck con el kit oficial, previsualiza en vivo con unsarep slides dev y valida layouts contra el catálogo antes de publicar.',
    code: 'unsarep slides init mi-deck',
  },
  {
    title: 'Despliega y versiona',
    body: 'Cada despliegue crea una versión inmutable servida por la API de slides. Activa, revierte o comparte versiones sin romper enlaces.',
    code: 'unsarep slides deploy',
  },
  {
    title: 'Presenta y comparte',
    body: 'Abre cualquier versión en el visor, entra a modo presentación a pantalla completa o exporta a PDF para distribuir.',
    code: '/presentations/:slug?present=1',
  },
];

const showcase = [
  {
    tag: 'Académico',
    title: 'Defensa de tesis',
    body: 'Portada institucional, agenda, metodología y resultados con temas de facultad.',
  },
  {
    tag: 'Investigación',
    title: 'Póster de congreso',
    body: 'Métricas, gráficos y citas en layouts de stats y bento de alta densidad.',
  },
  {
    tag: 'Docencia',
    title: 'Clase semanal',
    body: 'Split de código, callouts y cierres con puntos clave reutilizables.',
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
          UNSAReport Slides
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Diseña, versiona y presenta diapositivas académicas desde tu terminal
          hasta el aula.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/presentations" className={buttonClasses('primary', 'md')}>
            Ver presentaciones
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            to="/presentations/catalog"
            className={buttonClasses('secondary', 'md')}
          >
            Explorar catálogo
          </Link>
          <Link to="/auth/login" className={buttonClasses('ghost', 'md')}>
            Iniciar sesión
          </Link>
        </div>
      </section>

      <section
        aria-label="Cómo funciona"
        className="max-w-7xl mx-auto px-4 pb-12 md:pb-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title} padding="md" className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-white text-balance">
                {f.title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">
                {f.body}
              </p>
              <code className="block p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                {f.code}
              </code>
            </Card>
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
              Hecho para la vida académica
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Patrones de autoría probados en defensas, congresos y aulas. Sin
              cuentas demo ni datos en vivo: copia el patrón y publícalo.
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
          <div className="text-center">
            <Link
              to="/presentations/catalog"
              className={buttonClasses('secondary', 'sm')}
            >
              Ver layouts del catálogo
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>
            <span className="font-semibold text-slate-300">UNSAReport</span> ·
            Plataforma institucional de presentaciones
          </p>
          <nav aria-label="Enlaces de pie" className="flex items-center gap-5">
            <Link to="/presentations" className="hover:text-slate-300">
              Presentaciones
            </Link>
            <Link to="/presentations/catalog" className="hover:text-slate-300">
              Catálogo
            </Link>
            <Link to="/auth/login" className="hover:text-slate-300">
              Acceso
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
